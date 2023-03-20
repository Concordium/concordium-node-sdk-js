export * from './WalletConnection';
export * from './WalletConnect';
export * from './BrowserWallet';

/**
 * ID of the "Mobile Wallets" project in Concordium's {@link https://cloud.walletconnect.com WalletConnect Cloud} account.
 * dApps must initialize the {@link WalletConnectConnector.create WalletConnect client} with this ID
 * or one of a project in their own account.
 */
export const CONCORDIUM_WALLET_CONNECT_PROJECT_ID = '76324905a70fe5c388bab46d3e0564dc';
