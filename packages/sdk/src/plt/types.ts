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

type TokenEventGeneric<T extends TokenEventType, E extends object> = E & {
    /** The type of the event. */
    tag: T;
};

/**
 * Represents a token event emitted as the result of a token holder transaction.
 * The event type is determined by the `tag` field.
 */
export type TokenHolderEvent =
    | TokenEventGeneric<TokenEventType.Transfer, TokenTransferEvent>
    | TokenEventGeneric<TokenEventType.Module, TokenModuleEvent>;

/**
 * Represents a token event emitted as the result of a token governance transaction.
 * The event type is determined by the `tag` field.
 */
export type TokenGovernanceEvent =
    | TokenEventGeneric<TokenEventType.Transfer, TokenTransferEvent>
    | TokenEventGeneric<TokenEventType.Mint, TokenSupplyUpdateEvent>
    | TokenEventGeneric<TokenEventType.Burn, TokenSupplyUpdateEvent>
    | TokenEventGeneric<TokenEventType.Module, TokenModuleEvent>;

/**
 * The type of events emitted by the token module.
 */
export enum TokenEventType {
    /** Event emitted when a transfer of tokens is performed. */
    Transfer = 'transfer',
    /** Event emitted when the token supply is updated by minting to a token holder. */
    Mint = 'mint',
    /** Event emitted when the token supply is updated by burning from the balance of a token holder. */
    Burn = 'burn',
    /** Event emitted when from a token module */
    Module = 'module',
}

/**
 * Event emitted by the token module.
 */
export type TokenModuleEvent = {
    /** The type of the event emitted by the token module. */
    type: string;
    /** Additional details about the event (CBOR encoded). */
    details: Cbor.Type;
};

/**
 * Event emitted when a transfer of tokens is performed.
 */
export type TokenTransferEvent = {
    /** The token holder sending the tokens. */
    from: TokenHolder;
    /** The token holder receiving the tokens. */
    to: TokenHolder;
    /** The amount of tokens transferred. */
    amount: TokenAmount.Type;
    /** An optional memo associated with the transfer. */
    memo?: string;
};

/**
 * Event emitted when the token supply is updated.
 */
export type TokenSupplyUpdateEvent = {
    /** The token holder whose supply is updated. */
    target: TokenHolder;
    /** The amount by which the token supply is updated. */
    amount: TokenAmount.Type;
};

/**
 * A token holder is an entity that can hold tokens.
 */
export type TokenHolder = TokenHolderGeneric<'account', AccountAddress.Type>;

/**
 * A generic token holder type that can be extended to support other types of holders in the future.
 */
type TokenHolderGeneric<T extends 'account', A> = {
    /** The type of the token holder. Can be used to discriminate different types of token holders. */
    tag: T;
    /** The address of the token holder. */
    address: A;
};
