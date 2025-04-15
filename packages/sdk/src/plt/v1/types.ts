import { TokenGovernancePayload, TokenHolderPayload } from '../../index.js';
import * as AccountAddress from '../../types/AccountAddress.js';
import { Cbor, CborMemo, TokenAmount, TokenModuleReference } from '../index.js';

/**
 * The module reference for the V1 token.
 */
export const TOKEN_MODULE_REF = TokenModuleReference.fromHexString(
    '0EA8121FDC427C9B23AE5E26CFEA3E8CBB544C84AA0C82DB26A85949CE1706C3' // TODO: get the correct module reference...
);

/**
 * Enum representing the types of token operations.
 */
export enum TokenOperationType {
    Transfer = 'transfer',
    Mint = 'mint',
    Burn = 'burn',
    AddAllowList = 'add-allow-list',
    RemoveAllowList = 'remove-allow-list',
    AddDenyList = 'add-deny-list',
    RemoveDenyList = 'remove-deny-list',
}

export type Memo = CborMemo.Type | Uint8Array;

/**
 * The structure of a PLT V1 token transfer.
 */
export type TokenTransfer = {
    /** The amount to transfer. */
    amount: TokenAmount.Type;
    /** The recipient of the transfer. */
    recipient: AccountAddress.Type;
    /** An optional memo for the transfer. A string will be CBOR encoded, while raw bytes are included in the
     * transaction as is. */
    memo?: Memo;
};

/**
 * Generic type for a token operation.
 * @template TokenOperationType - The type of the token operation.
 * @template T - The specific operation details.
 */
type TokenOperation<Type extends TokenOperationType, T extends Object> = {
    [K in Type]: T;
};

/**
 * Represents a token transfer operation.
 */
export type TokenTransferOperation = TokenOperation<TokenOperationType.Transfer, TokenTransfer>;

/**
 * Represents a holder operation, currently only supporting transfer operations.
 */
export type TokenHolderOperation = TokenTransferOperation;

/**
 * Creates a payload for token holder operations.
 * This function encodes the provided token holder operation(s) into a CBOR format.
 *
 * @param operations - A single token holder operation or an array of token holder operations.
 * @returns The encoded token holder payload.
 */
export function createTokenHolderPayload(
    operations: TokenHolderOperation | TokenHolderOperation[]
): TokenHolderPayload {
    const ops = [operations].flat();
    return Cbor.encode(ops);
}

/**
 * The structure of a PLT V1 token mint operation.
 */
export type TokenMint = {
    /** The amount to mint. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token mint operation.
 */
export type TokenMintOperation = TokenOperation<TokenOperationType.Mint, TokenMint>;

/**
 * The structure of a PLT V1 token burn operation.
 */
export type TokenBurn = {
    /** The amount to burn. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token burn operation.
 */
export type TokenBurnOperation = TokenOperation<TokenOperationType.Burn, TokenBurn>;

/**
 * The structure of a PLT V1 token add to allow list operation.
 */
export type TokenAddAllowList = {
    /** The account to be added to the allow list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to add an account to the allow list.
 */
export type TokenAddAllowListOperation = TokenOperation<TokenOperationType.AddAllowList, TokenAddAllowList>;

/**
 * The structure of a PLT V1 token remove from allow list operation.
 */
export type TokenRemoveAllowList = {
    /** The account to be removed from the allow list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to remove an account from the allow list.
 */
export type TokenRemoveAllowListOperation = TokenOperation<TokenOperationType.RemoveAllowList, TokenRemoveAllowList>;

/**
 * The structure of a PLT V1 token add to deny list operation.
 */
export type TokenAddDenyList = {
    /** The account to be added to the deny list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to add an account to the deny list.
 */
export type TokenAddDenyListOperation = TokenOperation<TokenOperationType.AddDenyList, TokenAddDenyList>;

/**
 * The structure of a PLT V1 token remove from deny list operation.
 */
export type TokenRemoveDenyList = {
    /** The account to be removed from the deny list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to remove an account from the deny list.
 */
export type TokenRemoveDenyListOperation = TokenOperation<TokenOperationType.RemoveDenyList, TokenRemoveDenyList>;

/**
 * Union type representing all possible governance operations for a token.
 */
export type TokenGovernanceOperation =
    | TokenMintOperation
    | TokenBurnOperation
    | TokenAddAllowListOperation
    | TokenRemoveAllowListOperation
    | TokenAddDenyListOperation
    | TokenRemoveDenyListOperation;

/**
 * Creates a payload for token governance operations.
 * This function encodes the provided token governance operation(s) into a CBOR format.
 *
 * @param operations - A single token governance operation or an array of token governance operations.
 * @returns The encoded token governance payload.
 */
export function createTokenGovernancePayload(
    operations: TokenGovernanceOperation | TokenGovernanceOperation[]
): TokenGovernancePayload {
    const ops = [operations].flat();
    return Cbor.encode(ops);
}
