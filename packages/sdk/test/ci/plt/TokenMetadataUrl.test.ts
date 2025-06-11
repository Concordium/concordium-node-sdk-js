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
        const additional = { key: 'value' };

        const tokenMetadataUrl = TokenMetadataUrl.create(url, checksum, additional);
        const cbor = TokenMetadataUrl.toCBOR(tokenMetadataUrl);
        const deserialized = TokenMetadataUrl.fromCBOR(cbor);

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
        expect(() => TokenMetadataUrl.fromCBORValue({})).toThrow();

        expect(() =>
            TokenMetadataUrl.fromCBORValue({ url: 'https://example.com', checksumSha256: new Uint8Array(10) })
        ).toThrow();
    });

    it('should handle additional fields correctly in CBOR', () => {
        const url = 'https://example.com';
        const additional = { customField: 'customValue' };
        const cborValue = { url, ...additional };

        const tokenMetadataUrl = TokenMetadataUrl.fromCBORValue(cborValue);
        expect(tokenMetadataUrl.url).toBe(url);
        expect(tokenMetadataUrl.additional).toEqual(additional);
    });
});
