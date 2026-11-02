import {
    type LockCancelOperation,
    type LockCreateOperation,
    type LockFundOperation,
    type LockReleaseOperation,
    type LockSendOperation,
    type Operation,
    type TokenOperationWithId,
    createTokenOperationWithId,
} from './Operation.js';
import type * as TokenId from './TokenId.js';
import { TokenOperation, TokenOperationType } from './TokenOperation.js';
import { parseMetadataUpdate } from './cbor-parse.js';

/** Sanitize token operation details for encoding. */
export function tokenOperationValue(operation: TokenOperation): TokenOperation {
    if ('transfer' in operation) {
        const { amount, recipient, memo } = operation.transfer;
        return { transfer: { amount, recipient, memo } };
    }
    if ('mint' in operation) return { mint: { amount: operation.mint.amount } };
    if ('burn' in operation) return { burn: { amount: operation.burn.amount } };
    if ('addAllowList' in operation) return { addAllowList: { target: operation.addAllowList.target } };
    if ('removeAllowList' in operation) return { removeAllowList: { target: operation.removeAllowList.target } };
    if ('addDenyList' in operation) return { addDenyList: { target: operation.addDenyList.target } };
    if ('removeDenyList' in operation) return { removeDenyList: { target: operation.removeDenyList.target } };
    if ('pause' in operation) return { pause: {} };
    if ('unpause' in operation) return { unpause: {} };
    if ('updateMetadata' in operation) return { updateMetadata: parseMetadataUpdate(operation.updateMetadata) };
    if ('assignAdminRoles' in operation) {
        const { account, roles } = operation.assignAdminRoles;
        return { assignAdminRoles: { account, roles } };
    }
    if ('revokeAdminRoles' in operation) {
        const { account, roles } = operation.revokeAdminRoles;
        return { revokeAdminRoles: { account, roles } };
    }
    throw new Error(`Unknown token operation: ${Object.keys(operation) as TokenOperationType[]}`);
}

function toTokenOperation(operation: TokenOperationWithId): { token: TokenId.Type; operation: TokenOperation } {
    const [name] = Object.keys(operation);
    const { token, ...details } = (operation as Record<string, { token: TokenId.Type }>)[name];
    // Strip the token prefix to align unscoped names with scoped operation names.
    const suffix = name.slice('token'.length);
    const scopedName = suffix[0].toLowerCase() + suffix.slice(1);
    return { token, operation: { [scopedName]: details } as TokenOperation };
}

/** Select known wire fields from an unscoped operation. */
export function operationValue(op: Operation): Operation {
    switch (true) {
        case 'lockCreate' in op: {
            const { recipients, expiry, grants, tokens, keepAlive, memo, metadata } = (op as LockCreateOperation)
                .lockCreate.simpleV0;
            return { lockCreate: { simpleV0: { recipients, expiry, grants, tokens, keepAlive, memo, metadata } } };
        }
        case 'lockCancel' in op: {
            const { lock, memo } = (op as LockCancelOperation).lockCancel;
            return { lockCancel: { lock, memo } };
        }
        case 'lockFund' in op: {
            const { token, lock, amount, memo } = (op as LockFundOperation).lockFund;
            return { lockFund: { token, lock, amount, memo } };
        }
        case 'lockSend' in op: {
            const { token, lock, source, amount, recipient, memo } = (op as LockSendOperation).lockSend;
            return { lockSend: { token, lock, source, amount, recipient, memo } };
        }
        case 'lockRelease' in op: {
            const { token, lock, source, amount, memo } = (op as LockReleaseOperation).lockRelease;
            return { lockRelease: { token, lock, source, amount, memo } };
        }
        case 'tokenTransfer' in op:
        case 'tokenMint' in op:
        case 'tokenBurn' in op:
        case 'tokenAddAllowList' in op:
        case 'tokenRemoveAllowList' in op:
        case 'tokenAddDenyList' in op:
        case 'tokenRemoveDenyList' in op:
        case 'tokenPause' in op:
        case 'tokenUnpause' in op:
        case 'tokenUpdateMetadata' in op:
        case 'tokenAssignAdminRoles' in op:
        case 'tokenRevokeAdminRoles' in op: {
            const { token, operation } = toTokenOperation(op as TokenOperationWithId);
            return createTokenOperationWithId(token, tokenOperationValue(operation));
        }
        default:
            throw new Error('Unknown operation');
    }
}
