import { SchemaType, serializeSchemaType } from '../schemaTypes.js';
import { deserializeTypeValue } from '../schema.js';
import type {
    Base64String,
    HexString,
    SmartContractTypeValues,
} from '../types.js';

/** Return value from invoking a smart contract entrypoint. */
class ReturnValue {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal buffer of bytes representing the return type. */
        public readonly buffer: Uint8Array
    ) {}
}

/** Return value from invoking a smart contract entrypoint. */
export type Type = ReturnValue;

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
export function parseWithSchemaType(
    returnValue: ReturnValue,
    schemaType: SchemaType
): SmartContractTypeValues {
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
