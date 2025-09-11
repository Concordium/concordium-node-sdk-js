import { Tag, decode, encode } from 'cbor2';

import { MAX_U64 } from '../../../src/constants.ts';
import { CborContractAddress } from '../../../src/pub/plt.ts';
import { ContractAddress } from '../../../src/types/index.js';

/**
 * Tests for CBOR contract address (tag 40919) encoding/decoding utilities.
 */
describe('PLT CborContractAddress', () => {
    test('create basic (no explicit subindex) and toString/toJSON', () => {
        const addr = CborContractAddress.create(42n);
        expect(addr.index).toBe(42n);
        expect(addr.subindex).toBe(0n); // default
        expect(addr.toString()).toBe('<42, 0>');
        expect(addr.toJSON()).toEqual({ index: 42n });
    });

    test('create with subindex and toJSON includes subindex', () => {
        const addr = CborContractAddress.create(42n, 7n);
        expect(addr.index).toBe(42n);
        expect(addr.subindex).toBe(7n);
        expect(addr.toJSON()).toEqual({ index: 42n, subindex: 7n });
        expect(addr.toString()).toBe('<42, 7>');
    });

    test('negative index rejected', () => {
        expect(() => CborContractAddress.create(-1n)).toThrow(/negative/i);
        expect(() => CborContractAddress.create(1n, -5n)).toThrow(/negative/i);
    });

    test('exceeds max value rejected', () => {
        const over = MAX_U64 + 1n;
        expect(() => CborContractAddress.create(over)).toThrow(/larger/);
        expect(() => CborContractAddress.create(1n, over)).toThrow(/larger/);
    });

    test('decimal values rejected', () => {
        expect(() => CborContractAddress.create(1.2)).toThrow();
        expect(() => CborContractAddress.create(1n, 3.2)).toThrow();
    });

    test('from/to ContractAddress conversion', () => {
        const ca = ContractAddress.create(10n, 5n);
        const wrapped = CborContractAddress.fromContractAddress(ca);
        expect(wrapped.index).toBe(10n);
        expect(wrapped.subindex).toBe(5n);
        const back = CborContractAddress.toContractAddress(wrapped);
        expect(back).toEqual(ca);
    });

    describe('CBOR tagged value (array form) encode/decode', () => {
        test('single byte encoding', () => {
            const addr = CborContractAddress.create(5n, 9n);
            const encoded = CborContractAddress.toCBOR(addr);
            const hex = Buffer.from(encoded).toString('hex');

            // Tag 40919 containing array with 2 values: uint(5) and uint(9)
            const expected = `d99fd7 82 0509`.replace(/\s/g, '');
            expect(hex).toEqual(expected);

            const rt = CborContractAddress.fromCBOR(encoded);
            expect(rt.index).toEqual(5n);
            expect(rt.subindex).toEqual(9n);
        });

        test('small values', () => {
            const addr = CborContractAddress.create(123n, 25n);
            const encoded = CborContractAddress.toCBOR(addr);
            const hex = Buffer.from(encoded).toString('hex');

            // Tag 40919 containing array with 2 values: uint(123) and uint(25)
            const expected = `d99fd7 82 187b 1819`.replace(/\s/g, '');
            expect(hex).toEqual(expected);

            const rt = CborContractAddress.fromCBOR(encoded);
            expect(rt.index).toEqual(123n);
            expect(rt.subindex).toEqual(25n);
        });

        test('large values', () => {
            const addr = CborContractAddress.create(MAX_U64, 25n);
            const encoded = CborContractAddress.toCBOR(addr);
            const hex = Buffer.from(encoded).toString('hex');

            // Tag 40919 containing array with 2 values: uint(uint64_max) and uint(25)
            const expected = `d99fd7 82 1bffffffffffffffff 1819`.replace(/\s/g, '');
            expect(hex).toEqual(expected);

            const rt = CborContractAddress.fromCBOR(encoded);
            expect(rt.index).toEqual(MAX_U64);
            expect(rt.subindex).toEqual(25n);
        });
    });

    describe('CBOR tagged value decode simple form (uint value)', () => {
        test('single byte encoding', () => {
            // Tag 40919 containing uint(5)
            const hex = `d99fd7 05`.replace(/\s/g, '');

            const decoded = CborContractAddress.fromCBOR(new Uint8Array(Buffer.from(hex, 'hex')));
            expect(decoded.index).toEqual(5n);
            expect(decoded.subindex).toEqual(0n);
        });

        test('small values', () => {
            // Tag 40919 containing uint(123)
            const hex = `d99fd7 187b`.replace(/\s/g, '');

            const decoded = CborContractAddress.fromCBOR(new Uint8Array(Buffer.from(hex, 'hex')));
            expect(decoded.index).toEqual(123n);
            expect(decoded.subindex).toEqual(0n);
        });

        test('large values', () => {
            // Tag 40919 containing uint(uint64_max)
            const hex = `d99fd7 1bffffffffffffffff`.replace(/\s/g, '');

            const decoded = CborContractAddress.fromCBOR(new Uint8Array(Buffer.from(hex, 'hex')));
            expect(decoded.index).toEqual(MAX_U64);
            expect(decoded.subindex).toEqual(0n);
        });
    });

    test('CBOR roundtrip without explicit subindex (defaults to 0)', () => {
        const addr = CborContractAddress.create(77n);
        const encoded = CborContractAddress.toCBOR(addr);
        const rt = CborContractAddress.fromCBOR(encoded);
        expect(rt.index).toBe(77n);
        expect(rt.subindex).toBe(0n);
    });

    test('register encoder & decoder with cbor2', () => {
        CborContractAddress.registerCBOREncoder();
        const cleanup = CborContractAddress.registerCBORDecoder();
        try {
            const addr = CborContractAddress.create(123n, 456n);
            const encoded = encode(addr); // automatic via registered encoder
            const decoded: CborContractAddress.Type = decode(encoded); // automatic via decoder
            expect(decoded.index).toBe(123n);
            expect(decoded.subindex).toBe(456n);
        } finally {
            cleanup();
        }
    });

    test('decoder rejects wrong tag', () => {
        // Manually craft CBOR with wrong tag: use tag 0 instead of 40919
        const malformed = encode(new Tag(123, [1, 2]));
        expect(() => CborContractAddress.fromCBOR(malformed)).toThrow(/expected tag 40919/);
    });

    test('decoder rejects malformed array length', () => {
        // Tag 40919 with array length 1
        // Build Tag manually by encoding [tag, contents]
        const malformed = encode(new Tag(40919, [1]));
        expect(() => CborContractAddress.fromCBOR(malformed)).toThrow(/expected uint value or tuple/);
    });

    test('decoder rejects non-numeric contents', () => {
        const malformed = encode(new Tag(40919, ['a', 'b']));
        expect(() => CborContractAddress.fromCBOR(malformed)).toThrow(/expected uint value/);
    });
});
