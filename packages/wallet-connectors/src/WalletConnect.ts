import SignClient from '@walletconnect/sign-client';
import QRCodeModal from '@walletconnect/qrcode-modal';
import { ISignClient, SessionTypes, SignClientTypes } from '@walletconnect/types';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    HttpProvider,
    InitContractPayload,
    JsonRpcClient,
    SchemaVersion,
    serializeInitContractParameters,
    serializeUpdateContractParameters,
    toBuffer,
    UpdateContractPayload,
} from '@concordium/web-sdk';
import { Network, WalletConnection, WalletConnectionDelegate, WalletConnector } from './WalletConnection';

const WALLET_CONNECT_SESSION_NAMESPACE = 'ccd';

async function connect(client: ISignClient, chainId: string, cancel: () => void) {
    try {
        const { uri, approval } = await client.connect({
            requiredNamespaces: {
                ccd: {
                    methods: ['sign_and_send_transaction', 'sign_message'],
                    chains: [chainId],
                    events: ['chain_changed', 'accounts_changed'],
                },
            },
        });
        if (uri) {
            // Open modal as we're not connecting to an existing pairing.
            QRCodeModal.open(uri, cancel);
        }
        return await approval();
    } catch (e) {
        // Ignore falsy errors.
        if (e) {
            console.error(`WalletConnect client error: ${e}`);
        }
        cancel();
    } finally {
        QRCodeModal.close();
    }
}

interface SignAndSendTransactionResult {
    hash: string;
}

interface SignAndSendTransactionError {
    code: number;
    message: string;
}

function isSignAndSendTransactionError(obj: any): obj is SignAndSendTransactionError {
    return 'code' in obj && 'message' in obj;
}

function accountTransactionPayloadToJson(data: AccountTransactionPayload) {
    return JSON.stringify(data, (key, value) => {
        if (value?.type === 'Buffer') {
            // Buffer has already been transformed by its 'toJSON' method.
            return toBuffer(value.data).toString('hex');
        }
        if (typeof value === 'bigint') {
            return Number(value);
        }
        return value;
    });
}

/**
 * Encode parameters into appropriate payload field ('payload.param' for 'InitContract' and 'payload.message' for 'Update').
 * The 'parameters' and 'schema' parameters must be not undefined for these transaction types.
 * The payload field must be not already set as that would indicate that the caller thought that was the right way to pass them.
 * @param type Type identifier of the transaction.
 * @param payload Payload of the transaction. Must not include the fields 'param' and 'message' for transaction types 'InitContract' and 'Update', respectively.
 * @param parameters Contract invocation parameters. Must be provided for 'InitContract' or 'Update' transactions and omitted otherwise.
 * @param schema Schema for the contract invocation parameters. Must be provided for 'InitContract' or 'Update' transactions and omitted otherwise.
 * @param schemaVersion Version of the provided schema.
 */
function encodePayloadParameters(
    type: AccountTransactionType,
    payload: AccountTransactionPayload,
    parameters?: Record<string, unknown>,
    schema?: string,
    schemaVersion?: SchemaVersion
) {
    switch (type) {
        case AccountTransactionType.InitContract: {
            if (parameters === undefined) {
                throw new Error(`parameters provided for 'InitContract' transaction must be not undefined`);
            }
            if (schema === undefined) {
                throw new Error(`schema provided for 'InitContract' transaction must be not undefined`);
            }
            const initContractPayload = payload as InitContractPayload;
            if (initContractPayload.param) {
                throw new Error(`'param' field of 'InitContract' parameters must be empty`);
            }
            return {
                ...payload,
                param: serializeInitContractParameters(
                    initContractPayload.initName,
                    parameters,
                    toBuffer(schema, 'base64'),
                    schemaVersion
                ),
            } as InitContractPayload;
        }
        case AccountTransactionType.Update: {
            if (parameters === undefined) {
                throw new Error(`parameters provided for 'Update' transaction must be not undefined`);
            }
            if (schema === undefined) {
                throw new Error(`schema provided for 'Update' transaction must be not undefined`);
            }
            const updateContractPayload = payload as UpdateContractPayload;
            if (updateContractPayload.message) {
                throw new Error(`'message' field of 'Update' parameters must be empty`);
            }
            const [contractName, receiveName] = updateContractPayload.receiveName.split('.');
            return {
                ...payload,
                message: serializeUpdateContractParameters(
                    contractName,
                    receiveName,
                    parameters,
                    toBuffer(schema, 'base64'),
                    schemaVersion
                ),
            } as UpdateContractPayload;
        }
        default: {
            if (parameters !== undefined) {
                throw new Error(`parameters provided for '${type}' transaction must be undefined`);
            }
            if (schema !== undefined) {
                throw new Error(`schema provided for '${type}' transaction must be undefined`);
            }
            if (schemaVersion !== undefined) {
                throw new Error(`schema version provided for '${type}' transaction must be undefined`);
            }
            return payload;
        }
    }
}

/**
 * Implementation of {@link WalletConnection} for WalletConnect v2.
 *
 * While WalletConnect doesn't set any restrictions on the amount of accounts and networks/chains
 * that can be associated with a single connection,
 * this implementation assumes that there is at least one and always use only the first one in the list.
 *
 * It also assumes that the network/chain is fixed to the one provided to {@link WalletConnector}.
 */
export class WalletConnectConnection implements WalletConnection {
    readonly connector: WalletConnectConnector;

    readonly rpcClient: JsonRpcClient;

    readonly chainId: string;

    session: SessionTypes.Struct;

    constructor(
        connector: WalletConnectConnector,
        rpcClient: JsonRpcClient,
        chainId: string,
        session: SessionTypes.Struct
    ) {
        this.connector = connector;
        this.rpcClient = rpcClient;
        this.chainId = chainId;
        this.session = session;
    }

    getConnector() {
        return this.connector;
    }

    async ping() {
        const { topic } = this.session;
        await this.connector.client.ping({ topic });
    }

    /**
     * @return The account that the wallet currently associates with this connection.
     */
    getConnectedAccount() {
        // We're only expecting a single account to be connected.
        const fullAddress = this.session.namespaces[WALLET_CONNECT_SESSION_NAMESPACE].accounts[0];
        return fullAddress.substring(fullAddress.lastIndexOf(':') + 1);
    }

    getJsonRpcClient() {
        return this.rpcClient;
    }

    async signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: AccountTransactionPayload,
        parameters?: Record<string, unknown>,
        schema?: string,
        schemaVersion?: SchemaVersion
    ) {
        const params = {
            type: AccountTransactionType[type],
            sender: accountAddress,
            payload: accountTransactionPayloadToJson(
                encodePayloadParameters(type, payload, parameters, schema, schemaVersion)
            ),
            schema,
        };
        try {
            const { hash } = (await this.connector.client.request({
                topic: this.session.topic,
                request: {
                    method: 'sign_and_send_transaction',
                    params,
                },
                chainId: this.chainId,
            })) as SignAndSendTransactionResult;
            return hash;
        } catch (e) {
            if (isSignAndSendTransactionError(e) && e.code === 500) {
                throw new Error('transaction rejected in wallet');
            }
            throw e;
        }
    }

    async signMessage(accountAddress: string, message: string) {
        const params = { message };
        const signature = await this.connector.client.request({
            topic: this.session.topic,
            request: {
                method: 'sign_message',
                params,
            },
            chainId: this.chainId,
        });
        return JSON.stringify(signature) as AccountTransactionSignature;
    }

    async disconnect() {
        await this.connector.client.disconnect({
            topic: this.session.topic,
            reason: {
                code: 1,
                message: 'user disconnecting',
            },
        });
        this.connector.onDisconnect(this);
    }
}

/**
 * Implementation of {@link WalletConnector} for WalletConnect v2.
 *
 * In relation to the interface it implements, this class imposes the restriction that all connections it initiates
 * must live on the chain/network that the connector was created with.
 * The connected wallet is assumed to respect this rule.
 */
export class WalletConnectConnector implements WalletConnector {
    readonly client: ISignClient;

    readonly network: Network;

    readonly delegate: WalletConnectionDelegate;

    readonly connections = new Map<string, WalletConnectConnection>();

    /**
     * Construct a new instance.
     *
     * Use {@link create} to have the sign client initialized from {@link SignClientTypes.Options}
     * to not have to do it manually.
     *
     * The constructor sets up event handling and appropriate forwarding to the provided delegate.
     *
     * @param client The underlying WalletConnect client.
     * @param delegate The object to receive events emitted by the client.
     * @param network The network/chain that connected accounts must live on.
     */
    constructor(client: SignClient, delegate: WalletConnectionDelegate, network: Network) {
        this.client = client;
        this.network = network;
        this.delegate = delegate;

        client.on('session_event', ({ topic, params: { chainId, event }, id }) => {
            console.debug('WalletConnect event: session_event', { topic, id, chainId, event });
            const connection = this.connections.get(topic);
            if (!connection) {
                console.error(`WalletConnect event 'session_event' received for unknown topic '${topic}'.`);
                return;
            }
        });
        client.on('session_update', ({ topic, params }) => {
            console.debug('WalletConnect event: session_update', { topic, params });

            const connection = this.connections.get(topic);
            if (!connection) {
                console.error(`WalletConnect event 'session_update' received for unknown topic '${topic}'.`);
                return;
            }
            const { namespaces } = params;
            // Overwrite session.
            connection.session = { ...connection.session, namespaces };
            delegate.onAccountChanged(connection, connection.getConnectedAccount());
        });
        client.on('session_delete', ({ topic }) => {
            // Session was deleted: Reset the dApp state, clean up user session, etc.
            console.debug('WalletConnect event: session_delete', { topic });
            const connection = this.connections.get(topic);
            if (!connection) {
                console.error(`WalletConnect event 'session_delete' received for unknown topic '${topic}'.`);
                return;
            }
            this.onDisconnect(connection);
        });
    }

    /**
     * Convenience function for creating a new instance from WalletConnection configuration instead of an already initialized client.
     *
     * @param signClientInitOpts WalletConnect configuration.
     * @param delegate The object to receive events emitted by the client.
     * @param network The network/chain that connected accounts must live on.
     */
    static async create(
        signClientInitOpts: SignClientTypes.Options,
        delegate: WalletConnectionDelegate,
        network: Network
    ) {
        const client = await SignClient.init(signClientInitOpts);
        return new WalletConnectConnector(client, delegate, network);
    }

    async connect() {
        const chainId = `${WALLET_CONNECT_SESSION_NAMESPACE}:${this.network.name}`;
        const session = await new Promise<SessionTypes.Struct | undefined>((resolve) => {
            connect(this.client, chainId, () => resolve(undefined)).then(resolve);
        });
        if (!session) {
            // Connect was cancelled.
            return undefined;
        }
        const rpcClient = new JsonRpcClient(new HttpProvider(this.network.jsonRpcUrl));
        const connection = new WalletConnectConnection(this, rpcClient, chainId, session);
        this.connections.set(session.topic, connection);
        this.delegate.onConnected(connection, connection.getConnectedAccount());
        return connection;
    }

    onDisconnect(connection: WalletConnectConnection) {
        this.connections.delete(connection.session.topic);
        this.delegate.onDisconnected(connection);
    }

    getConnections() {
        return Array.from(this.connections.values());
    }

    /**
     * Disconnect all connections.
     */
    async disconnect() {
        await Promise.all(this.getConnections().map((c) => c.disconnect()));
        // TODO Disconnect the underlying client.
    }
}
