import { Buffer } from 'buffer/index.js';

import { deserializeTypeValue } from '../schema.js';
import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import type { Base64String, HexString, SmartContractTypeValues } from '../types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ReturnValue;
/**
 * @deprecated
 */
export type Serializable = HexString;

/** Return value from invoking a smart contract entrypoint. */
class ReturnValue {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Internal buffer of bytes representing the return type. */
        public readonly buffer: Uint8Array
    ) {}

    /**
     * Get a string representation of the return value.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the return value.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} to a return value.
 * @param {HexString} json The JSON representation of the return value.
 * @returns {ReturnValue} The return value.
 */
export function fromJSON(json: HexString): ReturnValue {
    return fromHexString(json);
}

/**
 * Unwraps {@linkcode Type} value
 * @deprecated Use the {@linkcode ReturnValue.toJSON} method instead.
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toHexString(value);
}

/** Return value from invoking a smart contract entrypoint. */
export type Type = ReturnValue;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is ReturnValue {
    return value instanceof ReturnValue;
}

/**
 * Create an empty return value.
 * @returns {ReturnValue} An empty return value.
 */
export function empty(): ReturnValue {
    return fromBuffer(new ArrayBuffer(0));
}

/**
 * Create a return type from invoking a smart contract entrypoint.
 * @param {ArrayBuffer} buffer The buffer of bytes representing the return value.
 * @returns {ReturnValue}
 */
export function fromBuffer(buffer: ArrayBuffer): ReturnValue {
    return new ReturnValue(new Uint8Array(buffer));
}

/**
 * Create a return type from invoking a smart contract entrypoint from a hex string.
 * @param {HexString} hex The hex string representing the return value.
 * @returns {ReturnValue}
 */
export function fromHexString(hex: HexString): ReturnValue {
    return new ReturnValue(new Uint8Array(Buffer.from(hex, 'hex')));
}

/**
 * Convert a return value into a hex string.
 * @param {ReturnValue} returnValue The return value to encode in a hex string.
 * @returns {HexString} The return value encoded in hex.
 */
export function toHexString(returnValue: ReturnValue): HexString {
    return Buffer.from(returnValue.buffer).toString('hex');
}

/**
 * Convert a return value into a buffer.
 * @param {ReturnValue} parameter The return value to get the buffer from.
 * @returns {Uint8Array}
 */
export function toBuffer(parameter: ReturnValue): Uint8Array {
    return parameter.buffer;
}

/**
 * Convert a return value into a more structured representation using a schema type.
 * @param {ReturnValue} returnValue The return value.
 * @param {SchemaType} schemaType The schema type for the return value.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaType(returnValue: ReturnValue, schemaType: SchemaType): SmartContractTypeValues {
    const schemaBytes = serializeSchemaType(schemaType);
    return deserializeTypeValue(returnValue.buffer, schemaBytes);
}

/**
 * Convert a return value into a more structured representation using a schema type.
 * @param {ReturnValue} returnValue The return value.
 * @param {Base64String} schemaBase64 The schema type for the return value.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaTypeBase64(
    returnValue: ReturnValue,
    schemaBase64: Base64String
): SmartContractTypeValues {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return deserializeTypeValue(returnValue.buffer, schemaBytes);
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode ReturnValue.toJSON} method instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: ReturnValue): TypedJson<Serializable> {
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
