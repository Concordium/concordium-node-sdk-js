import * as AccountAddress from '../types/AccountAddress.js';
import type { Cbor, TokenAmount, TokenId, TokenModuleReference } from './index.js';

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
export type TokenModuleRejectReason = {
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
    /** The account to nominate for governance operations. */
    governanceAccount: AccountAddress.Type;
    /**
     * The number of decimal places used in the representation of amounts of this token. This determines the smallest
     * representable fraction of the token.
     * This can be at most `255`.
     */
    decimals: number;
    /** The module specific initialization parameters. */
    initializationParameters: Cbor.Type;
};
