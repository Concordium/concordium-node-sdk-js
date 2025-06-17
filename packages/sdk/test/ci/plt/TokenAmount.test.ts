import Big from 'big.js';

import { MAX_U64 } from '../../../src/constants.ts';
import { TokenAmount } from '../../../src/pub/plt.js';

describe('PLT TokenAmount', () => {
    test('Parses decimals correctly', () => {
        expect(TokenAmount.fromDecimal('1', 0)).toEqual(TokenAmount.create(1n, 0));
        expect(TokenAmount.fromDecimal('1.002', 3)).toEqual(TokenAmount.create(1002n, 3));
        expect(TokenAmount.fromDecimal('15.002456687544126548', 18)).toEqual(
            TokenAmount.create(15002456687544126548n, 18)
        );
    });

    test('Token amounts with invalid values throws', () => {
        expect(() => TokenAmount.create(-504n, 0)).toThrow(TokenAmount.Err.negative());
        expect(() => TokenAmount.create(MAX_U64 + 1n, 0)).toThrow(TokenAmount.Err.exceedsMaxValue());
    });

    test('Returns expected amount', () => {
        expect(TokenAmount.zero(0)).toEqual(TokenAmount.create(0n, 0));
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
        expect(TokenAmount.toDecimal(TokenAmount.create(1n, 0))).toEqual(Big('1'));
        expect(TokenAmount.toDecimal(TokenAmount.create(1000n, 6))).toEqual(Big('0.001'));
        expect(TokenAmount.toDecimal(TokenAmount.create(123456789n, 2))).toEqual(Big('1234567.89'));
    });

    test('TokenAmount constructor correctly rejects multiple seperators', () => {
        expect(() => TokenAmount.fromDecimal('10.000.000', 3)).toThrow(Error('[big.js] Invalid number'));
    });

    test('Equals checks for numeric equality, not object equality', () => {
        let a = TokenAmount.create(1n, 2);
        let b = TokenAmount.create(1n, 2);
        expect(TokenAmount.equals(a, b)).toBe(true);

        a = TokenAmount.create(1n, 2);
        b = TokenAmount.create(100n, 4);
        expect(TokenAmount.equals(a, b)).toBe(true);

        a = TokenAmount.create(123n, 2);
        b = TokenAmount.create(1230n, 3);
        expect(TokenAmount.equals(a, b)).toBe(true);

        a = TokenAmount.create(100n, 2);
        b = TokenAmount.create(101n, 2);
        expect(TokenAmount.equals(a, b)).toBe(false);
    });
});
