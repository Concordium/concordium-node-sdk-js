import { secondsSinceEpoch } from '../util.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.TransactionExpiry;
type Serializable = string;

/**
 * Representation of a transaction expiry date.
 */
class TransactionExpiry extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;
    protected get serializable(): Serializable {
        return this.expiryEpochSeconds.toString();
    }

    constructor(
        /** Internal representation of expiry. Seconds since unix epoch */
        public readonly expiryEpochSeconds: bigint
    ) {
        super();
    }

    toJSON(): number {
        return Number(this.expiryEpochSeconds);
    }
}

/**
 * Representation of a transaction expiry date.
 */
export { TransactionExpiry as Type };

/**
 * Construct a TransactionExpiry from a number of seconds since unix epoch.
 * @param {bigint | number} seconds Number of seconds since unix epoch.
 * @throws If provided a negative number.
 * @returns The transaction expiry.
 */
export function fromEpochSeconds(seconds: bigint | number): TransactionExpiry {
    if (seconds < 0n) {
        throw new Error(
            'Invalid transaction expiry: Expiry cannot be before unix epoch.'
        );
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
 * Takes a JSON string and converts it to instance of type {@linkcode Type}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(
    JSON_DISCRIMINATOR,
    (v: string) => fromEpochSeconds(BigInt(v))
);
