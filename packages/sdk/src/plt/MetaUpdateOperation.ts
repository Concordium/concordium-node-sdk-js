import type { MetaUpdatePayload } from '../types.js';
import * as Cbor from './Cbor.js';
import type * as CborAccountAddress from './CborAccountAddress.js';
import * as LockConfig from './LockConfig.js';
import * as LockId from './LockId.js';
import type * as TokenAmount from './TokenAmount.js';
import type * as TokenId from './TokenId.js';
import type * as TokenMetadataUrl from './TokenMetadataUrl.js';
import {
    Memo,
    TokenOperation,
    TokenOperationType,
    TokenTransfer,
    TokenUpdateAdminRolesDetails,
} from './TokenOperation.js';

/** Meta operation that creates a lock. */
export type LockCreateOperation = {
    lockCreate: LockConfig.Type;
};

/** Details for cancelling a lock. */
export type LockCancel = {
    lock: LockId.Type;
    memo?: Memo;
};

export type LockCancelOperation = {
    lockCancel: LockCancel;
};

/** Details for funding a lock with tokens from the sender account. */
export type LockFund = {
    token: TokenId.Type;
    lock: LockId.Type;
    amount: TokenAmount.Type;
    memo?: Memo;
};

export type LockFundOperation = {
    lockFund: LockFund;
};

/** Details for sending locked funds to a recipient. */
export type LockSend = {
    token: TokenId.Type;
    lock: LockId.Type;
    source: CborAccountAddress.Type;
    amount: TokenAmount.Type;
    recipient: CborAccountAddress.Type;
    memo?: Memo;
};

export type LockSendOperation = {
    lockSend: LockSend;
};

/** Details for returning locked funds to their owner account. */
export type LockReturn = {
    token: TokenId.Type;
    lock: LockId.Type;
    source: CborAccountAddress.Type;
    amount: TokenAmount.Type;
    memo?: Memo;
};

export type LockReturnOperation = {
    lockReturn: LockReturn;
};

type TokenScopedOperation<Type extends TokenOperationType, T extends object> = {
    [K in Type]: T & { token: TokenId.Type };
};

/** Token operation extended with an explicit token id for MetaUpdate context. */
export type MetaTokenOperation =
    | TokenScopedOperation<TokenOperationType.Transfer, TokenTransfer>
    | TokenScopedOperation<TokenOperationType.Mint, { amount: TokenAmount.Type }>
    | TokenScopedOperation<TokenOperationType.Burn, { amount: TokenAmount.Type }>
    | TokenScopedOperation<TokenOperationType.AddAllowList, { target: CborAccountAddress.Type }>
    | TokenScopedOperation<TokenOperationType.RemoveAllowList, { target: CborAccountAddress.Type }>
    | TokenScopedOperation<TokenOperationType.AddDenyList, { target: CborAccountAddress.Type }>
    | TokenScopedOperation<TokenOperationType.RemoveDenyList, { target: CborAccountAddress.Type }>
    | TokenScopedOperation<TokenOperationType.Pause, object>
    | TokenScopedOperation<TokenOperationType.Unpause, object>
    | TokenScopedOperation<TokenOperationType.UpdateMetadata, TokenMetadataUrl.Type>
    | TokenScopedOperation<TokenOperationType.AssignAdminRoles, TokenUpdateAdminRolesDetails>
    | TokenScopedOperation<TokenOperationType.RevokeAdminRoles, TokenUpdateAdminRolesDetails>;

/** Operation supported by a MetaUpdate transaction. */
export type MetaUpdateOperation =
    | MetaTokenOperation
    | LockCreateOperation
    | LockCancelOperation
    | LockFundOperation
    | LockSendOperation
    | LockReturnOperation;

function operationToCBORValue(operation: MetaUpdateOperation): object {
    if ('lockCreate' in operation) {
        return { lockCreate: LockConfig.toCBORValue(operation.lockCreate) };
    }
    if ('lockCancel' in operation) {
        return {
            lockCancel: {
                ...operation.lockCancel,
                memo: operation.lockCancel.memo,
            },
        };
    }
    if ('lockFund' in operation) {
        return { lockFund: operation.lockFund };
    }
    if ('lockSend' in operation) {
        return { lockSend: operation.lockSend };
    }
    if ('lockReturn' in operation) {
        return { lockReturn: operation.lockReturn };
    }
    return operation;
}

/**
 * Convert an existing token operation into a MetaUpdate token operation by adding an explicit token id.
 *
 * @param token token id the operation applies to.
 * @param operation token operation to wrap.
 * @returns token operation in MetaUpdate context.
 */
export function createMetaTokenOperation(token: TokenId.Type, operation: TokenOperation): MetaTokenOperation {
    const [type] = Object.keys(operation) as [TokenOperationType];
    const details = (operation as Record<TokenOperationType, object>)[type];
    return { [type]: { token, ...details } } as MetaTokenOperation;
}

/**
 * CBOR encode one or more MetaUpdate operations.
 *
 * @param operations operation or operations to encode.
 * @returns CBOR encoded operation sequence.
 */
export function encodeMetaUpdateOperations(operations: MetaUpdateOperation | MetaUpdateOperation[]): Cbor.Type {
    return Cbor.encode([operations].flat().map(operationToCBORValue));
}

/**
 * Create a MetaUpdate transaction payload from one or more typed operations.
 *
 * @param operations operation or operations to include in the payload.
 * @returns MetaUpdate payload with CBOR encoded operations.
 */
export function createMetaUpdatePayload(operations: MetaUpdateOperation | MetaUpdateOperation[]): MetaUpdatePayload {
    return {
        operations: encodeMetaUpdateOperations(operations),
    };
}
