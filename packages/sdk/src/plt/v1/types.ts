import * as AccountAddress from '../../types/AccountAddress.js';
import { TokenAmount, TokenModuleReference } from '../types.js';

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
    memo?: string | ArrayBuffer;
};

/**
 * Generic type for a token operation.
 * @template TokenOperationType - The type of the token operation.
 * @template T - The specific operation details.
 */
type TokenOperation<TokenOperationType, T extends Object> = T & {
    /** The type of operation. */
    type: TokenOperationType;
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
