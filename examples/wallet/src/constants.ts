import { Network } from '@concordium/web-sdk';

export const network: Network = 'Testnet';

// Local storage keys
export const seedPhraseKey = 'seed-phrase';
export const selectedIdentityProviderKey = 'selected-identity-provider';

// The indices of the identity and the credential deployed on the account.
// These are static in this example as we only create a single identity and
// a single credential.
export const identityIndex = 0;
export const credNumber = 0;

// Connection parameters that determine the node that the wallet
// connects to.
export const nodeAddress = 'https://grpc.testnet.concordium.com';
export const nodePort = 20000;

// Base URL for the wallet proxy.
export const walletProxyBaseUrl = 'https://wallet-proxy.testnet.concordium.com';

// Base URL for CCDscan. This is used to link to a submitted transaction.
export const ccdscanBaseUrl = 'https://testnet.ccdscan.io';
