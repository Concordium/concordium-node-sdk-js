import { Buffer } from 'buffer/index.js';
import _JB from 'json-bigint';

import { sha256 } from '../../hash.js';
import {
    AccountAddress,
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    ConcordiumGRPCClient,
    NextAccountNonce,
    RegisterDataPayload,
    cborDecode,
    cborEncode,
    signTransaction,
} from '../../index.js';
import { ContractAddress, DataBlob, TransactionExpiry, TransactionHash } from '../../types/index.js';
import { CredentialStatement, StatementProverQualifier } from '../../web3-id/types.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
import { CredentialContextLabel, GivenContext } from './types.js';

const JSONBig = _JB({ useNativeBigInt: true, alwaysParseAsBig: true });

/**
 * Context information for a verifiable presentation request.
 * Contains both the context data that is already known (given) and
 * the context data that needs to be provided by the presenter (requested).
 */
export type Context = {
    /** Type identifier for the context format */
    type: 'ConcordiumContextInformationV1';
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
    return { type: 'ConcordiumContextInformationV1', ...context };
}

/**
 * Creates a simple context with commonly used parameters for basic verification scenarios.
 *
 * This is a convenience function that creates a context with a nonce for freshness,
 * a connection ID for session tracking, and a context string for additional information.
 * It requests BlockHash and ResourceID to be provided by the presenter.
 *
 * @param nonce - Cryptographic nonce for preventing replay attacks
 * @param connectionId - Identifier for the verification session
 * @param contextString - Additional context information
 *
 * @returns A context object configured for basic verification
 */
export function createSimpleContext(nonce: Uint8Array, connectionId: string, contextString: string): Context {
    return createContext({
        given: [
            { label: 'Nonce', context: nonce },
            { label: 'ConnectionID', context: connectionId },
            { label: 'ContextString', context: contextString },
        ],
        requested: ['BlockHash', 'ResourceID'],
    });
}

/**
 * Data structure for CBOR-encoded verifiable presentation request anchors.
 * This format is used when storing presentation requests on the Concordium blockchain.
 */
export type AnchorData = {
    /** Type identifier for Concordium Verifiable Request Anchor */
    type: 'CCDVRA';
    /** Version of the anchor data format */
    version: number;
    /** Hash of the presentation request */
    // TODO: maybe use a specific type for sha256 hash
    hash: Uint8Array;
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

/**
 * Creates a CBOR-encoded anchor for a verifiable presentation request.
 *
 * This function creates a standardized CBOR-encoded representation of the
 * presentation request that can be stored on the Concordium blockchain as
 * transaction data. The anchor includes a hash of the request and optional
 * public metadata.
 *
 * @param context - The context information for the request
 * @param credentialStatements - The credential statements being requested
 * @param publicInfo - Optional public information to include in the anchor
 *
 * @returns CBOR-encoded anchor data suitable for blockchain storage
 */
export function createAnchor(
    context: Context,
    credentialStatements: CredentialStatement[],
    publicInfo?: Record<string, any>
): Uint8Array {
    const hash = computeAnchorHash(context, credentialStatements);
    const data: AnchorData = { type: 'CCDVRA', version: 1, hash, public: publicInfo };
    return cborEncode(data);
}

/**
 * Computes a hash of the presentation request context and statements.
 *
 * This hash is used to create a tamper-evident anchor that can be stored
 * on-chain to prove the request was made at a specific time and with
 * specific parameters.
 *
 * @param context - The context information for the request
 * @param credentialStatements - The credential statements being requested
 *
 * @returns SHA-256 hash of the serialized request data
 */
export function computeAnchorHash(context: Context, credentialStatements: CredentialStatement[]): Uint8Array {
    // TODO: this is a quick and dirty anchor implementation that needs to be replaced with
    // proper serialization, which is TBD.
    const contextDigest = Buffer.from(JSON.stringify(context));
    const statementsDigest = Buffer.from(JSONBig.stringify(credentialStatements));
    return Uint8Array.from(sha256([contextDigest, statementsDigest]));
}

/**
 * Decodes a CBOR-encoded verifiable presentation request anchor.
 *
 * This function parses and validates a CBOR-encoded anchor that was previously
 * created with `createAnchor`. It ensures the anchor has the correct format
 * and contains all required fields.
 *
 * @param cbor - The CBOR-encoded anchor data to decode
 * @returns The decoded anchor data structure
 * @throws Error if the CBOR data is invalid or doesn't match expected format
 */
export function decodeAnchor(cbor: Uint8Array): AnchorData {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVRA') throw new Error('Expected "type" to be "CCDVRA"');
    if (!('version' in value) || typeof value.version !== 'number')
        throw new Error('Expected "version" to be a number');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as AnchorData;
}

/**
 * JSON representation of a verifiable presentation request.
 * Used for serialization and network transmission of request data.
 *
 * The structure is reminiscent of a w3c verifiable presentation
 */
export type JSON = {
    /** The request context with serialized given contexts */
    requestContext: Pick<Context, 'type' | 'requested'> & { given: GivenContextJSON[] };
    /** The credential statements being requested */
    credentialStatements: CredentialStatement[];
    /** Reference to the blockchain transaction containing the request anchor */
    transactionRef: TransactionHash.JSON;
};

/**
 * A verifiable presentation request that specifies what credentials and proofs
 * are being requested from a credential holder. This class encapsulates the
 * request context, the specific credential statements needed, and a reference
 * to the blockchain transaction that anchors the request.
 */
class VerifiablePresentationRequestV1 {
    /**
     * Creates a new verifiable presentation request.
     *
     * @param requestContext - The context information for this request
     * @param credentialStatements - The specific credential statements being requested
     * @param transactionRef - Reference to the blockchain transaction anchoring this request
     */
    constructor(
        public readonly requestContext: Context,
        public readonly credentialStatements: CredentialStatement[],
        public readonly transactionRef: TransactionHash.Type // NOTE: renamed from requestTX in ADR
    ) {}

    /**
     * Serializes the presentation request to a JSON representation.
     *
     * @returns The JSON representation of this presentation request
     */
    public toJSON(): JSON {
        return {
            requestContext: { ...this.requestContext, given: this.requestContext.given.map(givenContextToJSON) },
            credentialStatements: this.credentialStatements,
            transactionRef: this.transactionRef.toJSON(),
        };
    }
}

/**
 * A verifiable presentation request that specifies what credentials and proofs
 * are being requested from a credential holder. This class encapsulates the
 * request context, the specific credential statements needed, and a reference
 * to the blockchain transaction that anchors the request.
 */
export type Type = VerifiablePresentationRequestV1;

/**
 * Deserializes a verifiable presentation request from its JSON representation.
 *
 * This function reconstructs the request object from JSON data, handling
 * the conversion of serialized context information and credential statements
 * back to their proper types.
 *
 * @param json - The JSON representation to deserialize
 * @returns The deserialized verifiable presentation request
 */
export function fromJSON(json: JSON): VerifiablePresentationRequestV1 {
    const requestContext = { ...json.requestContext, given: json.requestContext.given.map(givenContextFromJSON) };
    const statements: CredentialStatement[] = json.credentialStatements.map(({ statement, idQualifier }) => {
        let mappedQualifier: StatementProverQualifier;
        switch (idQualifier.type) {
            case 'id':
                mappedQualifier = { type: 'id', issuers: idQualifier.issuers.map(Number) };
                break;
            case 'cred':
                mappedQualifier = { type: 'cred', issuers: idQualifier.issuers.map(Number) };
                break;
            case 'sci':
                mappedQualifier = {
                    type: 'sci',
                    issuers: idQualifier.issuers.map((c) => ContractAddress.create(c.index, c.subindex)),
                };
                break;
            default:
                mappedQualifier = idQualifier;
        }
        return { statement, idQualifier: mappedQualifier } as CredentialStatement;
    });

    return new VerifiablePresentationRequestV1(
        requestContext,
        statements,
        TransactionHash.fromJSON(json.transactionRef)
    );
}

/**
 * Creates a verifiable presentation request and anchors it to the Concordium blockchain.
 *
 * This function creates a presentation request with the specified context and credential
 * statements, then stores an anchor of the request on the blockchain as a data registration
 * transaction. The blockchain anchor provides a tamper-evident timestamp and immutable
 * record of the request.
 *
 * @param grpc - The Concordium GRPC client for blockchain interaction
 * @param sender - The account address that will send the anchoring transaction
 * @param signer - The signer for the anchoring transaction
 * @param context - The context information for the request (without type field)
 * @param credentialStatements - The credential statements being requested
 * @param anchorPublicInfo - Optional public information to include in the anchor
 *
 * @returns Promise resolving to the created presentation request
 * @throws Error if the transaction fails or network issues occur
 */
export async function createAndAchor(
    grpc: ConcordiumGRPCClient,
    sender: AccountAddress.Type,
    signer: AccountSigner,
    context: Omit<Context, 'type'>,
    credentialStatements: CredentialStatement[],
    anchorPublicInfo?: Record<string, any>
): Promise<VerifiablePresentationRequestV1> {
    const requestContext = createContext(context);
    const anchor = createAnchor(requestContext, credentialStatements, anchorPublicInfo);

    const nextNonce: NextAccountNonce = await grpc.getNextAccountNonce(sender);
    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
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
 * Creates a new verifiable presentation request.
 *
 * This is a factory function that creates a request with the specified
 * context, credential statements, and transaction reference.
 *
 * @param context - The context information for the request
 * @param credentialStatements - The credential statements being requested
 * @param transactionRef - Reference to the blockchain transaction anchoring this request
 *
 * @returns A new verifiable presentation request instance
 */
export function create(
    context: Context,
    credentialStatements: CredentialStatement[],
    transactionRef: TransactionHash.Type
): VerifiablePresentationRequestV1 {
    return new VerifiablePresentationRequestV1(context, credentialStatements, transactionRef);
}
