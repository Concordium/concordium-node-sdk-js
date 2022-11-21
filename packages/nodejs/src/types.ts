import {
    AccountAddress as AccountAddressLocal,
    CredentialRegistrationId as CredentialRegistrationIdLocal,
} from '@concordium/common-sdk';

export type AccountIdentifierInput =
    | AccountAddressLocal
    | CredentialRegistrationIdLocal
    | bigint;
