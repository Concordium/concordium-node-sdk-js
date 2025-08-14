import Big from 'big.js';
import { decode } from 'cbor2/decoder';
import { encode } from 'cbor2/encoder';

import { MAX_U64 } from '../../../src/constants.ts';
import { TokenAmount } from '../../../src/pub/plt.js';

describe('PLT TokenAmount', () => {
    test('Parses decimals correctly', () => {
        expect(TokenAmount.fromDecimal('1', 0)).toEqual(TokenAmount.create(1n, 0));
        expect(TokenAmount.fromDecimal('1.002', 3)).toEqual(TokenAmount.create(1002n, 3));
        expect(TokenAmount.fromDecimal('15.002456687544126548', 18)).toEqual(
            TokenAmount.create(15002456687544126548n, 18)
        );
    });

    test('Parses large decimal values correctly', () => {
        expect(() => TokenAmount.fromDecimal('1', 255)).toThrow(TokenAmount.Err.exceedsMaxValue());
        expect(
            TokenAmount.fromDecimal(
                '0.000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001',
                255
            )
        ).toEqual(TokenAmount.create(1n, 255));
    });

    test('Token amounts with invalid values throws', () => {
        expect(() => TokenAmount.create(-504n, 0)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.create(-504n, 1)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.fromDecimal(-504n, 0)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.fromDecimal(-504n, 1)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.create(MAX_U64 + 1n, 0)).toThrow(TokenAmount.Err.exceedsMaxValue());
        expect(() => TokenAmount.create(99999999999999999999999999n, 1)).toThrow(TokenAmount.Err.exceedsMaxValue());
        expect(() => TokenAmount.fromDecimal(MAX_U64 + 1n, 0)).toThrow(TokenAmount.Err.exceedsMaxValue());
        expect(() => TokenAmount.fromDecimal(99999999999999999999999999n, 1)).toThrow(
            TokenAmount.Err.exceedsMaxValue()
        );
    });

    test('Returns expected amount', () => {
        expect(TokenAmount.zero(0)).toEqual(TokenAmount.create(0n, 0));
    });

    test('JSON conversion works both ways', () => {
        const json: TokenAmount.JSON = { value: '123', decimals: 2 };
        expect(TokenAmount.fromJSON(json).toJSON()).toEqual(json);
    });

    test('Formats to string as expected', () => {
        expect(TokenAmount.create(1588n, 3).toString()).toEqual('1.588');
        expect(TokenAmount.create(1588n, 9).toString()).toEqual('0.000001588');
    });

    test('Returns correct decimal amount', () => {
        expect(TokenAmount.toDecimal(TokenAmount.create(1n, 0))).toEqual(Big('1'));
        expect(TokenAmount.toDecimal(TokenAmount.create(1000n, 6))).toEqual(Big('0.001'));
        expect(TokenAmount.toDecimal(TokenAmount.create(123456789n, 2))).toEqual(Big('1234567.89'));
    });

    test('TokenAmount constructor correctly rejects multiple seperators', () => {
        expect(() => TokenAmount.fromDecimal('10.000.000', 3)).toThrow(Error('[big.js] Invalid number'));
    });

    test('Equals checks for numeric equality, not object equality', () => {
        let a = TokenAmount.create(1n, 2);
        let b = TokenAmount.create(1n, 2);
        expect(TokenAmount.equals(a, b)).toBe(true);

        a = TokenAmount.create(1n, 2);
        b = TokenAmount.create(100n, 4);
        expect(TokenAmount.equals(a, b)).toBe(true);

        a = TokenAmount.create(123n, 2);
        b = TokenAmount.create(1230n, 3);
        expect(TokenAmount.equals(a, b)).toBe(true);

        a = TokenAmount.create(100n, 2);
        b = TokenAmount.create(101n, 2);
        expect(TokenAmount.equals(a, b)).toBe(false);
    });
});

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
        let originalAmount = TokenAmount.create(7500000n, 4);
        let encoded = TokenAmount.toCBOR(originalAmount);
        let decoded = TokenAmount.fromCBOR(encoded);

        expect(decoded.value).toBe(originalAmount.value);
        expect(decoded.decimals).toBe(originalAmount.decimals);
        expect(TokenAmount.toDecimal(decoded).toString()).toBe('750'); // 7500000 / 10^4 = 750

        originalAmount = TokenAmount.create(75n, 0);
        encoded = TokenAmount.toCBOR(originalAmount);
        decoded = TokenAmount.fromCBOR(encoded);

        expect(decoded.value).toBe(originalAmount.value);
        expect(decoded.decimals).toBe(originalAmount.decimals);
        expect(TokenAmount.toDecimal(decoded).toString()).toBe('75'); // 75 / 10^0 = 75
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
