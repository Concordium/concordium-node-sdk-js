import { checkParameterLength } from '../contractHelpers.js';
import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import { serializeTypeValue } from '../schema.js';
import type { Base64String, HexString } from '../types.js';

/** Parameter for a smart contract entrypoint. */
class Parameter {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal buffer of bytes representing the parameter. */
        public readonly buffer: ArrayBuffer
    ) {}
}

/** Parameter for a smart contract entrypoint. */
export type Type = Parameter;

/**
 * Create an empty parameter.
 * @returns {Parameter} An empty parameter.
 */
export function empty(): Parameter {
    return new Parameter(new ArrayBuffer(0));
}

/**
 * Create a parameter for a smart contract entrypoint.
 * Ensuring the buffer does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {ArrayBuffer} buffer The buffer of bytes representing the parameter.
 * @throws If the provided buffer exceed the supported number of bytes for a smart contract.
 * @returns {Parameter}
 */
export function fromBuffer(buffer: ArrayBuffer): Parameter {
    checkParameterLength(buffer);
    return new Parameter(buffer);
}

/**
 * Create an unchecked parameter for a smart contract entrypoint.
 * It is up to the caller to ensure the buffer does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {ArrayBuffer} buffer The buffer of bytes representing the parameter.
 * @returns {Parameter}
 */
export function fromBufferUnchecked(buffer: ArrayBuffer): Parameter {
    return new Parameter(buffer);
}

/**
 * Create a parameter for a smart contract entrypoint from a hex string.
 * Ensuring the parameter does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {HexString} hex String with hex encoding of the parameter.
 * @throws If the provided parameter exceed the supported number of bytes for a smart contract.
 * @returns {Parameter}
 */
export function fromHexString(hex: HexString): Parameter {
    return fromBuffer(Buffer.from(hex, 'hex'));
}

/**
 * Convert a parameter into a hex string.
 * @param {Parameter} parameter The parameter to encode in a hex string.
 * @returns {HexString}
 */
export function toHexString(parameter: Parameter): HexString {
    return Buffer.from(parameter.buffer).toString('hex');
}

/**
 * Create a parameter from a schema type and the corresponding schema value.
 * @param {SchemaType} schemaType The schema type for some parameter.
 * @param {unknown} value The parameter value fitting the schema type.
 * @returns {Parameter} A parameter of the provided value encoded using the schema type.
 */
export function fromSchemaType(
    schemaType: SchemaType,
    value: unknown
): Parameter {
    const schemaBytes = serializeSchemaType(schemaType);
    return fromBuffer(serializeTypeValue(value, schemaBytes));
}

/**
 * Create a parameter from a schema type and the corresponding schema value.
 * @param {Base64String} schemaBase64 The schema type for some parameter in base64.
 * @param {unknown} value The parameter value fitting the schema type.
 * @returns {Parameter} A parameter of the provided value encoded using the schema type.
 */
export function fromBase64SchemaType(
    schemaBase64: Base64String,
    value: unknown
): Parameter {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return fromBuffer(serializeTypeValue(value, schemaBytes));
}
