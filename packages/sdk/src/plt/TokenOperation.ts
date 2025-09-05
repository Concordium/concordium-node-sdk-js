import { TokenUpdatePayload } from '../types.js';
import { Cbor, CborMemo, TokenAmount, TokenHolder, TokenId } from './index.js';

/**
 * Enum representing the types of token operations.
 */
export enum TokenOperationType {
    Transfer = 'transfer',
    Mint = 'mint',
    Burn = 'burn',
    AddAllowList = 'addAllowList',
    RemoveAllowList = 'removeAllowList',
    AddDenyList = 'addDenyList',
    RemoveDenyList = 'removeDenyList',
    Pause = 'pause',
    Unpause = 'unpause',
}

export type Memo = CborMemo.Type | Uint8Array;

/**
 * The structure of a PLT transfer.
 */
export type TokenTransfer = {
    /** The amount to transfer. */
    amount: TokenAmount.Type;
    /** The recipient of the transfer. */
    recipient: TokenHolder.Type;
    /** An optional memo for the transfer. A string will be CBOR encoded, while raw bytes are included in the
     * transaction as is. */
    memo?: Memo;
};

/**
 * Generic type for a token operation.
 * @template TokenOperationType - The type of the token operation.
 * @template T - The specific operation details.
 */
type TokenOperationGen<Type extends TokenOperationType, T extends Object> = {
    [K in Type]: T;
};

/**
 * Represents a token transfer operation.
 */
export type TokenTransferOperation = TokenOperationGen<TokenOperationType.Transfer, TokenTransfer>;

/**
 * The structure of a PLT mint/burn operation.
 */
export type TokenSupplyUpdate = {
    /** The amount to mint/burn. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token mint operation.
 */
export type TokenMintOperation = TokenOperationGen<TokenOperationType.Mint, TokenSupplyUpdate>;

/**
 * Represents a token burn operation.
 */
export type TokenBurnOperation = TokenOperationGen<TokenOperationType.Burn, TokenSupplyUpdate>;

/**
 * The structure of any list update operation for a PLT.
 */
export type TokenListUpdate = {
    /** The target of the list update. */
    target: TokenHolder.Type;
};

/**
 * Represents an operation to add an account to the allow list.
 */
export type TokenAddAllowListOperation = TokenOperationGen<TokenOperationType.AddAllowList, TokenListUpdate>;

/**
 * Represents an operation to remove an account from the allow list.
 */
export type TokenRemoveAllowListOperation = TokenOperationGen<TokenOperationType.RemoveAllowList, TokenListUpdate>;

/**
 * Represents an operation to add an account to the deny list.
 */
export type TokenAddDenyListOperation = TokenOperationGen<TokenOperationType.AddDenyList, TokenListUpdate>;

/**
 * Represents an operation to remove an account from the deny list.
 */
export type TokenRemoveDenyListOperation = TokenOperationGen<TokenOperationType.RemoveDenyList, TokenListUpdate>;

/**
 * Represents an operation to pause the execution any operation that involves token balance
 * changes.
 */
export type TokenPauseOperation = TokenOperationGen<TokenOperationType.Pause, {}>;

/**
 * Represents an operation to unpause the execution any operation that involves token balance
 * changes.
 */
export type TokenUnpauseOperation = TokenOperationGen<TokenOperationType.Unpause, {}>;

/**
 * Union type representing all possible operations for a token.
 */
export type TokenOperation =
    | TokenTransferOperation
    | TokenMintOperation
    | TokenBurnOperation
    | TokenAddAllowListOperation
    | TokenRemoveAllowListOperation
    | TokenAddDenyListOperation
    | TokenRemoveDenyListOperation
    | TokenPauseOperation
    | TokenUnpauseOperation;

/**
 * Creates a payload for token operations.
 * This function encodes the provided token operation(s) into a CBOR format.
 *
 * @param tokenId - The unique identifier of the token for which the operation(s) is being performed.
 * @param operations - A single token operation or an array of token operations.
 *
 * @returns The encoded token governance payload.
 */
export function createTokenUpdatePayload(
    tokenId: TokenId.Type,
    operations: TokenOperation | TokenOperation[]
): TokenUpdatePayload {
    const ops = [operations].flat();
    return {
        tokenId: tokenId,
        operations: Cbor.encode(ops),
    };
}
