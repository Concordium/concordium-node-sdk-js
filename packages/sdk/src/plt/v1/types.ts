import * as AccountAddress from '../../types/AccountAddress.js';
import { TokenAmount, TokenModuleReference } from '../types.js';

/**
 * Enum representing the types of token operations.
 */
export enum V1TokenOperationType {
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
export type V1TokenTransfer = {
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
 * @template V1TokenOperationType - The type of the token operation.
 * @template T - The specific operation details.
 */
type V1TokenOperation<V1TokenOperationType, T extends Object> = T & {
    /** The type of operation. */
    type: V1TokenOperationType;
};

/**
 * Represents a token transfer operation.
 */
export type V1TokenTransferOperation = V1TokenOperation<V1TokenOperationType.Transfer, V1TokenTransfer>;

/**
 * Represents a holder operation, currently only supporting transfer operations.
 */
export type V1TokenHolderOperation = V1TokenTransferOperation;

/**
 * The structure of a PLT V1 token mint operation.
 */
export type V1TokenMint = {
    /** The amount to mint. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token mint operation.
 */
export type V1TokenMintOperation = V1TokenOperation<V1TokenOperationType.Mint, V1TokenMint>;

/**
 * The structure of a PLT V1 token burn operation.
 */
export type V1TokenBurn = {
    /** The amount to burn. */
    amount: TokenAmount.Type;
};

/**
 * Represents a token burn operation.
 */
export type V1TokenBurnOperation = V1TokenOperation<V1TokenOperationType.Burn, V1TokenBurn>;

/**
 * The structure of a PLT V1 token add to allow list operation.
 */
export type V1TokenAddAllowList = {
    /** The account to be added to the allow list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to add an account to the allow list.
 */
export type V1TokenAddAllowListOperation = V1TokenOperation<V1TokenOperationType.AddAllowList, V1TokenAddAllowList>;

/**
 * The structure of a PLT V1 token remove from allow list operation.
 */
export type V1TokenRemoveAllowList = {
    /** The account to be removed from the allow list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to remove an account from the allow list.
 */
export type V1TokenRemoveAllowListOperation = V1TokenOperation<V1TokenOperationType.RemoveAllowList, V1TokenRemoveAllowList>;

/**
 * The structure of a PLT V1 token add to deny list operation.
 */
export type V1TokenAddDenyList = {
    /** The account to be added to the deny list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to add an account to the deny list.
 */
export type V1TokenAddDenyListOperation = V1TokenOperation<V1TokenOperationType.AddDenyList, V1TokenAddDenyList>;

/**
 * The structure of a PLT V1 token remove from deny list operation.
 */
export type V1TokenRemoveDenyList = {
    /** The account to be removed from the deny list. */
    target: AccountAddress.Type;
};

/**
 * Represents an operation to remove an account from the deny list.
 */
export type V1TokenRemoveDenyListOperation = V1TokenOperation<V1TokenOperationType.RemoveDenyList, V1TokenRemoveDenyList>;

/**
 * Union type representing all possible governance operations for a token.
 */
export type V1TokenGovernanceOperation =
    | V1TokenMintOperation
    | V1TokenBurnOperation
    | V1TokenAddAllowListOperation
    | V1TokenRemoveAllowListOperation
    | V1TokenAddDenyListOperation
    | V1TokenRemoveDenyListOperation;

/**
 * The module reference for the V1 token.
 */
export const V1_TOKEN_MODULE_REF = TokenModuleReference.fromHexString(
    '0EA8121FDC427C9B23AE5E26CFEA3E8CBB544C84AA0C82DB26A85949CE1706C3' // TODO: get the correct module reference...
);
