import * as wasm from '@concordium/rust-bindings/wallet';
import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import { ConcordiumGRPCClient, isKnown } from '../../grpc/index.js';
import {
    CredentialStatus,
    HexString,
    TransactionKindString,
    TransactionSummaryType,
    attributeTypeEquals,
} from '../../index.js';
import { signTransaction } from '../../signHelpers.js';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    Network,
    RegisterDataPayload,
    TransactionStatusEnum,
} from '../../types.js';
import { cborDecode, cborEncode } from '../../types/cbor.js';
import {
    BlockHash,
    CredentialRegistrationId,
    DataBlob,
    SequenceNumber,
    TransactionExpiry,
    TransactionHash,
} from '../../types/index.js';
import { bail } from '../../util.js';
import { VerifiablePresentationV1, VerificationRequestV1 } from './index.js';
import { AnchorTransactionMetadata, contextEquals } from './internal.js';
import { AtomicStatementV3, VerificationResult, isAccountClaims } from './proof.js';
import { RequestedStatement } from './request.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const VERSION = 1;

/**
 * A verification audit record that contains the complete verifiable presentation
 * request and response data. This record maintains the full audit trail of a verification
 * interaction, including all sensitive data that should be kept private.
 *
 * Audit records are used internally by verifiers to maintain complete records
 * of verification interactions, while only publishing hash-based public records on-chain
 * to preserve privacy.
 */
class VerificationAuditRecordV1 {
    /**
     * Creates a new verification audit record.
     *
     * @param request - The verifiable presentation request that was made
     * @param presentation - The verifiable presentation that was provided in response
     * @param id - Unique identifier for this audit record
     */
    constructor(
        public readonly request: VerificationRequestV1.Type,
        public readonly presentation: VerifiablePresentationV1.Type,
        public readonly id: string
    ) {}

    /**
     * Serializes the audit record to a JSON representation.
     *
     * @returns The JSON representation of this audit record
     */
    public toJSON(): JSON {
        return {
            request: this.request.toJSON(),
            presentation: this.presentation.toJSON(),
            id: this.id,
            version: VERSION,
            type: 'ConcordiumVerificationAuditRecord',
        };
    }
}

/**
 * A verification audit record that contains the complete verifiable presentation
 * request and response data. This record maintains the full audit trail of a verification
 * interaction, including all sensitive data that should be kept private.
 *
 * Audit records are used internally by verifiers to maintain complete records
 * of verification interactions, while only publishing hash-based public records on-chain
 * to preserve privacy.
 */
export type Type = VerificationAuditRecordV1;

/**
 * JSON representation of a verification audit record.
 * Contains the serialized forms of the request and presentation data.
 */
export type JSON = Pick<Type, 'id'> & {
    /** The type identifier for the audit record */
    type: 'ConcordiumVerificationAuditRecord';
    /** The audit record version */
    version: 1;
    /** The serialized verifiable presentation request */
    request: VerificationRequestV1.JSON;
    /** The serialized verifiable presentation */
    presentation: VerifiablePresentationV1.JSON;
};

/**
 * Creates a new verification audit record.
 *
 * @param id - Unique identifier for the audit record
 * @param request - The verifiable presentation request
 * @param presentation - The corresponding verifiable presentation
 *
 * @returns A new verification audit record instance
 */
export function create(
    id: string,
    request: VerificationRequestV1.Type,
    presentation: VerifiablePresentationV1.Type
): VerificationAuditRecordV1 {
    return new VerificationAuditRecordV1(request, presentation, id);
}

/**
 * Compares the context of a verification request with a corresponding context of a presentation.
 * Checks that the given contexts are equal and that requested context is filled in the presentation
 * context.
 *
 * Furthermore, the transaction ref of the verification request is checked against the block hash from presentation
 * context (if present).
 *
 * @param verificationRequest - the origin verification request for the presentation.
 * @param presentation - the presentation for the origin verification request.
 * @param grpc - a GRPC client for looking up the verification request anchor.
 *
 * @throws if any part of the context comparison fails
 */
async function compareContexts(
    { context: rc, transactionRef }: VerificationRequestV1.Type,
    { presentationContext: pc }: VerifiablePresentationV1.Type,
    grpc: ConcordiumGRPCClient
): Promise<void> {
    rc.given.length === pc.given.length ||
        bail(
            `Mismatch in number of given context items: request context has ${rc.given.length} while presentation context has ${pc.given.length}`
        );
    rc.requested.length === pc.requested.length ||
        bail(
            `Mismatch in number of requested context items: request context has ${rc.requested.length} while presentation context has ${pc.requested.length}`
        );

    rc.given.every(
        (rgc) =>
            pc.given.some((pgc) => contextEquals(rgc, pgc)) ||
            bail(`No matching context found for given request context ${rgc.label}`)
    );
    rc.requested.every(
        (rrc) =>
            pc.requested.some((prc) => prc.label === rrc) ||
            bail(`No matching context found for requested request context ${rrc}`)
    );

    const blockHashContext = pc.requested.find((prc) => prc.label === 'BlockHash');
    if (blockHashContext === undefined) return;

    if (!BlockHash.instanceOf(blockHashContext.context))
        throw new Error('Expected "BlockHash" type for "BlockHash" context');

    const blockItemStatus = await grpc.getBlockItemStatus(transactionRef);
    if (blockItemStatus.status !== TransactionStatusEnum.Finalized)
        throw new Error('Verification request anchor not finalized');

    if (!BlockHash.equals(blockItemStatus.outcome.blockHash, blockHashContext.context))
        throw new Error('Block hash from presentation does not match block found for verification request anchor');
}

/**
 * Verifies a list of requested statements match in structure and content with a list statements
 * from a presentation.
 *
 * @param requested - First list of atomic statements to compare.
 * @param presentation - Second list of atomic statements to compare.
 *
 * @throws Error if statements differ in length, order, type, or content.
 */
function verifyAtomicStatements<A>(requested: RequestedStatement<A>[], presentation: AtomicStatementV3<A>[]): void {
    if (requested.length !== presentation.length)
        throw new Error('Mismatch in number of atomic statements for statement/claim');

    const atomicError = new Error(
        'Mismatch found when comparing atomic statements for verification/presentation request.'
    );

    // We expect the order of statements to be identical.
    requested.forEach((requestedStatement, i) => {
        const presentationStatement = presentation[i];
        if (requestedStatement.attributeTag !== presentationStatement.attributeTag) throw atomicError;

        switch (requestedStatement.type) {
            case 'AttributeInSet': {
                if (presentationStatement.type !== 'AttributeInSet') throw atomicError;
                if (requestedStatement.set.length !== presentationStatement.set.length) throw atomicError;
                // For the sets, not all implementations used lists where the order items are added
                // is enforced (i.e. some use Sets).
                //
                // This is O(2*n^2), but we don't expect a lot of elements to compare.
                const setEqual =
                    requestedStatement.set.every((asv) =>
                        presentationStatement.set.some((bsv) => attributeTypeEquals(asv, bsv))
                    ) &&
                    presentationStatement.set.every((bsv) =>
                        requestedStatement.set.some((asv) => attributeTypeEquals(asv, bsv))
                    );
                if (!setEqual) throw atomicError;
                break;
            }
            case 'AttributeNotInSet': {
                if (presentationStatement.type !== 'AttributeNotInSet') throw atomicError;
                if (requestedStatement.set.length !== presentationStatement.set.length) throw atomicError;

                const setEqual =
                    requestedStatement.set.every((asv) =>
                        presentationStatement.set.some((bsv) => attributeTypeEquals(asv, bsv))
                    ) &&
                    presentationStatement.set.every((bsv) =>
                        requestedStatement.set.some((asv) => attributeTypeEquals(asv, bsv))
                    );
                if (!setEqual) throw atomicError;
                break;
            }
            case 'RevealAttribute': {
                if (presentationStatement.type !== 'AttributeValue') throw atomicError;
                break;
            }
            case 'AttributeInRange': {
                if (presentationStatement.type !== 'AttributeInRange') throw atomicError;
                if (!attributeTypeEquals(requestedStatement.lower, presentationStatement.lower)) throw atomicError;
                if (!attributeTypeEquals(requestedStatement.upper, presentationStatement.upper)) throw atomicError;
                break;
            }
        }
    });
}

/**
 * Verifies verifiable presentation account claims against a verification request identity claims.
 *
 * @param presentationClaims - Account claims from the verifiable presentation
 * @param requestedClaims - Verification request claims to validate against
 * @param grpc - gRPC client for querying account information
 *
 * @throws Error if:
 * - statement type is not 'identity';
 * - source is invalid;
 * - atomic statements mismatch;
 * - issuer is not valid
 */
async function verifyAccountClaims(
    presentationClaims: VerifiablePresentationV1.AccountClaims,
    requestedClaims: VerificationRequestV1.IdentityClaims,
    grpc: ConcordiumGRPCClient
) {
    if (requestedClaims.type !== 'identity')
        throw new Error(`Request statement of type ${requestedClaims.type} does not match account claims`);
    if (!requestedClaims.source.includes('accountCredential'))
        throw new Error(`Request statement does not include "account" source`);

    verifyAtomicStatements(requestedClaims.statements, presentationClaims.statement);

    // check that the selected credential for the claim is issued by a valid IDP
    const validIdpIndices = requestedClaims.issuers.map((i) => i.index);
    const [, credId] = presentationClaims.id.split(':cred:');
    const ai = await grpc.getAccountInfo(CredentialRegistrationId.fromHexString(credId));
    const cred = Object.values(ai.accountCredentials).find(
        (c) => c.value.type === 'normal' && c.value.contents.credId === credId
    );

    if (cred === undefined) throw new Error('Failed to find credId in account'); // should never happen, as we looked up this exact credId.
    if (!validIdpIndices.includes(cred.value.contents.ipIdentity))
        throw new Error('Credential selected is not issued by a valid identity provider.');
}

/**
 * Verifies verificable presenation identity claims against a verification request identity claims.
 *
 * @param vpClaims - Identity claims from the verifiable presentation
 * @param vrClaims - Verification request claims to validate against
 *
 * @throws Error if:
 * - statement type is not 'identity';
 * - source is invalid;
 * - atomic statements mismatch;
 * - issuer is not valid
 */
function verifyIdentityClaims(
    vpClaims: VerifiablePresentationV1.IdentityClaims,
    vrClaims: VerificationRequestV1.IdentityClaims
) {
    if (vrClaims.type !== 'identity')
        throw new Error(`Request statement of type ${vrClaims.type} does not match account claims`);
    if (!vrClaims.source.includes('identityCredential'))
        throw new Error(`Request statement does not include "identity" source`);

    verifyAtomicStatements(vrClaims.statements, vpClaims.statement);

    // check that the selected credential for the claim is issued by a valid IDP
    const validIdpIndices = vrClaims.issuers.map((i) => i.index);
    const [, idpIndex] = vpClaims.issuer.split(':idp:');

    if (!validIdpIndices.includes(Number(idpIndex)))
        throw new Error('Credential selected is not issued by a valid identity provider.');
}

/**
 * Verifies subject claims against a verification request statement.
 *
 * @param vpClaims - Subject claims from the verifiable presentation request (account or identity)
 * @param vrClaims - Verification request subject claims to validate against
 * @param grpc - gRPC client for querying account information
 *
 * @throws Error if claims do not match the statement requirements
 */
async function verifyClaims(
    vpClaims: VerifiablePresentationV1.SubjectClaims,
    vrClaims: VerificationRequestV1.SubjectClaims,
    grpc: ConcordiumGRPCClient
) {
    if (isAccountClaims(vpClaims)) {
        await verifyAccountClaims(vpClaims, vrClaims, grpc);
    } else {
        verifyIdentityClaims(vpClaims, vrClaims);
    }
}

/**
 * Verifies that a presentation request matches the verification request.
 *
 * @param presentationRequest - Presentation request containing subject claims
 * @param verificationRequest - Original verification request with credential statements
 * @param grpc - gRPC client for querying account information
 *
 * @throws Error if number of statements/claims mismatch or any individual claim verification fails
 */
async function verifyPresentationRequest(
    presentationRequest: VerifiablePresentationV1.Request,
    verificationRequest: VerificationRequestV1.Type,
    grpc: ConcordiumGRPCClient
) {
    verificationRequest.subjectClaims.length === presentationRequest.subjectClaims.length ||
        bail(
            `Mismatch in number of statements/claims: ${verificationRequest.subjectClaims.length} request statements found, ${presentationRequest.subjectClaims.length} presentation claims found`
        );

    for (let i = 0; i < verificationRequest.subjectClaims.length; i++) {
        await verifyClaims(presentationRequest.subjectClaims[i], verificationRequest.subjectClaims[i], grpc);
    }
}

/**
 * Creates a verification audit record after performing comprehensive validation of the presentation against the request.
 *
 * @param id - Unique identifier for the audit record
 * @param request - The verification request containing statements to verify
 * @param presentation - The verifiable presentation to validate
 * @param grpc - Concordium gRPC client for on-chain verification
 * @param network - Network identifier for verification context
 * @param blockHash - Optional block hash to verify against a specific chain state
 *
 * @returns A verification result containing either the audit record on success or an error on failure
 *
 * @remarks
 * This function performs four validation steps:
 * 1. Compares contexts between request and presentation
 * 2. Verifies cryptographic integrity of the presentation with public on-chain data
 * 3. Checks that all credentials are active
 * 4. Checks that the verification request anchor corresponding to the `request` has been registered on-chain
 * 4. Validates presentation claims against request statements
 */
export async function createChecked(
    id: string,
    request: VerificationRequestV1.Type,
    presentation: VerifiablePresentationV1.Type,
    grpc: ConcordiumGRPCClient,
    network: Network,
    blockHash?: BlockHash.Type
): Promise<VerificationResult<VerificationAuditRecordV1>> {
    // 1. check the context
    try {
        compareContexts(request, presentation, grpc);
    } catch (e) {
        return { type: 'failed', error: e as Error };
    }

    // 2. verify cryptographic integrity of presentation
    const verification = await VerifiablePresentationV1.verifyWithNode(presentation, grpc, network, blockHash);
    if (verification.type === 'failed') return verification;

    // 3. Checck that none of the credentials have expired
    if (!verification.result.credentialsStatus.every((cs) => cs === CredentialStatus.Active))
        return {
            type: 'failed',
            error: new Error('One or more credentials included in the presentation is not active.'),
        };

    try {
        // 4. Check that the verification request anchor has been registered on chain
        await VerificationRequestV1.verifyAnchor(request, grpc);

        // 5. check the claims in presentation request in the context of the request statements
        verifyPresentationRequest(verification.result.request, request, grpc);
    } catch (e) {
        return { type: 'failed', error: e as Error };
    }

    return { type: 'success', result: create(id, request, presentation) };
}

/**
 * Deserializes a verification audit record from its JSON representation.
 *
 * @param json - The JSON representation to deserialize
 * @returns The deserialized verification audit record
 */
export function fromJSON(json: JSON): VerificationAuditRecordV1 {
    return new VerificationAuditRecordV1(
        VerificationRequestV1.fromJSON(json.request),
        VerifiablePresentationV1.fromJSON(json.presentation),
        json.id
    );
}

/**
 * Describes the verification audit anchor data registered on chain.
 */
export type Anchor = {
    /** Type identifier for _Concordium Verification Audit Anchor_ */
    type: 'CCDVAA';
    /** Version of the anchor data format */
    version: number;
    /** The SHA-256 hash of the audit record, encoded as a hex string */
    hash: Uint8Array;
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

type VerificationAuditV1Input = {
    record: VerificationAuditRecordV1;
    publicInfo?: Record<string, HexString>;
};

/**
 * Converts a verification audit record to its corresponding anchor representation encoding.
 *
 * This function creates a privacy-preserving public record that contains only
 * a hash of the record data, suitable for publishing on-chain while
 * maintaining the privacy of the original verification interaction.
 *
 * @param record - The audit record to convert
 * @param info - Optional additional public information to include
 *
 * @returns The anchor encoding corresponding to the audit record
 */
export function createAnchor(record: VerificationAuditRecordV1, info?: Record<string, any>): Uint8Array {
    const input: VerificationAuditV1Input = {
        record: record,
    };
    if (info !== undefined) {
        input.publicInfo = Object.entries(info).reduce<Record<string, HexString>>(
            (acc, [k, v]) => ({ ...acc, [k]: Buffer.from(cborEncode(v)).toString('hex') }),
            {}
        );
    }
    return wasm.createVerificationAuditV1Anchor(JSONBig.stringify(input));
}

/**
 * Decodes a CBOR-encoded verification audit anchor.
 *
 * This function parses and validates a CBOR-encoded anchor that was previously
 * created with `createAnchor`. It ensures the anchor has the correct format
 * and contains all required fields.
 *
 * @param cbor - The CBOR-encoded anchor data to decode
 * @returns The decoded anchor data structure
 * @throws Error if the CBOR data is invalid or doesn't match expected format
 */
export function decodeAnchor(cbor: Uint8Array): Anchor {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVAA') throw new Error('Expected "type" to be "CCDVAA"');
    if (!('version' in value) || value.version !== VERSION) throw new Error('Expected "version" to be 1');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as Anchor;
}

/**
 * Computes a hash of the audit record.
 *
 * This hash is used to create a tamper-evident anchor that can be stored
 * on-chain to prove the request was made at a specific time and with
 * specific parameters.
 *
 * @param record - The audit record to compute the hash of
 *
 * @returns SHA-256 hash of the serialized audit record
 */
export function computeAnchorHash(record: VerificationAuditRecordV1, info?: Record<string, any>): Uint8Array {
    const input: VerificationAuditV1Input = {
        record: record,
    };
    if (info !== undefined) {
        input.publicInfo = Object.entries(info).reduce<Record<string, HexString>>(
            (acc, [k, v]) => ({ ...acc, [k]: Buffer.from(cborEncode(v)).toString('hex') }),
            {}
        );
    }
    return wasm.computeVerificationAuditV1AnchorHash(JSONBig.stringify(input));
}

/**
 * Verifies that an audit record's anchor has been properly registered on-chain.
 *
 * This function checks that:
 * 1. The transaction is finalized
 * 2. The transaction is a RegisterData transaction
 * 3. The registered anchor hash matches the computed hash of the audit record
 *
 * @param auditRecord - The audit record to verify
 * @param anchorTransactionRef - The transaction hash of the anchor registration
 * @param grpc - The gRPC client for blockchain queries
 *
 * @returns The transaction outcome if verification succeeds
 * @throws Error if the transaction is not finalized, has wrong type, or hash mismatch
 */
export async function verifyAnchor(
    auditRecord: VerificationAuditRecordV1,
    anchorTransactionRef: TransactionHash.Type,
    grpc: ConcordiumGRPCClient
) {
    const transaction = await grpc.getBlockItemStatus(anchorTransactionRef);
    if (transaction.status !== TransactionStatusEnum.Finalized) {
        throw new Error('presentation request anchor transaction not finalized');
    }
    const { summary } = transaction.outcome;
    if (
        !isKnown(summary) ||
        summary.type !== TransactionSummaryType.AccountTransaction ||
        summary.transactionType !== TransactionKindString.RegisterData
    ) {
        throw new Error('Unexpected transaction type found for presentation request anchor transaction');
    }

    const expectedAnchorHash = computeAnchorHash(auditRecord);
    const transactionAnchor = decodeAnchor(Buffer.from(summary.dataRegistered.data, 'hex'));
    if (Buffer.from(expectedAnchorHash).toString('hex') !== Buffer.from(transactionAnchor.hash).toString('hex')) {
        throw new Error('presentation anchor verification failed.');
    }

    return transaction.outcome;
}

type AnchorData = {
    /**
     * Transaction metadata for the anchor registration (sender, nonce)
     */
    metadata: AnchorTransactionMetadata;
    /**
     * Optional public metadata to include in the anchor
     */
    info?: Record<string, any>;
};

type VerificationData = {
    /**
     * The chain network identifier
     */
    network: Network;
    /**
     * Optional block hash for querying public info for presentation verification
     */
    blockHash?: BlockHash.Type;
};

/**
 * Creates a verification audit record and anchors it on-chain in a single operation.
 *
 * This is a convenience function that:
 * 1. Creates and validates an audit record using `createChecked`
 * 2. Registers the audit record anchor on-chain using `registerAnchor`
 *
 * @param id - Unique identifier for the audit record
 * @param request - The verification request being audited
 * @param presentation - The verifiable presentation being verified
 * @param grpc - The gRPC client for blockchain queries and transactions
 * @param anchorData - Transaction metadata for the anchor registration (sender, nonce) + public info
 * @param verificationData - The network identifier and optional block hash to query information at.
 *
 * @returns A verification result containing the audit record and anchor transaction hash
 */
export async function createAndAnchor(
    id: string,
    request: VerificationRequestV1.Type,
    presentation: VerifiablePresentationV1.Type,
    grpc: ConcordiumGRPCClient,
    { metadata, info }: AnchorData,
    { network, blockHash }: VerificationData
): Promise<VerificationResult<{ record: VerificationAuditRecordV1; anchorTransactionRef: TransactionHash.Type }>> {
    const result = await createChecked(id, request, presentation, grpc, network, blockHash);
    if (result.type === 'failed') return result;

    const record = result.result;
    const anchorTransactionRef = await registerAnchor(record, grpc, metadata, info);
    return { type: 'success', result: { record, anchorTransactionRef } };
}

/**
 * Registers a public verification audit record on the Concordium blockchain.
 *
 * This function converts a audit record to a public one and registers
 * it as transaction data on the blockchain. This provides a verifiable timestamp
 * and immutable record of the verification event while preserving privacy.
 *
 * @param record - The audit record to register publicly
 * @param grpc - The Concordium GRPC client for blockchain interaction
 * @param anchorTransactionMetadata - The metadata used for registering the anchor transaction on chain.
 * @param info - Optional additional public information to include
 *
 * @returns Promise resolving to the transaction hash
 * @throws Error if the transaction fails or network issues occur
 */
export async function registerAnchor(
    record: VerificationAuditRecordV1,
    grpc: ConcordiumGRPCClient,
    { sender, sequenceNumber, signer }: AnchorTransactionMetadata,
    info?: Record<string, any>
): Promise<TransactionHash.Type> {
    const nonce: SequenceNumber.Type = sequenceNumber ?? (await grpc.getNextAccountNonce(sender)).nonce;
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce,
        sender,
    };

    const payload: RegisterDataPayload = { data: new DataBlob(createAnchor(record, info)) };
    const accountTransaction: AccountTransaction = {
        header: header,
        payload,
        type: AccountTransactionType.RegisterData,
    };
    const signature = await signTransaction(accountTransaction, signer);
    return grpc.sendAccountTransaction(accountTransaction, signature);
}
