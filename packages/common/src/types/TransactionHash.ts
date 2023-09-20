import type { HexString } from '../types.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';

/** Hash of a transaction. */
class TransactionHash {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal buffer with the hash. */
        public readonly buffer: Uint8Array
    ) {}
}

/** Hash of a transaction. */
export type Type = TransactionHash;

/**
 * Create a TransactionHash from a buffer.
 * @param {ArrayBuffer} buffer Bytes for the transaction hash. Must be exactly 32 bytes.
 * @throws If the provided buffer does not contain 32 bytes.
 * @returns {TransactionHash}
 */
export function fromBuffer(buffer: ArrayBuffer): TransactionHash {
    if (buffer.byteLength !== 32) {
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

export function fromProto(hash: Proto.TransactionHash): TransactionHash {
    return fromBuffer(hash.value);
}

export function toProto(hash: TransactionHash): Proto.TransactionHash {
    return {
        value: hash.buffer,
    };
}
