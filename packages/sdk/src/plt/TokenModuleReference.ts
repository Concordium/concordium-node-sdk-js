import { Buffer } from 'buffer/index.js';

import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js'; // TODO: needs new proto files...
import type { HexString } from '../types.js';

/**
 * The number of bytes used to represent a block hash.
 */
const MODULE_REF_BYTE_LENGTH = 32;
export type JSON = HexString;

/**
 * Reference to a protocol level token (PLT) module.
 */
class ModuleReference {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private readonly __type = 'PLT.ModuleReference';
    constructor(
        /** Internal field, buffer containing the 32 bytes for the module reference. */
        public readonly bytes: Uint8Array
    ) {}

    /**
     * Get a string representation of the module reference.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return Buffer.from(this.bytes).toString('hex');
    }

    /**
     * Get a JSON-serializable representation of the module reference. This is called implicitly when serialized with JSON.stringify.
     * @returns {HexString} The JSON representation.
     */
    public toJSON(): JSON {
        return this.toString();
    }
}

/**
 * Reference to a smart contract module.
 */
export type Type = ModuleReference;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is ModuleReference {
    return value instanceof ModuleReference;
}

/**
 * Create a ModuleReference from a buffer of 32 bytes.
 * @param {ArrayBuffer} buffer Buffer containing 32 bytes for the hash.
 * @throws If the provided buffer does not contain exactly 32 bytes.
 * @returns {ModuleReference} A module reference.
 */
export function fromBuffer(buffer: ArrayBuffer): ModuleReference {
    const hex = Buffer.from(buffer).toString('hex');
    if (buffer.byteLength !== MODULE_REF_BYTE_LENGTH) {
        throw new Error(
            'The provided moduleRef ' + hex + ' is invalid as module reference as it does not contain 32 bytes'
        );
    }
    return new ModuleReference(new Uint8Array(buffer));
}

/**
 * Create a ModuleReference from a hex string.
 * @param {HexString} moduleRef Hex encoding of the module reference.
 * @throws If the provided hex encoding does not correspond to a buffer of exactly 32 bytes.
 * @returns {ModuleReference} A module reference.
 */
export function fromHexString(moduleRef: HexString): ModuleReference {
    if (moduleRef.length !== MODULE_REF_BYTE_LENGTH * 2) {
        throw new Error('The provided moduleRef ' + moduleRef + ' is invalid as its length was not 64');
    }
    return new ModuleReference(new Uint8Array(Buffer.from(moduleRef, 'hex')));
}

/**
 * Get the module reference bytes encoded as hex.
 * @param {ModuleReference} moduleReference The module reference.
 * @returns {HexString} String with hex encoding.
 */
export function toHexString(moduleReference: ModuleReference): HexString {
    return moduleReference.toString();
}

/**
 * Converts a {@linkcode HexString} to a module reference.
 * @param {HexString} json The JSON representation of the module reference.
 * @returns {ModuleReference} The module reference.
 */
export function fromJSON(json: JSON): ModuleReference {
    return fromHexString(json);
}

/**
 * Convert module reference from its protobuf encoding.
 * @param {Proto.ModuleRef} moduleReference The module reference in protobuf.
 * @returns {ModuleReference} The module reference.
 */
export function fromProto(moduleReference: Proto.ModuleRef): ModuleReference {
    return fromBuffer(moduleReference.value);
}

/**
 * Convert module reference into its protobuf encoding.
 * @param {ModuleReference} moduleReference The module reference.
 * @returns {Proto.ModuleRef} The protobuf encoding.
 */
export function toProto(moduleReference: ModuleReference): Proto.ModuleRef {
    return {
        value: moduleReference.bytes,
    };
}

/**
 * Check if two module references are the same.
 * @param {ModuleReference} left
 * @param {ModuleReference} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: ModuleReference, right: ModuleReference): boolean {
    return left.bytes.every((byte, i) => right.bytes[i] === byte);
}
