import Big from 'big.js';

import { MAX_U8, MAX_U64 } from '../../../src/constants.ts';
import { TokenAmount } from '../../../src/plt/types.js';

describe('PLT TokenAmount', () => {
    test('Parses decimals correctly', () => {
        expect(TokenAmount.fromDecimal('1', 6)).toEqual(TokenAmount.create(1000000n, 6));
        expect(TokenAmount.fromDecimal('1.002', 4)).toEqual(TokenAmount.create(10020n, 4));
        expect(TokenAmount.fromDecimal('15.002456687544126548', 18)).toEqual(
            TokenAmount.create(15002456687544126548n, 18)
        );
    });

    test('Token amounts that specifies more decimals than declared throws', () => {
        expect(() => TokenAmount.fromDecimal('0.12345', 4)).toThrow(TokenAmount.Err.fractionalValue());
    });

    test('Token amounts with invalid decimals throws', () => {
        expect(() => TokenAmount.zero(-1)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.zero(1.5)).toThrow(TokenAmount.Err.fractionalDecimals());
        expect(() => TokenAmount.zero(MAX_U8 + 1)).toThrow(TokenAmount.Err.exceedsMaxDecimals());
    });

    test('Token amounts with invalid values throws', () => {
        expect(() => TokenAmount.create(-504n, 0)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.create(MAX_U64 + 1n, 0)).toThrow(TokenAmount.Err.exceedsMaxValue());
    });

    test('Returns expected amount', () => {
        expect(TokenAmount.zero(0)).toEqual(TokenAmount.create(0n, 0));
        expect(TokenAmount.zero(4)).toEqual(TokenAmount.create(0n, 4));
        expect(TokenAmount.zero(MAX_U8)).toEqual(TokenAmount.create(0n, MAX_U8));
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
        expect(TokenAmount.toDecimal(TokenAmount.create(1000n, 6))).toEqual(Big('0.001'));
        expect(TokenAmount.toDecimal(TokenAmount.create(123456789n, 2))).toEqual(Big('1234567.89'));
    });

    test('FromCcd correctly takes comma as a decimal seperator', () => {
        expect(TokenAmount.toDecimal(TokenAmount.fromDecimal('10,000', 6))).toEqual(Big('10'));
    });

    test('TokenAmount constructor correctly rejects multiple comma seperators', () => {
        expect(() => TokenAmount.fromDecimal('10,000,000', 6)).toThrow(Error('[big.js] Invalid number'));
    });
});
