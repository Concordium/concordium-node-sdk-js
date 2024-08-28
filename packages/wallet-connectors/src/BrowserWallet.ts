import {
    SchemaType,
    SendTransactionPayload,
    WalletApi,
    detectConcordiumProvider,
} from '@concordium/browser-wallet-api-helpers';
import {
    AccountTransactionSignature,
    AccountTransactionType,
    CredentialStatements,
    VerifiablePresentation,
} from '@concordium/web-sdk';

import {
    SignableMessage,
    TypedSmartContractParameters,
    WalletConnection,
    WalletConnectionDelegate,
    WalletConnector,
} from './WalletConnection';
import { UnreachableCaseError } from './error';

const BROWSER_WALLET_DETECT_TIMEOUT = 2000;

/**
 * Implementation of both {@link WalletConnector} and {@link WalletConnection} for the Concordium Browser Wallet.
 * Implementing both interfaces in the same class is a good fit for this protocol
 * as all interaction with the wallet's API happens through a single stateful client.
 */
export class BrowserWalletConnector implements WalletConnector, WalletConnection {
    readonly client: WalletApi;

    readonly delegate: WalletConnectionDelegate;

    isConnected = false;

    /**
     * Construct a new instance.
     *
     * Use {@link create} to have the API client initialized automatically.
     *
     * The constructor sets up event handling and appropriate forwarding to the provided delegate.
     *
     * @param client The underlying API client.
     * @param delegate The object to receive events emitted by the client.
     */
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
        this.isConnected = true;
        this.delegate.onConnected(this, account);
        return this;
    }

    getConnections() {
        return this.isConnected ? [this] : [];
    }

    getConnector() {
        return this;
    }

    async ping() {
        return undefined;
    }

    /**
     * @return The account that the wallet currently associates with this connection.
     */
    async getConnectedAccount() {
        return this.client.getMostRecentlySelectedAccount();
    }

    /**
     * Returns the transport object of the gRPC client that the Browser Wallet uses to perform requests
     * against some Concordium Node connected to network/chain that the connected account lives on.
     * The client implements version 2 of the Node API.
     *
     * This method is included because it's part of the Browser Wallet API.
     * It should be used with care as it's hard to guarantee that it actually connects to the expected network.
     * The recommended alternative is to construct your own client using {@link Network.grpcOpts} which is
     * independent of any connection.
     *
     * @return The Browser Wallet's internal gRPC client.
     * @throws If the installed version of the Browser Wallet doesn't support the method.
     */
    getGrpcTransport() {
        return this.client.grpcTransport;
    }

    /**
     * Deregister event handlers on the API client and notify the delegate.
     * As there's no way to actually disconnect the Browser Wallet, this is all that we can reasonably do.
     * The client object will remain in the browser's global state.
     */
    async disconnect() {
        // The connection itself cannot actually be disconnected by the dApp as
        // only the wallet can initiate disconnecting individual accounts.
        // This "disconnect" only ensures that we stop interacting with the client
        // (which stays in the browser window's global state)
        // such that it doesn't interfere with a future reconnection.
        this.isConnected = false;
        this.client.removeAllListeners();
        this.delegate.onDisconnected(this);
    }

    async signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: SendTransactionPayload,
        typedParams?: TypedSmartContractParameters
    ): Promise<string> {
        if ((type === AccountTransactionType.InitContract || type === AccountTransactionType.Update) && typedParams) {
            const { parameters, schema } = typedParams;
            switch (schema.type) {
                case 'ModuleSchema':
                    return this.client.sendTransaction(
                        accountAddress,
                        type as any, // wallet API types enforce strict coupling of transaction types and corresponding payloads.
                        payload as any, // wallet API types enforce strict coupling of transaction types and corresponding payloads.
                        parameters,
                        {
                            type: SchemaType.Module,
                            value: schema.value.toString('base64'),
                        },
                        schema.version
                    );
                case 'TypeSchema':
                    return this.client.sendTransaction(accountAddress, type as any, payload as any, parameters, {
                        type: SchemaType.Parameter,
                        value: schema.value.toString('base64'),
                    });
                default:
                    throw new UnreachableCaseError('schema', schema);
            }
        }
        if (typedParams) {
            throw new Error(`'typedParams' must not be provided for transaction of type '${type}'`);
        }
        return this.client.sendTransaction(accountAddress, type as any, payload as any); // wallet API types enforce strict coupling of transaction types and corresponding payloads.
    }

    async signMessage(accountAddress: string, msg: SignableMessage): Promise<AccountTransactionSignature> {
        switch (msg.type) {
            case 'StringMessage':
                return this.client.signMessage(accountAddress, msg.value);
            case 'BinaryMessage':
                return this.client.signMessage(accountAddress, {
                    schema: msg.schema.value.toString('base64'),
                    data: msg.value.toString('hex'),
                });
            default:
                throw new UnreachableCaseError('message', msg);
        }
    }

    async requestVerifiablePresentation(
        challenge: string,
        credentialStatements: CredentialStatements
    ): Promise<VerifiablePresentation> {
        return this.client.requestVerifiablePresentation(challenge, credentialStatements);
    }
}
