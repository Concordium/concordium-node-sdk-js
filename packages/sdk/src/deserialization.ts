import { getAccountTransactionHandler } from './accountTransactions.js';
import { Cursor } from './deserializationHelpers.js';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    isAccountTransactionType,
} from './types.js';
import * as AccountAddress from './types/AccountAddress.js';
import * as AccountSequenceNumber from './types/SequenceNumber.js';
import * as TransactionExpiry from './types/TransactionExpiry.js';

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

function deserializeAccountTransactionSignature(signatures: Cursor): AccountTransactionSignature {
    const decodeSignature = (serialized: Cursor) => {
        const length = serialized.read(2).readUInt16BE(0);
        return serialized.read(length).toString('hex');
    };
    const decodeCredentialSignatures = (serialized: Cursor) =>
        deserializeMap(serialized, deserializeUint8, deserializeUint8, decodeSignature);
    return deserializeMap(signatures, deserializeUint8, deserializeUint8, decodeCredentialSignatures);
}

function deserializeTransactionHeader(serializedHeader: Cursor): AccountTransactionHeader {
    const sender = AccountAddress.fromBuffer(serializedHeader.read(32));
    const nonce = AccountSequenceNumber.create(serializedHeader.read(8).readBigUInt64BE(0));
    // TODO: extract payloadSize and energyAmount?
    // energyAmount
    serializedHeader.read(8).readBigUInt64BE(0);
    // payloadSize
    serializedHeader.read(4).readUInt32BE(0);
    const expiry = TransactionExpiry.fromEpochSeconds(serializedHeader.read(8).readBigUInt64BE(0));
    return {
        sender,
        nonce,
        expiry,
    };
}

export function deserializeAccountTransaction(serializedTransaction: Cursor): {
    accountTransaction: AccountTransaction;
    signatures: AccountTransactionSignature;
} {
    const signatures = deserializeAccountTransactionSignature(serializedTransaction);

    const header = deserializeTransactionHeader(serializedTransaction);

    const transactionType = deserializeUint8(serializedTransaction);
    if (!isAccountTransactionType(transactionType)) {
        throw new Error('TransactionType is not a valid value: ' + transactionType);
    }
    const accountTransactionHandler = getAccountTransactionHandler(transactionType);
    const payload = accountTransactionHandler.deserialize(serializedTransaction);

    return {
        accountTransaction: {
            type: transactionType,
            payload,
            header,
        },
        signatures,
    };
}
