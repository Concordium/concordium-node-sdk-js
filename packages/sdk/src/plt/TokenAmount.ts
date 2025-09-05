import Big, { BigSource } from 'big.js';
import { decode } from 'cbor2/decoder';
import { encode, registerEncoder } from 'cbor2/encoder';
import { Tag } from 'cbor2/tag';

import { MAX_U8, MAX_U64 } from '../constants.js';
import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';

/**
 * Protocol level token (PLT) amount JSON representation.
 *
 * Please note that `bigint` is used to represent the token amount, which is needed for precise representation of large numbers.
 * As such, extra steps must be taken to serialize and deserialize the token amount.
 */
export type JSON = {
    /** The integer representation of the token amount as a string. */
    value: string;
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
    /** Error type indicating the token decimals were specified as a fractional number. */
    FRACTIONAL_DECIMALS = 'FRACTIONAL_DECIMALS',
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
     * Creates a TokenAmount.Err indicating that the token amount/decimals is negative.
     */
    public static negative(): Err {
        return new Err(ErrorType.NEGATIVE, 'Token amounts/decimals cannot be negative');
    }

    /**
     * Creates a TokenAmount.Err indicating that the token amount has more decimals than allowed.
     */
    public static exceedsMaxDecimals(): Err {
        return new Err(ErrorType.EXCEEDS_MAX_DECIMALS, `Token amounts cannot have more than than ${MAX_U8}`);
    }

    /** Creates a TokenAmount.Err indicating the token decimals were specified as a fractional number. */
    public static fractionalDecimals(): Err {
        return new Err(ErrorType.FRACTIONAL_DECIMALS, `Token decimals must be specified as whole numbers`);
    }
}

/**
 * Protocol level token (PLT) amount representation.
 */
class TokenAmount {
    #nominal = true;

    /**
     * Constructs a new TokenAmount instance.
     * Validates that the value is within the allowed range and is non-negative.
     *
     * @throws {Err} If the value/decimals exceeds the maximum allowed or is negative.
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
        if (decimals > MAX_U8) {
            throw Err.exceedsMaxDecimals();
        }
        if (decimals < 0) {
            throw Err.negative();
        }
        if (!Number.isInteger(decimals)) {
            throw Err.fractionalDecimals();
        }
    }

    /**
     * Get a string representation of the token amount.
     * @returns {string} The string representation.
     */
    public toString(): string {
        const amountString = this.value.toString();
        if (this.decimals === 0) {
            return amountString;
        }

        const padded = amountString.padStart(this.decimals + 1, '0');
        return `${padded.slice(0, -this.decimals)}.${padded.slice(-this.decimals)}`;
    }

    /**
     * Get a JSON-serializable representation of the token amount. This is called implicitly when serialized with JSON.stringify.
     * @returns {HexString} The JSON representation.
     */
    public toJSON(): JSON {
        return { value: this.value.toString(), decimals: this.decimals };
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
 * Get decimal places from a Big {@linkcode Big}.
 *
 * @param big The number to get the decimal places.
 * @returns {number} The number of decimal places in above number.
 */
function getDecimalPlaces(big: Big): number {
    // `b.c` is an array of single digits (coefficient), `b.e` is the exponent (0-based index of highest digit)
    const decimals = big.c.length - (big.e + 1);
    return decimals > 0 ? decimals : 0;
}

/**
 * Creates a TokenAmount from a number, string, {@linkcode Big}, or bigint.
 *
 * @param amount The amount of tokens as a number, string, big or bigint.
 * @returns {TokenAmount} The token amount.
 *
 * @throws {Err} If the value exceeds the maximum allowed or is negative.
 */
export function fromDecimal(amount: BigSource | bigint, decimals: number): TokenAmount {
    let parsed: BigSource;
    if (typeof amount !== 'bigint') {
        parsed = Big(amount);
    } else {
        parsed = amount.toString();
    }

    const bigAmount = Big(parsed);
    const parsedDecimals = getDecimalPlaces(bigAmount);
    if (parsedDecimals > decimals) {
        throw new Error('The amount has more decimal places than the specified decimals.');
    }

    const intAmount = bigAmount.mul(Big((10n ** BigInt(decimals)).toString()));
    return new TokenAmount(BigInt(intAmount.toFixed(0)), decimals);
}

/**
 * Convert a token amount into a decimal value represented as a {@linkcode Big}
 *
 * @param {TokenAmount} amount
 * @returns {Big} The token amount as a {@linkcode Big}.
 */
export function toDecimal(amount: TokenAmount): Big {
    return Big(amount.toString());
}

/**
 * Converts {@linkcode JSON} to a token amount.
 *
 * @param {JSON} json The JSON representation of the token amount.
 * @returns {TokenAmount} The token amount.
 * @throws {Err} If the value/decimals exceeds the maximum allowed or is negative.
 */
export function fromJSON(json: JSON): TokenAmount {
    return new TokenAmount(BigInt(json.value), Number(json.decimals));
}

/**
 * Creates a token amount from its integer representation and a number of decimals.
 *
 * @param {bigint} value The integer representation of the token amount.
 * @param {number} decimals The decimals of the token amount, defining the precision at which amounts of the token can be specified.
 *
 * @returns {TokenAmount} The token amount.
 * @throws {Err} If the value/decimals exceeds the maximum allowed or is negative.
 */
export function create(value: bigint, decimals: number): TokenAmount {
    return new TokenAmount(value, decimals);
}

/**
 * Creates a token amount with a value of zero.
 *
 * @param {number} decimals The decimals of the token amount, defining the precision at which amounts of the token can be specified.
 * @returns {TokenAmount} The token amount.
 */
export function zero(decimals: number): TokenAmount {
    return new TokenAmount(BigInt(0), decimals);
}

/**
 * Convert token amount from its protobuf encoding.
 * @param {Proto.TokenAmount} amount
 * @returns {Type} The token amount.
 * @throws {Err} If the value/decimals exceeds the maximum allowed or is negative.
 */
export function fromProto(amount: Proto.TokenAmount): Type {
    return create(amount.value, amount.decimals);
}

/**
 * Convert token amount into its protobuf encoding.
 * @param {TokenAmount} amount
 * @returns {Proto.TokenAmount} The protobuf encoding.
 */
export function toProto(amount: Type): Proto.TokenAmount {
    return {
        value: amount.value,
        decimals: amount.decimals,
    };
}

/**
 * Check if two token amounts are the same. This tests for numeric equlity, not equality of object values.
 *
 * @example
 * const a = TokenAmount.create(1, 2);
 * const b = TokenAmount.create(100, 4);
 * console.log(TokenAmount.equals(a, b)); // true
 *
 * @param {TokenAmount} left
 * @param {TokenAmount} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: TokenAmount, right: TokenAmount): boolean {
    return toDecimal(left).eq(toDecimal(right));
}

const DECIMAL_FRACTION_TAG = 4; // 4 is the CBOR tag for decimal fraction

function toCBORDecFrac(value: TokenAmount): [number, bigint] {
    return [
        -value.decimals, // Exponent is negative of decimals
        value.value, // Mantissa is the value
    ];
}

/**
 * Converts a TokenAmount to its CBOR (Concise Binary Object Representation) `decfrac` encoding.
 *
 * @param {TokenAmount} value - The token amount to convert to CBOR format.
 * @returns {Uint8Array} The CBOR encoded representation of the token amount.
 */
export function toCBOR(value: TokenAmount): Uint8Array {
    const tagged = new Tag(DECIMAL_FRACTION_TAG, toCBORDecFrac(value));
    return new Uint8Array(encode(tagged));
}

/**
 * Function to parse a CBOR-decoded `decfrac` value into a TokenAmount instance.
 * This handles the internal conversion from the CBOR representation to our TokenAmount type.
 *
 * @param {unknown} decoded - The decoded CBOR value
 * @returns {TokenAmount} The parsed TokenAmount instance
 * @throws {Error} If the value is not in the expected `decfrac` format
 */
export function fromCBORValue(decoded: unknown): TokenAmount {
    // Verify we have a tagged value with tag DECIMAL_FRACTION_TAG (decimal fraction)
    if (!(decoded instanceof Tag) || decoded.tag !== DECIMAL_FRACTION_TAG) {
        throw new Error(`Invalid CBOR encoded token amount: expected tag ${DECIMAL_FRACTION_TAG} (decimal fraction)`);
    }

    const value = decoded.contents;
    // The value should be an array [exponent, mantissa]
    if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('Invalid CBOR encoded token amount: expected an array with two elements [exponent, mantissa]');
    }

    const [exponent, mantissa] = value;

    if (typeof exponent !== 'number') {
        throw new Error('Invalid CBOR encoded token amount: exponent must be a number');
    }

    if (typeof mantissa !== 'number' && typeof mantissa !== 'bigint') {
        throw new Error('Invalid CBOR encoded token amount: mantissa must be a number or bigint');
    }

    // Convert to TokenAmount (decimals is negative of exponent)
    if (exponent > 0) {
        throw new Error('Invalid CBOR encoded token amount: exponent cannot have a positive amount');
    }
    if (exponent < -MAX_U8) {
        throw new Error(`Invalid CBOR encoded token amount: exponent is too small (minimum value is -${MAX_U8})`);
    }

    const decimals = Math.abs(exponent);
    return create(typeof mantissa === 'bigint' ? mantissa : BigInt(mantissa), decimals);
}

/**
 * Decodes a CBOR `decfrac` encoding into a TokenAmount instance.
 *
 * @param {Uint8Array} bytes - The CBOR `decfrac` encoding.
 * @throws {Error} - If the input is not a valid CBOR encoding of a token amount.
 * @returns {TokenAmount} The decoded TokenAmount instance.
 */
export function fromCBOR(bytes: Uint8Array): TokenAmount {
    return fromCBORValue(decode(bytes));
}

/**
 * Registers a CBOR encoder for the TokenAmount type with the `cbor2` library.
 * This allows TokenAmount instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now TokenAmount instances can be encoded directly
 * const encoded = encode(myTokenAmount);
 */
export function registerCBOREncoder(): void {
    registerEncoder(TokenAmount, (value) => [DECIMAL_FRACTION_TAG, toCBORDecFrac(value)]);
}

/**
 * Registers a CBOR decoder for the decimal fraction (tag 4) format with the `cbor2` library.
 * This enables automatic decoding of CBOR data containing token amounts
 * when using the `cbor2` library's decode function.
 *
 * @returns {() => void} A cleanup function that, when called, will restore the previous
 * decoder (if any) that was registered for the decimal fraction format. This is useful
 * when used in an existing `cbor2` use-case.
 *
 * @example
 * // Register the decoder
 * const cleanup = registerCBORDecoder();
 * // Use the decoder
 * const tokenAmount = decode(cborBytes); // Returns TokenAmount if format matches
 * // Later, unregister the decoder
 * cleanup();
 */
export function registerCBORDecoder(): () => void {
    const old = Tag.registerDecoder(DECIMAL_FRACTION_TAG, fromCBORValue);

    // Return cleanup function to restore the old decoder
    return () => {
        if (old) {
            Tag.registerDecoder(DECIMAL_FRACTION_TAG, old);
        } else {
            Tag.clearDecoder(DECIMAL_FRACTION_TAG);
        }
    };
}
