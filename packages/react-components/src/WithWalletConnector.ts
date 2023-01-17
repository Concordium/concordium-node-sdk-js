import { Component } from 'react';
import { SignClientTypes } from '@walletconnect/types';
import {
    BrowserWalletConnector,
    Network,
    WalletConnectConnector,
    WalletConnection,
    WalletConnectionDelegate,
    WalletConnector,
} from '@concordium/wallet-connectors';

export type ConnectorType = 'BrowserWallet' | 'WalletConnect';

/**
 * The internal state of the component.
 */
interface State {
    /**
     * The active connector type. This value is updated using {@link WalletConnectionProps.setActiveConnectorType}.
     * Changes to this value trigger new connectors to be initialized appropriately.
     * This will cause {@link activeConnector} or {@link activeConnectorError} to change depending on the outcome.
     *
     * There currently is no way to provide an existing connector when changing the connector type
     * as it isn't clear if this ability would be useful in practice.
     */
    activeConnectorType: ConnectorType | undefined;

    /**
     * The active connector. New connectors get created automatically when {@link activeConnectorType} changes.
     *
     * Existing connectors are not disconnected automatically;
     * this may be done using {@link WalletConnectionProps.disconnectActive}.
     *
     * The hook {@link useWalletConnectorSelector} adds a little more structure to the connector state
     * and also takes care of disconnecting existing connectors as mentioned above.
     *
     * Note that the connector stored in this field only controls the creation of new connections.
     * In particular, when a new connector becomes active, the current value of {@link activeConnection} is not touched.
     * It is therefore perfectly possible for the active connection to not originate from the active connector.
     *
     * The reason for this behavior is it isn't obvious that one would always want this synchronization.
     * And whenever one does, it's easy for the app to just disconnect the existing connection before changing the connector.
     *
     * The same is true the other way: Changes to {@link activeConnection} don't cause changes to this field as the only
     * allowed way to change the connector is through setting the connector type.
     */
    activeConnector: WalletConnector | undefined;

    /**
     * Any of the following kinds of errors:
     * - Error initializing a connector with a type of the current value of {@link activeConnectorType}.
     *   In this case {@link activeConnector} is undefined.
     * - Error disconnecting the previous connector.
     *   In this case {@link activeConnectorType} and {@link activeConnector} are undefined.
     * - Error initiating a connection from the connector.
     *   In this case {@link activeConnector} is not undefined.
     */
    activeConnectorError: string;

    /**
     * Boolean indicator of whether we're waiting for a connection to be established.
     */
    isConnecting: boolean;

    /**
     * The currently active connection.
     *
     * For reasons explained in {@link activeConnector},
     * there's no guarantee that this connection originates from the current value of {@link activeConnector}
     * as there's no automatic synchronization between them.
     */
    activeConnection: WalletConnection | undefined;

    /**
     * The hash of the genesis block for the chain that {@link activeConnectedAccount} lives on.
     *
     * TODO The value of this field is not too reliable as it's updated only when the `onChainChanged` event fires.
     *      And this doesn't happen when the connection is initiated.
     *      For WalletConnect we could do that manually as we control what chain we connect to.
     *      For BrowserWallet we don't have that option (see also https://concordium.atlassian.net/browse/CBW-633).
     */
    activeConnectionGenesisHash: string | undefined;

    /**
     * The selected account of {@link activeConnection}.
     */
    activeConnectedAccount: string | undefined;
}

interface Props {
    /**
     * The network on which the connected accounts are expected to live on.
     *
     * Changes to this value will cause all connections managed by {@link State.activeConnector} to get disconnected.
     */
    network: Network; // reacting to change in 'componentDidUpdate'

    /**
     * WalletConnect configuration.
     * The component will use the current value of this field when initializing WalletConnect connections,
     * but existing connections will not be affected by changes to the value.
     */
    walletConnectOpts: SignClientTypes.Options;

    /**
     * Function for generating the child component based on the props derived from the state of this component.
     *
     * JSX automatically supplies the nested expression as this prop field, so callers usually don't set it explicitly.
     *
     * @param props Connection state and management functions.
     * @return Child component.
     */
    children: (props: WalletConnectionProps) => JSX.Element;
}

/**
 * The props to be passed to the child component.
 */
export interface WalletConnectionProps extends State {
    /**
     * The network provided to {@link WithWalletConnector} via its props.
     *
     * This is only passed for convenience as the value is always available to the child component anyway.
     */
    network: Network;

    /**
     * Function for setting or resetting {@link State.activeConnectorType activeConnectorType}.
     *
     * There currently is no way to provide an existing connector when changing the connector type
     * as it isn't clear if this ability would be useful in practice.
     *
     * @param type The new connector type or undefined to reset the value.
     */
    setActiveConnectorType: (type: ConnectorType | undefined) => void;

    /**
     * Function for setting or resetting {@link State.activeConnection activeConnection}.
     * For reasons explained in the documentation of that field, this function does not touch the active connector.
     * @param connection The wallet connection.
     */
    setActiveConnection: (connection: WalletConnection | undefined) => void;

    /**
     * Initiate a new connection using {@link State.activeConnector activeConnector}
     * and set it as {@link State.activeConnection activeConnection} once it's established.
     *
     * This does not automatically disconnect any existing connections.
     */
    connectActive: () => void;

    /**
     * Disconnect all connections owned by {@link State.activeConnector activeConnector} and reset this field,
     * destroying its existing value.
     *
     * This function is called automatically when {@link network} changes.
     */
    disconnectActive: () => void;
}

/**
 * React component that helps managing wallet connections
 * by introducing a notion of "active" {@link WalletConnector} and {@link WalletConnection},
 * and maintaining their states as part of its own component state.
 * This allows child components to access all relevant information in a reactive manner
 * and provides methods for managing the active connection.
 *
 * The component implements {@link WalletConnectionDelegate} and passes itself to all {@link WalletConnector}s
 * that it initializes.
 * This allows it to receive events from the underlying clients.
 * Once it receives an event for the active {@link WalletConnection},
 * it performs the relevant updates to its component state which then bubble down to child components.
 *
 * This component significantly reduces the complexity of integrating with wallets,
 * even if one only needs to support a single protocol and network.
 */
// TODO Rename to WalletConnectionManager?
export class WithWalletConnector extends Component<Props, State> implements WalletConnectionDelegate {
    constructor(props: Props) {
        super(props);
        this.state = {
            activeConnectorType: undefined,
            activeConnector: undefined,
            activeConnectorError: '',
            isConnecting: false,
            activeConnection: undefined,
            activeConnectionGenesisHash: undefined,
            activeConnectedAccount: undefined,
        };
    }

    /**
     * @see WalletConnectionProps.setActiveConnectorType
     */
    setActiveConnectorType = (type: ConnectorType | undefined) => {
        console.debug("WithWalletConnector: calling 'setActiveConnectorType'", { type, state: this.state });
        const { network } = this.props;
        const { activeConnectorType } = this.state;
        if (type === activeConnectorType) {
            return; // ensure idempotency
        }
        this.setState({
            activeConnectorType: type,
            activeConnector: undefined,
            activeConnection: undefined,
            activeConnectorError: '',
            isConnecting: false,
            activeConnectionGenesisHash: undefined,
            activeConnectedAccount: undefined,
        });
        if (!type) {
            return; // don't create a new connector
        }
        this.createConnector(type, network)
            .then((connector: WalletConnector) => {
                console.log('WithWalletConnector: setting active connector', { connector });
                // Switch the connector type back in case the user changed it since initiating the connection.
                this.setState({ activeConnectorType: type, activeConnector: connector, activeConnectorError: '' });
            })
            .catch((err) => {
                if (this.state.activeConnectorType === type) {
                    // Don't set error if user switched connector type since initializing this connector.
                    // It's OK to show it if the user switched away and back...
                    this.setState({ activeConnectorError: (err as Error).message });
                }
            });
    };

    /**
     * @see WalletConnectionProps.setActiveConnection
     */
    setActiveConnection = (connection: WalletConnection | undefined) => {
        console.debug("WithWalletConnector: calling 'setActiveConnection'", { connection, state: this.state });
        // Not setting the active connector to that of the connection for reasons described in
        // the docstring of `State.activeConnection`.
        connection?.getConnectedAccount().then((connectedAccount) => {
            console.log('WithWalletConnector: updating active connection and connected account state', {
                connection,
                connectedAccount,
            });
            this.setState({
                activeConnection: connection,
                activeConnectedAccount: connectedAccount,
            });
        });
    };

    private createConnector = (connectorType: ConnectorType, network: Network): Promise<WalletConnector> => {
        console.debug("WithWalletConnector: calling 'createConnector'", { connectorType, network, state: this.state });
        const { walletConnectOpts } = this.props;
        switch (connectorType) {
            case 'BrowserWallet':
                console.log('WithWalletConnector: initializing Browser Wallet connector');
                return BrowserWalletConnector.create(this);
            case 'WalletConnect':
                console.log('WithWalletConnector: initializing WalletConnect connector');
                return WalletConnectConnector.create(walletConnectOpts, network, this);
            default:
                throw new Error(`invalid connector type '${connectorType}'`);
        }
    };

    onAccountChanged = (connection: WalletConnection, address: string | undefined) => {
        console.debug("WithWalletConnector: calling 'onAccountChanged'", { connection, address, state: this.state });
        const { activeConnection } = this.state;
        // Ignore event on connections other than the active one.
        if (connection === activeConnection) {
            console.log('WithWalletConnector: updating connected account state', { address });
            this.setState({ activeConnectedAccount: address });
        }
    };

    onChainChanged = (connection: WalletConnection, genesisHash: string) => {
        console.debug("WithWalletConnector: calling 'onChainChanged'", { connection, genesisHash, state: this.state });
        const { activeConnection } = this.state;
        if (connection === activeConnection) {
            this.setState({ activeConnectionGenesisHash: genesisHash });
        }
    };

    onDisconnect = (connection: WalletConnection) => {
        console.debug("WithWalletConnector: calling 'onDisconnect'", { connection, state: this.state });
        const { activeConnection } = this.state;
        // Ignore event on connections other than the active one.
        if (connection === activeConnection) {
            console.log('WithWalletConnector: clearing wallet connection and connected account state');
            this.setState({ activeConnection: undefined, activeConnectedAccount: undefined });
        }
    };

    /**
     * @see WalletConnectionProps.connectActive
     */
    connectActive = () => {
        console.debug("WithWalletConnector: calling 'connectActive'", { state: this.state });
        const { activeConnector } = this.state;
        if (activeConnector) {
            this.setState({ isConnecting: true, activeConnectorError: '' });
            activeConnector
                .connect()
                .then((c) => {
                    // Don't clear any existing connection if the connection was cancelled.
                    if (c) {
                        this.setActiveConnection(c);
                    }
                })
                .catch((err) => {
                    if (this.state.activeConnector === activeConnector) {
                        this.setState({ activeConnectorError: (err as Error).message });
                    }
                })
                .finally(() => {
                    if (this.state.activeConnector === activeConnector) {
                        this.setState({ isConnecting: false });
                    }
                });
        }
    };

    /**
     * @see WalletConnectionProps.disconnectActive
     */
    disconnectActive = () => {
        console.debug("WithWalletConnector: calling 'disconnectActive'", { state: this.state });
        const { activeConnector } = this.state;
        if (activeConnector) {
            activeConnector.disconnect().catch((err) => {
                if (this.state.activeConnector === activeConnector) {
                    this.setState({ activeConnectorError: (err as Error).message });
                }
            });
        }
    };

    render() {
        const { children, network } = this.props;
        return children({
            ...this.state,
            network,
            setActiveConnectorType: this.setActiveConnectorType,
            setActiveConnection: this.setActiveConnection,
            connectActive: this.connectActive,
            disconnectActive: this.disconnectActive,
        });
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.network !== this.props.network) {
            // Disconnect everything when user changes network.
            // In the future there may be a mechanism for negotiating with the wallet.
            this.disconnectActive();
        }
    }

    componentWillUnmount() {
        // TODO Disconnect everything?
    }
}
