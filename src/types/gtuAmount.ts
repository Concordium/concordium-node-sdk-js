/**
 * Representation of a GTU amount.
 * The base unit of GTU is micro GTU, which is the representation
 * used on chain.
 */
export class GtuAmount {
    microGtuAmount: bigint;

    constructor(microGtuAmount: bigint) {
        if (microGtuAmount < 1n) {
            throw new Error(
                'A micro GTU amount must be a positive integer but was: ' +
                    microGtuAmount
            );
        } else if (microGtuAmount > 18446744073709551615n) {
            throw new Error(
                'A micro GTU amount must be representable as an unsigned 64 bit integer but was: ' +
                    microGtuAmount
            );
        }

        this.microGtuAmount = microGtuAmount;
    }
}
