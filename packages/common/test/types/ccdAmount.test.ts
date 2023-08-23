import Big from 'big.js';
import { CcdAmount } from '../../src';

describe('To and from ccd as strings', () => {
    test('Parses one CCD correctly', () => {
        const ccd = CcdAmount.fromCcd('1');
        expect(ccd.microCcdAmount).toEqual(1000000n);
    });

    test('Parses decimals correctly', () => {
        const ccd = CcdAmount.fromCcd('1.002');
        expect(ccd.microCcdAmount).toEqual(1002000n);
    });

    test('CCD amounts that specifies more decimals than 6 throws', () => {
        expect(() => CcdAmount.fromCcd('0.1234567')).toThrow(
            Error('Can not create CcdAmount from a non-whole number!')
        );
    });

    test('CCD amounts that specifies 6 or less decimals is valid, test 1', () => {
        const ccd = CcdAmount.fromCcd('0.123456');
        expect(ccd.microCcdAmount).toEqual(123456n);
    });

    test('CCD amounts that specifies 6 or less decimals is valid, test 2', () => {
        const ccd = CcdAmount.fromCcd('789.123456');
        expect(ccd.microCcdAmount).toEqual(789123456n);
    });

    test('Returns correct amount of CCD, test 1', () => {
        const ccd = new CcdAmount(1000n);
        expect(ccd.toCcd()).toEqual(Big('0.001'));
    });

    test('Returns correct amount of CCD, test 2', () => {
        const ccd = new CcdAmount(123456789n);
        expect(ccd.toCcd()).toEqual(Big('123.456789'));
    });

    test('FromCcd correctly takes comma as a decimal seperator', () => {
        expect(CcdAmount.fromCcd('10,000').toCcd()).toEqual(Big('10'));
    });

    test('CcdAmount constructor correctly rejects multiple comma seperators', () => {
        expect(() => CcdAmount.fromCcd('10,000,000')).toThrow(
            Error('[big.js] Invalid number')
        );
    });

    test('fromCcd is equal to ccdToMicroCcd', () => {
        const microCcd1 = Big(CcdAmount.fromCcd('1').microCcdAmount.toString());
        const microCcd2 = CcdAmount.ccdToMicroCcd('1');
        expect(microCcd1).toEqual(microCcd2);
    });

    test('toCcd is equal to microCcdToCcd', () => {
        const ccd1 = new CcdAmount('1').toCcd();
        const ccd2 = CcdAmount.microCcdToCcd('1');
        expect(ccd1).toEqual(ccd2);
    });
});