import { Duration } from '../../../src/index.js';

describe('fromString', () => {
    test('Parsing simple valid string', () => {
        const duration = Duration.fromString('100ms');
        const value = Number(Duration.toMillis(duration));
        expect(value).toBe(100);
    });

    test('Parsing valid string', () => {
        const duration = Duration.fromString('10d 1h 2m 7s');
        const value = Number(Duration.toMillis(duration));
        expect(value).toBe(867_727_000);
    });

    test('Fails when using invalid unit for a measure', () => {
        expect(() => {
            Duration.fromString('1w 10d');
        }).toThrow();
    });

    test('Fails when using decimals in a measure', () => {
        expect(() => {
            Duration.fromString('10.0d');
        }).toThrow();
    });

    test('Fails when using negative numbers in a measure', () => {
        expect(() => {
            Duration.fromString('-10d');
        }).toThrow();
    });
});
