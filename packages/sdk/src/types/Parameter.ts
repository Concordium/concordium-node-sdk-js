import { Buffer } from 'buffer/index.js';

import { checkParameterLength } from '../contractHelpers.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { deserializeTypeValue, serializeTypeValue } from '../schema.js';
import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import type { Base64String, HexString, SmartContractTypeValues } from '../types.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.Parameter;
/**
 * @deprecated
 */
export type Serializable = HexString;

/** Parameter for a smart contract entrypoint. */
class Parameter {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Internal buffer of bytes representing the parameter. */
        public readonly buffer: Uint8Array
    ) {}

    /**
     * Get a string representation of the parameter.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toHexString(this);
    }

    /**
     * Get a JSON-serializable representation of the parameter.
     * @returns {HexString} The JSON-serializable representation.
     */
    public toJSON(): HexString {
        return toHexString(this);
    }
}

/**
 * Converts a {@linkcode HexString} to a parameter.
 * @param {HexString} json The JSON representation of the parameter.
 * @returns {Parameter} The parameter.
 */
export function fromJSON(json: HexString): Parameter {
    return fromHexString(json);
}

/**
 * Unwraps {@linkcode Type} value
 * @deprecated Use the {@linkcode Parameter.toJSON} method instead.
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toHexString(value);
}

/** Parameter for a smart contract entrypoint. */
export type Type = Parameter;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Parameter {
    return value instanceof Parameter;
}

/**
 * Create an empty parameter.
 * @returns {Parameter} An empty parameter.
 */
export function empty(): Parameter {
    return fromBufferUnchecked(new ArrayBuffer(0));
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
    return fromBufferUnchecked(buffer);
}

/**
 * Create an unchecked parameter for a smart contract entrypoint.
 * It is up to the caller to ensure the buffer does not exceed the maximum number of bytes supported for a smart contract parameter.
 * @param {ArrayBuffer} buffer The buffer of bytes representing the parameter.
 * @returns {Parameter}
 */
export function fromBufferUnchecked(buffer: ArrayBuffer): Parameter {
    return new Parameter(new Uint8Array(buffer));
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
 * Convert a parameter into a buffer.
 * @param {Parameter} parameter The parameter to get the buffer from.
 * @returns {Uint8Array}
 */
export function toBuffer(parameter: Parameter): Uint8Array {
    return parameter.buffer;
}

/**
 * Create a parameter from a schema type and the corresponding schema value.
 * @param {SchemaType} schemaType The schema type for some parameter.
 * @param {unknown} value The parameter value fitting the schema type.
 * @returns {Parameter} A parameter of the provided value encoded using the schema type.
 */
export function fromSchemaType(schemaType: SchemaType, value: unknown): Parameter {
    const schemaBytes = serializeSchemaType(schemaType);
    return serializeTypeValue(value, schemaBytes);
}

/**
 * Create a parameter from a schema type and the corresponding schema value.
 * @param {Base64String} schemaBase64 The schema type for some parameter in base64.
 * @param {unknown} value The parameter value fitting the schema type.
 * @returns {Parameter} A parameter of the provided value encoded using the schema type.
 */
export function fromBase64SchemaType(schemaBase64: Base64String, value: unknown): Parameter {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return serializeTypeValue(value, schemaBytes);
}

/**
 * Parse a contract parameter using a schema type.
 * @param {Parameter} parameter The parameter.
 * @param {SchemaType} schemaType The schema type for the parameter.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaType(parameter: Parameter, schemaType: SchemaType): SmartContractTypeValues {
    const schemaBytes = serializeSchemaType(schemaType);
    return deserializeTypeValue(toBuffer(parameter), schemaBytes);
}

/**
 * Parse a contract parameter using a schema type.
 * @param {Parameter} parameter The parameter to parse.
 * @param {Base64String} schemaBase64 The schema type for the parameter encoded as Base64.
 * @returns {SmartContractTypeValues}
 */
export function parseWithSchemaTypeBase64(parameter: Parameter, schemaBase64: Base64String): SmartContractTypeValues {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return deserializeTypeValue(toBuffer(parameter), schemaBytes);
}

/**
 * Convert a smart contract parameter from its protobuf encoding.
 * @param {Proto.Parameter} parameter The parameter in protobuf.
 * @returns {Parameter} The parameter.
 */
export function fromProto(parameter: Proto.Parameter): Parameter {
    return fromBuffer(parameter.value);
}

/**
 * Convert a parameter into its protobuf encoding.
 * @param {Parameter} parameter The parameter.
 * @returns {Proto.Parameter} The protobuf encoding.
 */
export function toProto(parameter: Parameter): Proto.Parameter {
    return {
        value: parameter.buffer,
    };
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode Parameter.toJSON} method instead.
 * @param {Type} value - The parameter to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: Parameter): TypedJson<Serializable> {
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
