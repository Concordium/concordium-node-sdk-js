import type { Cbor, TokenAmount, TokenId, TokenModuleReference } from './index.js';

/**
 * Represents a protocol level token state for an account.
 */
export type TokenAccountState = {
    /** The amount of tokens held by the account. */
    balance: TokenAmount.Type;
    /**
     * Token module specific state (CBOR encoded), such as membership of allow/deny lists.
     * This should be a CBOR-encoded `TokenModuleAccountState` object.
     */
    moduleState?: Cbor.Type;
};

/**
 * The state associated with a specific token at a specific block
 */
export type TokenState = {
    /** The reference of the module implementing this token. */
    moduleRef: TokenModuleReference.Type;
    /** The number of decimals used to represent token amounts. */
    decimals: number;
    /** The total available token supply. */
    totalSupply: TokenAmount.Type;
    /** Token module specific state (CBOR encoded), such as token name, feature flags, meta data. */
    moduleState: Cbor.Type;
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

/**
 * Represents the reason for a token module operation rejection.
 */
export type EncodedTokenModuleRejectReason = {
    /** The ID of the token for which the operation was rejected. */
    tokenId: TokenId.Type;
    /** The type of rejection. */
    type: string;
    /** Additional details about the rejection (CBOR encoded), which vary between implementations of token modules. */
    details: Cbor.Type;
};

export type CreatePLTPayload = {
    /** The token ID or symbol of the token to create. */
    tokenId: TokenId.Type;
    /** The module reference for the token. */
    moduleRef: TokenModuleReference.Type;
    /**
     * The number of decimal places used in the representation of amounts of this token. This determines the smallest
     * representable fraction of the token.
     *
     * This MUST be an integer in the range `0..255` (inclusive).
     */
    decimals: number;
    /** The module specific initialization parameters. */
    initializationParameters: Cbor.Type;
};
