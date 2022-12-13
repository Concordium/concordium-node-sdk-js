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

export interface WalletConnection {
    getConnector(): WalletConnector;

    getConnectedAccount(): Promise<string | undefined>;

    // Cannot be in 'WalletConnector' as the browser wallet's client doesn't work until there is a connection.
    getJsonRpcClient(): JsonRpcClient;

    signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType.Update | AccountTransactionType.InitContract,
        payload: SendTransactionPayload,
        parameters: Record<string, unknown>,
        schema: string,
        schemaVersion?: SchemaVersion
    ): Promise<string>;

    signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: SendTransactionPayload
    ): Promise<string>;

    signMessage(accountAddress: string, message: string): Promise<AccountTransactionSignature>;

    disconnect(): Promise<void>;
}

export interface Network {
    name: string;

    genesisHash: string;

    jsonRpcUrl: string;
}

export interface WalletConnectionDelegate {
    onChainChanged(connection: WalletConnection, chain: string): void;
    onAccountChanged(connection: WalletConnection, address: string | undefined): void;
    onDisconnect(connection: WalletConnection): void;
}

export interface WalletConnector {
    connect(): Promise<WalletConnection>;
    getConnections(): Promise<WalletConnection[]>;
}

export async function withJsonRpcClient<T>(wc: WalletConnection, f: (c: JsonRpcClient) => Promise<T>) {
    return f(wc.getJsonRpcClient());
}

export async function destroy(connector: WalletConnector) {
    const connections = await connector.getConnections();
    return Promise.all(connections.map((c) => c.disconnect())).then((vs) => vs.length);
}

export async function connectedAccountOf(connection: WalletConnection | undefined) {
    return connection ? connection.getConnectedAccount() : undefined;
}
