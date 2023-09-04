import { Buffer } from 'buffer/';
import { HexString } from './types';

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
     * @throws If the buffer contains fewer bytes than being read.
     */
    public read(numBytes: number): Buffer {
        const end = this.cursor + numBytes;
        if (this.data.length < end) {
            throw new Error(
                `Failed to read ${numBytes} bytes from the cursor.`
            );
        }
        const data = Buffer.from(this.data.subarray(this.cursor, end));
        this.cursor += numBytes;
        return data;
    }

    public readUInt8(): number {
        const value = this.data.readUInt8(this.cursor);
        this.cursor += 1;
        return value;
    }
    public readUInt16LE(): number {
        const value = this.data.readUInt16LE(this.cursor);
        this.cursor += 2;
        return value;
    }
    public readUInt32LE(): number {
        const value = this.data.readUInt32LE(this.cursor);
        this.cursor += 4;
        return value;
    }
    public readBigUInt64LE(): bigint {
        const value = this.data.readBigUInt64LE(this.cursor);
        this.cursor += 8;
        return value.valueOf();
    }
    public readUInt16BE(): number {
        const value = this.data.readUInt16BE(this.cursor);
        this.cursor += 2;
        return value;
    }
    public readUInt32BE(): number {
        const value = this.data.readUInt32BE(this.cursor);
        this.cursor += 4;
        return value;
    }
    public readBigUInt64BE(): BigInt {
        const value = this.data.readBigUInt64BE(this.cursor);
        this.cursor += 8;
        return value;
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
