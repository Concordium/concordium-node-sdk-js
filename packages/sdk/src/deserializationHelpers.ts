import { Buffer } from 'buffer/index.js';

import { HexString } from './types.js';

/**
 * A wrapper around some data, which enables reading from the data without
 * having to keep track of what has already been read.
 */
export class Cursor {
    private cursor = 0;

    /**
     * Constructs a `Cursor`.
     *
     * @param {Buffer} data - the data
     */
    private constructor(private data: Buffer) {}

    /**
     * Constructs a `Cursor` from hex encoded data.
     *
     * @param {HexString} data - the (hex encoded) data
     *
     * @returns {Cursor} a Cursor wrapping the data
     */
    public static fromHex(data: HexString): Cursor {
        return new Cursor(Buffer.from(data, 'hex'));
    }

    /**
     * Constructs a `Cursor` from a buffer of bytes.
     *
     * @param {ArrayBuffer} buffer - the buffer containing bytes.
     *
     * @returns {Cursor} a Cursor wrapping the data.
     */
    public static fromBuffer(buffer: ArrayBuffer): Cursor {
        return new Cursor(Buffer.from(buffer));
    }

    /**
     * Read a number of bytes from the cursor.
     *
     * @param {number} [numBytes=this.remainingBytes.length] - The number of bytes to read. Defaults to the remaining bytes from the cursor position.
     *
     * @throws If the buffer contains fewer bytes than being read.
     *
     * @returns {Buffer} A buffer containing the number of bytes specified from the cursor position
     */
    public read(numBytes: number = this.remainingBytes.length): Buffer {
        const end = this.cursor + numBytes;
        if (this.data.length < end) {
            throw new Error(`Failed to read ${numBytes} bytes from the cursor.`);
        }
        const data = Buffer.from(this.data.subarray(this.cursor, end));
        this.cursor += numBytes;
        return data;
    }

    /** The remaining bytes, i.e. not including the bytes already read. */
    public get remainingBytes(): Buffer {
        return Buffer.from(this.data.subarray(this.cursor));
    }
}

/**
 * Represents function for deserilizing some value from a {@link Cursor}.
 * @template A The value to deserialize.
 */
export interface Deserializer<A> {
    (cursor: Cursor): A;
}

/**
 * Deserialize a single byte from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {number} The value of the single byte.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeUInt8(cursor: Cursor): number {
    return cursor.read(1).readUInt8(0);
}
/**
 * Deserialize a u16 little endian from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {number} The deserialized value.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeUInt16LE(cursor: Cursor): number {
    return cursor.read(2).readUInt16LE(0);
}
/**
 * Deserialize a u32 little endian from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {number} The deserialized value.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeUInt32LE(cursor: Cursor): number {
    return cursor.read(4).readUInt32LE(0);
}
/**
 * Deserialize a u64 little endian from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {bigint} The deserialized value.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeBigUInt64LE(cursor: Cursor): bigint {
    return cursor.read(8).readBigInt64LE(0).valueOf();
}

/**
 * Deserialize a u16 big endian from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {number} The deserialized value.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeUInt16BE(cursor: Cursor): number {
    return cursor.read(2).readUInt16BE(0);
}
/**
 * Deserialize a u32 big endian from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {number} The deserialized value.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeUInt32BE(cursor: Cursor): number {
    return cursor.read(4).readUInt32BE(0);
}
/**
 * Deserialize a u64 big endian from the cursor.
 * @param {Cursor} cursor Cursor over the data to deserialize from.
 * @returns {bigint} The deserialized value.
 * @throws If the buffer contains fewer bytes than being read.
 */
export function deserializeBigUInt64BE(cursor: Cursor): bigint {
    return cursor.read(8).readBigInt64BE(0).valueOf();
}

/**
 * Helper function to create a function that deserializes a `HexString` value received in a smart contract response into a list of dynamic type values
 * determined by the deserialization logic defined in the callback function.
 *
 * @param {Function} deserializer - A callback function invoked with a {@link Cursor} pointing to the remaining slice of the full value given by the `input`
 * The callback function is expected to return the deserialized value  of type `R`
 *
 * @returns {Function} A function taking a single `HexString` input, returning a list of dynamic type values deserialized according to the `deserializer` function.
 */
export const makeDeserializeListResponse =
    <R>(deserializer: (value: Cursor) => R) =>
    (value: HexString): R[] => {
        const cursor = Cursor.fromHex(value);
        const n = cursor.read(2).readUInt16LE(0);
        const values: R[] = [];

        for (let i = 0; i < n; i++) {
            const value = deserializer(cursor);
            values.push(value);
        }

        return values;
    };

/**
 * Helper function to create a function that deserializes a `HexString` value into either a value or a list of values,
 * depending on a given input value. The returned function will produce a single value if the input is not an array
 * or an array of length 1, and a list of values of the same length as the input if it is an array.
 *
 * @param {T} input - The input value to compare the deserialized value against.
 * @param {Function} deserializer - A deserialization function that takes a `HexString` value and returns a list of deserialized values.
 *
 * @returns {Function} A function taking a single `HexString` input, returning either a single value or a list of values.
 */
export const ensureMatchesInput =
    <T, R>(input: T, deserializer: (value: HexString) => R[]) =>
    (value: HexString): R[] | R => {
        const result = deserializer(value);
        const expectList = Array.isArray(input);
        const expectLength = expectList ? input.length : 1;

        if (result.length !== expectLength) {
            throw new Error(
                `Expected list with length ${expectLength} when deserializing response, received list with length ${result.length}`
            );
        }

        if (expectList) {
            return result;
        }

        return result[0];
    };
