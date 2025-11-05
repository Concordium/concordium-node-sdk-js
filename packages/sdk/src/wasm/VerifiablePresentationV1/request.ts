import { sha256 } from '../../hash.js';
import {
    AccountAddress,
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    AttributeKey,
    ConcordiumGRPCClient,
    NextAccountNonce,
    RegisterDataPayload,
    cborDecode,
    cborEncode,
    signTransaction,
} from '../../index.js';
import { DataBlob, TransactionExpiry, TransactionHash } from '../../types/index.js';
import { AccountStatementBuild } from '../../web3-id/proofs.js';
import { AtomicStatementV2, DIDString, IDENTITY_SUBJECT_SCHEMA, IdentityProviderDID } from '../../web3-id/types.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from './internal.js';
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

/**
 * Creates a CBOR-encoded anchor for a verification request.
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
    credentialStatements: Statement[],
    publicInfo?: Record<string, any>
): Uint8Array {
    const hash = computeAnchorHash(context, credentialStatements);
    const data: Anchor = { type: 'CCDVRA', version: VERSION, hash, public: publicInfo };
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
export function computeAnchorHash(context: Context, credentialStatements: Statement[]): Uint8Array {
    // TODO: this is a quick and dirty anchor implementation that needs to be replaced with
    // proper serialization, which is TBD.
    const sanitizedContext: Context = {
        ...context,
        given: context.given.map(
            (c) =>
                ({
                    ...c,
                    // convert any potential `Buffer` instances to raw Uint8Array to avoid discrepancies when decoding
                    context: c.context instanceof Uint8Array ? Uint8Array.from(c.context) : c.context,
                }) as GivenContext
        ),
    };
    const contextDigest = cborEncode(sanitizedContext);
    const statementsDigest = cborEncode(credentialStatements);
    return Uint8Array.from(sha256([contextDigest, statementsDigest]));
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
 * JSON representation of a verification request.
 * Used for serialization and network transmission of request data.
 */
export type JSON = {
    type: 'ConcordiumVerificationRequestV1';
    /** The request context with serialized given contexts */
    context: Pick<Context, 'type' | 'requested'> & { given: GivenContextJSON[] };
    /** The credential statements being requested */
    credentialStatements: StatementJSON[];
    /** Reference to the blockchain transaction containing the request anchor */
    transactionRef: TransactionHash.JSON;
};

/**
 * Type of identity credential source that can be used for proving attributes.
 */
type IdentityCredType = 'identityCredential' | 'accountCredential';

/**
 * Statement requesting proofs from identity credentials issued by identity providers.
 * Can specify whether to accept proofs from identity credentials, account credentials, or both.
 */
export type IdentityStatement = {
    /** Type discriminator for identity statements */
    type: 'identity';
    /** Source types accepted for this statement (identity credential, account credential, or both) */
    source: IdentityCredType[];
    /** Atomic statements about identity attributes to prove */
    statement: AtomicStatementV2<AttributeKey>[];
    /** Valid identity provider issuers for this statement */
    issuers: IdentityProviderDID[];
};

/**
 * Union type representing all supported statement types in a verification request.
 */
export type Statement = IdentityStatement;

/**
 * JSON representation of statements with issuer DIDs serialized as strings.
 */
type StatementJSON = Omit<IdentityStatement, 'issuers'> & {
    issuers: DIDString[];
};

/**
 * Builder class for constructing credential statement requests.
 * Provides methods to add different types of credential statements with their requirements.
 */
class StatementBuilder {
    /** Array of credential statements being built. */
    private statements: Statement[] = [];

    /**
     * Add statements for identity credentials.
     *
     * @param validIdentityProviders Array of identity provider identifyers that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    addIdentityStatement(
        validIdentityProviders: IdentityProviderDID[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): StatementBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        this.statements.push({
            type: 'identity',
            source: ['identityCredential'],
            statement: builder.getStatement(),
            issuers: validIdentityProviders,
        });
        return this;
    }

    /**
     * Add statements for account credentials.
     *
     * @param validIdentityProviders Array of identity provider identifyers that are valid issuers
     * @param builderCallback Callback function to build the statements using the provided identity builder
     *
     * @returns The updated builder instance
     */
    addAccountStatement(
        validIdentityProviders: IdentityProviderDID[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): StatementBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        this.statements.push({
            type: 'identity',
            source: ['accountCredential'],
            statement: builder.getStatement(),
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
    addAccountOrIdentityStatement(
        validIdentityProviders: IdentityProviderDID[],
        builderCallback: (builder: AccountStatementBuild) => void
    ): StatementBuilder {
        const builder = new AccountStatementBuild(IDENTITY_SUBJECT_SCHEMA);
        builderCallback(builder);
        this.statements.push({
            type: 'identity',
            source: ['accountCredential', 'identityCredential'],
            statement: builder.getStatement(),
            issuers: validIdentityProviders,
        });
        return this;
    }

    /**
     * Get the built credential statements.
     * @returns Array of credential statements
     */
    getStatements(): Statement[] {
        return this.statements;
    }
}

/**
 * Creates a new statement builder for constructing credential requests.
 *
 * @returns A new statement builder instance
 */
export function statementBuilder(): StatementBuilder {
    return new StatementBuilder();
}

/**
 * A verification request that specifies what credentials and proofs
 * are being requested from a credential holder. This class encapsulates the
 * request context, the specific credential statements needed, and a reference
 * to the blockchain transaction that anchors the request.
 */
class VerificationRequestV1 {
    /**
     * Creates a new verification request.
     *
     * @param context - The context information for this request
     * @param credentialStatements - The specific credential statements being requested
     * @param transactionRef - Reference to the blockchain transaction anchoring this request
     */
    constructor(
        public readonly context: Context,
        public readonly credentialStatements: Statement[],
        public readonly transactionRef: TransactionHash.Type
    ) {}

    /**
     * Serializes the verification request to a JSON representation.
     *
     * @returns The JSON representation of this presentation request
     */
    public toJSON(): JSON {
        const credentialStatements = this.credentialStatements.map((statement) => ({
            ...statement,
            issuers: statement.issuers.map((i) => i.toJSON()),
        }));
        return {
            type: 'ConcordiumVerificationRequestV1',
            context: { ...this.context, given: this.context.given.map(givenContextToJSON) },
            credentialStatements,
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
    const statements: Statement[] = json.credentialStatements.map((statement) => {
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
    credentialStatements: Statement[],
    anchorPublicInfo?: Record<string, any>
): Promise<VerificationRequestV1> {
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
    credentialStatements: Statement[],
    transactionRef: TransactionHash.Type
): VerificationRequestV1 {
    return new VerificationRequestV1(context, credentialStatements, transactionRef);
}
