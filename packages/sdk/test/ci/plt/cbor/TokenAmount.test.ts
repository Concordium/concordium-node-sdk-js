import { Buffer } from 'buffer/index.js';
import { decode, encode } from 'cbor2';

import { TokenAmount } from '../../../../src/pub/plt.js';

describe('PLT TokenAmount CBOR', () => {
    test('CBOR encoding works correctly', () => {
        const amount = TokenAmount.create(1500000n, 6);
        const encoded = TokenAmount.toCBOR(amount);

        // Expected: Tag 4 (decimal fraction) with array [-6, 1500000]
        // c4 - Tag 4 (decimal fraction)
        // 82 - Array of size 2
        // 25 - Integer -6 (0x26 represents negative integer 6)
        // 1a - Integer follows (4 bytes)
        // 00 16 e3 60 - Integer 1500000
        const expected = Buffer.from(
            `
            c4 82
              25
              1a 00 16 e3 60
            `.replace(/\s/g, ''),
            'hex'
        );

        // Check that the encoded value matches our expectation
        expect(Buffer.from(encoded).toString('hex')).toEqual(expected.toString('hex'));

        // Simple decoding verification
        const decoded = TokenAmount.fromCBOR(encoded);
        expect(decoded.value).toBe(1500000n);
        expect(decoded.decimals).toBe(6);
    });

    test('CBOR decoding works correctly', () => {
        // Create a test amount with known values
        const originalAmount = TokenAmount.create(7500000n, 4);

        // Encode to CBOR
        const encoded = TokenAmount.toCBOR(originalAmount);

        // Decode from CBOR
        const decoded = TokenAmount.fromCBOR(encoded);

        // Verify the decoded amount matches the original
        expect(decoded.value).toBe(originalAmount.value);
        expect(decoded.decimals).toBe(originalAmount.decimals);
        expect(TokenAmount.toDecimal(decoded).toString()).toBe('750'); // 7500000 / 10^4 = 750
    });

    test('CBOR decoding with decoder registration', () => {
        // Register the TokenAmount decoder
        TokenAmount.registerCBOREncoder();
        const cleanup = TokenAmount.registerCBORDecoder();

        try {
            // Create a test amount
            const originalAmount = TokenAmount.create(1234567n, 3);

            // Encode directly with cbor2 library
            const encoded = encode(originalAmount);

            // Expected: Tag 4 (decimal fraction) with array [-3, 1234567]
            // c4 - Tag 4 (decimal fraction)
            // 82 - Array of size 2
            // 22 - Integer -3 (0x22 represents negative integer 3)
            // 1a - Integer follows (4 bytes)
            // 00 12 d6 87 - Integer 1234567
            const expected = Buffer.from(
                `
                c4 82
                  22
                  1a 00 12 d6 87
                `.replace(/\s/g, ''),
                'hex'
            );

            // Check that the encoded value matches our expectation
            // Note: In some CBOR implementations the exact byte representation might vary
            // while still being semantically equivalent, so this test might need adjustment
            expect(Buffer.from(encoded).toString('hex')).toEqual(expected.toString('hex'));

            // Decode directly with cbor2 library (should use our registered decoder)
            const decoded: TokenAmount.Type = decode(encoded);

            // Verify decoding works
            expect(decoded.value).toBe(1234567n);
            expect(decoded.decimals).toBe(3);
        } finally {
            // Clean up the registered decoder
            cleanup();
        }
    });
});
