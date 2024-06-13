import {
    SendTransactionInitContractPayload,
    SendTransactionPayload,
    SendTransactionUpdateContractPayload,
} from '@concordium/browser-wallet-api-helpers';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    BigintFormatType,
    ContractName,
    CredentialStatements,
    EntrypointName,
    InitContractPayload,
    Parameter,
    UpdateContractPayload,
    VerifiablePresentation,
    getTransactionKindString,
    jsonUnwrapStringify,
    serializeInitContractParameters,
    serializeTypeValue,
    serializeUpdateContractParameters,
    toBuffer,
} from '@concordium/web-sdk';
import { WalletConnectModal, WalletConnectModalConfig } from '@walletconnect/modal';
import { MobileWallet } from '@walletconnect/modal-core';
// eslint-disable-next-line import/no-named-as-default
import SignClient from '@walletconnect/sign-client';
import { ISignClient, ProposalTypes, SessionTypes, SignClientTypes } from '@walletconnect/types';

import {
    Network,
    Schema,
    SignableMessage,
    TypedSmartContractParameters,
    WalletConnection,
    WalletConnectionDelegate,
    WalletConnector,
} from './WalletConnection';
import {
    CONCORDIUM_WALLET_CONNECT_PROJECT_ID,
    DEFAULT_MOBILE_WALLETS,
    FULL_WALLET_CONNECT_NAMESPACE_CONFIG, // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MAINNET, // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TESTNET, // The eslint rule is disabled because the constants MAINNET/TESTNET are used as `@linkcode` in this file.
    WALLET_CONNECT_SESSION_NAMESPACE,
} from './constants';
import { UnreachableCaseError } from './error';

/**
 * Describes the possible methods to invoke
 */
export enum WalletConnectMethod {
    SignAndSendTransaction = 'sign_and_send_transaction',
    SignMessage = 'sign_message',
    RequestVerifiablePresentation = 'request_verifiable_presentation',
}

/**
 * Describes the possible events to listen to
 */
export enum WalletConnectEvent {
    ChainChanged = 'chain_changed',
    AccountsChanged = 'accounts_changed',
}

/**
 * Describes a mobile wallet to connect to through a wallet connect modal.
 */
export type WalletConnectModalMobileWallet = MobileWallet & {
    /** Url for an icon to represent the wallet */
    iconUrl?: string;
};

/**
 * Creates a {@linkcode WalletConnectModalConfig}.
 *
 * @param network The {@linkcode Network} to connect to.
 * @param [mobileWallets] The list of mobile wallets to use for deep linking. Defaults to the concordium and cryptoX wallets for mobile for the specified `network`.
 * If `network` is anything but {@linkcode MAINNET} or {@linkcode TESTNET}, the default value is an empty list.
 * @param [enableExplorer] Whether to enable the wallet connect explorer in the wallet connect modal. Defaults to `false`.
 *
 * @returns the corresponding {@linkcode WalletConnectModalConfig}
 */
export function createWalletConnectModalConfig(
    network: Network,
    mobileWallets: WalletConnectModalMobileWallet[] = DEFAULT_MOBILE_WALLETS[network.name] ?? [],
    enableExplorer = false
): WalletConnectModalConfig {
    let walletImages: Record<string, string> | undefined;
    const mws: MobileWallet[] = [];

    mobileWallets.forEach(({ iconUrl, ...wallet }) => {
        mws.push(wallet);
        if (iconUrl !== undefined) {
            walletImages = walletImages ?? {};
            walletImages[wallet.name] = iconUrl;
        }
    });

    return {
        projectId: CONCORDIUM_WALLET_CONNECT_PROJECT_ID,
        chains: [getChainId(network)],
        mobileWallets: mws,
        desktopWallets: [],
        explorerRecommendedWalletIds: 'NONE',
        explorerExcludedWalletIds: 'ALL',
        walletImages,
        enableExplorer,
    };
}

async function connect(
    client: ISignClient,
    namespaceConfig: ProposalTypes.RequiredNamespace,
    cancel: () => void,
    modalConfig: WalletConnectModalConfig
) {
    let modal: WalletConnectModal | undefined;

    try {
        const { uri, approval } = await client.connect({
            requiredNamespaces: {
                ccd: namespaceConfig,
            },
        });
        let response: SessionTypes.Struct | undefined = undefined;
        if (uri) {
            modal = new WalletConnectModal(modalConfig);
            modal.subscribeModal(({ open }) => {
                if (!open && response === undefined) {
                    cancel();
                }
            });

            // Open modal as we're not connecting to an existing pairing.
            await modal.openModal({ uri });
        }

        response = await approval();
        return response;
    } catch (e) {
        // Ignore falsy errors.
        if (e) {
            console.error(`WalletConnect client error: ${e}`);
        }
        cancel();
    } finally {
        modal?.closeModal();
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
    return jsonUnwrapStringify(data, BigintFormatType.Integer, (_key, value) => {
        if (value?.type === 'Buffer') {
            // Buffer has already been transformed by its 'toJSON' method.
            return toBuffer(value.data).toString('hex');
        }
        return value;
    });
}

function serializeInitContractParam(
    contractName: ContractName.Type,
    typedParams: TypedSmartContractParameters | undefined
): Parameter.Type {
    if (!typedParams) {
        return Parameter.empty();
    }
    const { parameters, schema } = typedParams;
    switch (schema.type) {
        case 'ModuleSchema':
            return serializeInitContractParameters(contractName, parameters, schema.value, schema.version);
        case 'TypeSchema':
            return serializeTypeValue(parameters, schema.value);
        default:
            throw new UnreachableCaseError('schema', schema);
    }
}

function serializeUpdateContractMessage(
    contractName: ContractName.Type,
    entrypointName: EntrypointName.Type,
    typedParams: TypedSmartContractParameters | undefined
): Parameter.Type {
    if (!typedParams) {
        return Parameter.empty();
    }
    const { parameters, schema } = typedParams;
    switch (schema.type) {
        case 'ModuleSchema':
            return serializeUpdateContractParameters(
                contractName,
                entrypointName,
                parameters,
                schema.value,
                schema.version
            );
        case 'TypeSchema':
            return serializeTypeValue(parameters, schema.value);
        default:
            throw new UnreachableCaseError('schema', schema);
    }
}

/**
 * Convert schema into the object format expected by the Mobile crypto library (function 'parameter_to_json')
 * which decodes the parameter before presenting it to the user for approval.
 * @param schema The schema object.
 */
function convertSchemaFormat(schema: Schema | undefined) {
    if (!schema) {
        return null;
    }
    switch (schema.type) {
        case 'ModuleSchema':
            return {
                type: 'module',
                value: schema.value.toString('base64'),
                version: schema.version,
            };
        case 'TypeSchema':
            return {
                type: 'parameter',
                value: schema.value.toString('base64'),
            };
        default:
            throw new UnreachableCaseError('schema', schema);
    }
}

/**
 * Serialize parameters into appropriate payload field ('payload.param' for 'InitContract' and 'payload.message' for 'Update').
 * This payload field must be not already set as that would indicate that the caller thought that was the right way to pass them.
 * @param type Type identifier of the transaction.
 * @param payload Payload of the transaction. Must not include the fields 'param' and 'message' for transaction types 'InitContract' and 'Update', respectively.
 * @param typedParams Contract invocation parameters and associated schema. May be provided optionally provided for transactions of type 'InitContract' or 'Update'.
 */
function serializePayloadParameters(
    type: AccountTransactionType,
    payload: SendTransactionPayload,
    typedParams: TypedSmartContractParameters | undefined
): AccountTransactionPayload {
    switch (type) {
        case AccountTransactionType.InitContract: {
            const initContractPayload = payload as InitContractPayload;
            if (initContractPayload.param) {
                throw new Error(`'param' field of 'InitContract' parameters must be empty`);
            }
            return {
                ...payload,
                param: serializeInitContractParam(initContractPayload.initName, typedParams),
            } as InitContractPayload;
        }
        case AccountTransactionType.Update: {
            const updateContractPayload = payload as UpdateContractPayload;
            if (updateContractPayload.message) {
                throw new Error(`'message' field of 'Update' parameters must be empty`);
            }
            const [contractName, entrypointName] = updateContractPayload.receiveName.value.split('.');
            return {
                ...payload,
                message: serializeUpdateContractMessage(
                    ContractName.fromString(contractName),
                    EntrypointName.fromString(entrypointName),
                    typedParams
                ),
            } as UpdateContractPayload;
        }
        default: {
            if (typedParams) {
                throw new Error(`'typedParams' must not be provided for transaction of type '${type}'`);
            }
            return payload as Exclude<
                SendTransactionPayload,
                SendTransactionInitContractPayload | SendTransactionUpdateContractPayload
            >;
        }
    }
}

/**
 * Convert {@link SignableMessage} into the object format expected by the Mobile Wallets.
 * As of this writing, the iOS wallets only support the {@link StringMessage} variant.
 * So if used with these application the iOS wallet will not correctly sign the actual bytes in the message.
 * @param msg The binary or string message to be signed.
 */
function convertSignableMessageFormat(msg: SignableMessage) {
    switch (msg.type) {
        case 'StringMessage': {
            return { message: msg.value };
        }
        case 'BinaryMessage': {
            return {
                message: { schema: msg.schema.value.toString('base64'), data: msg.value.toString('hex') },
            };
        }
        default:
            throw new UnreachableCaseError('message', msg);
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

    readonly chainId: string;

    session: SessionTypes.Struct;

    constructor(connector: WalletConnectConnector, chainId: string, session: SessionTypes.Struct) {
        this.connector = connector;
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

    async signAndSendTransaction(
        accountAddress: string,
        type: AccountTransactionType,
        payload: SendTransactionPayload,
        typedParams?: TypedSmartContractParameters
    ) {
        const params = {
            type: getTransactionKindString(type),
            sender: accountAddress,
            payload: accountTransactionPayloadToJson(serializePayloadParameters(type, payload, typedParams)),
            schema: convertSchemaFormat(typedParams?.schema),
        };
        try {
            const { hash } = (await this.connector.client.request({
                topic: this.session.topic,
                request: {
                    method: 'sign_and_send_transaction',
                    params,
                },
                chainId: this.chainId,
            })) as SignAndSendTransactionResult; // TODO do proper type check
            return hash;
        } catch (e) {
            if (isSignAndSendTransactionError(e) && e.code === 500) {
                throw new Error('transaction rejected in wallet');
            }
            throw e;
        }
    }

    async signMessage(accountAddress: string, msg: SignableMessage) {
        const connectedAccount = this.getConnectedAccount();
        if (accountAddress !== connectedAccount) {
            throw new Error(
                `cannot sign message with address '${accountAddress}' on connection for account '${connectedAccount}'`
            );
        }
        const params = convertSignableMessageFormat(msg);
        const signature = await this.connector.client.request({
            topic: this.session.topic,
            request: {
                method: 'sign_message',
                params,
            },
            chainId: this.chainId,
        });
        return signature as AccountTransactionSignature; // TODO do proper type check
    }

    async requestVerifiablePresentation(
        challenge: string,
        credentialStatements: CredentialStatements
    ): Promise<VerifiablePresentation> {
        const paramsJson = jsonUnwrapStringify({ challenge, credentialStatements });
        const params = { paramsJson };
        const result = await this.connector.client.request<{ verifiablePresentationJson: string }>({
            topic: this.session.topic,
            request: {
                method: 'request_verifiable_presentation',
                params,
            },
            chainId: this.chainId,
        });
        return VerifiablePresentation.fromString(result.verifiablePresentationJson);
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

function getChainId({ name }: Network): string {
    return `${WALLET_CONNECT_SESSION_NAMESPACE}:${name}`;
}

/**
 * Describes the configuration of a connection to a wallet through wallet connect
 */
export type WalletConnectNamespaceConfig = {
    /** Which methods to request permission for */
    methods: WalletConnectMethod[];
    /** Which events to request permission for */
    events: WalletConnectEvent[];
};

/**
 * Implementation of {@link WalletConnector} for WalletConnect v2.
 *
 * In relation to the interface it implements, this class imposes the restriction that all connections it initiates
 * must live on the chain/network that the connector was created with.
 * The connected wallet is assumed to respect this rule.
 */
export class WalletConnectConnector implements WalletConnector {
    readonly client: ISignClient;

    readonly chainId: string;

    readonly delegate: WalletConnectionDelegate;

    readonly connections = new Map<string, WalletConnectConnection>();

    readonly modalConfig: WalletConnectModalConfig;

    readonly namespaceConfig: WalletConnectNamespaceConfig;

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
     * @param [namespaceConfig] The namespace configuration of the connections, i.e. which methods and events to request permission for in the wallet. Defaults to {@linkcode FULL_WALLET_CONNECT_NAMESPACE_CONFIG}
     * @param [modalConfig] The configuration of the modal for connecting to the mobile wallet. Defaults to the default invocation of {@linkcode createWalletConnectModalConfig}
     */
    constructor(
        client: SignClient,
        delegate: WalletConnectionDelegate,
        network: Network,
        namespaceConfig: WalletConnectNamespaceConfig = FULL_WALLET_CONNECT_NAMESPACE_CONFIG,
        modalConfig: WalletConnectModalConfig = createWalletConnectModalConfig(network)
    ) {
        this.client = client;
        this.chainId = getChainId(network);
        this.delegate = delegate;
        this.modalConfig = modalConfig;
        this.namespaceConfig = namespaceConfig;

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
     * The constant {@link CONCORDIUM_WALLET_CONNECT_PROJECT_ID} exported by this library may be used as {@link SignClientTypes.Options.projectId projectID}
     * if the dApp doesn't have its own {@link https://cloud.walletconnect.com WalletConnect Cloud} project.
     * @param delegate The object to receive events emitted by the client.
     * @param network The network/chain that connected accounts must live on.
     * @param [namespaceConfig] The namespace configuration of the connections, i.e. which methods and events to request permission for in the wallet. Defaults to {@linkcode FULL_WALLET_CONNECT_NAMESPACE_CONFIG}
     * @param [modalConfig] The configuration of the modal for connecting to the mobile wallet. Defaults to the default invocation of {@linkcode createWalletConnectModalConfig}
     */
    static async create(
        signClientInitOpts: SignClientTypes.Options,
        delegate: WalletConnectionDelegate,
        network: Network,
        namespaceConfig: WalletConnectNamespaceConfig = FULL_WALLET_CONNECT_NAMESPACE_CONFIG,
        modalConfig: WalletConnectModalConfig = createWalletConnectModalConfig(network)
    ) {
        const client = await SignClient.init(signClientInitOpts);
        return new WalletConnectConnector(client, delegate, network, namespaceConfig, modalConfig);
    }

    async connect() {
        const namespaceConfig: ProposalTypes.RequiredNamespace = {
            chains: [this.chainId],
            ...this.namespaceConfig,
        };
        const session = await new Promise<SessionTypes.Struct | undefined>((resolve) => {
            connect(this.client, namespaceConfig, () => resolve(undefined), this.modalConfig).then(resolve);
        });
        if (!session) {
            // Connect was cancelled.
            return undefined;
        }
        const connection = new WalletConnectConnection(this, this.chainId, session);
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
