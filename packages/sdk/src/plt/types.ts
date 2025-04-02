import * as AccountAddress from '../types/AccountAddress.js';
import * as TokenAmount from './TokenAmount.js';
import * as TokenId from './TokenId.js';
import * as TokenModuleReference from './TokenModuleReference.js';
import * as TokenEvent from './TokenEvent.js';
import * as TokenModuleState from './TokenModuleState.js';

export {
    /**
     * Module containing funcionality for interacting with protocol level token (PLT) modules.
     */
    TokenModuleReference,
    /**
     * Module containing funcionality for interacting with protocol level token (PLT) amounts.
     */
    TokenAmount,
    /**
     * Module containing funcionality for interacting with protocol level token (PLT) IDs.
     */
    TokenId,
    /**
     * Module containing funcionality for interacting with events emitted by protocol level token (PLTs) module
     * instances.
     */
    TokenEvent,
    /**
     * Module containing funcionality for interacting with the state of a protocol level token (PLT) module
     * instance.
     */
    TokenModuleState,
};

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
