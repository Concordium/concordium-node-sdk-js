import { decode } from 'cbor2/decoder';
import { encode } from 'cbor2/encoder';
import { Tag } from 'cbor2/tag';

import { CborMemo } from '../../../src/plt/index.js';

describe('PLT CborMemo', () => {
    it('should throw an error if content exceeds 256 bytes', () => {
        const content = 't'.repeat(257);
        expect(() => CborMemo.fromString(content)).toThrow(
            'Memo content exceeds the maximum allowed length of 256 bytes.'
        );
    });

    it('should create a CborMemo from a string', () => {
        const memo = CborMemo.fromString('test');
        expect(memo.content).toBeInstanceOf(Uint8Array);
    });

    it('should create a CborMemo from any value', () => {
        const memo = CborMemo.fromAny({ key: 'value' });
        expect(memo.content).toBeInstanceOf(Uint8Array);
    });

    it('should parse a CborMemo into the cbor-encoded value it contains', () => {
        let memo = CborMemo.fromString('test');
        expect(CborMemo.parse(memo)).toBe('test');

        const value = { one: 'two', three: 4 };
        memo = CborMemo.fromAny(value);
        expect(CborMemo.parse(memo)).toEqual(value);
    });

    it('should decode CBOR to a CborMemo', () => {
        const content = new Uint8Array([0x01, 0x02, 0x03]);
        const cbor = encode(new Tag(24, content));
        const memo = CborMemo.fromCBOR(cbor);
        expect(memo.content).toEqual(content);
    });

    it('should register a CBOR encoder for CborMemo', () => {
        CborMemo.registerCBOREncoder();
        const cleanup = CborMemo.registerCBORDecoder();

        const value = { test: 'this is a test' };
        const memo = CborMemo.fromAny(value);
        const encoded = encode(memo);
        const decoded = decode(encoded);

        expect(decoded).toEqual(memo);
        cleanup();
    });

    it('should register and unregister a CBOR decoder for tag 24', () => {
        const cleanup = CborMemo.registerCBORDecoder();
        const content = new Uint8Array([0x01, 0x02, 0x03]);
        const cbor = encode(new Tag(24, content));
        const decoded = decode(cbor);
        expect(CborMemo.instanceOf(decoded)).toBeTruthy();
        cleanup();
    });
});
