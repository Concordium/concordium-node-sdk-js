import { TokenId } from '../../../src/pub/plt.js';

describe('PLT TokenId', () => {
    test('Creates token IDs as expected', () => {
        const str = 'DKK';
        const expected = TokenId.fromString(str);

        expect(TokenId.fromString(str).value).toEqual(str);

        const bytes = new TextEncoder().encode(str);
        expect(TokenId.fromBytes(bytes)).toEqual(expected);

        const json = str;
        expect(TokenId.fromJSON(json)).toEqual(expected);

        expect(() => TokenId.fromString('T'.repeat(255))).not.toThrow();
    });

    test('JSON id test', () => {
        const json = 'TOKEN';
        expect(TokenId.fromJSON(json).toJSON()).toEqual(json);
    });

    test('Throws errors on invalid values', () => {
        expect(() => TokenId.fromString('T'.repeat(256))).toThrow(TokenId.Err.exceedsMaxLength());
    });

    test('Equals correctly compares token IDs', () => {
        // Same symbols should be equal
        const id1 = TokenId.fromString('TOKEN');
        const id2 = TokenId.fromString('TOKEN');
        expect(TokenId.equals(id1, id2)).toBe(true);

        // Different symbols should not be equal
        const id3 = TokenId.fromString('DIFFERENT');
        expect(TokenId.equals(id1, id3)).toBe(false);

        // Case sensitivity check
        const id4 = TokenId.fromString('token');
        expect(TokenId.equals(id1, id4)).toBe(false);

        // Empty strings should be equal to each other
        const id5 = TokenId.fromString('');
        const id6 = TokenId.fromString('');
        expect(TokenId.equals(id5, id6)).toBe(true);
    });

    test('Throws errors on invalid UTF-8 input', () => {
        // Test fromBytes with invalid UTF-8
        const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]); // Invalid UTF-8 sequence
        expect(() => TokenId.fromBytes(invalidUtf8)).toThrow(TokenId.Err.invalid());

        // For fromString, we need to create a string with a lone surrogate which is invalid UTF-8 when encoded
        // This is a string with an unpaired surrogate
        const invalidString = String.fromCharCode(0xd800); // Unpaired high surrogate
        expect(() => TokenId.fromString(invalidString)).toThrow(TokenId.Err.invalid());
    });
});
