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

// Redirect constant URI used in the identity creation protocol.
// This determines where the identity provider will redirect the
// user back to when completing the identity process.
export const redirectUri = 'http://localhost:4173/identity';
