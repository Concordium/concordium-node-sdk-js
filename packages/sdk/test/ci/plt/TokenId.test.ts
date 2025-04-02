import { TokenId } from '../../../src/plt/types.ts';

describe('PLT TokenId', () => {
    test('Creates token IDs as expected', () => {
        const str = 'DKK';
        const expected = TokenId.fromString(str);

        expect(TokenId.fromString(str).symbol).toEqual(str);

        const bytes = new TextEncoder().encode(str);
        expect(TokenId.fromBytes(bytes)).toEqual(expected);

        const json = str;
        expect(TokenId.fromJSON(json)).toEqual(expected);

        expect(() => TokenId.fromString('T'.repeat(256))).not.toThrow();
    });

    test('JSON id test', () => {
        const json = 'TOKEN';
        expect(TokenId.fromJSON(json).toJSON()).toEqual(json);
    });

    test('Throws errors on invalid values', () => {
        expect(() => TokenId.fromString('T'.repeat(257))).toThrow(TokenId.Err.exceedsMaxLength());
    });
});
