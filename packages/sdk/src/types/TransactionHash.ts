import { Buffer } from 'buffer/index.js';

import type * as Proto from '../grpc-api/v2/concordium/types.js';
import type { HexString } from '../types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.TransactionHash;
/**
 * @deprecated
 */
export type Serializable = HexString;

/**
 * The number of bytes used to represent a transaction hash.
 */
const TRANSACTION_HASH_BYTE_LENGTH = 32;

/** Hash of a transaction. */
class TransactionHash {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Internal buffer with the hash. */
        public readonly buffer: Uint8Array
    ) {}

    /**
     * Get a string representation of the transaction hash.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the transaction hash.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} to a transaction hash.
 * @param {HexString} json The JSON representation of the transaction hash.
 * @returns {TransactionHash} The transaction hash.
 */
export function fromJSON(json: HexString): TransactionHash {
    return fromHexString(json);
}

/**
 * Unwraps {@linkcode Type} value
 * @deprecated Use the {@linkcode TransactionHash.toJSON} method instead.
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toHexString(value);
}

/** Hash of a transaction. */
export type Type = TransactionHash;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is TransactionHash {
    return value instanceof TransactionHash;
}

/**
 * Create a TransactionHash from a buffer.
 * @param {ArrayBuffer} buffer Bytes for the transaction hash. Must be exactly 32 bytes.
 * @throws If the provided buffer does not contain 32 bytes.
 * @returns {TransactionHash}
 */
export function fromBuffer(buffer: ArrayBuffer): TransactionHash {
    if (buffer.byteLength !== TRANSACTION_HASH_BYTE_LENGTH) {
        throw new Error(
            `Invalid transaction hash provided: Expected a buffer containing 32 bytes, instead got '${Buffer.from(
                buffer
            ).toString('hex')}'.`
        );
    }
    return new TransactionHash(new Uint8Array(buffer));
}

/**
 * Create a TransactionHash from a hex string.
 * @param {HexString} hex String with hex encoding of the transaction hash.
 * @throws if the encoding does not correspond to exactly 32 bytes.
 * @returns {TransactionHash}
 */
export function fromHexString(hex: HexString): TransactionHash {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Convert a transaction hash into a hex encoded string.
 * @param {TransactionHash} hash TransactionHash to convert to hex.
 * @returns {HexString} String with hex encoding.
 */
export function toHexString(hash: TransactionHash): HexString {
    return Buffer.from(hash.buffer).toString('hex');
}

/**
 * Get byte representation of a TransactionHash.
 * @param {TransactionHash} hash The transaction hash.
 * @returns {ArrayBuffer} Hash represented as bytes.
 */
export function toBuffer(hash: TransactionHash): Uint8Array {
    return hash.buffer;
}

/**
 * Convert a transaction hash from its protobuf encoding.
 * @param {Proto.TransactionHash} transactionHash The transaction hash in protobuf.
 * @returns {TransactionHash} The transaction hash.
 */
export function fromProto(transactionHash: Proto.TransactionHash): TransactionHash {
    return fromBuffer(transactionHash.value);
}

/**
 * Convert a transaction hash into its protobuf encoding.
 * @param {TransactionHash} transactionHash The transaction hash.
 * @returns {Proto.TransactionHash} The protobuf encoding.
 */
export function toProto(transactionHash: TransactionHash): Proto.TransactionHash {
    return {
        value: transactionHash.buffer,
    };
}

/**
 * Check if two transaction hashes are the same.
 * @param {TransactionHash} left
 * @param {TransactionHash} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: TransactionHash, right: TransactionHash): boolean {
    for (let i = 0; i < TRANSACTION_HASH_BYTE_LENGTH; i++) {
        if (left.buffer.at(i) !== right.buffer.at(i)) {
            return false;
        }
    }
    return true;
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode TransactionHash.toJSON} method instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: TransactionHash): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toHexString(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the {@linkcode fromJSON} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromHexString);
