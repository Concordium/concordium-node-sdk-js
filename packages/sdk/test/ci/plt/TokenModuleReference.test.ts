import { TokenModuleReference } from '../../../src/plt/types.ts';

describe('PLT TokenModuleReference', () => {
    test('Creates token module references as expected', () => {
        const hex = '0ea8121fdc427c9b23ae5e26cfea3e8cbb544c84aa0c82db26a85949ce1706c3';
        const bytes = Buffer.from(hex, 'hex');
        const expected = TokenModuleReference.fromBuffer(bytes);

        expect(expected.bytes).toEqual(new Uint8Array(bytes));
        expect(TokenModuleReference.fromHexString(hex)).toEqual(expected);
    });

    test('JSON id test', () => {
        const json = '0ea8121fdc427c9b23ae5e26cfea3e8cbb544c84aa0c82db26a85949ce1706c3';
        expect(TokenModuleReference.fromJSON(json).toJSON()).toEqual(json);
    });

    test('Throws errors on invalid values', () => {
        let bytes = Buffer.from('0EA8121FDC427C9B23AE5E26CFEA3E8CBB544C84AA0C82DB26A85949CE1706', 'hex');
        expect(() => TokenModuleReference.fromBuffer(bytes)).toThrow(TokenModuleReference.Err.incorrectLength(bytes));

        bytes = Buffer.from('0EA8121FDC427C9B23AE5E26CFEA3E8CBB544C84AA0C82DB26A85949CE1706E1706', 'hex');
        expect(() => TokenModuleReference.fromBuffer(bytes)).toThrow(TokenModuleReference.Err.incorrectLength(bytes));

        const invalidHex = '0EA8121FDC427C9B23AE5E26CFEA3E8CBB544C84AA0C82DB26A85949CE1706E170'
        expect(() => TokenModuleReference.fromHexString(invalidHex)).toThrow();
    });
});
