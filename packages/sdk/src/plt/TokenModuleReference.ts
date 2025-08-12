import { Buffer } from 'buffer/index.js';

import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import type { HexString } from '../types.js';

/**
 * The number of bytes used to represent a token module reference.
 */
const MODULE_REF_BYTE_LENGTH = 32;
export type JSON = HexString;

/**
 * Enum representing the types of errors that can occur with token module references.
 */
export enum ErrorType {
    /** Error type indicating the length of module reference is incorrect. */
    INCORRECT_LENGTH = 'INCORRECT_LENGTH',
}

/**
 * Custom error to represent issues with token module references.
 */
export class Err extends Error {
    private constructor(
        /** The {@linkcode ErrorType} of the error. Can be used as to distinguish different types of errors. */
        public readonly type: ErrorType,
        message: string
    ) {
        super(message);
        this.name = `TokenModuleReference.Err.${type}`;
    }

    /**
     * Creates a TokenModuleReference.Err indicating the length of module reference is incorrect.
     */
    public static incorrectLength(bytes: Uint8Array): Err {
        const hex = Buffer.from(bytes).toString('hex');
        return new Err(
            ErrorType.INCORRECT_LENGTH,
            `Token module reference ${hex} is invalid, as it must contain ${MODULE_REF_BYTE_LENGTH} bytes`
        );
    }
}

/**
 * Reference to a protocol level token (PLT) module.
 */
class ModuleReference {
    #nominal = true;

    /**
     * Constructs a new ModuleReference instance.
     * Validates that the value is exactly the accepted byte length.
     *
     * @throws {Err} If the value is not exactly 32 bytes.
     */
    constructor(
        /** Internal field, buffer containing the 32 bytes for the module reference. */
        public readonly bytes: Uint8Array
    ) {
        if (bytes.byteLength !== MODULE_REF_BYTE_LENGTH) {
            throw Err.incorrectLength(bytes);
        }
    }

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
 * @throws {Err} If the value is not exactly 32 bytes.
 */
export function fromBuffer(buffer: ArrayBuffer): ModuleReference {
    return new ModuleReference(new Uint8Array(buffer));
}

/**
 * Create a ModuleReference from a hex string.
 * @param {HexString} moduleRef Hex encoding of the module reference.
 * @throws If the provided hex encoding does not correspond to a buffer of exactly 32 bytes.
 * @returns {ModuleReference} A module reference.
 * @throws {Err} If the value is not exactly 32 bytes.
 */
export function fromHexString(moduleRef: HexString): ModuleReference {
    return fromBuffer(Buffer.from(moduleRef, 'hex'));
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
 * @throws {Err} If the value is not exactly 32 bytes.
 */
export function fromJSON(json: JSON): ModuleReference {
    return fromHexString(json);
}

/**
 * Convert module reference from its protobuf encoding.
 * @param {Proto.TokenModuleRef} moduleReference The module reference in protobuf.
 * @returns {ModuleReference} The module reference.
 * @throws {Err} If the value is not exactly 32 bytes.
 */
export function fromProto(moduleReference: Proto.TokenModuleRef): ModuleReference {
    return fromBuffer(moduleReference.value);
}

/**
 * Convert module reference into its protobuf encoding.
 * @param {ModuleReference} moduleReference The module reference.
 * @returns {Proto.TokenModuleRef} The protobuf encoding.
 */
export function toProto(moduleReference: ModuleReference): Proto.TokenModuleRef {
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
