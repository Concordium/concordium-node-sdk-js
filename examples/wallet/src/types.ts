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

/**
 * The list of possible statuses returned by an identity provider
 * when querying for an identity object.
 */
export enum IdentityProviderIdentityStatus {
    /** Pending identity verification and initial account creation. */
    Pending = "pending",
    /** The identity creation failed or was rejected. */
    Error = "error",
    /** The identity is ready and the initial account was created and is on chain. */
    Done = "done"
}
export interface PendingIdentityTokenContainer {
    status: IdentityProviderIdentityStatus.Pending;
    token?: any;
    detail: string;
}
export interface DoneIdentityTokenContainer {
    status: IdentityProviderIdentityStatus.Done;
    token: any;
    detail: string;
}
export interface ErrorIdentityTokenContainer {
    status: IdentityProviderIdentityStatus.Error;
    token: any;
    detail: string;
}
export type IdentityTokenContainer = PendingIdentityTokenContainer | DoneIdentityTokenContainer | ErrorIdentityTokenContainer;
