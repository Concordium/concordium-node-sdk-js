/**
 * Protocol level token (PLT) amount JSON representation.
 *
 * Please note that `bigint` is used to represent the token amount, which is needed for precise representation of large numbers.
 * As such, extra steps must be taken to serialize and deserialize the token amount.
 */
export type JSON = {
    /** The integer representation of the token amount. */
    value: bigint;
    /** The decimals of the token amount, defining the precision at which amounts of the token can be specified. */
    decimals: number;
};

/**
 * Protocol level token (PLT) amount representation.
 */
class TokenAmount {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private readonly __type = 'PLT.Amount';
    constructor(
        /** The integer representation of the token amount. */
        public readonly value: bigint,
        /** The decimals of the token amount, defining the precision at which amounts of the token can be specified. */
        public readonly decimals: number
    ) {
        // TODO: any invariants to check?
    }

    /**
     * Get a string representation of the token amount.
     * @returns {string} The string representation.
     */
    public toString(): string {
        const amountString = this.value.toString();
        const padded = amountString.padStart(this.decimals + 1, '0');
        return `${padded.slice(0, -this.decimals)}.${padded.slice(-this.decimals)}`;
    }

    /**
     * Get a JSON-serializable representation of the token amount. This is called implicitly when serialized with JSON.stringify.
     * @returns {HexString} The JSON representation.
     */
    public toJSON(): JSON {
        return { value: this.value, decimals: this.decimals };
    }
}

/**
 * Protocol level token (PLT) amount representation.
 */
export type Type = TokenAmount;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is TokenAmount {
    return value instanceof TokenAmount;
}

/**
 * Converts {@linkcode JSON} to a token amount.
 * @param {string} json The JSON representation of the CCD amount.
 * @returns {CcdAmount} The CCD amount.
 */
export function fromJSON(json: JSON): TokenAmount {
    return new TokenAmount(BigInt(json.value), Number(json.decimals));
}

/**
 * Creates a token amount from its integer representation and a number of decimals.
 * @param {bigint} value The integer representation of the token amount.
 * @param {number} decimals The decimals of the token amount, defining the precision at which amounts of the token can be specified.
 * @returns {TokenAmount} The token amount.
 */
export function create(value: bigint, decimals: number): TokenAmount {
    return new TokenAmount(value, decimals);
}

/**
 * Creates a token amount with a value of zero.
 * @param {number} decimals The decimals of the token amount, defining the precision at which amounts of the token can be specified.
 * @returns {TokenAmount} The token amount.
 */
export function zero(decimals: number): TokenAmount {
    return new TokenAmount(BigInt(0), decimals);
}
