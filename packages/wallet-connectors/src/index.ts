import { Network } from './WalletConnection';

export * from './WalletConnection';
export * from './WalletConnect';
export * from './BrowserWallet';

/**
 * ID of the "Mobile Wallets" project in Concordium's {@link https://cloud.walletconnect.com WalletConnect Cloud} account.
 * dApps must initialize the {@link WalletConnectConnector.create WalletConnect client} with this ID
 * or one of a project in their own account.
 */
export const CONCORDIUM_WALLET_CONNECT_PROJECT_ID = '76324905a70fe5c388bab46d3e0564dc';

const TESTNET_GENESIS_BLOCK_HASH = '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796';
const MAINNET_GENESIS_BLOCK_HASH = '9dd9ca4d19e9393877d2c44b70f89acbfc0883c2243e5eeaecc0d1cd0503f478';

/**
 * Standard configuration for the Testnet network.
 */
export const TESTNET: Network = {
    name: 'testnet',
    genesisHash: TESTNET_GENESIS_BLOCK_HASH,
    grpcOpts: {
        baseUrl: 'https://grpc.testnet.concordium.com:20000',
    },
    ccdScanBaseUrl: 'https://testnet.ccdscan.io',
};

/**
 * Standard configuration for the Mainnet network.
 */
export const MAINNET: Network = {
    name: 'mainnet',
    genesisHash: MAINNET_GENESIS_BLOCK_HASH,
    grpcOpts: {
        baseUrl: 'https://grpc.mainnet.concordium.software:20000',
    },
    ccdScanBaseUrl: 'https://ccdscan.io',
};
