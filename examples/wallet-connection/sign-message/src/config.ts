import {
    BrowserWalletConnector,
    CONCORDIUM_WALLET_CONNECT_PROJECT_ID,
    WalletConnectConnector,
    WalletConnectEvent,
    WalletConnectMethod,
    WalletConnectNamespaceConfig,
    ephemeralConnectorType,
} from '@concordium/react-components';
import { SignClientTypes } from '@walletconnect/types';

const WALLET_CONNECT_OPTS: SignClientTypes.Options = {
    projectId: CONCORDIUM_WALLET_CONNECT_PROJECT_ID,
    metadata: {
        name: 'Sign Message',
        description: 'Example dApp for sending sponsored transactions.',
        url: '#',
        icons: ['https://walletconnect.com/walletconnect-logo.png'],
    },
};

const WALLET_CONNECT_SCOPE: WalletConnectNamespaceConfig = {
    methods: [WalletConnectMethod.SignMessage],
    events: [WalletConnectEvent.AccountsChanged, WalletConnectEvent.ChainChanged],
};

export const BROWSER_WALLET = ephemeralConnectorType(BrowserWalletConnector.create);
export const WALLET_CONNECT = ephemeralConnectorType((delegate, network) =>
    WalletConnectConnector.create(WALLET_CONNECT_OPTS, delegate, network, WALLET_CONNECT_SCOPE)
);
