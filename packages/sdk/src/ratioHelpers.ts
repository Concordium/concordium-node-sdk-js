import { Ratio } from './types.js';

/**
 * Collapses the Fraction into a single number.
 * If the denominator does not divide the numerator, the function rounds up;
 */
export function collapseRatio({ numerator, denominator }: Ratio): bigint {
    const quotient = numerator / denominator;
    if (numerator % denominator === 0n) {
        return quotient;
    }
    return 1n + quotient;
}

/**
 * Multiply a ratio with a bigint.
 * @param factor a number which should be multiplied with the ratio. If given a string, it will attempt to parse it to a bigint.
 * @returns the product as a ratio.
 */
export function multiplyRatio({ numerator, denominator }: Ratio, factor: bigint | string): Ratio {
    return {
        numerator: numerator * BigInt(factor),
        denominator,
    };
}
