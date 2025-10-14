import { IdStatement } from '../../index.js';
import { AccountAddress, BlockHash } from '../../types/index.js';

export type IdPresentationContextLabel =
    | 'ContextString'
    | 'ResourceID'
    | 'BlockHash'
    | 'PaymentHash'
    | 'ConnectionID'
    | 'Nonce';

export type GivenContext = {
    label: IdPresentationContextLabel;
    context: Uint8Array | string | BlockHash.Type; // TODO: make explicit variants with unknown represented as hex string.
};

type CredType = 'IdentityCredential' | 'AccountCredential' | 'IdentityOrAccountCredential'; // whats the use of the last one here?

// TODO: figure out the correct way to represent as DID.
export type IdentityProviderDID = number;

// TODO: figure out the correct way to represent as DID.
export type AccountCredDID = AccountAddress.Type;

type IdCredentialQualifier = {
    type: CredType;
    issuers: IdentityProviderDID[];
};

export type IdCredentialStatement = {
    statement: IdStatement; // we reuse the id statement as there should not be any difference here?
    idQualifier: IdCredentialQualifier;
};
