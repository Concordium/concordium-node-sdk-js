import { Buffer } from 'buffer/';
import { HexString } from './types';

export class Cursor {
    private cursor = 0;

    constructor(private data: Buffer) {}

    public static fromHex(data: HexString): Cursor {
        return new Cursor(Buffer.from(data, 'hex'));
    }

    /** Read a number of bytes from the cursor */
    public read(numBytes: number): Buffer {
        const data = Buffer.from(
            this.data.subarray(this.cursor, this.cursor + numBytes)
        );
        this.cursor += numBytes;

        return data;
    }

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
