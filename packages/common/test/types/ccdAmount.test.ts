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
        expect(() => CcdAmount.fromCcd('0.1234567')).toThrow();
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
        expect(ccd.toCcd()).toEqual('0.001');
    });

    test('Returns correct amount of CCD, test 2', () => {
        const ccd = new CcdAmount(123456789n);
        expect(ccd.toCcd()).toEqual('123.456789');
    });

    test('Test comma seperator toCcd', () => {
        const ccd = new CcdAmount(123456789n);
        expect(ccd.toCcd(true)).toEqual('123,456789');
    });

    test('Test comma seperator fromCcd', () => {
        const ccd = CcdAmount.fromCcd('1,002', true);
        expect(ccd.microCcdAmount).toEqual(1002000n);
    });
});
