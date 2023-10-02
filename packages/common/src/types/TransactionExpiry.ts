import { secondsSinceEpoch } from '../util.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';

/**
 * Representation of a transaction expiry date.
 */
class TransactionExpiry {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** Internal representation of expiry. Seconds since unix epoch */
        public expiryEpochSeconds: bigint
    ) {}

    toJSON(): number {
        return Number(this.expiryEpochSeconds);
    }
}

/**
 * Representation of a transaction expiry date.
 */
export type Type = TransactionExpiry;

export function fromEpochSeconds(seconds: bigint): TransactionExpiry {
    if (seconds < 0n) {
        throw new Error(
            'Invalid transaction expiry: Expiry cannot be before unix epoch.'
        );
    }
    return new TransactionExpiry(seconds);
}

export function fromDate(expiry: Date) {
    return fromEpochSeconds(secondsSinceEpoch(expiry));
}

export function toDate(expiry: TransactionExpiry): Date {
    return new Date(Number(expiry.expiryEpochSeconds) * 1000);
}

export function futureMinutes(minutes: number) {
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
