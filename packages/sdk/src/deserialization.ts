import { getAccountTransactionHandler } from './accountTransactions.js';
import { Cursor } from './deserializationHelpers.js';
import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    isAccountTransactionType,
} from './types.js';

/**
 * Reads an unsigned 8-bit integer from the given {@link Cursor}.
 *
 * @param source input stream
 * @returns number from 0 to 255
 */
export function deserializeUint8(source: Cursor): number {
    return source.read(1).readUInt8(0);
}

function deserializeMap<K extends string | number | symbol, T>(
    serialized: Cursor,
    decodeSize: (size: Cursor) => number,
    decodeKey: (k: Cursor) => K,
    decodeValue: (t: Cursor) => T
): Record<K, T> {
    const size = decodeSize(serialized);
    const result = {} as Record<K, T>;
    for (let i = 0; i < size; i += 1) {
        const key = decodeKey(serialized);
        const value = decodeValue(serialized);
        result[key] = value;
    }
    return result;
}

/**
 * Deserializes account transaction signatures from a cursor.
 *
 * @param signatures - The cursor containing the serialized signature data.
 * @returns A map of credential indexes to credential signatures, where each credential signature maps key indexes to signature hex strings.
 */
export function deserializeAccountTransactionSignature(signatures: Cursor): AccountTransactionSignature {
    const decodeSignature = (serialized: Cursor) => {
        const length = serialized.read(2).readUInt16BE(0);
        return serialized.read(length).toString('hex');
    };
    const decodeCredentialSignatures = (serialized: Cursor) =>
        deserializeMap(serialized, deserializeUint8, deserializeUint8, decodeSignature);
    return deserializeMap(signatures, deserializeUint8, deserializeUint8, decodeCredentialSignatures);
}

/**
 * Deserializes an account transaction payload from a cursor.
 *
 * @param value - The cursor containing the serialized payload data.
 * @returns An object containing the transaction type and the deserialized payload.
 * @throws {Error} If the transaction type is not valid.
 */
export function deserializeAccountTransactionPayload(value: Cursor): {
    type: AccountTransactionType;
    payload: AccountTransactionPayload;
} {
    const type = deserializeUint8(value);
    if (!isAccountTransactionType(type)) {
        throw new Error('TransactionType is not a valid value: ' + type);
    }

    const accountTransactionHandler = getAccountTransactionHandler(type);
    const payload = accountTransactionHandler.deserialize(value);
    return { type, payload };
}
