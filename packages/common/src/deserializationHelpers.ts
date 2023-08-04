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
    constructor(private data: Buffer) {}

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
     * Read a number of bytes from the cursor
     *
     * @param {number} [numBytes] - Number of bytes to read. If not defined, the remaining data is read.
     */
    public read(numBytes?: number): Buffer {
        const n = numBytes ?? this.remainingBytes.length;
        const data = Buffer.from(
            this.data.subarray(this.cursor, this.cursor + n)
        );
        this.cursor += n;

        return data;
    }

    /** The remaining bytes, i.e. not including the bytes already read. */
    public get remainingBytes(): Buffer {
        return Buffer.from(this.data.subarray(this.cursor));
    }
}

/**
 * Helper function to create a function that deserializes a `HexString` value into a list of dynamic type values
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
