import { Buffer } from 'buffer/index.js';

/**
 * Decodes an unsigned leb128 encoded value to bigint. Note that if buffer
 * that is provided does not _only_ contain the uleb128 encoded number an
 * error will be thrown.
 *
 * @param {Uint8Array} buffer - The buffer to decode
 *
 * @returns {bigint} the decoded bigint value.
 */
export const uleb128Decode = (buffer: Uint8Array): bigint => {
    const [bigint, index] = uleb128DecodeWithIndex(buffer);
    if (index !== buffer.length) {
        throw Error('The provided buffer did not contain just a single ULEB128 encoded number');
    }
    return bigint;
};

/**
 * Decodes an unsigned leb128 encoded value to bigint and returns it along
 * with the index of the end of the encoded uleb128 number + 1.
 *
 * @param {UInt8Array} bytes - The buffer to decode
 * @param {number} index - A non-negative index to decode at, defaults to 0
 *
 * @returns {[bigint, number]} the decoded bigint value and the index of
 * the end of the encoded uleb128 number + 1.
 */
export function uleb128DecodeWithIndex(bytes: Uint8Array, index = 0): [bigint, number] {
    if (bytes.length <= index) {
        throw Error(
            `The ULEB128 encoding was not valid: The passed bytes from index ${index} must at least contain a single byte`
        );
    }

    let acc = 0n;
    let nextIndex = index;

    // For each byte, get the value of the 7 least significant bits (byte & 0x7f) and add this to the accumulator (<< 7 * i)
    for (let i = index; i < bytes.length; i++) {
        nextIndex += 1;
        const byte = bytes[i];

        const c = BigInt(byte & 0x7f) << BigInt(7 * (i - index));
        acc += c;

        if ((byte & 0x80) === 0x00) {
            return [acc, nextIndex];
        }
    }

    throw Error('The ULEB128 encoding was not valid: Could not find end of number');
}

/**
 * Encodes a bigint value as unsigned leb128.
 *
 * @param {bigint} num - The `bigint` value to encode
 *
 * @returns {Buffer} the encoded value.
 */
export const uleb128Encode = (num: bigint): Buffer => {
    const res: number[] = [];
    let cursor = 0n; // Where to read from in the bit sequence

    while (true) {
        const next = cursor + 7n; // Next cursor position
        const value = (num >> cursor) & BigInt(0x7f); // Read 7 least significant bits of bit sequence from cursor (& 0x7f).

        if (num >> next === 0n) {
            // Value from next cursor position is 0, i.e. we've reached the end of the bit sequence.
            res.push(Number(value));
            break;
        }

        res.push(Number(value) | 0x80); // Add value to result, signaling more bytes to read (| 0x80).
        cursor = next;
    }

    return Buffer.from(res);
};
