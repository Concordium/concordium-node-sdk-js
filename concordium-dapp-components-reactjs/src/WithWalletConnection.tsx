import React from 'react';
import { SignClientTypes } from '@walletconnect/types';
import {
    BrowserWalletConnector,
    connectedAccountOf,
    Network,
    WalletConnectConnector,
    WalletConnection,
    WalletConnectionDelegate,
    WalletConnector
} from "concordium-dapp-wallet-connectors";

interface State {
    activeConnectorType: string | undefined;
    activeConnector: WalletConnector | undefined;
    activeConnection: WalletConnection | undefined;
    activeConnectedAccount: string | undefined;
}

// TODO React appropriately if 'network' changes.
interface Props {
    network: Network; // not expected to change
    walletConnectOpts: SignClientTypes.Options; // not expected to change
    children: (props: WalletConnectionProps) => React.ReactNode;
}

export interface WalletConnectionProps extends State {
    setActiveConnectorType: (t: string | undefined) => void;
    setActiveConnection: (c: WalletConnection | undefined) => void;
}

// TODO Expose error to child component instead of logging to 'console.error'.
export class WithWalletConnection extends React.Component<Props, State> implements WalletConnectionDelegate {
    constructor(props: Props) {
        super(props);
        this.state = {
            activeConnectorType: undefined,
            activeConnector: undefined,
            activeConnection: undefined,
            activeConnectedAccount: undefined,
        };
    }

    setActiveConnectorType = (type: string | undefined) => {
        const { network } = this.props;
        const { activeConnectorType } = this.state;
        if (type === activeConnectorType) {
            return; // ensure idempotency
        }
        this.setState({
            activeConnectorType: type,
            activeConnector: undefined,
            activeConnection: undefined,
            activeConnectedAccount: undefined,
        });
        if (type) {
            this.createConnector(type, network).then(this.setActiveConnector).catch(console.error);
        }
    };

    private setActiveConnector = (connector: WalletConnector) => {
        console.log('WithWalletConnection: updating connector state', { connector, state: this.state });
        this.setState({ activeConnector: connector });
    };

    setActiveConnection = (connection: WalletConnection | undefined) => {
        console.debug('WithWalletConnection: setActiveConnection called', { connection, state: this.state });
        // Not setting the active connector to that of the connection
        // as it isn't obvious that one would always want that.
        // The app can just do it explicitly.
        connectedAccountOf(connection).then((connectedAccount) => {
            console.log('WithWalletConnection: updating active connection and connected account state', {
                connection,
                connectedAccount,
            });
            this.setState({
                activeConnection: connection,
                activeConnectedAccount: connectedAccount,
            });
        });
    };

    private createConnector = (connectorType: string, network: Network): Promise<WalletConnector> => {
        console.debug('WithWalletConnection: createConnector called', { connectorType, network, state: this.state });
        const { walletConnectOpts } = this.props;
        switch (connectorType) {
            case 'BrowserWallet':
                console.log('WithWalletConnection: initializing Browser Wallet connector');
                return BrowserWalletConnector.create(this);
            case 'WalletConnect':
                console.log('WithWalletConnection: initializing WalletConnect connector');
                return WalletConnectConnector.create(walletConnectOpts, network, this);
            default:
                throw new Error(`invalid connector type '${connectorType}'`);
        }
    };

    onAccountChanged = (connection: WalletConnection, address: string | undefined) => {
        console.debug('WithWalletConnection: onAccountChanged called', { connection, address, state: this.state });
        const { activeConnection } = this.state;
        // Ignore event on connections other than the active one.
        if (connection === activeConnection) {
            console.log('WithWalletConnection: updating connected account state', { address });
            this.setState({ activeConnectedAccount: address });
        }
    };

    onChainChanged = (connection: WalletConnection, genesisHash: string) => {
        console.debug('WithWalletConnection: onChainChanged called', { connection, genesisHash, state: this.state });
        const { network } = this.props;
        // Check if the user is connected to expected network by checking if the genesis hash matches the expected one.
        // Emit a warning and disconnect if it's the wrong chain.
        if (genesisHash !== network.genesisHash) {
            window.alert(
                `Unexpected genesis hash '${genesisHash}'. Expected '${network.genesisHash}' (network '${network.name}').`
            );
            connection.disconnect().catch(console.error);
        }
    };

    onDisconnect = (connection: WalletConnection) => {
        console.debug('WithWalletConnection: onDisconnect called', { connection, state: this.state });
        const { activeConnection } = this.state;
        // Ignore event on connections other than the active one.
        if (connection === activeConnection) {
            console.log('WithWalletConnection: clearing wallet connection and connected account state');
            this.setState({ activeConnection: undefined, activeConnectedAccount: undefined });
        }
    };

    render() {
        const { children } = this.props;
        return children({
            ...this.state,
            setActiveConnectorType: this.setActiveConnectorType,
            setActiveConnection: this.setActiveConnection,
        });
    }
}
