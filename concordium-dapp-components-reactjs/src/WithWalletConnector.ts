import { Component } from 'react';
import { SignClientTypes } from '@walletconnect/types';
import {
    BrowserWalletConnector,
    connectedAccountOf,
    Network,
    WalletConnectConnector,
    WalletConnection,
    WalletConnectionDelegate,
    WalletConnector,
} from 'concordium-dapp-wallet-connectors';

export type ConnectorType = 'BrowserWallet' | 'WalletConnect';

interface State {
    activeConnectorType: ConnectorType | undefined;
    activeConnector: WalletConnector | undefined;
    activeConnectorError: string; // if activeConnector is undefined this will be the disconnect error from the last connector
    isConnecting: boolean;
    activeConnection: WalletConnection | undefined;
    activeConnectionGenesisHash: string | undefined;
    activeConnectedAccount: string | undefined;
}

interface Props {
    network: Network; // reacting to change in 'componentDidUpdate'
    walletConnectOpts: SignClientTypes.Options; // not expected/reacting to change
    children: (props: WalletConnectionProps) => JSX.Element;
}

export interface WalletConnectionProps extends State {
    network: Network;
    activeConnectionGenesisHash: string | undefined;
    setActiveConnectorType: (t: ConnectorType | undefined) => void;
    setActiveConnection: (c: WalletConnection | undefined) => void;
    connectActive: () => void;
    disconnectActive: () => void;
}

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

    setActiveConnection = (connection: WalletConnection | undefined) => {
        console.debug("WithWalletConnector: calling 'setActiveConnection'", { connection, state: this.state });
        // Not setting the active connector to that of the connection
        // as it isn't obvious that one would always want that.
        // The app can just do it explicitly.
        connectedAccountOf(connection).then((connectedAccount) => {
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

    connectActive = () => {
        console.debug("WithWalletConnector: calling 'connectActive'", { state: this.state });
        const { activeConnector } = this.state;
        if (activeConnector) {
            this.setState({ isConnecting: true, activeConnectorError: '' });
            activeConnector
                .connect()
                .then((c) => {
                    if (c) {
                        // Connect was cancelled. Don't let this clear any existing connection.
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

    componentDidUpdate(prevProps: Props, prevState: State) {
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
