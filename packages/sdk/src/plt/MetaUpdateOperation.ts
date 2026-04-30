import type { MetaUpdatePayload } from '../types.js';
import * as Cbor from './Cbor.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborMemo from './CborMemo.js';
import * as LockConfig from './LockConfig.js';
import * as LockId from './LockId.js';
import * as TokenAmount from './TokenAmount.js';
import * as TokenId from './TokenId.js';
import type * as TokenMetadataUrl from './TokenMetadataUrl.js';
import {
    Memo,
    TokenOperation,
    TokenOperationType,
    TokenTransfer,
    TokenUpdateAdminRolesDetails,
} from './TokenOperation.js';
import { parseEmpty, parseListUpdate, parseSupplyUpdate, parseTransfer } from './cbor-parse.js';

/** Enum representing the types of meta update operations. */
export enum MetaUpdateOperationType {
    /** Creates a new protocol-level lock. */
    LockCreate = 'lockCreate',
    /** Cancels an existing lock before expiry. Requires the `cancel` capability on the lock controller. */
    LockCancel = 'lockCancel',
    /** Funds a lock with tokens from the sender account. */
    LockFund = 'lockFund',
    /** Sends locked tokens to a recipient from a lock the sender controls. */
    LockSend = 'lockSend',
    /** Returns locked tokens to the account that owns the lock. */
    LockReturn = 'lockReturn',
}

type MetaUpdateOperationGen<Type extends MetaUpdateOperationType | TokenOperationType, T extends object> = {
    [K in Type]: T;
};

/** Meta operation that creates a lock. */
export type LockCreateOperation = MetaUpdateOperationGen<MetaUpdateOperationType.LockCreate, LockConfig.Type>;

/** Details for cancelling a lock. */
export type LockCancel = {
    /** Identifier of the lock to cancel. */
    lock: LockId.Type;
    /** Optional memo to include with the cancellation. */
    memo?: Memo;
};

/** Meta operation that cancels an existing lock. */
export type LockCancelOperation = MetaUpdateOperationGen<MetaUpdateOperationType.LockCancel, LockCancel>;

/** Details for funding a lock with tokens from the sender account. */
export type LockFund = {
    /** Token id of the token to fund the lock with. */
    token: TokenId.Type;
    /** Identifier of the lock to fund. */
    lock: LockId.Type;
    /** Amount of tokens to transfer into the lock from the sender account. */
    amount: TokenAmount.Type;
    /** Optional memo to include with the operation. */
    memo?: Memo;
};

/** Meta operation that funds a lock with tokens from the sender account. */
export type LockFundOperation = MetaUpdateOperationGen<MetaUpdateOperationType.LockFund, LockFund>;

/** Details for sending locked funds to a recipient. */
export type LockSend = {
    /** Token id of the locked token to send. */
    token: TokenId.Type;
    /** Identifier of the lock holding the tokens. */
    lock: LockId.Type;
    /** Account that currently holds the locked funds. */
    source: CborAccountAddress.Type;
    /** Amount of locked tokens to send. */
    amount: TokenAmount.Type;
    /** Account to receive the tokens. */
    recipient: CborAccountAddress.Type;
    /** Optional memo to include with the operation. */
    memo?: Memo;
};

/** Meta operation that sends locked tokens to a recipient. */
export type LockSendOperation = MetaUpdateOperationGen<MetaUpdateOperationType.LockSend, LockSend>;

/** Details for returning locked funds to their owner account. */
export type LockReturn = {
    /** Token id of the locked token to return. */
    token: TokenId.Type;
    /** Identifier of the lock holding the tokens. */
    lock: LockId.Type;
    /** Account that currently holds the locked funds. */
    source: CborAccountAddress.Type;
    /** Amount of locked tokens to return to the owning account. */
    amount: TokenAmount.Type;
    /** Optional memo to include with the operation. */
    memo?: Memo;
};

/** Meta operation that returns locked tokens to the account that owns the lock. */
export type LockReturnOperation = MetaUpdateOperationGen<MetaUpdateOperationType.LockReturn, LockReturn>;

type FromTokenOperation<Type extends TokenOperationType, T extends object> = MetaUpdateOperationGen<
    Type,
    T & {
        /** Token id the operation applies to. */
        token: TokenId.Type;
    }
>;

/** Token operation extended with an explicit token id for MetaUpdate context. */
export type MetaTokenOperation =
    | FromTokenOperation<TokenOperationType.Transfer, TokenTransfer>
    | FromTokenOperation<TokenOperationType.Mint, { amount: TokenAmount.Type }>
    | FromTokenOperation<TokenOperationType.Burn, { amount: TokenAmount.Type }>
    | FromTokenOperation<TokenOperationType.AddAllowList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<TokenOperationType.RemoveAllowList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<TokenOperationType.AddDenyList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<TokenOperationType.RemoveDenyList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<TokenOperationType.Pause, object>
    | FromTokenOperation<TokenOperationType.Unpause, object>
    | FromTokenOperation<TokenOperationType.UpdateMetadata, TokenMetadataUrl.Type>
    | FromTokenOperation<TokenOperationType.AssignAdminRoles, TokenUpdateAdminRolesDetails>
    | FromTokenOperation<TokenOperationType.RevokeAdminRoles, TokenUpdateAdminRolesDetails>;

/** Operation supported by a MetaUpdate transaction. */
export type MetaUpdateOperation =
    | MetaTokenOperation
    | LockCreateOperation
    | LockCancelOperation
    | LockFundOperation
    | LockSendOperation
    | LockReturnOperation;

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
    return Cbor.encode([operations].flat());
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

/**
 * A meta update operation decoded from CBOR whose type key is not recognised by this SDK version.
 * Preserves the raw decoded value so callers can inspect it forward-compatibly.
 */
export type UnknownMetaUpdateOperation = { [key: string]: unknown };

/**
 * Extract and validate the required `token` field from a token-scoped meta operation's detail
 * object, returning the token id and the remaining fields as separate values.
 *
 * @param details raw decoded CBOR details object.
 * @param opType operation type name used in error messages.
 * @returns tuple of `[tokenId, restOfDetails]`.
 */
function extractMetaToken(details: unknown, opType: string): [TokenId.Type, Record<string, unknown>] {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid ${opType} details: expected an object`);
    const d = details as Record<string, unknown>;
    if (typeof d.token !== 'string') throw new Error(`Invalid ${opType} details: missing or invalid 'token' field`);
    const { token, ...rest } = d;
    return [TokenId.fromString(token), rest];
}

function parseLockIdField(value: unknown, context: string): LockId.Type {
    try {
        return LockId.fromCBORValue(value);
    } catch {
        throw new Error(`Invalid ${context}: invalid lock id`);
    }
}

function parseMemoField(value: unknown, context: string): Memo | undefined {
    if (value === undefined) return undefined;
    if (value instanceof Uint8Array || CborMemo.instanceOf(value)) return value;
    throw new Error(`Invalid ${context}: invalid memo`);
}

function parseLockCancel(details: unknown): LockCancel {
    if (typeof details !== 'object' || details === null)
        throw new Error('Invalid lockCancel details: expected an object');
    const d = details as Record<string, unknown>;
    return {
        lock: parseLockIdField(d.lock, 'lockCancel'),
        memo: parseMemoField(d.memo, 'lockCancel'),
    };
}

function parseLockFund(details: unknown): LockFund {
    const [token, d] = extractMetaToken(details, 'lockFund');
    if (!TokenAmount.instanceOf(d.amount))
        throw new Error('Invalid lockFund details: expected amount to be a TokenAmount');
    return {
        token,
        lock: parseLockIdField(d.lock, 'lockFund'),
        amount: d.amount,
        memo: parseMemoField(d.memo, 'lockFund'),
    };
}

function parseLockSend(details: unknown): LockSend {
    const [token, d] = extractMetaToken(details, 'lockSend');
    if (!TokenAmount.instanceOf(d.amount))
        throw new Error('Invalid lockSend details: expected amount to be a TokenAmount');
    if (!CborAccountAddress.instanceOf(d.source))
        throw new Error('Invalid lockSend details: expected source to be a CborAccountAddress');
    if (!CborAccountAddress.instanceOf(d.recipient))
        throw new Error('Invalid lockSend details: expected recipient to be a CborAccountAddress');
    return {
        token,
        lock: parseLockIdField(d.lock, 'lockSend'),
        source: d.source,
        amount: d.amount,
        recipient: d.recipient,
        memo: parseMemoField(d.memo, 'lockSend'),
    };
}

function parseLockReturn(details: unknown): LockReturn {
    const [token, d] = extractMetaToken(details, 'lockReturn');
    if (!TokenAmount.instanceOf(d.amount))
        throw new Error('Invalid lockReturn details: expected amount to be a TokenAmount');
    if (!CborAccountAddress.instanceOf(d.source))
        throw new Error('Invalid lockReturn details: expected source to be a CborAccountAddress');
    return {
        token,
        lock: parseLockIdField(d.lock, 'lockReturn'),
        source: d.source,
        amount: d.amount,
        memo: parseMemoField(d.memo, 'lockReturn'),
    };
}

/**
 * Decode a single raw CBOR value as a MetaUpdate operation.
 * Known operation types are fully validated and returned as typed operations.
 * Unrecognised type keys are returned as {@linkcode UnknownMetaUpdateOperation}.
 *
 * Token-scoped operation parsers are reused from the TokenOperation module:
 * - Transfer details: reuses `parseTransfer`
 * - Mint / Burn details: reuses `parseSupplyUpdate`
 * - Allow / deny list details: reuses `parseListUpdate`
 * - Pause / Unpause: reuses `parseEmpty` (after stripping the `token` field)
 *
 * @param decoded raw decoded CBOR value.
 * @returns the decoded operation.
 */
function parseMetaUpdateOperation(decoded: unknown): MetaUpdateOperation | UnknownMetaUpdateOperation {
    if (typeof decoded !== 'object' || decoded === null)
        throw new Error(`Invalid meta update operation: expected an object, got ${JSON.stringify(decoded)}`);

    const keys = Object.keys(decoded);
    if (keys.length !== 1)
        throw new Error(`Invalid meta update operation: expected a single-key object, got keys [${keys.join(', ')}]`);

    const type = keys[0];
    const details = (decoded as Record<string, unknown>)[type];

    switch (type) {
        case TokenOperationType.Transfer: {
            const [token, rest] = extractMetaToken(details, type);
            return { [type]: { token, ...parseTransfer(rest) } };
        }
        case TokenOperationType.Mint:
        case TokenOperationType.Burn: {
            const [token, rest] = extractMetaToken(details, type);
            return { [type]: { token, ...parseSupplyUpdate(rest) } };
        }
        case TokenOperationType.AddAllowList:
        case TokenOperationType.RemoveAllowList:
        case TokenOperationType.AddDenyList:
        case TokenOperationType.RemoveDenyList: {
            const [token, rest] = extractMetaToken(details, type);
            return { [type]: { token, ...parseListUpdate(rest) } };
        }
        case TokenOperationType.Pause:
        case TokenOperationType.Unpause: {
            const [token, rest] = extractMetaToken(details, type);
            parseEmpty(rest);
            return { [type]: { token } };
        }
        case MetaUpdateOperationType.LockCreate:
            return { [type]: LockConfig.fromCBORValue(details) };
        case MetaUpdateOperationType.LockCancel:
            return { [type]: parseLockCancel(details) };
        case MetaUpdateOperationType.LockFund:
            return { [type]: parseLockFund(details) };
        case MetaUpdateOperationType.LockSend:
            return { [type]: parseLockSend(details) };
        case MetaUpdateOperationType.LockReturn:
            return { [type]: parseLockReturn(details) };
        default:
            return decoded as UnknownMetaUpdateOperation;
    }
}

/**
 * Decode a single MetaUpdate operation from CBOR.
 *
 * @param cbor CBOR encoding of a single MetaUpdate operation.
 * @returns the decoded operation, or {@linkcode UnknownMetaUpdateOperation} for unrecognised types.
 *
 * @example
 * const op = decodeMetaUpdateOperation(cbor);
 * switch (true) {
 *   case MetaUpdateOperationType.Transfer in op: {
 *     const details = op[MetaUpdateOperationType.Transfer];
 *     console.log(details.token, details.amount);
 *     break;
 *   }
 *   case MetaUpdateOperationType.LockCreate in op:
 *     console.log(op[MetaUpdateOperationType.LockCreate]);
 *     break;
 *   default:
 *     console.warn('Unknown operation', op);
 * }
 */
export function decodeMetaUpdateOperation(cbor: Cbor.Type): MetaUpdateOperation | UnknownMetaUpdateOperation {
    return parseMetaUpdateOperation(Cbor.decode(cbor));
}

/**
 * Decode a list of MetaUpdate operations from CBOR.
 *
 * @param cbor CBOR encoding of a MetaUpdate operation array.
 * @returns the decoded operations.
 *
 * @example
 * const ops = decodeMetaUpdateOperations(cbor);
 * ops.forEach(op => {
 *   switch (true) {
 *     case MetaUpdateOperationType.LockFund in op:
 *       console.log(op[MetaUpdateOperationType.LockFund].lock);
 *       break;
 *     default:
 *       console.warn('Unknown operation', op);
 *   }
 * });
 */
export function decodeMetaUpdateOperations(cbor: Cbor.Type): (MetaUpdateOperation | UnknownMetaUpdateOperation)[] {
    const decoded = Cbor.decode(cbor);
    if (!Array.isArray(decoded))
        throw new Error(`Invalid meta update operations: ${JSON.stringify(decoded)}. Expected a list of operations.`);
    return decoded.map(parseMetaUpdateOperation);
}

/**
 * Decode the operations in a {@linkcode MetaUpdatePayload} from CBOR into typed operations.
 *
 * @param payload the MetaUpdate payload to parse.
 * @returns the payload with decoded operations.
 *
 * @example
 * const parsed = parseMetaUpdatePayload(encodedPayload);
 * parsed.operations.forEach(op => {
 *   switch (true) {
 *     case MetaUpdateOperationType.Transfer in op:
 *       console.log(op[MetaUpdateOperationType.Transfer].amount);
 *       break;
 *     default:
 *       console.warn('Unknown operation', op);
 *   }
 * });
 */
export function parseMetaUpdatePayload(payload: MetaUpdatePayload): Omit<MetaUpdatePayload, 'operations'> & {
    operations: (MetaUpdateOperation | UnknownMetaUpdateOperation)[];
} {
    return { ...payload, operations: decodeMetaUpdateOperations(payload.operations) };
}
