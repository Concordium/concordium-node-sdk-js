import * as wasm from '@concordium/rust-bindings/wallet';
import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import {
    AttributeKey,
    BlockHash,
    ConcordiumGRPCClient,
    CredentialRegistrationId,
    CryptographicParameters,
    Network,
    TransactionKindString,
    TransactionStatusEnum,
    TransactionSummaryType,
    isKnown,
} from '../../index.js';
import { bail } from '../../util.js';
import {
    AccountCommitmentInput,
    AtomicStatementV2,
    CredentialStatus,
    DIDString,
    IdentityCommitmentInput,
    createAccountDID,
    createIdentityStatementDID,
} from '../../web3-id/index.js';
import { VerifiableCredentialV1, VerificationRequestV1 } from './index.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
import { GivenContext } from './types.js';

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

export function isAccountClaims(claim: SubjectClaims): claim is AccountClaims {
    return (claim as AccountClaims).type.includes('ConcordiumAccountBasedSubjectClaims');
}

export function isIdentityClaims(claim: SubjectClaims): claim is AccountClaims {
    return (claim as IdentityClaims).type.includes('ConcordiumIdBasedSubjectClaims');
}

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
 * A proof that establishes that the owner of the credential has indeed created
 * the presentation. At present this is a list of signatures.
 */
export type WeakLinkingProof = {
    /** When the statement was created, serialized as an ISO string */
    created: string;
    /** The proof value */
    proofValue: string;
    /** The proof type */
    type: 'ConcordiumWeakLinkingProofV1';
};

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
     * @param proof - Weak linking proof
     */
    constructor(
        public readonly presentationContext: Context,
        public readonly verifiableCredential: VerifiableCredentialV1.Type[],
        public readonly proof: WeakLinkingProof
    ) {}

    /**
     * Serializes the verifiable presentation to a JSON representation.
     *
     * @returns The JSON representation of this presentation
     */
    public toJSON(): JSON {
        return {
            type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'],
            presentationContext: proofContextToJSON(this.presentationContext),
            verifiableCredential: this.verifiableCredential,
            proof: this.proof,
        };
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
    verifiableCredential: VerifiableCredentialV1.Type[];
    /** Optional weak linking proof for account-based credentials */
    proof: WeakLinkingProof;
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
        verificationRequest.subjectClaims
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
export type VerificationResult<T> = { type: 'success'; result: T } | { type: 'failed'; error: Error };

/**
 * Get all public metadata of the {@linkcode VerifiablePresentationV1}. The metadata is verified as part of this.
 *
 * @param presentation - The verifiable presentation to verify
 * @param grpc - The {@linkcode ConcordiumGRPCClient} to use for querying
 * @param network - The target network
 * @param [blockHash] - The block to verify the proof at. If not specified, the last finalized block is used.
 *
 * @returns The corresponding list of {@linkcode CredentialWithMetadata} if successful.
 * @throws If credential metadata could not be successfully verified
 */
export async function getPublicData(
    presentation: VerifiablePresentationV1,
    grpc: ConcordiumGRPCClient,
    network: Network,
    blockHash?: BlockHash.Type
): Promise<VerifiableCredentialV1.MetadataVerificationResult[]> {
    const promises = presentation.verifiableCredential.map((vc) =>
        VerifiableCredentialV1.verifyMetadata(vc, grpc, network, blockHash)
    );

    return await Promise.all(promises);
}

type VerifyPresentationV1Input = {
    presentation: VerifiablePresentationV1;
    globalContext: CryptographicParameters;
    publicData: VerifiableCredentialV1.VerificationMaterial[];
};

/**
 * Verifies a verifiable presentation against its corresponding request.
 *
 * This function validates the cryptographic proofs in the presentation,
 * checks that they match the original request, and verifies them against
 * the provided public data and cryptographic parameters.
 *
 * @param presentation - The verifiable presentation to verify
 * @param cryptographicParameters - Concordium network cryptographic parameters
 * @param publicData - Public credential data for verification
 *
 * @returns a {@linkcode VerificationResult} contiaining the {@linkcode Request}.
 * @throws If presentation could not be successfully verified
 */
export function verify(
    presentation: VerifiablePresentationV1,
    cryptographicParameters: CryptographicParameters,
    publicData: VerifiableCredentialV1.VerificationMaterial[]
): VerificationResult<Request> {
    const input: VerifyPresentationV1Input = {
        presentation,
        globalContext: cryptographicParameters,
        publicData,
    };
    const serializedRequest = wasm.verifyPresentationV1(JSONBig.stringify(input));
    const requestJson: RequestJSON = JSONBig.parse(serializedRequest);
    const request: Request = {
        context: proofContextFromJSON(requestJson.context),
        subjectClaims: requestJson.subjectClaims,
    };
    return { type: 'success', result: request };
}

/**
 * Verifies a verifiable presentation using a Concordium node.
 *
 * This function performs verification by querying a Concordium node for
 * the necessary cryptographic parameters and public data, then validates
 * the presentation proofs against the blockchain state.
 *
 * @param presentation - The verifiable presentation to verify
 * @param grpc - Concordium GRPC client for node communication
 * @param network - The Concordium network to verify against
 * @param [blockHash] - The block to verify the proof at. If not specified, the last finalized block is used.
 *
 * @returns Promise resolving to a {@linkcode VerificationResult} contiaining the {@linkcode Request} and a
 * list of statuses for each credential in the presentation.
 *
 * @throws If presentation could not be successfully verified
 * @throws If credential metadata could not be successfully verified
 */
export async function verifyWithNode(
    presentation: VerifiablePresentationV1,
    grpc: ConcordiumGRPCClient,
    network: Network,
    blockHash?: BlockHash.Type
): Promise<VerificationResult<{ request: Request; credentialsStatus: CredentialStatus[] }>> {
    const cryptoParams = await grpc.getCryptographicParameters(blockHash);
    const publicData = await getPublicData(presentation, grpc, network, blockHash);

    try {
        const request = verify(
            presentation,
            cryptoParams,
            publicData.map((d) => d.inputs)
        );
        if (request.type === 'failed') return request;

        return {
            type: 'success',
            result: { request: request.result, credentialsStatus: publicData.map((d) => d.status) },
        };
    } catch (e) {
        const error = e instanceof Error ? e : new Error(`{e}`);
        return { type: 'failed', error };
    }
}
