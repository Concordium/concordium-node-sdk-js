import * as AccountAddress from '../types/AccountAddress.js';
import * as TokenAmount from './TokenAmount.js';
import * as TokenId from './TokenId.js';
import * as TokenModuleReference from './TokenModuleReference.js';

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
    /** The token name. This should be unique, but uniqueness is enforced only by the chain governance, not by the consensus protocol. */
    name: string;
    /** The reference of the module implementing this token. */
    moduleRef: TokenModuleReference.Type;
    /** Account address of the issuer. The issuer is the holder of the nominated account which can perform token-governance operations. */
    issuer: AccountAddress.Type;
    /** The number of decimals used to represent token amounts. */
    decimals: TokenDecimals;
    /** A URL pointing to additional meta information about the token. */
    metadataUrl: string; // TODO: maybe this will change to include a checksum...
    /** The total available token supply. */
    totalSupply: TokenAmount.Type;
    /** Whether the token supports an allow list. */
    supportsAllowlist: boolean;
    /** Whether the token supports a deny list. */
    supportsDenylist: boolean;
    /** Whether the token supports minting. */
    supportsMinting: boolean;
    /** Whether the token supports burning. */
    supportsBurning: boolean;
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
