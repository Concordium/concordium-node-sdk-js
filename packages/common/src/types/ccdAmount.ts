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

    toJSON(): string {
        return this.microCcdAmount.toString();
    }
}
