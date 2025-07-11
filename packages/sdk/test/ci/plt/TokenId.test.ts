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

        expect(() => TokenId.fromString('T'.repeat(128))).not.toThrow();
    });

    test('JSON id test', () => {
        const json = 'TOKEN';
        expect(TokenId.fromJSON(json).toJSON()).toEqual(json);
    });

    test('Throws errors on invalid values', () => {
        expect(() => TokenId.fromString('T'.repeat(129))).toThrow(TokenId.Err.exceedsMaxLength());
        expect(() => TokenId.fromString('')).toThrow(TokenId.Err.belowMinLength());
        expect(() => TokenId.fromString('abc$')).toThrow(TokenId.Err.invalidCharacters());
        expect(() => TokenId.fromString('abc@')).toThrow(TokenId.Err.invalidCharacters());
        expect(() => TokenId.fromString('abc ')).toThrow(TokenId.Err.invalidCharacters());
    });

    test('Equals correctly compares token IDs', () => {
        // Same symbols should be equal
        const id1 = TokenId.fromString('TOKEN');
        const id2 = TokenId.fromString('TOKEN');
        expect(TokenId.equals(id1, id2)).toBe(true);

        // Different symbols should not be equal
        const id3 = TokenId.fromString('DIFFERENT');
        expect(TokenId.equals(id1, id3)).toBe(false);

        // Case insensitivity check
        const id4 = TokenId.fromString('token');
        expect(TokenId.equals(id1, id4)).toBe(true);

        // Allowed special characters
        const id5 = TokenId.fromString('abc-123.DEF%');
        const id6 = TokenId.fromString('ABC-123.def%');
        expect(TokenId.equals(id5, id6)).toBe(true);
    });

    test('Throws errors on invalid bytes (not valid string)', () => {
        // Test fromBytes with invalid UTF-8
        const invalidUtf8 = new Uint8Array([0xff, 0xfe, 0xfd]); // Invalid UTF-8 sequence
        expect(() => TokenId.fromBytes(invalidUtf8)).toThrow(TokenId.Err.invalidCharacters());
    });
});
