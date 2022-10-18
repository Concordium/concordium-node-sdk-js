import { Buffer } from 'buffer/';
import { VerifyKey } from '.';
import {
    ConfigureDelegationPayload,
    DelegationTarget,
    DelegationTargetType,
} from './types';
import {
    SizeLength,
    ULeb128Type,
    ILeb128Type,
    ByteListType,
    ByteArrayType,
} from './deserializeSchema';
const MAX_UINT_64 = 18446744073709551615n; // 2^64 - 1
import { DataBlob } from './types/DataBlob';

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
 * @returns little endian serialization of the input
 */
export function encodeInt128LE(value: bigint): Buffer {
    if (
        value < -170141183460469231731687303715884105728n ||
        value > 170141183460469231731687303715884105727n
    ) {
        throw new Error(
            'The input has to be a 128 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(16);
    const view = new DataView(arr);
    const byteOffset = 0;
    const res = splitUInt128toUInt64LE(value);
    view.setBigInt64(byteOffset, res.left, true);
    view.setBigInt64(byteOffset + 8, res.right, true);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 128 bit unsigned integer to a Buffer using big endian.
 * @param value a 128 bit integer
 * @returns little endian serialization of the input
 */
export function encodeWord128LE(value: bigint): Buffer {
    if (value > 340282366920938463463374607431768211455n || value < 0n) {
        throw new Error(
            'The input has to be a 128 bit unsigned integer but it was: ' +
                value
        );
    }
    const arr = new ArrayBuffer(16);
    const view = new DataView(arr);
    const byteOffset = 0;
    const res = splitUInt128toUInt64LE(value);
    view.setBigUint64(byteOffset, res.left, true);
    view.setBigUint64(byteOffset + 8, res.right, true);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 64 bit signed integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns serialization of the input
 */
export function encodeInt64(value: bigint, useLittleEndian = false): Buffer {
    if (value > 9223372036854775807n || value < -9223372036854775808n) {
        throw new Error(
            'The input has to be a 64 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigInt64(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a boolean to a Buffer using big endian.
 * @param value a boolean value
 * @returns boolean serialization of the input
 */
export function encodeBool(value: boolean): Buffer {
    const result = value === true ? 1 : 0;
    const arr = new ArrayBuffer(1);
    const view = new DataView(arr);
    view.setInt8(0, result);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 64 bit unsigned integer to a Buffer using big endian.
 * @param value a 64 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord64(value: bigint, useLittleEndian = false): Buffer {
    if (value > 18446744073709551615n || value < 0n) {
        throw new Error(
            'The input has to be a 64 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(8);
    const view = new DataView(arr);
    view.setBigUint64(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 32 bit signed integer to a Buffer using big endian.
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeInt32(value: number, useLittleEndian = false): Buffer {
    if (value < -2147483648 || value > 2147483647 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setInt32(0, value, useLittleEndian);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 32 bit unsigned integer to a Buffer.
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord32(value: number, useLittleEndian = false): Buffer {
    if (value > 4294967295 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 32 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(4);
    const view = new DataView(arr);
    view.setUint32(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 16 bit signed integer to a Buffer.
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeInt16(value: number, useLittleEndian = false): Buffer {
    if (value < -32768 || value > 32767 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit signed integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setInt16(0, value, useLittleEndian);
    return Buffer.from(new Int8Array(arr));
}

/**
 * Encodes a 16 bit unsigned integer to a Buffer using big endian.
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord16(value: number, useLittleEndian = false): Buffer {
    if (value > 65535 || value < 0 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 16 bit unsigned integer but it was: ' + value
        );
    }
    const arr = new ArrayBuffer(2);
    const view = new DataView(arr);
    view.setUint16(0, value, useLittleEndian);
    return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 8 bit signed integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeInt8(value: number): Buffer {
    if (value > 127 || value < -128 || !Number.isInteger(value)) {
        throw new Error(
            'The input has to be a 8 bit signed integer but it was: ' + value
        );
    }

    return Buffer.from(Buffer.of(value));
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

export function encodeWord16FromString(
    value: string,
    useLittleEndian = false
): Buffer {
    return encodeWord16(Number(value), useLittleEndian);
}

/**
 * Encodes a Datablob.
 * @param data Datablob containing data bytes.
 * @returns Buffer containing the length of the data and the data bytes.
 */
export function encodeDataBlob(blob: DataBlob): Buffer {
    const length = encodeWord16(blob.data.length);
    return Buffer.concat([length, blob.data]);
}

/**
 * Packing a buffer along with its length in 32 bits
 * @param buffer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns Buffer containing the 32 bit length of buffer and buffer.
 */
export function packBufferWithWord32Length(
    buffer: Buffer,
    useLittleEndian = false
): Buffer {
    const length = encodeWord32(buffer.length, useLittleEndian);
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
 * @param bigint 128 bit bigint value that needs to be split
 * @returns two 64 bit bigint values left and right
 * where left is most signficant bits
 * where right is least signficant bits
 */
function splitUInt128toUInt64LE(bigint: bigint): {
    left: bigint;
    right: bigint;
} {
    return {
        right: (bigint & (MAX_UINT_64 << 64n)) >> 64n,
        left: bigint & MAX_UINT_64,
    };
}

/**
 * Serialize fixed sized hex string to Buffer
 * @param schema Schema for the input
 * @param data user input
 * @returns Buffer containing serialization of the byte array
 */
export function serializeByteArray(
    schema: ByteArrayType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    data: any
): Buffer {
    if (typeof data !== 'string' && !(data instanceof String)) {
        throw new Error(
            `Invalid input for type ByteArray, must be a string containing a lowercase hex encoding of ${schema.size} bytes.`
        );
    }
    const buffer = Buffer.from(data.toString(), 'hex');
    if (buffer.length !== schema.size) {
        throw new Error(
            `Invalid input for type ByteArray, must be a string containing a lowercase hex encoding of ${schema.size} bytes.`
        );
    }
    return buffer;
}

/**
 * Serialize hex string to Buffer
 * @param schema Schema for the input
 * @param data user input
 * @returns Buffer containing serialization of the byte list
 */
export function serializeByteList(
    schema: ByteListType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    data: any
): Buffer {
    if (typeof data !== 'string' && !(data instanceof String)) {
        throw new Error(
            'Invalid input for type ByteArray, must be a string containing a lowercase hex encoding of bytes.'
        );
    }
    const bytes = Buffer.from(data.toString(), 'hex');
    const listLengthBuffer = serializeLength(bytes.length, schema.sizeLength);
    return Buffer.concat([listLengthBuffer, bytes]);
}

/**
 * Serialize a string with an unsigned integer using LEB128 to a Buffer.
 * @param uleb128Type type of parameters
 * @param data user input
 * @returns Buffer containing serialization of unsigned integer
 */
export function serializeULeb128(
    uleb128Type: ULeb128Type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    data: any
): Buffer {
    if (typeof data !== 'string' && !(data instanceof String)) {
        throw new Error(
            'Invalid input for type ULeb128, must be a string containing an unsigned integer'
        );
    }
    let value = BigInt(data.toString());
    if (value < 0n) {
        throw new Error(
            'Invalid input for type ULeb128, must contain a positive value'
        );
    }
    const buffer: Buffer[] = [];
    for (let i = 0; i < uleb128Type.constraint; i++) {
        const byte = Number(BigInt.asUintN(7, value));
        value = value / 128n; // Note: this is integer division
        const lastByte = value === 0n;
        buffer.push(encodeWord8(lastByte ? byte : byte | 0b1000_0000));
        if (lastByte) {
            return Buffer.concat(buffer);
        }
    }
    throw new Error('Invalid LEB128 unsigned integer encoding');
}

/**
 * Serialize a string with a signed integer using LEB128 to a Buffer.
 * @param ileb128Type type of parameters
 * @param data user input
 * @returns Buffer containing serialization of unsigned integer
 */
export function serializeILeb128(
    ileb128Type: ILeb128Type,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    data: any
): Buffer {
    if (typeof data !== 'string' && !(data instanceof String)) {
        throw new Error(
            'Invalid input for type ULeb128, must be a string containing a signed integer'
        );
    }
    // Since BigInt does not support bitwise right shifting, the current workaround is to convert
    // the bigint to a string with the two-complement binary representation and split this into
    // chunks for the leb128 encoding.
    const value = BigInt(data.toString());
    const isNegative = value < 0;
    const unsignedBitString = value.toString(2);
    const totalBits = unsignedBitString.length;
    const totalBytes = Math.ceil(totalBits / 7);
    const binaryString = isNegative
        ? BigInt.asUintN(totalBytes * 7, value).toString(2)
        : unsignedBitString.padStart(totalBytes * 7, '0');

    if (totalBytes > ileb128Type.constraint) {
        throw new Error(
            `'Invalid LEB128 signed integer encoding, the encoding is constraint to at most ${ileb128Type.constraint} bytes`
        );
    }

    const buffer: Buffer[] = [];

    for (let i = 0; i < totalBytes; i++) {
        const startIndex = (totalBytes - i - 1) * 7;
        const valueBits = binaryString.substring(startIndex, startIndex + 7);
        const byte = parseInt(valueBits, 2);
        const isLastByte = !(i + 1 < totalBytes);
        buffer.push(
            encodeWord8(
                !isLastByte
                    ? byte | 0b1000_0000
                    : isNegative
                    ? byte | 0b0100_0000
                    : byte
            )
        );
    }

    return Buffer.concat(buffer);
}

/**
 *
 * @param length length of the values provided by the user
 * @param sizeLength sizeLength represented as an unsigned integer
 * @returns serialization of the length using the number of bytes specified by the sizeLength
 */

export function serializeLength(
    length: number,
    sizeLength: SizeLength
): Buffer {
    switch (sizeLength) {
        case SizeLength.U8:
            return encodeWord8(length);
        case SizeLength.U16:
            return encodeWord16(length, true);
        case SizeLength.U32:
            return encodeWord32(length, true);
        case SizeLength.U64:
            return encodeWord64(BigInt(length), true);
        default:
            throw new Error('Unknown SizeLength provided');
    }
}

/**
 * Makes a bitmap for transactions with optional payload fields, where each bit indicates whether a value is included or not.
 *
 * @param payload the payload to generate the bitmap for
 * @param fieldOrder the order the payload fields are serialized in. The order is represented in the bitmap from right to left, i.e index 0 of the order translates to first bit.
 *
 * @example
 * getPayloadBitmap<{test?: string; test2?: string}>({test2: 'yes'}, ['test', 'test2']) // returns 2 (00000010 as bits of UInt8)
 * getPayloadBitmap<{test?: string; test2?: string; test3?: number}>({test: 'yes', test3: 100}, ['test', 'test2', 'test3']) // returns 5 (00000101 as bits of UInt8)
 */
function getPayloadBitmap<T>(payload: T, fieldOrder: Array<keyof T>) {
    return fieldOrder
        .map((k) => payload[k])
        .reduceRight(
            // eslint-disable-next-line no-bitwise
            (acc, cur) => (acc << 1) | Number(cur !== undefined),
            0
        );
}

// Makes all properties of type T non-optional.
export type NotOptional<T> = {
    [P in keyof T]-?: T[P];
};

/**
 * Makes a type with keys from Object and values being functions that take values with types of respective original values, returning a Buffer or undefined.
 */
type SerializationSpec<T> = NotOptional<{
    [P in keyof T]: (v: T[P]) => Buffer | undefined;
}>;

export function isDefined<T>(v?: T): v is T {
    return v !== undefined;
}

/**
 * Given a specification describing how to serialize the fields of a payload of type T, this function produces a function
 * that serializes payloads of type T, returning a buffer of the serialized fields by order of occurance in serialization spec.
 */
const serializeFromSpec =
    <T>(spec: SerializationSpec<T>) =>
    (payload: T) => {
        const buffers = Object.keys(spec)
            .map((k) => {
                const v = payload[k as keyof T];
                const f = spec[k as keyof typeof spec] as (
                    x: typeof v
                ) => Buffer | undefined;
                return f(v);
            })
            .filter(isDefined);

        return Buffer.concat(buffers);
    };

/**
 * Takes a callback function taking 1 argument, returning a new function taking same argument, applying callback only if supplied argument is defined.
 */
export const orUndefined =
    <A, R>(fun: (v: A) => R) =>
    (v: A | undefined): R | undefined =>
        v !== undefined ? fun(v) : undefined;

function serializeDelegationTarget(target: DelegationTarget) {
    if (target.delegateType === DelegationTargetType.PassiveDelegation) {
        return encodeInt8(0);
    } else {
        return Buffer.concat([encodeInt8(1), encodeWord64(target.bakerId)]);
    }
}

export const configureDelegationSerializationSpec: SerializationSpec<ConfigureDelegationPayload> =
    {
        stake: orUndefined((x) => encodeWord64(x.microGtuAmount)),
        restakeEarnings: orUndefined(encodeBool),
        delegationTarget: orUndefined(serializeDelegationTarget),
    };

export const getSerializedConfigureDelegationBitmap = (
    payload: ConfigureDelegationPayload
): Buffer =>
    encodeWord16(
        getPayloadBitmap(
            payload,
            Object.keys(configureDelegationSerializationSpec) as Array<
                keyof ConfigureDelegationPayload
            >
        )
    );

export function serializeConfigureDelegationPayload(
    payload: ConfigureDelegationPayload
): Buffer {
    const bitmap = getSerializedConfigureDelegationBitmap(payload);
    const sPayload = serializeFromSpec(configureDelegationSerializationSpec)(
        payload
    );

    return Buffer.concat([bitmap, sPayload]);
}
