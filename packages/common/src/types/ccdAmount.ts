import { Big } from 'big.js/';

/**
 * Representation of a CCD amount.
 * The base unit of CCD is micro CCD, which is the representation
 * used on chain.
 */
export class CcdAmount {
    microCcdAmount: bigint;

    constructor(microCcdAmount: bigint) {
        if (microCcdAmount < 0n) {
            throw new Error(
                'A micro CCD amount must be a non-negative integer but was: ' +
                    microCcdAmount
            );
        } else if (microCcdAmount > 18446744073709551615n) {
            throw new Error(
                'A micro CCD amount must be representable as an unsigned 64 bit integer but was: ' +
                    microCcdAmount
            );
        }

        this.microCcdAmount = microCcdAmount;
    }

    /**
     * Returns the amount of CCD as a string.
     *
     * @param useCommaDecimalSeperator Whether or not to use comma as a decimal seperator, defaults to false
     * @returns The amount of CCD as a string
     */
    toCcd(useCommaDecimalSeperator = false): string {
        const ccd = Big(this.microCcdAmount.toString()).div(Big(1000000));

        if (useCommaDecimalSeperator) {
            return ccd.toString().replace('.', ',');
        } else {
            return ccd.toString();
        }
    }

    /**
     * Parses an amount of CCD formatted as a string and creates a CcdAmount from it.
     *
     * @param ccd The amount of CCD to formatted as a string
     * @param useCommaDecimalSeperator Whether or not to use comma as a decimal seperator, defaults to false
     * @returns The CcdAmount object derived from the ccd input parameter
     */
    static fromCcd(ccd: string, useCommaDecimalSeperator = false): CcdAmount {
        if (useCommaDecimalSeperator) {
            const numberOfDecimalSeperators = ccd.split(',').length - 1;

            if (numberOfDecimalSeperators > 1) {
                throw Error('More than one decimal seperator found!');
            }

            ccd = ccd.replace('.', ',');
        }

        const microCcd = Big(ccd).mul(Big(1000000));
        return new CcdAmount(BigInt(microCcd.toFixed()));
    }

    toJSON(): string {
        return this.microCcdAmount.toString();
    }
}
