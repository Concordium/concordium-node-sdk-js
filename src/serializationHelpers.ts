import { Buffer } from 'buffer/';
import { VerifyKey } from '.';
import {
    ParameterType,
    SMParameter,
    SMStruct,
    SMArray,
    SMTypes,
    SMPrimitiveTypes,
} from './types';
import { Memo } from './types/Memo';

export function serializeMap<K extends string | number | symbol, T>(
    map: Record<K, T>,
    encodeSize: (size: number) => Buffer,
    encodeKey: (k: string) => Buffer,
    encodeValue: (t: T) => Buffer
): Buffer {
    const keys = Object.keys(map);
    const buffers = [encodeSize(keys.length)];
    keys.forEach((key) => {
        buffers.push(encodeKey(key));
        buffers.push(encodeValue(map[key as K]));
    });
    return Buffer.concat(buffers);
}

export function serializeList<T>(
    list: T[],
    putSize: (size: number) => Buffer,
    putMember: (t: T) => Buffer
): Buffer {
    const buffers = [putSize(list.length)];
    list.forEach((member: T) => {
        buffers.push(putMember(member));
    });
    return Buffer.concat(buffers);
}

/**
 * Encodes a 128 bit signed integer to a Buffer using big endian.
 * @param value a 128 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWordI128(value: bigint): Buffer {
    if (value > -18446744073709551616n || value < 18446744073709551615n) {
        throw new Error(
            'The input has to be a 128 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 128 bit unsigned integer to a Buffer using big endian.
 * @param value a 128 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord128(value: bigint): Buffer {
    if (value > 170141183460469231731687303715884105728n || value < 0n) {
        throw new Error(
            'The input has to be a 128 bit unsigned integer but it was: ' +
            value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 64 bit signed integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWordI64(value: bigint): Buffer {
    if (value > -4294967296n || value < 4294967295n) {
        throw new Error(
            'The input has to be a 64 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigInt64(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a boolean to a Buffer using big endian.
 * @param value a boolean value
 * @returns boolean serialization of the input
 */
export function encodeBool(value: boolean): Buffer {
    const result = value === true ? 1 : 0;
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt8(0, result);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 64 bit unsigned integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord64(value: bigint): Buffer {
    if (value > 9223372036854775807n || value < 0n) {
        throw new Error(
            'The input has to be a 64 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 32 bit signed integer to a Buffer using big endian.
 * @param value a 32 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWordI32(value: number): Buffer {
    if (value > -2147483648 || value < 2147483647 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, value, false);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 32 bit unsigned integer to a Buffer using big endian.
 * @param value a 32 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord32(value: number): Buffer {
    if (value > 4294967295 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 16 bit signed integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWordI16(value: number): Buffer {
    if (value > -32768 || value < 32767 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, value, false);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 16 bit unsigned integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord16(value: number): Buffer {
    if (value > 65535 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, value, false);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 8 bit unsigned integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord8(value: number): Buffer {
    if (value > 255 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 8 bit unsigned integer but it was: ' + value
        );
    }
    return Buffer.from(Buffer.of(value));
}

export function encodeWord8FromString(value: string): Buffer {
    return encodeWord8(Number(value));
}

/**
 * Encodes a memo.
 * @param memo Memo containing the memo bytes.
 * @returns Buffer containing the length of the memo bytes and the memo bytes.
 */
export function encodeMemo(memo: Memo): Buffer {
    const length = encodeWord16(memo.memo.length);
    return Buffer.concat([length, memo.memo]);
}

/**
 * Packing a buffer along with its length in 64 bits
 * @param buffer
 * @returns Buffer containing the 64 bit length of buffer and buffer.
 */
export function packBufferWithWord64Length(buffer: Buffer): Buffer {
    const length = encodeWord64(BigInt(buffer.length));
    return Buffer.concat([length, buffer]);
}

/**
 * Packing a buffer along with its length in 32 bits
 * @param buffer
 * @returns Buffer containing the 32 bit length of buffer and buffer.
 */
export function packBufferWithWord32Length(buffer: Buffer): Buffer {
    const length = encodeWord32(buffer.length);
    return Buffer.concat([length, buffer]);
}

/**
 * Packing a buffer along the with offset of 16 bit length
 * @param buffer containing the buffer
 * @returns Buffer containing the length of the buffer of 16 bit and buffer.
 */
export function packBufferWithWord16Length(buffer: Buffer): Buffer {
    const length = encodeWord16(buffer.length);
    return Buffer.concat([length, buffer]);
}

/**
 * Convert string to byte array
 * @param utf-8 string
 * @returns Buffer
 */
export function encodeStringToByteArray(str: string): Buffer {
    const buffer = new Buffer(str, 'utf8');
    const length = encodeWord16(buffer.length);
    return Buffer.concat([length, buffer]);
}

enum SchemeId {
    Ed25519 = 0,
}

/**
 * Serializes a public key. The serialization includes the
 * scheme used for the key/
 * @param key the key to serialize
 * @returns the serialization of the key
 */
export function serializeVerifyKey(key: VerifyKey): Buffer {
    const scheme = key.schemeId as keyof typeof SchemeId;
    let schemeId;
    if (SchemeId[scheme] !== undefined) {
        schemeId = SchemeId[scheme];
    } else {
        throw new Error(`Unknown key type: ${scheme}`);
    }
    const keyBuffer = Buffer.from(key.verifyKey, 'hex');
    const serializedScheme = encodeWord8(schemeId);
    return Buffer.concat([serializedScheme, keyBuffer]);
}

/**
 * Serializes a year and month string.
 * @param yearMonth year and month formatted as "YYYYMM"
 * @returns the serialization of the year and month string
 */
export function serializeYearMonth(yearMonth: string): Buffer {
    const year = parseInt(yearMonth.substring(0, 4), 10);
    const month = parseInt(yearMonth.substring(4, 6), 10);
    const serializedYear = encodeWord16(year);
    const serializedMonth = encodeWord8(month);
    return Buffer.concat([serializedYear, serializedMonth]);
}

/**
 *Check weather the type is fixed length
 * @param {ParameterType} type type of parameter
 * @returns {boolean} return true if the type is fixed length
 */
function isFixedType(type: ParameterType): boolean {
    return type == ParameterType.U8 ||
        type == ParameterType.I8 ||
        type == ParameterType.U16 ||
        type == ParameterType.I16 ||
        type == ParameterType.U32 ||
        type == ParameterType.I32 ||
        type == ParameterType.U64 ||
        type == ParameterType.I64 ||
        type == ParameterType.U128 ||
        type == ParameterType.I128 ||
        type == ParameterType.Bool;
}

/**
 *
 * @param parameter is array of parameters provided by the user
 * @returns Buffer of parameters
 */
export function serializeParameter(parameter: SMParameter<SMTypes>): Buffer {
    switch (parameter.type) {
        case ParameterType.U8:
            return encodeWord8((parameter as SMParameter<number>).value);
        case ParameterType.I8:
            return encodeWord8((parameter as SMParameter<number>).value);
        case ParameterType.U16:
            return encodeWord16((parameter as SMParameter<number>).value);
        case ParameterType.I16:
            return encodeWordI16((parameter as SMParameter<number>).value);
        case ParameterType.U32:
            return encodeWord32((parameter as SMParameter<number>).value);
        case ParameterType.I32:
            return encodeWordI32((parameter as SMParameter<number>).value);
        case ParameterType.U64:
            return encodeWord64((parameter as SMParameter<bigint>).value);
        case ParameterType.I64:
            return encodeWordI64((parameter as SMParameter<bigint>).value);
        case ParameterType.U128:
            return encodeWord128((parameter as SMParameter<bigint>).value);
        case ParameterType.I128:
            return encodeWordI128((parameter as SMParameter<bigint>).value);
        case ParameterType.Bool:
            return encodeBool((parameter as SMParameter<boolean>).value);
        case ParameterType.String:
            return Buffer.from((parameter as SMParameter<string>).value);
        case ParameterType.Struct:
            const bufferStruct: Buffer[] = [];
            (parameter.value as SMStruct).forEach((element) => {
                const parameterBuffer = serializeParameter(element);
                if (isFixedType(element.type)) {
                    bufferStruct.push(parameterBuffer);
                } else {
                    bufferStruct.push(packBufferWithWord32Length(parameterBuffer));
                }
            });
            return Buffer.concat(bufferStruct);
        case ParameterType.Array:
            const bufferArray: Buffer[] = [];
            const arrayType = (
                parameter.value as SMArray<SMPrimitiveTypes | SMStruct>
            ).type;
            (
                parameter.value as SMArray<SMPrimitiveTypes | SMStruct>
            ).value.forEach((element) => {
                const parameterBuffer = serializeParameter({
                    type: arrayType,
                    value: element,
                });
                if (isFixedType(arrayType)) {
                    bufferArray.push(parameterBuffer);
                } else {
                    bufferArray.push(packBufferWithWord32Length(parameterBuffer));
                }
            });
            return Buffer.concat(bufferArray);
        default:
            return Buffer.from([]);
    }
}
