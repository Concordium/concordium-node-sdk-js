import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { Buffer } from 'buffer/index.js';
import { packBufferWithWord32Length } from '../serializationHelpers.js';
import type { HexString } from '../types.js';
import {
    TypedJson,
    TypedJsonDiscriminator,
    makeFromTypedJson,
} from './util.js';

/**
 * The number of bytes used to represent a block hash.
 */
const MODULE_REF_BYTE_LENGTH = 32;
/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ModuleReference;
type Serializable = HexString;

/**
 * Reference to a smart contract module.
 */
class ModuleReference {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Internal field, the module reference represented as a hex string. */
        public readonly moduleRef: HexString,
        /** Internal field, buffer containing the 32 bytes for the module reference. */
        public readonly decodedModuleRef: Uint8Array
    ) {}

    public toJSON(): string {
        return packBufferWithWord32Length(this.decodedModuleRef).toString(
            'hex'
        );
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
            'The provided moduleRef ' +
                hex +
                ' is invalid as module reference as it does not contain 32 bytes'
        );
    }
    return new ModuleReference(hex, new Uint8Array(buffer));
}

/**
 * Create a ModuleReference from a hex string.
 * @param {HexString} moduleRef Hex encoding of the module reference.
 * @throws If the provided hex encoding does not correspond to a buffer of exactly 32 bytes.
 * @returns {ModuleReference} A module reference.
 */
export function fromHexString(moduleRef: HexString): ModuleReference {
    if (moduleRef.length !== MODULE_REF_BYTE_LENGTH * 2) {
        throw new Error(
            'The provided moduleRef ' +
                moduleRef +
                ' is invalid as its length was not 64'
        );
    }
    return new ModuleReference(
        moduleRef,
        new Uint8Array(Buffer.from(moduleRef, 'hex'))
    );
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
        value: moduleReference.decodedModuleRef,
    };
}

/**
 * Check if two module references are the same.
 * @param {ModuleReference} left
 * @param {ModuleReference} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: ModuleReference, right: ModuleReference): boolean {
    return left.moduleRef === right.moduleRef;
}

const fromSerializable = (v: Serializable) => {
    const data = Buffer.from(v, 'hex');
    return fromBuffer(data);
};

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 *
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: ModuleReference): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: value.moduleRef,
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
    fromSerializable
);
