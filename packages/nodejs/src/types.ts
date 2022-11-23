import {
    AccountAddress,
    CredentialRegistrationId,
} from '@concordium/common-sdk';

export type AccountIdentifierInput =
    | AccountAddress
    | CredentialRegistrationId
    | bigint;
