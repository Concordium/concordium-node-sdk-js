import type { HexString } from '../types.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';

/**
 * Represents a hash of a block in the chain.
 */
class BlockHash {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal buffer of bytes representing the hash. */
        public readonly buffer: Uint8Array
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
    return new BlockHash(new Uint8Array(buffer));
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

/**
 * Get byte representation of a BlockHash.
 * @param {BlockHash} hash The block hash.
 * @returns {ArrayBuffer} Hash represented as bytes.
 */
export function toBuffer(hash: BlockHash): Uint8Array {
    return hash.buffer;
}

/**
 * Convert a block hash from its protobuf encoding.
 * @param {Proto.BlockHash} hash The protobuf encoding.
 * @returns {BlockHash}
 */
export function fromProto(hash: Proto.BlockHash): BlockHash {
    return fromBuffer(hash.value);
}

/**
 * Convert a block hash into its protobuf encoding.
 * @param {BlockHash} hash The block hash.
 * @returns {Proto.BlockHash} The protobuf encoding.
 */
export function toProto(hash: BlockHash): Proto.BlockHash {
    return {
        value: hash.buffer,
    };
}

/**
 * Construct a 'given' block hash input from a block hash.
 * @param {BlockHash} blockHash The given block hash.
 * @returns {Proto.BlockHashInput} The given block hash input.
 */
export function toBlockHashInput(blockHash: BlockHash): Proto.BlockHashInput {
    return {
        blockHashInput: { oneofKind: 'given', given: toProto(blockHash) },
    };
}
