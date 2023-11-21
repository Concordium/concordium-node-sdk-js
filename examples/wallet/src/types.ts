import { CryptographicParameters, IdentityProvider, Network } from "@concordium/web-sdk";

export interface IdentityProviderMetaData {
    issuanceStart: string;
    recoveryStart: string;
    icon: string;
    support: string;
}

export type IdentityProviderWithMetadata = IdentityProvider & { metadata: IdentityProviderMetaData };

export interface IdentityWorkerInput {
    selectedIdentityProvider: IdentityProviderWithMetadata,
    cryptographicParameters: CryptographicParameters,
    network: Network,
    seedPhrase: string
};
