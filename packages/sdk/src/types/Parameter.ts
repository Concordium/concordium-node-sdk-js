import { checkParameterLength } from '../contractHelpers.js';
import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import { serializeTypeValue } from '../schema.js';
import type { Base64String, HexString } from '../types.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_TYPE = TypedJsonDiscriminator.Parameter;
type Serializable = HexString;

/** Parameter for a smart contract entrypoint. */
class Parameter extends TypeBase<Serializable> {
    protected typedJsonType = JSON_TYPE;
    protected get serializableJsonValue(): Serializable {
        return toHexString(this);
    }

    constructor(
        /** Internal buffer of bytes representing the parameter. */
        public readonly buffer: Uint8Array
    ) {
        super();
    }
}

/** Parameter for a smart contract entrypoint. */
export type Type = Parameter;

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
export function fromSchemaType(
    schemaType: SchemaType,
    value: unknown
): Parameter {
    const schemaBytes = serializeSchemaType(schemaType);
    return serializeTypeValue(value, schemaBytes);
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
    return serializeTypeValue(value, schemaBytes);
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
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {JsonString} json - The JSON string to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(JSON_TYPE, fromHexString);
