import { TokenUpdatePayload } from '../types.js';
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

/**
 * Represents a token operation (found when decoding) unknown to the SDK.
 */
export type UnknownTokenOperation = { [key: string]: unknown };

function parseTransfer(details: unknown): TokenTransfer {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid transfer details: ${JSON.stringify(details)}. Expected an object.`);
    if (!('amount' in details) || !TokenAmount.instanceOf(details.amount))
        throw new Error(`Invalid transfer details: ${JSON.stringify(details)}. Expected 'amount' to be a TokenAmount`);
    if (!('recipient' in details) || !CborAccountAddress.instanceOf(details.recipient))
        throw new Error(
            `Invalid transfer details: ${JSON.stringify(details)}. Expected 'recipient' to be a TokenHolder`
        );
    if ('memo' in details && !(details.memo instanceof Uint8Array || CborMemo.instanceOf(details.memo)))
        throw new Error(
            `Invalid transfer details: ${JSON.stringify(details)}. Expected 'memo' to be Uint8Array | CborMemo`
        );
    return details as TokenTransfer;
}

function parseSupplyUpdate(details: unknown): TokenSupplyUpdate {
    if (typeof details !== 'object' || details === null) {
        throw new Error(`Invalid supply update details: ${JSON.stringify(details)}. Expected an object.`);
    }
    if (!('amount' in details) || !TokenAmount.instanceOf(details.amount))
        throw new Error(
            `Invalid supply update details: ${JSON.stringify(details)}. Expected 'amount' to be a TokenAmount`
        );
    return details as TokenSupplyUpdate;
}

function parseListUpdate(details: unknown): TokenListUpdate {
    if (typeof details !== 'object' || details === null)
        throw new Error(`Invalid list update details: ${JSON.stringify(details)}. Expected an object.`);
    if (!('target' in details) || !CborAccountAddress.instanceOf(details.target))
        throw new Error(
            `Invalid list update details: ${JSON.stringify(details)}. Expected 'target' to be a TokenHolder`
        );
    return details as TokenListUpdate;
}

function parseEmpty(details: unknown): {} {
    if (typeof details !== 'object' || details === null || Object.keys(details as object).length !== 0)
        throw new Error(`Invalid operation details: ${JSON.stringify(details)}. Expected empty object {}`);
    return details;
}

/**
 * Decode a single token operation from CBOR. Throws on invalid shapes, only returns Unknown variant when the key is unrecognized.
 */
function parseTokenOperation(decoded: unknown): TokenOperation | UnknownTokenOperation {
    if (typeof decoded !== 'object' || decoded === null)
        throw new Error(`Invalid token operation: ${JSON.stringify(decoded)}. Expected an object.`);

    const keys = Object.keys(decoded);
    if (keys.length !== 1)
        throw new Error(
            `Invalid token operation: ${JSON.stringify(decoded)}. Expected an object with a single key identifying the operation type.`
        );

    const type = keys[0];
    const details = (decoded as Record<string, unknown>)[type];
    switch (type) {
        case TokenOperationType.Transfer:
            return { [type]: parseTransfer(details) };
        case TokenOperationType.Mint:
            return { [type]: parseSupplyUpdate(details) };
        case TokenOperationType.Burn:
            return { [type]: parseSupplyUpdate(details) };
        case TokenOperationType.AddAllowList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.RemoveAllowList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.AddDenyList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.RemoveDenyList:
            return { [type]: parseListUpdate(details) };
        case TokenOperationType.Pause:
            return { [type]: parseEmpty(details) };
        case TokenOperationType.Unpause:
            return { [type]: parseEmpty(details) };
        default:
            return decoded as UnknownTokenOperation;
    }
}

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
    payload: TokenUpdatePayload
): Omit<TokenUpdatePayload, 'operations'> & { operations: (TokenOperation | UnknownTokenOperation)[] } {
    const operations = decodeTokenOperations(payload.operations);
    return { ...payload, operations };
}
