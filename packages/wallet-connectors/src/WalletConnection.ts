import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
    JsonRpcClient,
    SchemaVersion,
    UpdateContractPayload,
} from '@concordium/web-sdk';

// Copied from 'wallet-api-types.ts' in 'browser-wallet-api-helpers' as it isn't exported.
type SendTransactionPayload =
    | Exclude<AccountTransactionPayload, UpdateContractPayload | InitContractPayload>
    | Omit<UpdateContractPayload, 'message'>
    | Omit<InitContractPayload, 'param'>;

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
     * Returns a JSON-RPC client that is ready to perform requests against some Concordium Node connected to network/chain
     * that the connected account lives on.
     *
     * This method is included because it's part of the Browser Wallet's API.
     * It should be used with care as it's hard to guarantee that it actually connects to the expected network.
     * The application may easily instantiate its own client and use that instead for more control.
     *
     * Note that this method cannot be moved to {@link WalletConnector} as the Browser Wallet's RPC client doesn't work
     * until a connection has been established.
     *
     * @return Returns a JSON-RPC client for performing requests against a Concordium Node connected
     * to the appropriate network.
     */
    getJsonRpcClient(): JsonRpcClient;

    /**
     * Assembles a contract init/update transaction and sends it off to the wallet for approval and submission.
     *
     * The returned promise resolves to the hash of the transaction once the request is approved in the wallet and successfully submitted.
     * If this doesn't happen, the promise rejects with an explanatory error message.
     *
     * The parameters of the contract invocation must be provided in the {@link parameters} field, *not* {@link payload}.
     * @param accountAddress The account whose keys are used to sign the transaction.
     * @param type Type of the transaction (i.e. {@link AccountTransactionType.InitContract} or {@link AccountTransactionType.Update}.
     * @param payload The payload of the transaction *not* including the parameters of the contract invocation.
     * @param parameters The parameters of the contract invocation, given as a non-encoded, structured JavaScript object.
     * @param schema Schema for the contract invocation parameters.
     * @param schemaVersion Version of the provided schema.
     * @return A promise for the hash of the submitted transaction.
     */
    signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType.Update | AccountTransactionType.InitContract,
        payload: SendTransactionPayload,
        parameters: Record<string, unknown>,
        schema: string,
        schemaVersion?: SchemaVersion
    ): Promise<string>;

    /**
     * Assembles a transaction which is not a contract init/update (with parameters)
     * and sends it off to the wallet for approval and submission.
     *
     * The returned promise resolves to the hash of the transaction once the request is approved in the wallet and successfully submitted.
     * If this doesn't happen, the promise rejects with an explanatory error message.
     *
     * The parameters of the contract invocation must be provided in the {@link parameters} field, *not* {@link payload}.
     * @param accountAddress The account whose keys are used to sign the transaction.
     * @param type Type of the transaction.
     * @param payload The payload of the transaction.
     * @return A promise for the hash of the submitted transaction.
     */
    signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: SendTransactionPayload
    ): Promise<string>;

    /**
     * Request the wallet to sign a message using the keys of the given account.
     *
     * The returned promise resolves to the signatures once the wallet approves the request and successfully signs the message.
     * If this doesn't happen, the promise rejects with an explanatory error message.
     *
     * @param accountAddress The account whose keys are used to sign the message.
     * @param message The message to sign.
     * @return A promise for the signatures of the message.
     */
    signMessage(accountAddress: string, message: string): Promise<AccountTransactionSignature>;

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
     * The URL of a <a href="https://github.com/Concordium/concordium-json-rpc">Concordium JSON-RPC proxy</a> instance
     * for performing API (v1) queries against a Concordium Node instance connected to this network.
     */
    jsonRpcUrl: string;

    /**
     * The base URL of a <a href="https://github.com/Concordium/concordium-scan">CCDScan</a> instance
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
    getConnections(): Promise<WalletConnection[]>;

    /**
     * Ensure that all connections initiated by this connector are disconnected
     * and clean up resources associated to the connector.
     * See the documentation for the concrete implementations for details on what guarantees they provide.
     */
    disconnect(): Promise<void>;
}

/**
 * Convenience function for invoking an async function with the JSON-RPC proxy client of the given {@link WalletConnection}.
 *
 * @param connection The connected used to resolve the RPC client.
 * @param f The async function to invoke.
 * @return The promise returned by {@link f}.
 */
export async function withJsonRpcClient<T>(connection: WalletConnection, f: (c: JsonRpcClient) => Promise<T>) {
    return f(connection.getJsonRpcClient());
}
