import { Buffer } from 'buffer/';
import { encode as cborEncode } from 'cbor';

export function serializeMap<K extends string | number | symbol, T>(
    map: Record<K, T>,
    encodeSize: (size: number) => Buffer,
    encodeKey: (k: K) => Buffer,
    encodeValue: (t: T) => Buffer
): Buffer {
    const keys = Object.keys(map) as K[];
    const buffers = [encodeSize(keys.length)];
    keys.forEach((key: K) => {
        buffers.push(encodeKey(key));
        buffers.push(encodeValue(map[key]));
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
    if (value > 4294967295 || value < 0) {
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
 * Encodes a 8 bit unsigned integer to a Buffer using big endian.
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeUint8(value: number): Buffer {
    return Buffer.from(Buffer.of(value));
}

/**
 * Encodes a boolean in a Buffer.
 * @param value a boolean
 * @returns serialization of the input
 */
export function encodeBoolean(value: boolean): Buffer {
    return Buffer.from(Buffer.of(value ? 1 : 0));
}

/**
 * Encodes a string to a Buffer using CBOR encoding.
 * @param memo a string
 * @returns CBOR encoded serialization of the input
 */
export function encodeMemo(memo: string): Buffer {
    return Buffer.from(cborEncode(memo));
}

/**
 * Encodes a hex string to a Buffer.
 * @param memo a string
 * @returns serialization of the input
 */
export function encodeHexString(value: string): Buffer {
    return Buffer.from(value, 'hex');
}
