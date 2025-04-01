import { MAX_U32, MAX_U64 } from '../constants.js';
import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';

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
 * Enum representing the types of errors that can occur with token amounts.
 */
export enum ErrorType {
    /** Error type indicating the token amount exceeds the maximum allowed value. */
    EXCEEDS_MAX_VALUE = 'EXCEEDS_MAX_VALUE',
    /** Error type indicating the token amount is negative. */
    NEGATIVE = 'NEGATIVE',
    /** Error type indicating the token amount has more decimals than allowed. */
    EXCEEDS_MAX_DECIMALS = 'EXCEEDS_MAX_DECIMALS',
}

/**
 * Custom error to represent issues with token amounts.
 */
export class Err extends Error {
    private constructor(
        /** The {@linkcode ErrorType} of the error. Can be used as to distinguish different types of errors. */
        public readonly type: ErrorType,
        message: string
    ) {
        super(message);
        this.name = `TokenAmount.Err.${type}`;
    }

    /**
     * Creates a TokenAmount.Err indicating that the token amount exceeds the maximum allowed value.
     */
    public static exceedsMaxValue(): Err {
        return new Err(ErrorType.EXCEEDS_MAX_VALUE, `Token amounts cannot be larger than ${MAX_U64}`);
    }

    /**
     * Creates a TokenAmount.Err indicating that the token amount is negative.
     */
    public static negative(): Err {
        return new Err(ErrorType.NEGATIVE, 'Token amounts cannot be negative');
    }

    /**
     * Creates a TokenAmount.Err indicating that the token amount has more decimals than allowed.
     */
    public static exceedsMaxDecimals(): Err {
        return new Err(ErrorType.EXCEEDS_MAX_DECIMALS, `Token amounts cannot have more than than ${MAX_U32}`);
    }
}

/**
 * Protocol level token (PLT) amount representation.
 */
class TokenAmount {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private readonly __type = 'PLT.Amount';

    /**
     * Constructs a new TokenAmount instance.
     * Validates that the value is within the allowed range and is non-negative.
     *
     * @throws {Err} If the value/digits exceeds the maximum allowed or is negative.
     */
    constructor(
        /** The unsigned integer representation of the token amount. */
        public readonly value: bigint,
        /** The decimals of the token amount, defining the precision at which amounts of the token can be specified. */
        public readonly decimals: number
    ) {
        if (value > MAX_U64) {
            throw Err.exceedsMaxValue();
        }
        if (value < 0n) {
            throw Err.negative();
        }
        if (decimals > MAX_U32) {
            throw Err.exceedsMaxDecimals();
        }
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
 *
 * @param {string} json The JSON representation of the CCD amount.
 * @returns {CcdAmount} The CCD amount.
 * @throws {Err} If the value/digits exceeds the maximum allowed or is negative.
 */
export function fromJSON(json: JSON): TokenAmount {
    return new TokenAmount(BigInt(json.value), Number(json.decimals));
}

/**
 * Creates a token amount from its integer representation and a number of decimals.
 *
 * @param {bigint} value The integer representation of the token amount.
 * @param {number} decimals The decimals of the token amount, defining the precision at which amounts of the token can be specified.
 * @returns {TokenAmount} The token amount.
 * @throws {Err} If the value/digits exceeds the maximum allowed or is negative.
 */
export function create(value: bigint, decimals: number): TokenAmount {
    return new TokenAmount(value, decimals);
}

/**
 * Creates a token amount with a value of zero.
 *
 * @param {number} decimals The decimals of the token amount, defining the precision at which amounts of the token can be specified.
 * @returns {TokenAmount} The token amount.
 * @throws {Err} If the digits exceeds the maximum allowed.
 */
export function zero(decimals: number): TokenAmount {
    return new TokenAmount(BigInt(0), decimals);
}

/**
 * Convert token amount from its protobuf encoding.
 * @param {Proto.TokenAmount} amount
 * @returns {Type} The token amount.
 * @throws {Err} If the value/digits exceeds the maximum allowed or is negative.
 */
export function fromProto(amount: Proto.TokenAmount): Type {
    return create(amount.digits, amount.nrOfDecimals);
}

/**
 * Convert token amount into its protobuf encoding.
 * @param {TokenAmount} amount
 * @returns {Proto.TokenAmount} The protobuf encoding.
 */
export function toProto(amount: Type): Proto.TokenAmount {
    return {
        digits: amount.value,
        nrOfDecimals: amount.decimals,
    };
}
