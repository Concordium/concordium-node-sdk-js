import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { secondsSinceEpoch } from '../util.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.TransactionExpiry;
export type Serializable = string;

/**
 * Representation of a transaction expiry date.
 */
class TransactionExpiry {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    #nominal = true;
    constructor(
        /** Internal representation of expiry. Seconds since unix epoch */
        public readonly expiryEpochSeconds: bigint
    ) {}

    /**
     * Get a string representation of the transaction expiry date in seconds since the Unix epoch.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return this.expiryEpochSeconds.toString();
    }

    /**
     * Get a JSON-serializable representation of the transaction expiry date.
     * @throws If the expiry represented as seconds after unix epoch is too
     * large to be represented as a number.
     * @returns {string} The JSON-serializable representation.
     */
    public toJSON(): number {
        if (this.expiryEpochSeconds > Number.MAX_SAFE_INTEGER || this.expiryEpochSeconds < Number.MIN_SAFE_INTEGER) {
            throw new Error('Transaction expiry is too large to be represented as a number.');
        }
        return Number(this.expiryEpochSeconds);
    }
}

/**
 * Unwraps {@linkcode Type} value
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode bigint} value
 */
export function toUnwrappedJSON(value: Type): bigint {
    return value.expiryEpochSeconds;
}

/**
 * Representation of a transaction expiry date.
 */
export type Type = TransactionExpiry;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is TransactionExpiry {
    return value instanceof TransactionExpiry;
}

/**
 * Construct a TransactionExpiry from a number of seconds since unix epoch.
 * @param {bigint | number} seconds Number of seconds since unix epoch.
 * @throws If provided a negative number.
 * @returns The transaction expiry.
 */
export function fromEpochSeconds(seconds: bigint | number): TransactionExpiry {
    if (seconds < 0n) {
        throw new Error('Invalid transaction expiry: Expiry cannot be before unix epoch.');
    }
    return new TransactionExpiry(BigInt(seconds));
}

/**
 * Construct a TransactionExpiry from a Date object.
 * @param {Date} expiry The date representing the expiry time.
 * @throws If provided the date is from before unix epoch.
 * @returns {TransactionExpiry} The transaction expiry.
 */
export function fromDate(expiry: Date): TransactionExpiry {
    return fromEpochSeconds(secondsSinceEpoch(expiry));
}

/**
 * Convert a TransactionExpiry into a Date object.
 * @param {TransactionExpiry} expiry A TransactionExpiry to convert.
 * @returns {Date} The date object.
 */
export function toDate(expiry: TransactionExpiry): Date {
    return new Date(Number(expiry.expiryEpochSeconds) * 1000);
}

/**
 * Construct a TransactionExpiry minutes in the future from the time of calling this function.
 * @param {number} minutes The number of minutes in the future to set as the expiry time.
 * @returns {TransactionExpiry} The transaction expiry.
 */
export function futureMinutes(minutes: number): TransactionExpiry {
    const expiryMillis = Date.now() + minutes * 60 * 1000;
    return fromDate(new Date(expiryMillis));
}

/**
 * Convert expiry from its protobuf encoding.
 * @param {Proto.TransactionTime} expiry The expiry in protobuf.
 * @returns {TransactionExpiry} The expiry.
 */
export function fromProto(expiry: Proto.TransactionTime): TransactionExpiry {
    return new TransactionExpiry(expiry.value);
}

/**
 * Convert expiry into its protobuf encoding.
 * @param {TransactionExpiry} expiry The expiry.
 * @returns {Proto.TransactionTime} The protobuf encoding.
 */
export function toProto(expiry: TransactionExpiry): Proto.TransactionTime {
    return {
        value: expiry.expiryEpochSeconds,
    };
}

/**
 * Constructs a {@linkcode Type} from {@linkcode Serializable}.
 * @param {Serializable} value
 * @returns {Type} The duration.
 */
export function fromSerializable(value: Serializable): Type {
    return fromEpochSeconds(BigInt(value));
}

/**
 * Converts {@linkcode Type} into {@linkcode Serializable}
 * @param {Type} value
 * @returns {Serializable} The serializable value
 */
export function toSerializable(value: Type): Serializable {
    return value.expiryEpochSeconds.toString();
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode toSerializable} function instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: TransactionExpiry): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toSerializable(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the {@linkcode fromSerializable} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromSerializable);
