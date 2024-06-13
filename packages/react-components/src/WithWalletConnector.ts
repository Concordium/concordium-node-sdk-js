import { Network, WalletConnection, WalletConnectionDelegate, WalletConnector } from '@concordium/wallet-connectors';
import { Component } from 'react';

import { errorString } from './error';

/**
 * Activation/deactivation controller of a given connector type.
 */
export interface ConnectorType {
    /**
     * Called when the connection type is being activated.
     * The connector instance returned by this method becomes the new {@link State.activeConnector activeConnector}.
     * @param component The component in which the instance is being activated.
     *                  This object doubles as the delegate to pass to new connector instances.
     * @param network The network to pass to new connector instances.
     */
    activate(component: WithWalletConnector, network: Network): Promise<WalletConnector>;

    /**
     * Called from {@link WithWalletConnector} when the connection type is being deactivated,
     * i.e. right after {@link State.activeConnector activeConnector} has been unset from this value.
     * @param component The component in which the instance is being deactivated.
     * @param connector The connector to deactivate.
     */
    deactivate(component: WithWalletConnector, connector: WalletConnector): Promise<void>;
}

/**
 * Produce a {@link ConnectorType} that creates a new connector instance on activation
 * and disconnects the existing one on deactivation.
 * This is the simplest connection type and should be used unless there's a reason not to.
 * @param create Factory function for creating new connector instances.
 */
export function ephemeralConnectorType(create: (c: WithWalletConnector, n: Network) => Promise<WalletConnector>) {
    return {
        activate: create,
        deactivate: (w: WithWalletConnector, c: WalletConnector) => c.disconnect(),
    };
}

/**
 * Produce a {@link ConnectorType} that reuse connectors between activation cycles.
 * That is, once a connector is created, it's never automatically disconnected.
 * Note that only the connector is permanent. Individual connections may still be disconnected by the application.
 * @param create Factory function for creating new connector instances.
 */
export function persistentConnectorType(create: (c: WithWalletConnector, n: Network) => Promise<WalletConnector>) {
    const connectorPromises = new Map<WithWalletConnector, Map<Network, Promise<WalletConnector>>>();
    return {
        activate: (component: WithWalletConnector, network: Network) => {
            const delegateConnectorPromises =
                connectorPromises.get(component) || new Map<Network, Promise<WalletConnector>>();
            connectorPromises.set(component, delegateConnectorPromises);
            const connectorPromise = delegateConnectorPromises.get(network) || create(component, network);
            delegateConnectorPromises.set(network, connectorPromise);
            return connectorPromise;
        },
        deactivate: async () => undefined,
    };
}

/**
 * The internal state of the component.
 */
interface State {
    /**
     * The active connector type. This value is updated using {@link WalletConnectionProps.setActiveConnectorType}.
     * Changes to this value trigger activation of a connector managed by the connector type.
     * This will cause {@link activeConnector} or {@link activeConnectorError} to change depending on the outcome.
     */
    activeConnectorType: ConnectorType | undefined;

    /**
     * The active connector. Connector instances get (de)activated appropriately when {@link activeConnectorType} changes.
     *
     * It's up to the {@link ConnectorType} in {@link activeConnectorType} to implement any synchronization between
     * the active connector and {@link activeConnector}:
     * In general, it is perfectly possible for the active connection to not originate from the active connector.
     *
     * If the application disconnects the active connector manually, they must also call
     * {@link WalletConnectionProps.setActiveConnectorType} to
     */
    activeConnector: WalletConnector | undefined;

    /**
     * Any of the following kinds of errors:
     * - Error activating a connector with {@link activeConnectorType}.
     *   In this case {@link activeConnector} is undefined.
     * - Error deactivating the previous connector.
     *   In this case {@link activeConnectorType} and {@link activeConnector} are undefined.
     */
    activeConnectorError: string;

    /**
     * A map from open connections to their selected accounts or the empty string
     * if the connection doesn't have an associated account.
     */
    connectedAccounts: Map<WalletConnection, string>;

    /**
     * A map from open connections to the hash of the genesis block for the chain that the selected accounts
     * of the connections live on.
     * Connections without a selected account (or the account's chain is unknown) will not have an entry in this map.
     *
     * TODO The reported hash values are not too reliable as they're updated only when the `onChainChanged` event fires.
     *      And this doesn't happen when the connection is initiated.
     *      For WalletConnect we could do that manually as we control what chain we connect to.
     *      For BrowserWallet we don't have that option (see also https://concordium.atlassian.net/browse/CBW-633).
     */
    genesisHashes: Map<WalletConnection, string>;
}

function updateMapEntry<K, V>(map: Map<K, V>, key: K | undefined, value: V | undefined) {
    const res = new Map(map);
    if (key !== undefined) {
        if (value !== undefined) {
            res.set(key, value);
        } else {
            res.delete(key);
        }
    }
    return res;
}

interface Props {
    /**
     * The network on which the connected accounts are expected to live on.
     *
     * Changes to this value will cause all connections managed by {@link State.activeConnector} to get disconnected.
     */
    network: Network; // reacting to change in 'componentDidUpdate'

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
     * Any existing connector type value is deactivated and any new one is activated.
     *
     * @param type The new connector type or undefined to reset the value.
     */
    setActiveConnectorType: (type: ConnectorType | undefined) => void;
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
            genesisHashes: new Map(),
            connectedAccounts: new Map(),
        };
    }

    /**
     * @see WalletConnectionProps.setActiveConnectorType
     */
    setActiveConnectorType = (type: ConnectorType | undefined) => {
        console.debug("WithWalletConnector: calling 'setActiveConnectorType'", { type, state: this.state });
        const { network } = this.props;
        const { activeConnectorType, activeConnector } = this.state;
        this.setState({
            activeConnectorType: type,
            activeConnector: undefined,
            activeConnectorError: '',
        });
        if (activeConnectorType && activeConnector) {
            activeConnectorType.deactivate(this, activeConnector).catch((err) =>
                this.setState((state) => {
                    // Don't set error if user switched connector type since initializing this connector.
                    // It's OK to show it if the user switched away and back...
                    if (state.activeConnectorType !== type) {
                        return state;
                    }
                    return { ...state, activeConnectorError: errorString(err) };
                })
            );
        }
        if (type) {
            type.activate(this, network)
                .then((connector: WalletConnector) => {
                    console.log('WithWalletConnector: setting active connector', { connector });
                    // Switch the connector (type) back in case the user changed it since initiating the connection.
                    this.setState({ activeConnectorType: type, activeConnector: connector, activeConnectorError: '' });
                })
                .catch((err) =>
                    this.setState((state) => {
                        if (state.activeConnectorType !== type) {
                            return state;
                        }
                        return { ...state, activeConnectorError: errorString(err) };
                    })
                );
        }
    };

    onAccountChanged = (connection: WalletConnection, address: string | undefined) => {
        console.debug("WithWalletConnector: calling 'onAccountChanged'", { connection, address, state: this.state });
        this.setState((state) => ({
            ...state,
            connectedAccounts: updateMapEntry(state.connectedAccounts, connection, address || ''),
        }));
    };

    onChainChanged = (connection: WalletConnection, genesisHash: string) => {
        console.debug("WithWalletConnector: calling 'onChainChanged'", { connection, genesisHash, state: this.state });
        this.setState((state) => ({
            ...state,
            genesisHashes: updateMapEntry(state.genesisHashes, connection, genesisHash),
        }));
    };

    onConnected = (connection: WalletConnection, address: string | undefined) => {
        console.debug("WithWalletConnector: calling 'onConnected'", { connection, state: this.state });
        this.onAccountChanged(connection, address);
    };

    onDisconnected = (connection: WalletConnection) => {
        console.debug("WithWalletConnector: calling 'onDisconnected'", { connection, state: this.state });
        this.setState((state) => ({
            ...state,
            connectedAccounts: updateMapEntry(state.connectedAccounts, connection, undefined),
        }));
    };

    render() {
        const { children, network } = this.props;
        return children({ ...this.state, network, setActiveConnectorType: this.setActiveConnectorType });
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.network !== this.props.network) {
            // Reset active connector and connection when user changes network.
            // In the future there may be a mechanism for negotiating with the wallet.
            this.setActiveConnectorType(undefined);
        }
    }

    componentWillUnmount() {
        // TODO Disconnect everything?
    }
}
