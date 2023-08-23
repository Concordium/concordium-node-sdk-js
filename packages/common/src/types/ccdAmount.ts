import { Big, BigSource } from 'big.js';

const MICRO_CCD_PER_CCD = 1000000;

/**
 * Representation of a CCD amount.
 * The base unit of CCD is micro CCD, which is the representation
 * used on chain.
 */
export class CcdAmount {
    microCcdAmount: bigint;

    /**
     * Constructs a CcdAmount and checks that it is valid. It accepts a number, string, big, or bigint as parameter.
     * It can accept a string as parameter with either a comma or a dot as the decimal separator.
     *
     * @param microCcdAmount The amount of micro CCD as a number, string, big, or bigint.
     * @throws If the number of commas in the input string exceeds 1
     * @throws If a number is passed with several decimal seperators
     * @throws If a negative amount of micro CCD is passed
     * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
     */
    constructor(microCcdAmount: bigint | BigSource) {
        // If the input is a "BigSource" assert that the number is whole
        if (typeof microCcdAmount !== 'bigint') {
            microCcdAmount = newBig(microCcdAmount);

            if (!microCcdAmount.mod(Big(1)).eq(Big(0))) {
                throw Error(
                    'Can not create CcdAmount from a non-whole number!'
                );
            }

            microCcdAmount = BigInt(microCcdAmount.toFixed());
        }

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
     * Returns the amount of micro CCD as a Big.
     *
     * @returns The amount of micro CCD as a Big
     */
    toMicroCcd(): Big {
        return Big(this.microCcdAmount.toString());
    }

    /**
     * Returns the amount of CCD as a Big.
     *
     * @returns The amount of CCD as a Big
     */
    toCcd(): Big {
        return this.toBig().div(Big(MICRO_CCD_PER_CCD));
    }

    /**
     * Creates a CcdAmount from a number, string, big, or bigint.
     *
     * @param ccd The amount of CCD
     * @returns The CcdAmount object derived from the ccd input parameter
     * @throws If the number of commas in the input string exceeds 1
     * @throws If a number is passed with several decimal seperators
     * @throws If a negative amount of micro CCD is passed
     * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
     */
    static fromCcd(ccd: BigSource | bigint): CcdAmount {
        if (typeof ccd === 'bigint') {
            ccd = ccd.toString();
        }

        const microCcd = newBig(ccd).mul(Big(MICRO_CCD_PER_CCD));
        return new CcdAmount(microCcd);
    }

    /**
     * Converts an amount of CCD to micro CCD and asserts that the amount is a valid amount of CCD.
     *
     * @param ccd The amount of CCD
     * @returns The amount of micro CCD as a Big
     * @throws If the number of commas in the input string exceeds 1
     * @throws If a number is passed with several decimal seperators
     */
    static ccdToMicroCcd(ccd: BigSource | bigint): Big {
        return CcdAmount.fromCcd(ccd).toBig();
    }

    /**
     * Converts an amount of micro CCD to CCD and asserts that the amount is a valid amount of CCD.
     *
     * @param microCcd The amount of micro CCD as a number, string, big or bigint.
     * @returns The amount of CCD as a Big
     * @throws If the number of commas in the input string exceeds 1
     * @throws If a number is passed with several decimal seperators
     * @throws If a negative amount of micro CCD is passed
     * @throws If the micro CCD passed is greater than what can be contained in a 64-bit integer
     */
    static microCcdToCcd(microCcd: BigSource | bigint): Big {
        return new CcdAmount(microCcd).toCcd();
    }

    toJSON(): string {
        return this.microCcdAmount.toString();
    }
}

function newBig(bigSource: BigSource): Big {
    if (typeof bigSource === 'string') {
        return Big(bigSource.replace(',', '.'));
    }
    return Big(bigSource);
}
