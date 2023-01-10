import { detectConcordiumProvider, WalletApi } from '@concordium/browser-wallet-api-helpers';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    JsonRpcClient,
    SchemaVersion,
} from '@concordium/web-sdk';
import { WalletConnectionDelegate, WalletConnection, WalletConnector } from './WalletConnection';

const BROWSER_WALLET_DETECT_TIMEOUT = 2000;

export class BrowserWalletConnector implements WalletConnector, WalletConnection {
    readonly client: WalletApi;

    readonly delegate: WalletConnectionDelegate;

    constructor(client: WalletApi, delegate: WalletConnectionDelegate) {
        this.client = client;
        this.delegate = delegate;

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
        try {
            const client = await detectConcordiumProvider(BROWSER_WALLET_DETECT_TIMEOUT);
            return new BrowserWalletConnector(client, delegate);
        } catch (e) {
            // Provider detector throws 'undefined' when rejecting!
            throw new Error('Browser Wallet extension not detected');
        }
    }

    async connect() {
        const account = await this.client.connect();
        if (!account) {
            throw new Error('Browser Wallet connection failed');
        }
        return this;
    }

    async getConnections() {
        // Defining "connected" as the presence of a connected account.
        // TODO Would be more stable to base on availability of RPC client?
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
        // The connection itself cannot actually be disconnected by the dApp as
        // only the wallet can initiate disconnecting individual accounts.
        // This "disconnect" only ensures that we stop interacting with the client
        // (which stays in the browser window's global state)
        // such that it doesn't interfere with a future reconnection.
        this.client.removeAllListeners();
        this.delegate.onDisconnect(this);
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
