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
        expect(addr.subindex).toBe(undefined);
        expect(addr.toString()).toBe('<42, 0>');
        expect(addr.toJSON()).toEqual({ index: 42n });
    });

    test('create with explicit subindex 0 and toString/toJSON', () => {
        const addr = CborContractAddress.create(42n, 0n);
        expect(addr.index).toBe(42n);
        expect(addr.subindex).toBe(undefined);
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
            const expected = `d99fd7 82 05 09`.replace(/\s/g, '');
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
            const addr = CborContractAddress.create(5n);
            const encoded = CborContractAddress.toCBOR(addr);
            const hex = Buffer.from(encoded).toString('hex');

            // Tag 40919 containing uint(5)
            const expected = `d99fd7 05`.replace(/\s/g, '');
            expect(hex).toEqual(expected);

            const decoded = CborContractAddress.fromCBOR(encoded);
            expect(decoded.index).toEqual(5n);
            expect(decoded.subindex).toEqual(undefined);
        });

        test('small values', () => {
            const addr = CborContractAddress.create(123n);
            const encoded = CborContractAddress.toCBOR(addr);
            const hex = Buffer.from(encoded).toString('hex');

            // Tag 40919 containing uint(123)
            const expected = `d99fd7 187b`.replace(/\s/g, '');
            expect(hex).toEqual(expected);

            const decoded = CborContractAddress.fromCBOR(encoded);
            expect(decoded.index).toEqual(123n);
            expect(decoded.subindex).toEqual(undefined);
        });

        test('large values', () => {
            const addr = CborContractAddress.create(MAX_U64);
            const encoded = CborContractAddress.toCBOR(addr);
            const hex = Buffer.from(encoded).toString('hex');

            // Tag 40919 containing uint(uint64_max)
            const expected = `d99fd7 1bffffffffffffffff`.replace(/\s/g, '');
            expect(hex).toEqual(expected);

            const decoded = CborContractAddress.fromCBOR(encoded);
            expect(decoded.index).toEqual(MAX_U64);
            expect(decoded.subindex).toEqual(undefined);
        });
    });

    test('CBOR roundtrip without explicit subindex', () => {
        const addr = CborContractAddress.create(77n);
        const encoded = CborContractAddress.toCBOR(addr);
        const rt = CborContractAddress.fromCBOR(encoded);
        expect(rt.index).toBe(77n);
        expect(rt.subindex).toBe(undefined);
    });

    test('CBOR roundtrip without explicit subindex 0', () => {
        const addr = CborContractAddress.create(77n, 0n);
        const encoded = CborContractAddress.toCBOR(addr);
        const rt = CborContractAddress.fromCBOR(encoded);
        expect(rt.index).toBe(77n);
        expect(rt.subindex).toBe(undefined);
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

    describe('fromCBOR preserves original structure', () => {
        test('no subindex', () => {
            // Tag 40919 containing uint(5)
            const hex = `d99fd7 05`.replace(/\s/g, '');
            const decoded = CborContractAddress.fromCBOR(Buffer.from(hex, 'hex'));

            expect(decoded.index).toBe(5n);
            expect(decoded.subindex).toBe(undefined);
        });

        test('explicit 0 subindex', () => {
            // Tag 40919 containing array with 2 values: uint(5) and uint(0)
            const hex = `d99fd7 82 05 00`.replace(/\s/g, '');
            const decoded = CborContractAddress.fromCBOR(Buffer.from(hex, 'hex'));

            expect(decoded.index).toBe(5n);
            expect(decoded.subindex).toBe(0n);
        });
    });

    describe('fromJSON preserves original structure', () => {
        test('no subindex', () => {
            const json = { index: '5' } as unknown as CborContractAddress.JSON;
            const parsed = CborContractAddress.fromJSON(json);

            expect(parsed.index).toBe(5n);
            expect(parsed.subindex).toBe(undefined);
        });

        test('explicit 0 subindex', () => {
            const json = { index: '5', subindex: '0' } as unknown as CborContractAddress.JSON;
            const parsed = CborContractAddress.fromJSON(json);

            expect(parsed.index).toBe(5n);
            expect(parsed.subindex).toBe(0n);
        });
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
