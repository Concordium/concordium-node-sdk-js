import type { UnscopedTokenUpdatePayload } from '../types.js';
import * as Cbor from './Cbor.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as CborMemo from './CborMemo.js';
import * as LockConfig from './LockConfig.js';
import * as LockId from './LockId.js';
import * as TokenAmount from './TokenAmount.js';
import * as TokenId from './TokenId.js';
import {
    Memo,
    TokenMetadataUrlDetails,
    TokenOperation,
    TokenOperationType,
    TokenTransfer,
    TokenUpdateAdminRolesDetails,
} from './TokenOperation.js';
import { parseMetadataUpdate, parseTokenOperation } from './cbor-parse.js';

/** Enum representing the types of unscoped token update operations. */
export enum OperationType {
    TokenTransfer = 'tokenTransfer',
    TokenMint = 'tokenMint',
    TokenBurn = 'tokenBurn',
    TokenAddAllowList = 'tokenAddAllowList',
    TokenRemoveAllowList = 'tokenRemoveAllowList',
    TokenAddDenyList = 'tokenAddDenyList',
    TokenRemoveDenyList = 'tokenRemoveDenyList',
    TokenPause = 'tokenPause',
    TokenUnpause = 'tokenUnpause',
    TokenUpdateMetadata = 'tokenUpdateMetadata',
    TokenAssignAdminRoles = 'tokenAssignAdminRoles',
    TokenRevokeAdminRoles = 'tokenRevokeAdminRoles',
    /** Creates a new protocol-level lock. */
    LockCreate = 'lockCreate',
    /** Cancels an existing lock before expiry. Requires the `cancel` capability on the lock controller. */
    LockCancel = 'lockCancel',
    /** Funds a lock with tokens from the sender account. */
    LockFund = 'lockFund',
    /** Sends locked tokens to a recipient from a lock the sender controls. */
    LockSend = 'lockSend',
    /** Releases locked tokens to the account that owns the lock. */
    LockRelease = 'lockRelease',
}

type OperationGen<Type extends OperationType, T extends object> = {
    [K in Type]: T;
};

/** Unscoped operation that creates a lock. */
export type LockCreateOperation = OperationGen<OperationType.LockCreate, LockConfig.Type>;

/** Details for cancelling a lock. */
export type LockCancel = {
    /** Identifier of the lock to cancel. */
    lock: LockId.Type;
    /** Optional memo to include with the cancellation. */
    memo?: Memo;
};

/** Unscoped operation that cancels an existing lock. */
export type LockCancelOperation = OperationGen<OperationType.LockCancel, LockCancel>;

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

/** Unscoped operation that funds a lock with tokens from the sender account. */
export type LockFundOperation = OperationGen<OperationType.LockFund, LockFund>;

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

/** Unscoped operation that sends locked tokens to a recipient. */
export type LockSendOperation = OperationGen<OperationType.LockSend, LockSend>;

/** Details for releasing locked funds to their owner account. */
export type LockRelease = {
    /** Token id of the locked token to release. */
    token: TokenId.Type;
    /** Identifier of the lock holding the tokens. */
    lock: LockId.Type;
    /** Account that currently holds the locked funds. */
    source: CborAccountAddress.Type;
    /** Amount of locked tokens to release to the owning account. */
    amount: TokenAmount.Type;
    /** Optional memo to include with the operation. */
    memo?: Memo;
};

/** Unscoped operation that releases locked tokens to the account that owns the lock. */
export type LockReleaseOperation = OperationGen<OperationType.LockRelease, LockRelease>;

type FromTokenOperation<Type extends OperationType, T extends object> = OperationGen<
    Type,
    T & {
        /** Token id the operation applies to. */
        token: TokenId.Type;
    }
>;

/** Token operation extended with an explicit token id for Unscoped Token Update context. */
export type TokenOperationWithId =
    | FromTokenOperation<OperationType.TokenTransfer, TokenTransfer>
    | FromTokenOperation<OperationType.TokenMint, { amount: TokenAmount.Type }>
    | FromTokenOperation<OperationType.TokenBurn, { amount: TokenAmount.Type }>
    | FromTokenOperation<OperationType.TokenAddAllowList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<OperationType.TokenRemoveAllowList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<OperationType.TokenAddDenyList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<OperationType.TokenRemoveDenyList, { target: CborAccountAddress.Type }>
    | FromTokenOperation<OperationType.TokenPause, object>
    | FromTokenOperation<OperationType.TokenUnpause, object>
    | FromTokenOperation<OperationType.TokenUpdateMetadata, TokenMetadataUrlDetails>
    | FromTokenOperation<OperationType.TokenAssignAdminRoles, TokenUpdateAdminRolesDetails>
    | FromTokenOperation<OperationType.TokenRevokeAdminRoles, TokenUpdateAdminRolesDetails>;

/** Operation supported by an Unscoped Token Update transaction. */
export type Operation =
    | TokenOperationWithId
    | LockCreateOperation
    | LockCancelOperation
    | LockFundOperation
    | LockSendOperation
    | LockReleaseOperation;

/**
 * Convert an existing token operation into an Unscoped Token Update token operation by adding an explicit token id.
 *
 * @param token token id the operation applies to.
 * @param operation token operation to wrap.
 * @returns token operation in Unscoped Token Update context.
 */
export function createTokenOperationWithId(token: TokenId.Type, operation: TokenOperation): TokenOperationWithId {
    const [type] = Object.keys(operation) as [TokenOperationType];
    const details = (operation as Record<TokenOperationType, object>)[type];
    const key = `token${type[0].toUpperCase()}${type.slice(1)}`;
    const body = type === TokenOperationType.UpdateMetadata ? parseMetadataUpdate(details) : details;
    return { [key]: { token, ...body } } as TokenOperationWithId;
}

/**
 * CBOR encode one or more Unscoped Token Update operations.
 *
 * @param operations operation or operations to encode.
 * @returns CBOR encoded operation sequence.
 */
export function encodeOperations(operations: Operation | Operation[]): Cbor.Type {
    return Cbor.encode(
        [operations].flat().map((op) => {
            if (OperationType.TokenUpdateMetadata in op) {
                const { token, ...details } = op.tokenUpdateMetadata;
                return { tokenUpdateMetadata: { token, ...parseMetadataUpdate(details) } };
            }
            return op;
        })
    );
}

/**
 * An unscoped token update operation decoded from CBOR whose type key is not recognised by this SDK version.
 * Preserves the raw decoded value so callers can inspect it forward-compatibly.
 */
export type UnknownOperation = { [key: string]: unknown };

/**
 * Extract and validate the required `token` field from a token-specific unscoped operation's detail
 * object, returning the token id and the remaining fields as separate values.
 *
 * @param details raw decoded CBOR details object.
 * @param opType operation type name used in error messages.
 * @returns tuple of `[tokenId, restOfDetails]`.
 */
function extractToken(details: unknown, opType: string): [TokenId.Type, Record<string, unknown>] {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid ${opType} details: expected an object`);
    const d = details as Record<string, unknown>;
    if (typeof d.token !== 'string') throw new Error(`Invalid ${opType} details: missing or invalid 'token' field`);
    const { token, ...rest } = d;
    return [TokenId.fromString(token), rest];
}

function parseLockIdField(value: unknown, context: string): LockId.Type {
    if (LockId.instanceOf(value)) return value;
    throw new Error(`Invalid ${context}: invalid lock id`);
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
    const [token, d] = extractToken(details, 'lockFund');
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
    const [token, d] = extractToken(details, 'lockSend');
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

function parseLockRelease(details: unknown): LockRelease {
    const [token, d] = extractToken(details, 'lockRelease');
    if (!TokenAmount.instanceOf(d.amount))
        throw new Error('Invalid lockRelease details: expected amount to be a TokenAmount');
    if (!CborAccountAddress.instanceOf(d.source))
        throw new Error('Invalid lockRelease details: expected source to be a CborAccountAddress');
    return {
        token,
        lock: parseLockIdField(d.lock, 'lockRelease'),
        source: d.source,
        amount: d.amount,
        memo: parseMemoField(d.memo, 'lockRelease'),
    };
}

/**
 * Decode a single raw CBOR value as an Unscoped Token Update operation.
 * Known operation types are fully validated and returned as typed operations.
 * Unrecognised type keys are returned as {@linkcode UnknownOperation}.
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
function parseOperation(decoded: unknown): Operation | UnknownOperation {
    if (typeof decoded !== 'object' || decoded === null)
        throw new Error(`Invalid unscoped token update operation: expected an object, got ${JSON.stringify(decoded)}`);

    const keys = Object.keys(decoded);
    if (keys.length !== 1)
        throw new Error(
            `Invalid unscoped token update operation: expected a single-key object, got keys [${keys.join(', ')}]`
        );

    const type = keys[0];
    const details = (decoded as Record<string, unknown>)[type];

    switch (type) {
        case OperationType.TokenTransfer:
        case OperationType.TokenMint:
        case OperationType.TokenBurn:
        case OperationType.TokenAddAllowList:
        case OperationType.TokenRemoveAllowList:
        case OperationType.TokenAddDenyList:
        case OperationType.TokenRemoveDenyList:
        case OperationType.TokenPause:
        case OperationType.TokenUnpause:
        case OperationType.TokenUpdateMetadata:
        case OperationType.TokenAssignAdminRoles:
        case OperationType.TokenRevokeAdminRoles: {
            const [token, rest] = extractToken(details, type);
            const key = type[5].toLowerCase() + type.slice(6);
            const parsed = parseTokenOperation({ [key]: rest });
            return { [type]: { token, ...(parsed as Record<string, object>)[key] } } as TokenOperationWithId;
        }
        case OperationType.LockCreate:
            return { [type]: LockConfig.fromCBORValue(details) };
        case OperationType.LockCancel:
            return { [type]: parseLockCancel(details) };
        case OperationType.LockFund:
            return { [type]: parseLockFund(details) };
        case OperationType.LockSend:
            return { [type]: parseLockSend(details) };
        case OperationType.LockRelease:
            return { [type]: parseLockRelease(details) };
        default:
            return decoded as UnknownOperation;
    }
}

/**
 * Decode a single Unscoped Token Update operation from CBOR.
 *
 * @param cbor CBOR encoding of a single Unscoped Token Update operation.
 * @returns the decoded operation, or {@linkcode UnknownOperation} for unrecognised types.
 *
 * @example
 * const op = decodeOperation(cbor);
 * switch (true) {
 *   case OperationType.TokenTransfer in op: {
 *     const details = op[OperationType.TokenTransfer];
 *     console.log(details.token, details.amount);
 *     break;
 *   }
 *   case OperationType.LockCreate in op:
 *     console.log(op[OperationType.LockCreate]);
 *     break;
 *   default:
 *     console.warn('Unknown operation', op);
 * }
 */
export function decodeOperation(cbor: Cbor.Type): Operation | UnknownOperation {
    return parseOperation(Cbor.decode(cbor));
}

/**
 * Decode a list of Unscoped Token Update operations from CBOR.
 *
 * @param cbor CBOR encoding of an Unscoped Token Update operation array.
 * @returns the decoded operations.
 *
 * @example
 * const ops = decodeOperations(cbor);
 * ops.forEach(op => {
 *   switch (true) {
 *     case OperationType.LockFund in op:
 *       console.log(op[OperationType.LockFund].lock);
 *       break;
 *     default:
 *       console.warn('Unknown operation', op);
 *   }
 * });
 */
export function decodeOperations(cbor: Cbor.Type): (Operation | UnknownOperation)[] {
    const decoded = Cbor.decode(cbor);
    if (!Array.isArray(decoded))
        throw new Error(
            `Invalid unscoped token update operations: ${JSON.stringify(decoded)}. Expected a list of operations.`
        );
    return decoded.map(parseOperation);
}

/**
 * Decode the operations in a {@linkcode UnscopedTokenUpdatePayload} from CBOR into typed operations.
 *
 * @param payload the Unscoped Token Update payload to parse.
 * @returns the payload with decoded operations.
 *
 * @example
 * const parsed = parseUnscopedTokenUpdatePayload(encodedPayload);
 * parsed.operations.forEach(op => {
 *   switch (true) {
 *     case OperationType.TokenTransfer in op:
 *       console.log(op[OperationType.TokenTransfer].amount);
 *       break;
 *     default:
 *       console.warn('Unknown operation', op);
 *   }
 * });
 */
export function parseUnscopedTokenUpdatePayload(payload: UnscopedTokenUpdatePayload): Omit<
    UnscopedTokenUpdatePayload,
    'operations'
> & {
    operations: (Operation | UnknownOperation)[];
} {
    return { ...payload, operations: decodeOperations(payload.operations) };
}
