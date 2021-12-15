import { Buffer } from 'buffer/';
import { VerifyKey } from '.';
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
 * Encodes a Datablob.
 * @param memo Datablob containing data bytes.
 * @returns Buffer containing the length of the data and the data bytes.
 */
export function encodeDataBlob(blob: DataBlob): Buffer {
    const length = encodeWord16(blob.data.length);
    return Buffer.concat([length, blob.data]);
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
