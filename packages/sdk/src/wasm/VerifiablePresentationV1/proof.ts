// TODO: remove any eslint disable once fully implemented

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as wasm from '@concordium/rust-bindings/wallet';
import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import {
    AttributeKey,
    ConcordiumGRPCClient,
    CredentialRegistrationId,
    CryptographicParameters,
    HexString,
    Network,
    TransactionKindString,
    TransactionStatusEnum,
    TransactionSummaryType,
    VerificationRequestV1,
    isKnown,
} from '../../index.js';
import { ConcordiumWeakLinkingProofV1 } from '../../types/VerifiablePresentation.js';
import { bail } from '../../util.js';
import {
    AccountCommitmentInput,
    AtomicStatementV2,
    CredentialsInputsAccount,
    CredentialsInputsIdentity,
    DIDString,
    IdentityCommitmentInput,
    createAccountDID,
    createIdentityStatementDID,
} from '../../web3-id/index.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
import { GivenContext, ZKProofV4 } from './types.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

/**
 * Context information for a verifiable presentation proof.
 * This extends the request context by filling in the requested context
 * information with actual values provided by the presenter.
 */
export type Context = {
    /** Type identifier for the context format */
    type: 'ConcordiumContextInformationV1';
    /** Context information that was already provided in the request */
    given: GivenContext[];
    /** Context information that was requested and is now filled with actual values */
    requested: GivenContext[];
};

type ContextJSON = Pick<Context, 'type'> & { given: GivenContextJSON[]; requested: GivenContextJSON[] };

function proofContextToJSON(context: Context): ContextJSON {
    return {
        type: context.type,
        given: context.given.map(givenContextToJSON),
        requested: context.requested.map(givenContextToJSON),
    };
}

function proofContextFromJSON(context: ContextJSON): Context {
    return {
        type: context.type,
        given: context.given.map(givenContextFromJSON),
        requested: context.requested.map(givenContextFromJSON),
    };
}

/**
 * Claims to be proven about an account credential.
 * Contains the account credential DID and atomic statements about account attributes.
 */
export type AccountClaims = {
    type: ['ConcordiumSubjectClaimsV1', 'ConcordiumAccountBasedSubjectClaims'];
    id: DIDString;
    statement: AtomicStatementV2<AttributeKey>[];
};

/**
 * Create claims about an account based credential
 *
 * @param network - The network the account credential exists on.
 * @param credRegId - The credential registration ID of the account.
 * @param statement - The atomic statements to prove for the account credential.
 * @returns The account claims to be used in the presentation input for the verifiable credential.
 */
export function createAccountClaims(
    network: Network,
    credRegId: CredentialRegistrationId.Type,
    statement: AtomicStatementV2<AttributeKey>[]
): AccountClaims {
    return {
        type: ['ConcordiumSubjectClaimsV1', 'ConcordiumAccountBasedSubjectClaims'],
        id: createAccountDID(network, credRegId.toString()),
        statement,
    };
}

/**
 * Claim to be proven about attributes from an identity credential issued by a specified identity provider.
 * Contains the identity DID and atomic statements about identity attributes.
 */
export type IdentityClaims = {
    type: ['ConcordiumSubjectClaimsV1', 'ConcordiumIdBasedSubjectClaims'];
    issuer: DIDString;
    statement: AtomicStatementV2<AttributeKey>[];
};

/**
 * Create claims about an identity based credential
 *
 * @param network - The network of the identity provider used to create the identity.
 * @param idpIndex - The on-chain index of the identity provider used to create the identity.
 * @param statement - The atomic statements to prove for the identity credential.
 * @returns The identity claims to be used in the presentation input for the verifiable credential.
 */
export function createIdentityClaims(
    network: Network,
    idpIndex: number,
    statement: AtomicStatementV2<AttributeKey>[]
): IdentityClaims {
    return {
        type: ['ConcordiumSubjectClaimsV1', 'ConcordiumIdBasedSubjectClaims'],
        issuer: createIdentityStatementDID(network, idpIndex),
        statement,
    };
}

/**
 * Union type representing all supported subject claims types in a verifiable presentation.
 */
export type SubjectClaims = IdentityClaims | AccountClaims;

/**
 * Creates a proof context by filling in the requested context from a presentation request.
 *
 * This function validates that all requested context information has been provided
 * and creates a complete context for generating the verifiable presentation proof.
 *
 * @param requestContext - The original request context with labels for requested data
 * @param filledRequestedContext - The actual context data filling the requested labels
 *
 * @returns A complete context for proof generation
 * @throws Error if not all requested context is provided or if there's a mismatch
 */
// Fails if not given the full amount of requested context.
export function createContext(
    requestContext: VerificationRequestV1.Context,
    filledRequestedContext: GivenContext[]
): Context {
    // First we validate that the requested context is filled in `filledRequestedContext`.
    if (requestContext.requested.length !== filledRequestedContext.length)
        throw new Error('Mismatch between amount of requested context and filled context');
    requestContext.requested.every(
        (requestedLabel) =>
            filledRequestedContext.some((requestedData) => requestedData.label === requestedLabel) ||
            bail(`No data for requested context ${requestedLabel} found`)
    );
    return { type: 'ConcordiumContextInformationV1', given: requestContext.given, requested: filledRequestedContext };
}

/**
 * A verifiable credential based on identity information from an identity provider.
 * This credential type contains zero-knowledge proofs about identity attributes
 * without revealing the actual identity information.
 */
export type IdentityBasedCredential = {
    /** Type identifiers for this credential format */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'];
    /** The credential subject containing identity-based statements */
    credentialSubject: {
        /** The identity disclosure information also acts as ephemeral ID */
        id: HexString;
        /** Statements about identity attributes (should match request) */
        statement: AtomicStatementV2<AttributeKey>[];
    };
    /** ISO formatted datetime specifying when the credential is valid from */
    validFrom: string;
    /** ISO formatted datetime specifying when the credential expires */
    validTo: string;
    /** The zero-knowledge proof for attestation */
    proof: ZKProofV4;
    /** Issuer of the original ID credential */
    issuer: DIDString;
};

function createIdentityCredentialStub(
    { issuer: id, statement }: IdentityClaims,
    ipIndex: number
): IdentityBasedCredential {
    const network = id.split(':')[1] as Network;
    const proof: ZKProofV4 = {
        type: 'ConcordiumZKProofV4',
        createdAt: new Date().toISOString(),
        proofValue: '0102'.repeat(32),
    };
    const credentialSubject: IdentityBasedCredential['credentialSubject'] = {
        statement: statement,
        id: '123456'.repeat(8),
    };
    return {
        type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'],
        proof,
        issuer: `ccd:${network.toLowerCase()}:idp:${ipIndex}`,
        validFrom: new Date(2000, 0, 1).toISOString(),
        validTo: new Date().toISOString(),
        credentialSubject,
    };
}

/**
 * A verifiable credential based on an account credential on the Concordium blockchain.
 * This credential type contains zero-knowledge proofs about account credentials
 * and their associated identity attributes.
 */
export type AccountBasedCredential = {
    /** Type identifiers for this credential format */
    type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumAccountBasedCredential'];
    /** The credential subject containing account-based statements */
    credentialSubject: {
        /** The account credential identifier as a DID */
        id: DIDString;
        /** Statements about account attributes (should match request) */
        statement: AtomicStatementV2<AttributeKey>[];
    };
    /** The zero-knowledge proof for attestation */
    proof: ZKProofV4;
    /** The issuer of the ID credential used to open the account credential */
    issuer: DIDString;
};

/**
 * Union type representing all supported verifiable credential formats
 * in Concordium verifiable presentations.
 *
 * The structure is reminiscent of a w3c verifiable credential
 */
export type Credential = IdentityBasedCredential | AccountBasedCredential;

/**
 * A verifiable presentation containing zero-knowledge proofs of credential statements.
 * This class represents a complete response to a verifiable presentation request,
 * including the context, credentials, and cryptographic proofs.
 */
class VerifiablePresentationV1 {
    /**
     * Creates a new verifiable presentation.
     *
     * @param presentationContext - The complete context for this presentation
     * @param verifiableCredential - Array of verifiable credentials with proofs
     * @param proof - Optional weak linking proof (required for account-based credentials)
     */
    constructor(
        public readonly presentationContext: Context,
        public readonly verifiableCredential: Credential[],
        // only present if the verifiable credential includes an account based credential
        public readonly proof?: ConcordiumWeakLinkingProofV1
    ) {}

    /**
     * Serializes the verifiable presentation to a JSON representation.
     *
     * @returns The JSON representation of this presentation
     */
    public toJSON(): JSON {
        let json: JSON = {
            type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'],
            presentationContext: proofContextToJSON(this.presentationContext),
            verifiableCredential: this.verifiableCredential,
        };

        if (this.proof !== undefined) json.proof = this.proof;
        return json;
    }
}

/**
 * A verifiable presentation containing zero-knowledge proofs of credential statements.
 * This class represents a complete response to a verifiable presentation request,
 * including the context, credentials, and cryptographic proofs.
 */
export type Type = VerifiablePresentationV1;

/**
 * JSON representation of a verifiable presentation.
 * Used for serialization and network transmission of presentation data.
 */
export type JSON = {
    type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'];
    /** The presentation context with serialized context information */
    presentationContext: ContextJSON;
    /** Array of verifiable credentials with their proofs */
    verifiableCredential: Credential[];
    /** Optional weak linking proof for account-based credentials */
    proof?: ConcordiumWeakLinkingProofV1;
};

/**
 * Deserializes a verifiable presentation from its JSON representation.
 *
 * This function reconstructs the presentation object from JSON data, handling
 * the conversion of serialized context information back to proper types.
 *
 * @param value - The JSON representation to deserialize
 * @returns The deserialized verifiable presentation
 */
export function fromJSON(value: JSON): VerifiablePresentationV1 {
    const presentationContext: Context = proofContextFromJSON(value.presentationContext);
    return new VerifiablePresentationV1(presentationContext, value.verifiableCredential, value.proof);
}

export type Request = {
    context: Context;
    subjectClaims: SubjectClaims[];
};

/**
 * Union type of all commitment input types used for generating zero-knowledge proofs.
 * These inputs contain the secret information needed to create proofs without revealing
 * the actual credential data.
 */
export type CommitmentInput = IdentityCommitmentInput | AccountCommitmentInput;

/**
 * Creates a verifiable presentation from an anchored {@linkcode VerificationRequestV1}.
 *
 * This function retrieves the presentation request anchor from the blockchain,
 * verifies its integrity, and creates a verifiable presentation with the
 * requested statements and proofs. It automatically includes blockchain
 * context (block hash) in the presentation.
 *
 * @param grpc - Concordium GRPC client for blockchain interaction
 * @param verificationRequest - The anchored verification request
 * @param claims - The claims to prove for the corresponding subject
 * @param inputs - The credential inputs for generating proofs corresponding to the `claims`
 * @param additionalContext - Additional context information beyond block hash
 *
 * @returns Promise resolving to the created verifiable presentation
 * @throws Error if anchor verification fails or blockchain interaction errors
 */
export async function createFromAnchor(
    grpc: ConcordiumGRPCClient,
    verificationRequest: VerificationRequestV1.Type,
    claims: SubjectClaims[],
    inputs: CommitmentInput[],
    additionalContext: GivenContext[]
): Promise<VerifiablePresentationV1> {
    const globalContext = await grpc.getCryptographicParameters();
    const transaction = await grpc.getBlockItemStatus(verificationRequest.transactionRef);
    if (transaction.status !== TransactionStatusEnum.Finalized) {
        throw new Error('presentation request anchor transaction not finalized');
    }
    const { summary, blockHash } = transaction.outcome;
    if (
        !isKnown(summary) ||
        summary.type !== TransactionSummaryType.AccountTransaction ||
        summary.transactionType !== TransactionKindString.RegisterData
    ) {
        throw new Error('Unexpected transaction type found for presentation request anchor transaction');
    }

    const expectedAnchorHash = VerificationRequestV1.computeAnchorHash(
        verificationRequest.context,
        verificationRequest.credentialStatements
    );
    const transactionAnchor = VerificationRequestV1.decodeAnchor(Buffer.from(summary.dataRegistered.data, 'hex'));
    if (Buffer.from(expectedAnchorHash).toString('hex') !== Buffer.from(transactionAnchor.hash).toString('hex')) {
        throw new Error('presentation anchor verification failed.');
    }

    const blockContext: GivenContext = { label: 'BlockHash', context: blockHash };
    const proofContext = createContext(verificationRequest.context, [...additionalContext, blockContext]);
    return create({ context: proofContext, subjectClaims: claims }, inputs, globalContext);
}

/**
 * Matches the corresponding type in rust-bindings/wallet
 */
type RequestJSON = {
    type: 'ConcordiumVerifiablePresentationRequestV1';
    context: ContextJSON;
    subjectClaims: SubjectClaims[];
};

/**
 * Matches the corresponding type in rust-bindings/wallet
 */
type PresenationV1Input = {
    request: RequestJSON;
    global: CryptographicParameters;
    inputs: CommitmentInput[];
};

/**
 * Creates a verifiable presentation with the specified statements, inputs, and context.
 *
 * This function generates zero-knowledge proofs for the requested credential statements
 * using the provided commitment inputs and proof context. It handles different types
 * of credentials (identity-based, account-based) and creates appropriate
 * proofs for each.
 *
 * @param presentationRequest - The presenation request describing the credentials
 * @param inputs - The commitment inputs for generating proofs
 * @param globalContext - Concordium network cryptographic parameters
 *
 * @returns The created verifiable presentation with all proofs
 */
export function create(
    { context, subjectClaims }: Request,
    inputs: CommitmentInput[],
    globalContext: CryptographicParameters
): VerifiablePresentationV1 {
    const requestJson: RequestJSON = {
        type: 'ConcordiumVerifiablePresentationRequestV1',
        context: proofContextToJSON(context),
        subjectClaims: subjectClaims,
    };
    const input: PresenationV1Input = {
        request: requestJson,
        global: globalContext,
        inputs,
    };
    let serializedPresentation = wasm.createPresentationV1(JSONBig.stringify(input));
    return fromJSON(JSONBig.parse(serializedPresentation));
}

/**
 * Describes the result of a verifiable presentation verification, which can either succeed
 * or fail with an associated {@linkcode Error}
 */
export type VerificationResult = { type: 'success' } | { type: 'failed'; error: Error };

/**
 * The public data needed to verify an account based verifiable credential.
 */
export type AccountVerificationMaterial = CredentialsInputsAccount;

/**
 * The public data needed to verify an identity based verifiable credential.
 */
export type IdentityVerificationMaterial = CredentialsInputsIdentity;

/**
 * Union type of all verification material types used for verification.
 * These inputs contain the public credential data needed to verify proofs.
 */
export type VerificationMaterial = AccountVerificationMaterial | IdentityVerificationMaterial;

/**
 * Verifies a verifiable presentation against its corresponding request.
 *
 * This function validates the cryptographic proofs in the presentation,
 * checks that they match the original request, and verifies them against
 * the provided public data and cryptographic parameters.
 *
 * @param presentation - The verifiable presentation to verify
 * @param request - The original verification request
 * @param cryptographicParameters - Concordium network cryptographic parameters
 * @param publicData - Public credential data for verification
 *
 * @returns a {@linkcode VerificationResult}
 */
// TODO: for now this just returns true, but this should be replaced with call to the coresponding function in
// @concordium/rust-bindings that verifies the presentation in the context of the request.
export function verify(
    presentation: VerifiablePresentationV1,
    request: VerificationRequestV1.Type,
    cryptographicParameters: CryptographicParameters,
    publicData: VerificationMaterial[]
): VerificationResult {
    return { type: 'success' };
}

/**
 * Verifies a verifiable presentation using a Concordium node.
 *
 * This function performs verification by querying a Concordium node for
 * the necessary cryptographic parameters and public data, then validates
 * the presentation proofs against the blockchain state.
 *
 * @param presentation - The verifiable presentation to verify
 * @param request - The original verification request
 * @param grpc - Concordium GRPC client for node communication
 * @param network - The Concordium network to verify against
 *
 * @returns Promise resolving to a {@linkcode VerificationResult}
 */
export async function verifyWithNode(
    presentation: VerifiablePresentationV1,
    request: VerificationRequestV1.Type,
    grpc: ConcordiumGRPCClient,
    network: Network
): Promise<VerificationResult> {
    return { type: 'success' };
}
