import { Buffer } from 'buffer/index.js';
import type { HexString } from '../types.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';
import {
    TypedJson,
    TypedJsonDiscriminator,
    makeFromTypedJson,
} from './util.js';

// IMPORTANT:
// When adding functionality to this module, it is important to not change the wrapper class, as changing this might break compatibility
// between different versions of the SDK, e.g. if a dependency exposes an API that depends on the class and a class from a different version
// of the SDK is passed.

/**
 * The number of bytes used to represent a block hash.
 */
const BLOCK_HASH_BYTE_LENGTH = 32;
/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.BlockHash;
export type Serializable = HexString;

/**
 * Represents a hash of a block in the chain.
 */
class BlockHash {
    private typedJsonType = JSON_DISCRIMINATOR;

    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The internal buffer of bytes representing the hash. */
        public readonly buffer: Uint8Array
    ) {}
}

/**
 * Unwraps {@linkcode Type} value
 *
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toHexString(value);
}

/**
 * Represents a hash of a block in the chain.
 */
export type Type = BlockHash;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is BlockHash {
    return value instanceof BlockHash;
}

/**
 * Create a BlockHash from a buffer of 32 bytes.
 * @param {ArrayBuffer} buffer Buffer containing 32 bytes for the hash.
 * @throws If the provided buffer does not contain exactly 32 bytes.
 * @returns {BlockHash}
 */
export function fromBuffer(buffer: ArrayBuffer): BlockHash {
    if (buffer.byteLength !== BLOCK_HASH_BYTE_LENGTH) {
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

/**
 * Check if two transaction hashes are the same.
 * @param {BlockHash} left
 * @param {BlockHash} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: BlockHash, right: BlockHash): boolean {
    for (let i = 0; i < BLOCK_HASH_BYTE_LENGTH; i++) {
        if (left.buffer.at(i) !== right.buffer.at(i)) {
            return false;
        }
    }
    return true;
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 *
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: BlockHash): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toHexString(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(
    JSON_DISCRIMINATOR,
    fromHexString
);
