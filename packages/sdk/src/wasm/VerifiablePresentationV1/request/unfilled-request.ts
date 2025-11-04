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
    signTransaction,
} from '../../../index.js';
import { DataBlob, TransactionExpiry, TransactionHash } from '../../../types/index.js';
import { AccountStatementBuild } from '../../../web3-id/proofs.js';
import { AtomicStatementV2, DIDString, IDENTITY_SUBJECT_SCHEMA, IdentityProviderDID } from '../../../web3-id/types.js';
import { GivenContextJSON, givenContextFromJSON, givenContextToJSON } from '../internal.js';
import { CredentialContextLabel, GivenContext } from '../types.js';
import { createAnchor } from './anchor.js';

/**
 * Context information for an unfilled verifiable presentation request.
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
 * JSON representation of a verifiable presentation request.
 * Used for serialization and network transmission of request data.
 *
 * The structure is reminiscent of a w3c verifiable presentation
 */
export type JSON = {
    type: 'ConcordiumUnfilledVerifiablePresentationRequestV1';
    /** The request context with serialized given contexts */
    requestContext: Pick<Context, 'type' | 'requested'> & { given: GivenContextJSON[] };
    /** The credential statements being requested */
    credentialStatements: StatementJSON[];
    /** Reference to the blockchain transaction containing the request anchor */
    transactionRef: TransactionHash.JSON;
};

/**
 * Type of identity credential source that can be used for proving attributes.
 */
type IdentityCredType = 'identity' | 'account';

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
 * Union type representing all supported statement types in a verifiable presentation request.
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
            source: ['identity'],
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
            source: ['account'],
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
            source: ['account', 'identity'],
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
 * A verifiable presentation request that specifies what credentials and proofs
 * are being requested from a credential holder. This class encapsulates the
 * request context, the specific credential statements needed, and a reference
 * to the blockchain transaction that anchors the request.
 */
class UnfilledVerifiablePresentationRequestV1 {
    /**
     * Creates a new verifiable presentation request.
     *
     * @param requestContext - The context information for this request
     * @param credentialStatements - The specific credential statements being requested
     * @param transactionRef - Reference to the blockchain transaction anchoring this request
     */
    constructor(
        public readonly requestContext: Context,
        public readonly credentialStatements: Statement[],
        public readonly transactionRef: TransactionHash.Type
    ) {}

    /**
     * Serializes the presentation request to a JSON representation.
     *
     * @returns The JSON representation of this presentation request
     */
    public toJSON(): JSON {
        const credentialStatements = this.credentialStatements.map((statement) => ({
            ...statement,
            issuers: statement.issuers.map((i) => i.toJSON()),
        }));
        return {
            type: 'ConcordiumUnfilledVerifiablePresentationRequestV1',
            requestContext: { ...this.requestContext, given: this.requestContext.given.map(givenContextToJSON) },
            credentialStatements,
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
export type Type = UnfilledVerifiablePresentationRequestV1;

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
export function fromJSON(json: JSON): UnfilledVerifiablePresentationRequestV1 {
    const requestContext = { ...json.requestContext, given: json.requestContext.given.map(givenContextFromJSON) };
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

    return new UnfilledVerifiablePresentationRequestV1(
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
    credentialStatements: Statement[],
    anchorPublicInfo?: Record<string, any>
): Promise<UnfilledVerifiablePresentationRequestV1> {
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
    credentialStatements: Statement[],
    transactionRef: TransactionHash.Type
): UnfilledVerifiablePresentationRequestV1 {
    return new UnfilledVerifiablePresentationRequestV1(context, credentialStatements, transactionRef);
}
