import { Buffer } from 'buffer/';

/**
 * Decodes an unsigned leb128 encoded value to bigint.
 *
 * @param {Buffer} buffer - The buffer to decode
 *
 * @returns {bigint} the decoded bigint value.
 */
export const uleb128Decode = (buffer: Buffer): bigint => {
    return buffer.reduce(
        (result, byte, i) => result | (BigInt(byte & 0x7f) << BigInt(7 * i)), // For each byte, get the value of the 7 least significant bits (byte & 0x7f) and add this to the accumulator (<< 7 * i)
        0n
    );
};

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
