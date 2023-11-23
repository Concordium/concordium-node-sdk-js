import {
    CredentialInput,
    IdentityProvider,
    TransactionExpiry,
} from '@concordium/web-sdk';

export interface IdentityProviderMetaData {
    issuanceStart: string;
    recoveryStart: string;
    icon: string;
    support: string;
}

export type IdentityProviderWithMetadata = IdentityProvider & {
    metadata: IdentityProviderMetaData;
};

export interface AccountWorkerInput {
    credentialInput: CredentialInput;
    expiry: TransactionExpiry.Type;
}
