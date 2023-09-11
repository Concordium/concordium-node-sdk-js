import { HexString } from '.';

/**
 * Represents a hash of a block in the chain.
 */
class BlockHash {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal buffer of bytes representing the hash. */
        public buffer: ArrayBuffer
    ) {}
}

/**
 * Represents a hash of a block in the chain.
 */
export type Type = BlockHash;

/**
 * Create a BlockHash from a buffer of 32 bytes.
 * @param {ArrayBuffer} buffer Buffer containing 32 bytes for the hash.
 * @throws If the provided buffer does not contain exactly 32 bytes.
 * @returns {BlockHash}
 */
export function fromBuffer(buffer: ArrayBuffer): BlockHash {
    if (buffer.byteLength !== 32) {
        throw new Error(
            `Invalid transaction hash provided: Expected a buffer containing 32 bytes, instead got '${Buffer.from(
                buffer
            ).toString('hex')}'.`
        );
    }
    return new BlockHash(buffer);
}

/**
 * Create a BlockHash from a hex string.
 * @param {HexString} hex Hex encoding of block hash.
 * @throws If the provided hex encoding does not correspond to a buffer of exactly 32 bytes.
 * @returns {BlockHash}
 */
export function fromHexString(hex: HexString): BlockHash {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Hex encode a BlockHash.
 * @param {BlockHash} hash The block hash to encode.
 * @returns {HexString} String containing the hex encoding.
 */
export function toHexString(hash: BlockHash): HexString {
    return Buffer.from(hash.buffer).toString('hex');
}
