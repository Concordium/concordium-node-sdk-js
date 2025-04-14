import * as AccountAddress from '../types/AccountAddress.js';
import type { TokenAmount, TokenId, TokenModuleReference, TokenModuleState } from './index.js';

export type TokenDecimals = number;

/**
 * Represents a protocol level token state for an account.
 */
export type TokenAccountState = {
    /** The amount of tokens held by the account. */
    balance: TokenAmount.Type;
    /** Indicates whether the account is on the allow list. `undefined` if the list type is not supported by the token. */
    memberAllowList?: boolean;
    /** Indicates whether the account is on the deny list. `undefined` if the list type is not supported by the token. */
    memberDenyList?: boolean;
};

/**
 * The state associated with a specific token at a specific block
 */
export type TokenState = {
    /** The reference of the module implementing this token. */
    moduleRef: TokenModuleReference.Type;
    /** Account address of the issuer. The issuer is the holder of the nominated account which can perform token-governance operations. */
    issuer: AccountAddress.Type;
    /** The number of decimals used to represent token amounts. */
    decimals: TokenDecimals;
    /** The total available token supply. */
    totalSupply: TokenAmount.Type;
    /** Token module specific state (CBOR encoded), such as token name, feature flags, meta data. */
    moduleState: TokenModuleState.Type;
};

/**
 * The state of a particular token identified by an ID at a specific block.
 */
export type TokenInfo = {
    /** The ID of the token. */
    id: TokenId.Type;
    /** The associated state of the token. */
    state: TokenState;
};

/**
 * The state of a particular token identified by an ID for an account.
 */
export type TokenAccountInfo = {
    /** The ID of the token. */
    id: TokenId.Type;
    /** The associated account specific state of the token. */
    state: TokenAccountState;
};
