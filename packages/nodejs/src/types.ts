import {
    AccountAddress as AccountAddressLocal,
    CredentialRegistrationId as CredentialRegistrationIdLocal,
} from '@concordium/common-sdk';

export type AccountIdentifierInputLocal =
    | AccountAddressLocal
    | CredentialRegistrationIdLocal
    | bigint;
