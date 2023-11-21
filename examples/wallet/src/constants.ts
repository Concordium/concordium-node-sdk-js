import { Network } from "@concordium/web-sdk";

export const network: Network = 'Testnet';

// Local storage keys
export const seedPhraseKey = 'seed-phrase';
export const selectedIdentityProviderKey = 'selected-identity-provider';

// The indices of the identity and the credential deployed on the account.
// These are static in this example as we only create a single identity and
// a single credential.
export const identityIndex = 0;
export const credNumber = 0;
