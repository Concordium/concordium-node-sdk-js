import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import { deserializeTypeValue } from '../schema.js';
import type {
    Base64String,
    HexString,
    SmartContractTypeValues,
} from '../types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.ReturnValue;
type Serializable = HexString;

/** Return value from invoking a smart contract entrypoint. */
class ReturnValue extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;
    protected get serializable(): Serializable {
        return toHexString(this);
    }

    constructor(
        /** Internal buffer of bytes representing the return type. */
        public readonly buffer: Uint8Array
    ) {
        super();
    }
}

/** Return value from invoking a smart contract entrypoint. */
export type Type = ReturnValue;
export const instanceOf = (value: unknown): value is ReturnValue =>
    value instanceof ReturnValue;

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
 * @param {SchemaType} schemaType The schema type for the return value.
 * @param {ReturnValue} returnValue The return value.
 * @returns {SmartContractTypeValues}
 */
export function toSchemaType(
    schemaType: SchemaType,
    returnValue: ReturnValue
): SmartContractTypeValues {
    const schemaBytes = serializeSchemaType(schemaType);
    return deserializeTypeValue(returnValue.buffer, schemaBytes);
}

/**
 * Convert a return value into a more structured representation using a schema type.
 * @param {Base64String} schemaBase64 The schema type for the return value.
 * @param {ReturnValue} returnValue The return value.
 * @returns {SmartContractTypeValues}
 */
export function toBase64SchemaType(
    schemaBase64: Base64String,
    returnValue: ReturnValue
): SmartContractTypeValues {
    const schemaBytes = Buffer.from(schemaBase64, 'base64');
    return deserializeTypeValue(returnValue.buffer, schemaBytes);
}

/**
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(
    JSON_DISCRIMINATOR,
    fromHexString
);
