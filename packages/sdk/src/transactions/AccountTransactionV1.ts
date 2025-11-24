import { Buffer } from 'buffer/index.js';

import { deserializeAccountTransactionSignature } from '../deserialization.js';
import { Cursor } from '../deserializationHelpers.js';
import { AccountTransactionV0, Payload } from '../index.js';
import { serializeAccountTransactionSignature } from '../serialization.js';
import { SerializationSpec, encodeWord8, encodeWord16, getBitmap, serializeFromSpec } from '../serializationHelpers.js';
import { type AccountTransactionSignature } from '../types.js';
import { AccountAddress } from '../types/index.js';
import { orUndefined } from '../util.js';

type HeaderOptionals = {
    /**
     * An optional sponsor account for the transaction, which will pay for the transaction fee
     * associated with the transaction execution.
     */
    sponsor?: AccountAddress.Type;
};

/**
 * Describes the V1 account transaction header, which is an extension of {@linkcode AccountTransactionV0}s header
 * defining extra optional fields.
 */
export type Header = AccountTransactionV0.Header & HeaderOptionals;

/**
 * The signatures for {@linkcode AccountTransactionV1}.
 */
export type Signatures = {
    /**
     * The signatures on the transaction for the sender credential(s)
     */
    sender: AccountTransactionSignature;
    /**
     * The (optional) signatures on the transaction for the sponsor credential(s). These
     * _must_ be specified if the `sponsor` field on {@linkcode Header} is set.
     */
    sponsor?: AccountTransactionSignature;
};

/**
 * Describes the V1 account transaction format, which compared to the original account transaction format
 * is an extensible format defining extra optional transaction header fields.
 */
type AccountTransactionV1 = {
    /**
     * The signatures for V1 account transactions
     */
    signatures: Signatures;
    /**
     * The transaction header for the transaction which includes metadata required for execution
     * of any account transaction of the v1 format.
     */
    header: Header;
    /**
     * The transaction payload.
     */
    payload: Payload.Type;
};

/**
 * Describes the V1 account transaction format, which compared to the original account transaction format
 * is an extensible format defining extra optional transaction header fields.
 */
export type Type = AccountTransactionV1;

const headerSerializationSpec: SerializationSpec<HeaderOptionals> = { sponsor: orUndefined(AccountAddress.toBuffer) };

/**
 * Serializes the V1 account transaction header, including any optional fields.
 *
 * @param header - The V1 account transaction header to serialize, including base v0 fields and optional extensions (e.g., sponsor).
 * @returns The serialized header as a Uint8Array, consisting of the bitmap, v0 header, and optional field extensions.
 */
export function serializeHeader({ sponsor, ...v0 }: Header): Uint8Array {
    const options: HeaderOptionals = { sponsor };

    const bitmap = encodeWord16(getBitmap(options, ['sponsor']));
    const v0Header = AccountTransactionV0.serializeHeader(v0);
    const extension = Uint8Array.from(serializeFromSpec(headerSerializationSpec)(options));

    return Uint8Array.from(Buffer.concat([bitmap, v0Header, extension]));
}

/**
 * Serializes the signatures for a V1 account transaction, including sender and optional sponsor signatures.
 *
 * @param signatures - The sender and optional sponsor signatures to serialize.
 * @returns The serialized signatures as a Uint8Array.
 */
export function serializeSignatures(signatures: Signatures): Uint8Array {
    const sender = serializeAccountTransactionSignature(signatures.sender);
    const sponsor =
        signatures.sponsor !== undefined ? serializeAccountTransactionSignature(signatures.sponsor) : encodeWord8(0);
    return Uint8Array.from(Buffer.concat([sender, sponsor]));
}

/**
 * Serializes a complete V1 account transaction, including both header and payload.
 *
 * @param transaction - The V1 account transaction to serialize.
 * @returns The fully serialized transaction as a Uint8Array.
 */
export function serialize(transaction: AccountTransactionV1): Uint8Array {
    const signatures = serializeSignatures(transaction.signatures);
    const header = serializeHeader(transaction.header);
    const payload = Payload.serialize(transaction.payload);
    return Uint8Array.from(Buffer.concat([signatures, header, payload]));
}

const SPONSOR_MASK = 0x0001;
const VALIDATION_MASK = 0xffff - SPONSOR_MASK;

function deserializeBitmap(cursor: Cursor): number {
    const bitmap = cursor.read(2).readUInt16BE(0);
    if ((bitmap & VALIDATION_MASK) !== 0) throw new Error('Found unsupported bits in bitmap');
    return bitmap;
}

function deserializeHeaderOptions(cursor: Cursor, bitmap: number): HeaderOptionals {
    const optionals: HeaderOptionals = {};

    const hasSponsor = (bitmap & SPONSOR_MASK) !== 0;
    if (hasSponsor) optionals.sponsor = AccountAddress.fromBuffer(cursor.read(32));

    return optionals;
}

/**
 * Deserializes a V1 account transaction header from a buffer or cursor.
 *
 * @param value - The buffer or cursor containing the serialized header data.
 * @returns The deserialized V1 transaction header, including base fields and optional extensions.
 * @throws {Error} If the invoked with a buffer which is not fully consumed during deserialization.
 */
export function deserializeHeader(value: Cursor | ArrayBuffer): Header {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const bitmap = deserializeBitmap(cursor);
    const v0Header = AccountTransactionV0.deserializeHeader(cursor);
    const options = deserializeHeaderOptions(cursor, bitmap);

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction header did not exhaust the buffer');

    return { ...v0Header, ...options };
}

/**
 * Deserializes the signatures for a V1 account transaction from a buffer or cursor.
 *
 * @param value - The buffer or cursor containing the serialized signatures data.
 * @returns The deserialized sender and optional sponsor signatures.
 * @throws {Error} If the invoked with a buffer which is not fully consumed during deserialization.
 */
export function deserializeSignatures(value: Cursor | ArrayBuffer): Signatures {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const sender = deserializeAccountTransactionSignature(cursor);
    const hasSponsor = Boolean(cursor.peek(1).readUInt8(0));

    let sponsor: AccountTransactionSignature | undefined;
    if (hasSponsor) {
        sponsor = deserializeAccountTransactionSignature(cursor);
    } else {
        cursor.skip(1);
    }

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction signature did not exhaust the buffer');

    return { sender, sponsor };
}

/**
 * Deserializes a complete V1 account transaction from a buffer or cursor.
 *
 * @param value - The buffer or cursor containing the serialized transaction data.
 * @returns An object containing the deserialized signatures and transaction.
 * @throws {Error} If the invoked with a buffer which is not fully consumed during deserialization.
 */
export function deserialize(value: Cursor | ArrayBuffer): AccountTransactionV1 {
    const isRawBuffer = !(value instanceof Cursor);
    const cursor = isRawBuffer ? Cursor.fromBuffer(value) : value;

    const signatures = deserializeSignatures(cursor);
    const header = deserializeHeader(cursor);
    const payload = Payload.deserialize(cursor);

    if (isRawBuffer && cursor.remainingBytes.length !== 0)
        throw new Error('Deserializing the transaction did not exhaust the buffer');

    return { signatures, header, payload };
}
