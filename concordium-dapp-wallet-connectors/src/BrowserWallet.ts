/* eslint-disable no-console */

// eslint-disable-next-line max-classes-per-file
import { detectConcordiumProvider, WalletApi } from '@concordium/browser-wallet-api-helpers';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    JsonRpcClient,
    SchemaVersion,
} from '@concordium/web-sdk';
import { WalletConnectionDelegate, WalletConnection, WalletConnector } from './WalletConnection';

export class BrowserWalletConnector implements WalletConnector, WalletConnection {
    readonly client: WalletApi;

    constructor(client: WalletApi, delegate: WalletConnectionDelegate) {
        this.client = client;

        this.client.on('chainChanged', (c) => delegate.onChainChanged(this, c));
        this.client.on('accountChanged', (a) => delegate.onAccountChanged(this, a));
        this.client.on('accountDisconnected', () =>
            this.client
                .getMostRecentlySelectedAccount()
                .then((a) => delegate.onAccountChanged(this, a))
                .catch(console.error)
        );
    }

    static async create(delegate: WalletConnectionDelegate) {
        const client = await detectConcordiumProvider();
        return new BrowserWalletConnector(client, delegate);
    }

    async connect() {
        const account = await this.client.connect();
        if (!account) {
            throw new Error('connection failed');
        }
        return this;
    }

    async getConnections() {
        // Defining "connection" as a connected account.
        const account = await this.getConnectedAccount();
        return account ? [this] : [];
    }

    getConnector(): WalletConnector {
        return this;
    }

    async getConnectedAccount() {
        return this.client.getMostRecentlySelectedAccount();
    }

    getJsonRpcClient(): JsonRpcClient {
        return this.client.getJsonRpcClient();
    }

    async disconnect() {
        // Only the wallet can initiate a disconnect.
        return undefined;
    }

    async signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: AccountTransactionPayload,
        parameters?: Record<string, unknown>,
        schema?: string,
        schemaVersion?: SchemaVersion
    ): Promise<string> {
        if (
            (type === AccountTransactionType.InitContract || type === AccountTransactionType.Update) &&
            parameters !== undefined &&
            schema !== undefined
        ) {
            return this.client.sendTransaction(accountAddress, type, payload, parameters, schema, schemaVersion);
        }
        return this.client.sendTransaction(accountAddress, type, payload);
    }

    async signMessage(accountAddress: string, message: string): Promise<AccountTransactionSignature> {
        return this.client.signMessage(accountAddress, message);
    }
}
