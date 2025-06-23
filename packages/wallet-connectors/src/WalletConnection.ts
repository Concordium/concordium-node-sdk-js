import { SendTransactionPayload, SmartContractParameters } from '@concordium/browser-wallet-api-helpers';
import {
    AccountTransactionSignature,
    AccountTransactionType,
    CredentialStatements,
    SchemaVersion,
    VerifiablePresentation,
    toBuffer,
} from '@concordium/web-sdk';
import { GrpcWebOptions } from '@protobuf-ts/grpcweb-transport';
import { Buffer } from 'buffer/';

export type ModuleSchema = {
    type: 'ModuleSchema';
    value: Buffer;
    version?: SchemaVersion;
};
export type TypeSchema = {
    type: 'TypeSchema';
    value: Buffer;
};

/**
 * Discriminated union type for contract invocation schemas.
 * Is used to select the correct method for encoding the invocation parameters using the schema.
 */
export type Schema = ModuleSchema | TypeSchema;

/**
 * {@link Schema} constructor for a module schema.
 * @param schemaBase64 The raw module schema in base64 encoding.
 * @param version The schema spec version. Omit if the version is embedded into the schema.
 * @throws Error if {@link schemaBase64} is not valid base64.
 */
export function moduleSchemaFromBase64(schemaBase64: string, version?: SchemaVersion): ModuleSchema {
    return moduleSchema(schemaAsBuffer(schemaBase64), version);
}

/**
 * {@link Schema} constructor for a module schema.
 * @param schema The raw module schema in binary.
 * @param version The schema spec version. Omit if the version is embedded into the schema.
 */
export function moduleSchema(schema: Buffer, version?: SchemaVersion): ModuleSchema {
    return {
        type: 'ModuleSchema',
        value: schema,
        version: version,
    };
}

/**
 * {@link Schema} constructor for a type schema.
 * @param schemaBase64 The raw parameter schema in base64 encoding.
 * @throws Error if {@link schemaBase64} is not valid base64.
 */
export function typeSchemaFromBase64(schemaBase64: string): TypeSchema {
    return typeSchema(schemaAsBuffer(schemaBase64));
}

/**
 * {@link Schema} constructor for a type schema.
 * @param schema The raw parameter schema in binary.
 */
export function typeSchema(schema: Buffer): TypeSchema {
    return {
        type: 'TypeSchema',
        value: schema,
    };
}

export function schemaAsBuffer(schemaBase64: string) {
    let unpaddedLen = schemaBase64.length;
    if (schemaBase64.charAt(unpaddedLen - 1) === '=') {
        unpaddedLen--;

        if (schemaBase64.charAt(unpaddedLen - 1) === '=') {
            unpaddedLen--;
        }
    }
    const res = toBuffer(schemaBase64, 'base64');
    if (unpaddedLen !== Math.ceil((4 * res.length) / 3)) {
        throw new Error(`The provided schema '${schemaBase64}' is not valid base64`);
    }
    return res;
}

export type TypedSmartContractParameters = {
    parameters: SmartContractParameters;
    schema: Schema;
};

export type StringMessage = {
    type: 'StringMessage';
    value: string;
};
export type BinaryMessage = {
    type: 'BinaryMessage';
    value: Buffer;
    schema: TypeSchema;
};

/**
 * Discriminated union type for signable messages.
 */
export type SignableMessage = StringMessage | BinaryMessage;

/**
 * {@link SignableMessage} constructor for a string message.
 * @param msg The message as a plain string.
 */
export function stringMessage(msg: string): StringMessage {
    return {
        type: 'StringMessage',
        value: msg,
    };
}

/**
 * {@link SignableMessage} constructor for binary message.
 * @param msgHex The message represented in hexadecimal notation.
 * @param schema The schema describing the type of the binary message.
 */
export function binaryMessageFromHex(msgHex: string, schema: TypeSchema): BinaryMessage {
    return {
        type: 'BinaryMessage',
        value: messageAsBuffer(msgHex),
        schema,
    };
}

function messageAsBuffer(msgHex: string) {
    const res = toBuffer(msgHex, 'hex');
    // Check round-trip.
    if (res.toString('hex') !== msgHex) {
        throw new Error(`provided message '${msgHex}' is not valid hex`);
    }
    return res;
}

/**
 * Interface for interacting with a wallet backend through a connection that's already been established.
 * The connected account (and in turn connected network/chain) is managed by the wallet
 * and should therefore not generally be considered fixed for a given connection.
 * Even though some protocols support connecting to multiple accounts at the same time,
 * this interface assumes that only one of them is active at any given time.
 * To listen for changes to the connection parameters a {@link WalletConnectionDelegate} implementation
 * should be registered on the {@link WalletConnector} responsible for the concrete protocol.
 */
export interface WalletConnection {
    /**
     * @return The connector that instantiated this connection.
     */
    getConnector(): WalletConnector;

    /**
     * Ping the connection.
     */
    ping(): Promise<void>;

    /**
     * Assembles a transaction and sends it off to the wallet for approval and submission.
     *
     * The returned promise resolves to the hash of the transaction once the request is approved in the wallet and successfully submitted.
     * If this doesn't happen, the promise rejects with an explanatory error message.
     *
     * If the transaction is a contract init/update, then any contract parameters and a corresponding schema
     * must be provided in {@link typedParams} and parameters must be omitted from {@link payload}.
     * It's an error to provide {@link typedParams} for non-contract transactions and for contract transactions with empty parameters.
     *
     * @param accountAddress The account whose keys are used to sign the transaction.
     * @param type Type of the transaction (i.e. {@link AccountTransactionType.InitContract} or {@link AccountTransactionType.Update}.
     * @param payload The payload of the transaction *not* including the parameters of the contract invocation.
     * @param typedParams The parameters of the contract invocation and a schema describing how to serialize them. The parameters must be given as a plain JavaScript object.
     * @return A promise for the hash of the submitted transaction.
     */
    signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: SendTransactionPayload,
        typedParams?: TypedSmartContractParameters
    ): Promise<string>;

    /**
     * Request the wallet to sign a message using the keys of the given account.
     *
     * The returned promise resolves to the signatures once the wallet approves the request and successfully signs the message.
     * If this doesn't happen, the promise rejects with an explanatory error message.
     *
     * @param accountAddress The account whose keys are used to sign the message.
     * @param msg The message to sign.
     * @return A promise for the signatures of the message.
     */
    signMessage(accountAddress: string, msg: SignableMessage): Promise<AccountTransactionSignature>;

    /**
     * Request the wallet to provide a verifiable presentation for the provided challenge and statements.
     *
     * The returned promise resolves to the verifiable presentation once the wallet approves the request. If
     * this doesn't happen, the promise rejects with an explanatory error message.
     * @param challenge a challenge that is used to avoid accepting proofs created for other contexts.
     * @param credentialStatements the statements to provide a verifiable presentation for
     * @return A promise for the verifiable presentation for the statements.
     */
    requestVerifiablePresentation(
        challenge: string,
        credentialStatements: CredentialStatements
    ): Promise<VerifiablePresentation>;

    /**
     * Close the connection and clean up relevant resources.
     * There's no guarantee that the wallet will consider the connection closed
     * even after the returned promise resolves successfully,
     * but it should ensure that the app stops using the connection.
     * See the documentation for the concrete implementations for details on what guarantees they provide.
     *
     * @return A promise that resolves once the disconnect has completed.
     */
    disconnect(): Promise<void>;
}

/**
 * Collection of fields corresponding to a particular network/chain.
 */
export interface Network {
    /**
     * The name of the network (i.e. "testnet", "mainnet", etc.).
     */
    name: string;

    /**
     * The hash of the genesis block.
     */
    genesisHash: string;

    /**
     * The connection configuration for a gRPC Web endpoint for performing API (v2) queries against a
     * Concordium Node instance connected to this network.
     *
     * The initialization is straightforward:
     * <pre>
     *   import { ConcordiumGRPCClient } from '@concordium/web-sdk';
     *   import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
     *   ...
     *   const client = new ConcordiumGRPCClient(new GrpcWebFetchTransport(network.grpcOpts!));
     * </pre>
     *
     * For React projects, the hook <code>useGrpcClient</code> in
     * {@link https://www.npmjs.com/package/@concordium/react-components @concordium/react-components}
     * makes it very easy to obtain a client that's always connecting to the expected network.
     */
    grpcOpts: GrpcWebOptions | undefined;

    /**
     * The base URL of a {@link https://github.com/Concordium/concordium-scan CCDScan} instance
     * connected to this network.
     * While CCDScan supports queries against its backend,
     * the main use of this URL is to construct links to the frontend.
     */
    ccdScanBaseUrl: string;
}

/**
 * Interface for receiving events in a standardized set of callbacks.
 * As the relevant {@link WalletConnection} is passed into the callback,
 * apps will usually create a single delegate to be reused across all {@link WalletConnector}s
 * over the entire lifetime of the application.
 * The methods could be called redundantly,
 * so implementations should check the argument values against the current state and only react if they differ.
 */
export interface WalletConnectionDelegate {
    /**
     * Notification that the network/chain of the given {@link WalletConnection} has changed, as reported by the wallet.
     * @param connection Affected connection.
     * @param genesisHash The hash of the genesis block corresponding to the current chain.
     */
    onChainChanged(connection: WalletConnection, genesisHash: string): void;

    /**
     * Notification that the account selected on the given {@link WalletConnection} has changed, as reported by the wallet.
     * @param connection Affected connection.
     * @param address The address of the currently connected account.
     */
    onAccountChanged(connection: WalletConnection, address: string | undefined): void;

    /**
     * Notification that the given {@link WalletConnection} has been established.
     * @param connection Affected connection.
     * @param address The address of the initially connected account.
     */
    onConnected(connection: WalletConnection, address: string | undefined): void;

    /**
     * Notification that the given {@link WalletConnection} has been disconnected.
     * @param connection Affected connection.
     */
    onDisconnected(connection: WalletConnection): void;
}

/**
 * Interface for wrapping a client for a concrete protocol and handle events emitted by this client:
 * A {@link WalletConnectionDelegate} is usually passed to the connector on construction
 * to receive events in a standardized format.
 * The implementation may support multiple connections being instantiated from a single connector.
 */
export interface WalletConnector {
    /**
     * Request a connected to be initiated over the underlying protocol.
     *
     * Once the wallet approves the connection, the returned promise resolves to the connection object.
     * If the user cancels the connection before it's established, then the promise resolves to undefined.
     * Not all connectors support cancellation.
     *
     * If the wallet rejects the connection (or establishing it fails for other reasons),
     * then the promise rejects with an explanatory error message.
     *
     * @return A promise resolving to the resulting connection object.
     */
    connect(): Promise<WalletConnection | undefined>;

    /**
     * Get a list of all connections initiated by this connector that have not been disconnected.
     * @return A promise resolving to all the connector's connections.
     */
    getConnections(): WalletConnection[];

    /**
     * Ensure that all connections initiated by this connector are disconnected
     * and clean up resources associated to the connector.
     * See the documentation for the concrete implementations for details on what guarantees they provide.
     */
    disconnect(): Promise<void>;
}
