/** Energy measure. Used as part of cost calculations for transactions. */
class Energy {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The internal value for representing the energy. */
        public value: bigint
    ) {}
}

/** Energy measure. Used as part of cost calculations for transactions. */
export type Type = Energy;

/**
 * Construct an Energy type.
 * @param {bigint | number} value The measure of energy.
 * @throws If the provided value is a negative number.
 * @returns {Energy}
 */
export function create(value: bigint | number): Energy {
    if (value < 0) {
        throw new Error(
            'Invalid energy: The value cannot be a negative number.'
        );
    }
    return new Energy(BigInt(value));
}
