import { encode } from 'cbor2';

import { Cbor, TokenMetadataUrl } from '../../../src/pub/plt.js';

describe('TokenMetadataUrl', () => {
    it('should create a TokenMetadataUrl instance using the create function', () => {
        const url = 'https://example.com';
        const checksum = new Uint8Array(32);
        const additional = { field: 'value' };

        const tokenMetadataUrl = TokenMetadataUrl.create(url, checksum, additional);

        expect(tokenMetadataUrl.url).toBe(url);
        expect(tokenMetadataUrl.checksumSha256).toBe(checksum);
        expect(tokenMetadataUrl.additional).toEqual(additional);
    });

    it('should serialize and deserialize using JSON', () => {
        const url = 'https://example.com';
        const checksum = new Uint8Array(32);
        checksum.fill(1);
        const additional = { key: 'value' };

        let tokenMetadataUrl = TokenMetadataUrl.create(url, checksum, additional);
        const serialized = tokenMetadataUrl.toJSON();
        const expectedJson = {
            url,
            checksumSha256: Buffer.from(checksum).toString('hex'),
            _additional: { key: Cbor.encode(additional.key).toJSON() },
        };
        expect(serialized).toEqual(expectedJson);

        let deserialized = TokenMetadataUrl.fromJSON(serialized);
        expect(deserialized).toEqual(tokenMetadataUrl);

        tokenMetadataUrl = TokenMetadataUrl.create(url, checksum);
        deserialized = TokenMetadataUrl.fromJSON(tokenMetadataUrl.toJSON());
        expect(deserialized).toEqual(tokenMetadataUrl);

        tokenMetadataUrl = TokenMetadataUrl.create(url);
        deserialized = TokenMetadataUrl.fromJSON(tokenMetadataUrl.toJSON());
        expect(deserialized).toEqual(tokenMetadataUrl);
    });

    // This test ensures that we remain compatible with the different JSON formats used in the past.
    it('should deserialize from expected JSON format(s)', () => {
        const url = 'https://example.com';
        const checksum = new Uint8Array(32);
        checksum.fill(1);
        const additional = { key: 'value' };

        const expectedJson = {
            url,
            checksumSha256: Buffer.from(checksum).toString('hex'),
            _additional: { key: Cbor.encode(additional.key).toJSON() },
        };

        const tokenMetadataUrl = TokenMetadataUrl.fromJSON(expectedJson);
        expect(tokenMetadataUrl).toEqual(TokenMetadataUrl.create(url, checksum, additional));
    });

    it('should serialize and deserialize using CBOR', () => {
        const url = 'https://example.com';
        const checksum = new Uint8Array(32);
        checksum.fill(1);
        const additional = { key: 'value', another: 40 };

        let tokenMetadataUrl = TokenMetadataUrl.create(url, checksum, additional);
        let cbor = TokenMetadataUrl.toCBOR(tokenMetadataUrl);

        // a4 - Map of size 4
        // 63 6b6579 65 76616c7565 - key 'key', value 'value'
        // 63 75726c 73 68747470733a2f2f6578616d706c652e636f6d - key 'url', value 'https://example.com'
        // 67 616e6f74686572 18 28 - key 'another', value 40 (0x28)
        // 6e 636865636b73756d536861323536 5820 0101010101010101010101010101010101010101010101010101010101010101 - key 'checksumSha256', value 32-byte checksum
        let expectedCbor = Buffer.from(
            `
            a4
              63 6b6579 65 76616c7565
              63 75726c 73 68747470733a2f2f6578616d706c652e636f6d
              67 616e6f74686572 18 28
              6e 636865636b73756d536861323536 5820 0101010101010101010101010101010101010101010101010101010101010101
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(Buffer.from(cbor).toString('hex')).toEqual(expectedCbor.toString('hex'));

        let deserialized = TokenMetadataUrl.fromCBOR(cbor);
        expect(deserialized).toEqual(tokenMetadataUrl);

        tokenMetadataUrl = TokenMetadataUrl.create(url, checksum);
        cbor = TokenMetadataUrl.toCBOR(tokenMetadataUrl);

        // a2 - Map of size 2
        // 63 75726c 73 68747470733a2f2f6578616d706c652e636f6d - key 'url', value 'https://example.com'
        // 6e 636865636b73756d536861323536 5820 0101010101010101010101010101010101010101010101010101010101010101 - key 'checksumSha256', value 32-byte checksum
        expectedCbor = Buffer.from(
            `
            a2
              63 75726c 73 68747470733a2f2f6578616d706c652e636f6d
              6e 636865636b73756d536861323536 5820 0101010101010101010101010101010101010101010101010101010101010101
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(Buffer.from(cbor).toString('hex')).toEqual(expectedCbor.toString('hex'));

        deserialized = TokenMetadataUrl.fromCBOR(cbor);
        expect(deserialized).toEqual(tokenMetadataUrl);

        tokenMetadataUrl = TokenMetadataUrl.create(url);
        cbor = TokenMetadataUrl.toCBOR(tokenMetadataUrl);

        // a1 - Map of size 2
        // 63 75726c 73 68747470733a2f2f6578616d706c652e636f6d - key 'url', value 'https://example.com'
        expectedCbor = Buffer.from(
            `
            a1
              63 75726c 73 68747470733a2f2f6578616d706c652e636f6d
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(Buffer.from(cbor).toString('hex')).toEqual(expectedCbor.toString('hex'));

        deserialized = TokenMetadataUrl.fromCBOR(cbor);
        expect(deserialized).toEqual(tokenMetadataUrl);
    });

    it('should identify instance of TokenMetadataUrl', () => {
        const tokenMetadataUrl = TokenMetadataUrl.create('https://example.com');

        expect(TokenMetadataUrl.instanceOf(tokenMetadataUrl)).toBe(true);
        expect(TokenMetadataUrl.instanceOf({})).toBe(false);
    });

    it('should handle toString correctly', () => {
        const url = 'https://example.com';
        const tokenMetadataUrl = TokenMetadataUrl.create(url);

        expect(tokenMetadataUrl.toString()).toBe(url);
    });

    it('should handle CBOR decoding with missing fields gracefully', () => {
        expect(() => TokenMetadataUrl.fromCBOR(encode({}))).toThrow();

        expect(() =>
            TokenMetadataUrl.fromCBOR(encode({ url: 'https://example.com', checksumSha256: new Uint8Array(10) }))
        ).toThrow();
    });

    it('should handle additional fields correctly in CBOR', () => {
        const url = 'https://example.com';
        const additional = { customField: 'customValue' };
        const cborValue = encode({ url, ...additional });

        const tokenMetadataUrl = TokenMetadataUrl.fromCBOR(cborValue);
        expect(tokenMetadataUrl.url).toBe(url);
        expect(tokenMetadataUrl.additional).toEqual(additional);
    });
});
