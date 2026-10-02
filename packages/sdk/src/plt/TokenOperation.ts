import { ScopedTokenUpdatePayload, TokenUpdatePayload, UnscopedTokenUpdatePayload } from '../types.js';
import { Operation, UnknownOperation, decodeOperations, encodeOperations } from './Operation.js';
import { parseMetadataUpdate, parseTokenOperation } from './cbor-parse.js';
import { Cbor, CborAccountAddress, CborMemo, TokenAmount, TokenId } from './index.js';

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
    UpdateMetadata = 'updateMetadata',
    AssignAdminRoles = 'assignAdminRoles',
    RevokeAdminRoles = 'revokeAdminRoles',
}

/**
 * The different The different admin roles defined for the current token module implementation.
 * Each role gives access to specific administrative operations.
 */
export enum TokenAdminRole {
    UpdateAdminRoles = 'updateAdminRoles', //Gives authority to perform `token-assign-admin-roles` and `token-revoke-admin-roles` operations.
    Mint = 'mint', //Gives authority to perform `token-mint` operations.
    Burn = 'burn', //Gives authority to perform `token-burn` operations.
    UpdateAllowList = 'updateAllowList', //Gives authority to perform `token-add-allow-list` and `token-remove-allow-list` operations.
    UpdateDenyList = 'updateDenyList', //Gives authority to perform `token-add-deny-list` and `token-remove-deny-list` operations.
    Pause = 'pause', //Gives authority to perform `token-pause` and `token-unpause` operations.
    UpdateMetadata = 'updateMetadata', //Gives authority to perform `token-update-metadata` operations.
}

export type Memo = CborMemo.Type | Uint8Array;

/**
 * The structure of a PLT transfer.
 */
export type TokenTransfer = {
    /** The amount to transfer. */
    amount: TokenAmount.Type;
    /** The recipient of the transfer. */
    recipient: CborAccountAddress.Type;
    /** An optional memo for the transfer. A string will be CBOR encoded, while raw bytes are included in the
     * transaction as is. */
    memo?: Memo;
};

/**
 * The details of the `token-assign-admin-roles` and `token-revoke-admin-roles` operations
 */
export type TokenUpdateAdminRolesDetails = {
    roles: TokenAdminRole[]; //The admin roles to update.
    account: CborAccountAddress.Type; //The account to update admin for
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
    target: CborAccountAddress.Type;
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

/** Restricted metadata-update body. Initialization and event metadata remain extensible. */
export type TokenMetadataUrlDetails = {
    url: string;
    checksumSha256?: Uint8Array;
};

/** Represents an operation to update the metadata URL of a token. */
export type TokenUpdateMetadataOperation = TokenOperationGen<
    TokenOperationType.UpdateMetadata,
    TokenMetadataUrlDetails
>;

/**
 * Represents an operation to assign an admin role to an account.
 */
export type TokenAssignAdminRolesOperation = TokenOperationGen<
    TokenOperationType.AssignAdminRoles,
    TokenUpdateAdminRolesDetails
>;

/**
 * Represents an operation to revoke an admin role from an account.
 */
export type TokenRevokeAdminRolesOperation = TokenOperationGen<
    TokenOperationType.RevokeAdminRoles,
    TokenUpdateAdminRolesDetails
>;

/**
 * Represents an operation to update admin roles for an account, which can be either assigning or revoking roles.
 */
export type TokenUpdateAdminRoleOperation = TokenAssignAdminRolesOperation | TokenRevokeAdminRolesOperation;

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
    | TokenUnpauseOperation
    | TokenUpdateMetadataOperation
    | TokenUpdateAdminRoleOperation;

/**
 * Creates a scoped or unscoped Token Update payload.
 * This function encodes the provided token operation(s) into a CBOR format.
 *
 * @param input - Token operations with a token ID for a scoped payload, or unscoped operations without a token ID.
 *
 * @returns The encoded token governance payload.
 */
export function createTokenUpdatePayload(input: {
    tokenId: TokenId.Type;
    operations: TokenOperation | TokenOperation[];
}): ScopedTokenUpdatePayload;
export function createTokenUpdatePayload(input: { operations: Operation | Operation[] }): UnscopedTokenUpdatePayload;
export function createTokenUpdatePayload(
    input:
        | { tokenId: TokenId.Type; operations: TokenOperation | TokenOperation[] }
        | { operations: Operation | Operation[] }
): TokenUpdatePayload {
    if (!('tokenId' in input)) return { variant: 'unscoped', operations: encodeOperations(input.operations) };
    const ops = [input.operations].flat().map((op) => {
        if (TokenOperationType.UpdateMetadata in op) return { updateMetadata: parseMetadataUpdate(op.updateMetadata) };
        return op;
    });
    return { variant: 'scoped', tokenId: input.tokenId, operations: Cbor.encode(ops) };
}

/**
 * Represents a token operation (found when decoding) unknown to the SDK.
 */
export type UnknownTokenOperation = { [key: string]: unknown };

/**
 * Decodes a token operation.
 *
 * @param cbor - The CBOR encoding to decode.
 * @returns The decoded token operation.
 *
 * @example
 * const op = decodeTokenOperation(cbor);
 * switch (true) {
 *   case TokenOperationType.Transfer in op: {
 *     const details = op[TokenOperationType.Transfer]; // type is known at this point.
 *     console.log(details);
 *   }
 *   ...
 *   default: console.warn('Unknown operation', op);
 * }
 */
export function decodeTokenOperation(cbor: Cbor.Type): TokenOperation | UnknownTokenOperation {
    const decoded = Cbor.decode(cbor);
    return parseTokenOperation(decoded);
}

/**
 * Decodes a list of token operations.
 *
 * @param cbor - The CBOR encoding to decode.
 * @returns The decoded token operations.
 *
 * @example
 * const ops = decodeTokenOperations(cbor);
 * ops.forEach(op => {
 *   switch (true) {
 *     case TokenOperationType.Transfer in op: {
 *       const details = op[TokenOperationType.Transfer]; // type is known at this point.
 *       console.log(details);
 *     }
 *     ...
 *     default: console.warn('Unknown operation', op);
 *   }
 * });
 */
export function decodeTokenOperations(cbor: Cbor.Type): (TokenOperation | UnknownTokenOperation)[] {
    const decoded = Cbor.decode(cbor);
    if (!Array.isArray(decoded))
        throw new Error(`Invalid token update operations: ${JSON.stringify(decoded)}. Expected a list of operations.`);

    return decoded.map(parseTokenOperation);
}

/**
 * Parses a token update payload, decoding the operations from CBOR format.
 *
 * @param payload - The token update payload to parse.
 * @returns The parsed token update payload with decoded operations.
 *
 * @example
 * const parsedPayload = parseTokenUpdatePayload(encodedPayload);
 * parsedPayload.operations.forEach(op => {
 *   switch (true) {
 *     case TokenOperationType.Transfer in op: {
 *       const details = op[TokenOperationType.Transfer]; // type is known at this point.
 *       console.log(details);
 *     }
 *     ...
 *     default: console.warn('Unknown operation', op);
 *   }
 * });
 */
export function parseTokenUpdatePayload(
    payload: ScopedTokenUpdatePayload
): Omit<ScopedTokenUpdatePayload, 'operations'> & { operations: (TokenOperation | UnknownTokenOperation)[] };
export function parseTokenUpdatePayload(
    payload: UnscopedTokenUpdatePayload
): Omit<UnscopedTokenUpdatePayload, 'operations'> & { operations: (Operation | UnknownOperation)[] };
export function parseTokenUpdatePayload(
    payload: TokenUpdatePayload
): Omit<TokenUpdatePayload, 'operations'> & { operations: (TokenOperation | Operation | UnknownOperation)[] };
export function parseTokenUpdatePayload(
    payload: TokenUpdatePayload
): Omit<TokenUpdatePayload, 'operations'> & { operations: (TokenOperation | Operation | UnknownOperation)[] } {
    const operations =
        payload.variant === 'unscoped'
            ? decodeOperations(payload.operations)
            : decodeTokenOperations(payload.operations);
    return { ...payload, operations };
}
