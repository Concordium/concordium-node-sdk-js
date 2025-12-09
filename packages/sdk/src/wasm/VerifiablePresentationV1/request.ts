import * as wasm from '@concordium/rust-bindings/wallet';
import { Buffer } from 'buffer/index.js';
import JSONBig from 'json-bigint';

import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    AttributeKey,
    ConcordiumGRPCClient,
    HexString,
    RegisterDataPayload,
    TransactionKindString,
    TransactionStatusEnum,
    TransactionSummaryType,
    cborDecode,
    cborEncode,
    isKnown,
    signTransaction,
} from '../../index.js';
import { DataBlob, SequenceNumber, TransactionExpiry, TransactionHash } from '../../types/index.js';
import { AccountStatementBuild } from '../../web3-id/proofs.js';
import { AtomicStatementV2, DIDString, IDENTITY_SUBJECT_SCHEMA, IdentityProviderDID } from '../../web3-id/types.js';
import { AnchorTransactionMetadata, GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
import { CredentialContextLabel, GivenContext } from './types.js';

const VERSION = 1;

/**
 * Context information for a verification request.
 * Contains both the context data that is already known (given) and
 * the context data that needs to be provided by the presenter (requested).
 */
export type Context = {
    /** Type identifier for the context format */
    type: 'ConcordiumUnfilledContextInformationV1';
    /** Context information that is already provided */
    given: GivenContext[];
    /** Context information that must be provided by the presenter */
    requested: CredentialContextLabel[];
};

/**
 * Creates a new context object with the proper type identifier.
 *
 * @param context - The context data without the type field
 * @returns A complete context object with type identifier
 */
export function createContext(context: Omit<Context, 'type'>): Context {
    return { type: 'ConcordiumUnfilledContextInformationV1', ...context };
}

/**
 * Creates a simple context with commonly used parameters for basic verification scenarios.
 *
 * This is a convenience function that creates a context with a nonce for freshness,
 * a connection ID for session tracking, a rescource ID for specifying the connected website,
 * and an optional context string for additional information.
 * It requests the BlockHash to be provided by the presenter.
 *
 * @param nonce - Cryptographic nonce for preventing replay attacks
 * @param connectionId - Identifier for the verification session
 * @param rescourceId - Identifier for the website
 * @param contextString - Optional context information
 *
 * @returns A context object configured for basic verification
 */
export function createSimpleContext(
    nonce: Uint8Array,
    connectionId: string,
    rescourceId: string,
    contextString?: string
): Context {
    let optional_context: GivenContext[] =
        contextString !== undefined ? [{ label: 'ContextString', context: contextString }] : [];

    return createContext({
        given: [
            { label: 'Nonce', context: nonce },
            { label: 'ConnectionID', context: connectionId },
            { label: 'ResourceID', context: rescourceId },
            ...optional_context,
        ],
        requested: ['BlockHash'],
    });
}

/**
 * Data structure for CBOR-encoded _verification request anchors_.
 * This format is used when storing presentation requests on the Concordium blockchain.
 */
export type Anchor = {
    /** Type identifier for _Concordium Verification Request Anchor_ */
    type: 'CCDVRA';
    /** Version of the anchor data format */
    version: typeof VERSION;
    /** Hash of the presentation request */
    // TODO: maybe use a specific type for sha256 hash
    hash: Uint8Array;
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

type ContextJSON = Pick<Context, 'type' | 'requested'> & { given: GivenContextJSON[] };

function requestContextToJSON(context: Context): ContextJSON {
    return {
        type: context.type,
        given: context.given.map(givenContextToJSON),
        requested: context.requested,
    };
}

type RequestAnchorInput = {
    context: ContextJSON;
    subjectClaims: SubjectClaims[];
    publicInfo?: Record<string, HexString>;
};

/**
 * Creates a CBOR-encoded anchor for a verification request.
 *
 * This function creates a standardized CBOR-encoded representation of the
 * presentation request that can be stored on the Concordium blockchain as
 * transaction data. The anchor includes a hash of the request and optional
 * public metadata.
 *
 * @param context - The context information for the request
 * @param subjectClaims - The credential subject claims being requested
 * @param publicInfo - Optional public information to include in the anchor
 *
 * @returns CBOR-encoded anchor data suitable for blockchain storage
 */
export function createAnchor(
    context: Context,
    subjectClaims: SubjectClaims[],
    publicInfo?: Record<string, any>
): Uint8Array {
    let input: RequestAnchorInput = {
        context: requestContextToJSON(context),
        subjectClaims,
    };
    if (publicInfo !== undefined) {
        input.publicInfo = Object.entries(publicInfo).reduce<Record<string, HexString>>(
            (acc, [k, v]) => ({ ...acc, [k]: Buffer.from(cborEncode(v)).toString('hex') }),
            {}
        );
    }
    return wasm.createVerificationRequestV1Anchor(JSONBig.stringify(input));
}

/**
 * Computes a hash of the presentation request context and statements.
 *
 * This hash is used to create a tamper-evident anchor that can be stored
 * on-chain to prove the request was made at a specific time and with
 * specific parameters.
 *
 * @param context - The context information for the request
 * @param subjectClaims - The credential subject claims being requested
 *
 * @returns SHA-256 hash of the serialized request data
 */
export function computeAnchorHash(context: Context, subjectClaims: SubjectClaims[]): Uint8Array {
    const input: RequestAnchorInput = {
        context: requestContextToJSON(context),
        subjectClaims,
    };
    return wasm.computeVerificationRequestV1AnchorHash(JSONBig.stringify(input));
}

/**
 * Decodes a CBOR-encoded _verification request anchor_.
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
    if (!('type' in value) || value.type !== 'CCDVRA') throw new Error('Expected "type" to be "CCDVRA"');
    if (!('version' in value) || value.version !== VERSION) throw new Error('Expected "version" to be 1');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as Anchor;
}

/**
 * Verifies that a verification request's anchor has been properly registered on-chain.
 *
 * This function checks that:
 * 1. The transaction referenced in the request is finalized
 * 2. The transaction is a RegisterData transaction
 * 3. The registered anchor hash matches the computed hash of the request
 *
 * @param verificationRequest - The verification request containing the transaction reference
 * @param grpc - The gRPC client for blockchain queries
 * @returns The transaction outcome if verification succeeds
 * @throws Error if the transaction is not finalized, has wrong type, or hash mismatch
 */
export async function verifyAnchor(verificationRequest: VerificationRequestV1, grpc: ConcordiumGRPCClient) {
    const transaction = await grpc.getBlockItemStatus(verificationRequest.transactionRef);
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

    const expectedAnchorHash = computeAnchorHash(verificationRequest.context, verificationRequest.subjectClaims);
    const transactionAnchor = decodeAnchor(Buffer.from(summary.dataRegistered.data, 'hex'));
    if (Buffer.from(expectedAnchorHash).toString('hex') !== Buffer.from(transactionAnchor.hash).toString('hex')) {
        throw new Error('presentation anchor verification failed.');
    }

    return transaction.outcome;
}

/**
 * JSON representation of a verification request.
 * Used for serialization and network transmission of request data.
 */
export type JSON = {
    type: 'ConcordiumVerificationRequestV1';
    /** The request context with serialized given contexts */
    context: Pick<Context, 'type' | 'requested'> & { given: GivenContextJSON[] };
    /** The credential subject claims being requested */
    subjectClaims: SubjectClaimsJSON[];
    /** Reference to the blockchain transaction containing the request anchor */
    transactionRef: TransactionHash.JSON;
};

/**
 * Type of identity credential source that can be used for proving attributes.
 */
type IdentityCredType = 'identityCredential' | 'accountCredential';

// This type must match the JSON serialization format of `RequestedStatement` in concordium-base.
export type RequestedStatement<AttributeKey> = AtomicStatementV2<AttributeKey>;

/**
 * Statement requesting proofs from identity credentials issued by identity providers.
 * Can specify whether to accept proofs from identity credentials, account credentials, or both.
 */
export type IdentityClaims = {
    /** Type discriminator for identity statements */
    type: 'identity';
    /** Source types accepted for this statement (identity credential, account credential, or both) */
    source: IdentityCredType[];
    /** Atomic statements about identity attributes to prove */
    statements: RequestedStatement<AttributeKey>[];
    /** Valid identity provider issuers for this statement */
    issuers: IdentityProviderDID[];
};

/**
 * Union type representing all supported statement types in a verification request.
 */
// This type must match the JSON serialization format of `RequestedSubjectClaims` in concordium-base.
export type SubjectClaims = IdentityClaims;

/**
 * JSON representation of statements with issuer DIDs serialized as strings.
 */
type SubjectClaimsJSON = Omit<IdentityClaims, 'issuers'> & {
    issuers: DIDString[];
};

/**
 * Builder class for constructing credential subject claims.
 * Provides methods to add different types of subject claims with their requirements.
 */
class SubjectClaimsBuilder {
    /** Array of claims being built. */
    private claims: SubjectClaims[] = [];

    /**
     * Add claims for identity credentials.
     *
     * @param validIdentityProviders Array of identity provider identifyers that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    addIdentityClaims(
        validIdentityProviders: IdentityProviderDID[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): SubjectClaimsBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        this.claims.push({
            type: 'identity',
            source: ['identityCredential'],
            statements: builder.getStatement(),
            issuers: validIdentityProviders,
        });
        return this;
    }

    /**
     * Add claims for account credentials.
     *
     * @param validIdentityProviders Array of identity provider identifyers that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    addAccountClaims(
        validIdentityProviders: IdentityProviderDID[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): SubjectClaimsBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        this.claims.push({
            type: 'identity',
            source: ['accountCredential'],
            statements: builder.getStatement(),
            issuers: validIdentityProviders,
        });
        return this;
    }

    /**
     * Add statements for identity/account credentials. Here the wallet decides which type of proof is generated.
     *
     * @param validIdentityProviders Array of identity provider identifyers that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    addAccountOrIdentityClaims(
        validIdentityProviders: IdentityProviderDID[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): SubjectClaimsBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        this.claims.push({
            type: 'identity',
            source: ['accountCredential', 'identityCredential'],
            statements: builder.getStatement(),
            issuers: validIdentityProviders,
        });
        return this;
    }

    /**
     * Get the built credential statements.
     * @returns Array of credential statements
     */
    getClaims(): SubjectClaims[] {
        return this.claims;
    }
}

/**
 * Creates a new subject claims builder for constructing credential requests.
 *
 * @returns A new statement builder instance
 */
export function claimsBuilder(): SubjectClaimsBuilder {
    return new SubjectClaimsBuilder();
}

/**
 * A verification request that specifies what credentials and proofs
 * are being requested from a credential holder. This class encapsulates the
 * request context, the specific credential subject claims needed, and a reference
 * to the blockchain transaction that anchors the request.
 */
class VerificationRequestV1 {
    /**
     * Creates a new verification request.
     *
     * @param context - The context information for this request
     * @param subjectClaims - The specific credential subject claims being requested
     * @param transactionRef - Reference to the blockchain transaction anchoring this request
     */
    constructor(
        public readonly context: Context,
        public readonly subjectClaims: SubjectClaims[],
        public readonly transactionRef: TransactionHash.Type
    ) {}

    /**
     * Serializes the verification request to a JSON representation.
     *
     * @returns The JSON representation of this presentation request
     */
    public toJSON(): JSON {
        const subjectClaims = this.subjectClaims.map((statement) => ({
            ...statement,
            issuers: statement.issuers.map((i) => i.toJSON()),
        }));
        return {
            type: 'ConcordiumVerificationRequestV1',
            context: requestContextToJSON(this.context),
            subjectClaims,
            transactionRef: this.transactionRef.toJSON(),
        };
    }
}

/**
 * A verification request that specifies what credentials and proofs
 * are being requested from a credential holder. This class encapsulates the
 * request context, the specific credential statements needed, and a reference
 * to the blockchain transaction that anchors the request.
 */
export type Type = VerificationRequestV1;

/**
 * Deserializes a verification request from its JSON representation.
 *
 * This function reconstructs the request object from JSON data, handling
 * the conversion of serialized context information and credential statements
 * back to their proper types.
 *
 * @param json - The JSON representation to deserialize
 * @returns The deserialized verification request
 */
export function fromJSON(json: JSON): VerificationRequestV1 {
    const requestContext = { ...json.context, given: json.context.given.map(givenContextFromJSON) };
    const statements: SubjectClaims[] = json.subjectClaims.map((statement) => {
        switch (statement.type) {
            case 'identity':
                return {
                    ...statement,
                    source: statement.source,
                    issuers: statement.issuers.map(IdentityProviderDID.fromJSON),
                };
        }
    });

    return new VerificationRequestV1(requestContext, statements, TransactionHash.fromJSON(json.transactionRef));
}

/**
 * Creates a verification request and anchors it to the Concordium blockchain.
 *
 * This function creates a presentation request with the specified context and credential
 * statements, then stores an anchor of the request on the blockchain as a data registration
 * transaction. The blockchain anchor provides a tamper-evident timestamp and immutable
 * record of the request.
 *
 * @param grpc - The Concordium GRPC client for blockchain interaction
 * @param anchorTransactionMetadata - The metadata used for registering the anchor transaction on chain.
 * @param context - The context information for the request (without type field)
 * @param credentialStatements - The credential statements being requested
 * @param anchorPublicInfo - Optional public information to include in the anchor
 *
 * @returns Promise resolving to the created presentation request
 * @throws Error if the transaction fails or network issues occur
 */
export async function createAndAnchor(
    grpc: ConcordiumGRPCClient,
    { sender, sequenceNumber, signer }: AnchorTransactionMetadata,
    context: Omit<Context, 'type'>,
    credentialStatements: SubjectClaims[],
    anchorPublicInfo?: Record<string, any>
): Promise<VerificationRequestV1> {
    const requestContext = createContext(context);
    const anchor = createAnchor(requestContext, credentialStatements, anchorPublicInfo);

    const nonce: SequenceNumber.Type = sequenceNumber ?? (await grpc.getNextAccountNonce(sender)).nonce;
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce,
        sender,
    };
    const payload: RegisterDataPayload = { data: new DataBlob(anchor) };
    const accountTransaction: AccountTransaction = {
        header: header,
        payload,
        type: AccountTransactionType.RegisterData,
    };
    const signature = await signTransaction(accountTransaction, signer);
    const transactionHash = await grpc.sendAccountTransaction(accountTransaction, signature);

    return create(requestContext, credentialStatements, transactionHash);
}

/**
 * Creates a new verification request.
 *
 * This is a factory function that creates a request with the specified
 * context, credential statements, and transaction reference.
 *
 * @param context - The context information for the request
 * @param credentialStatements - The credential statements being requested
 * @param transactionRef - Reference to the blockchain transaction anchoring this request
 *
 * @returns A new verification request instance
 */
export function create(
    context: Context,
    credentialStatements: SubjectClaims[],
    transactionRef: TransactionHash.Type
): VerificationRequestV1 {
    return new VerificationRequestV1(context, credentialStatements, transactionRef);
}
