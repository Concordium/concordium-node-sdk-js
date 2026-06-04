import { decode } from 'cbor2/decoder';
import { encode, registerEncoder } from 'cbor2/encoder';
import { Tag } from 'cbor2/tag';

import * as TransactionExpiry from '../types/TransactionExpiry.js';

/** CBOR tag used for epoch-based time values. */
export const CBOR_TAG = 1;

/** CBOR epoch-time wrapper around a transaction expiry. */
class CborEpoch {
    #nominal = true;

    constructor(
        /** Expiry represented as seconds since Unix epoch. */
        public readonly expiry: TransactionExpiry.Type
    ) {}

    /**
     * Get a JSON-serializable representation of the epoch time.
     *
     * @returns epoch seconds.
     */
    public toJSON(): number {
        return this.expiry.toJSON();
    }
}

/** CBOR epoch-time value. */
export type Type = CborEpoch;

/**
 * Construct a CBOR epoch-time value from a transaction expiry.
 *
 * @param expiry transaction expiry to wrap.
 * @returns CBOR epoch-time value.
 */
export function fromTransactionExpiry(expiry: TransactionExpiry.Type): Type {
    return new CborEpoch(expiry);
}

/**
 * Extract the wrapped transaction expiry.
 *
 * @param epoch CBOR epoch-time value.
 * @returns transaction expiry.
 */
export function toTransactionExpiry(epoch: Type): TransactionExpiry.Type {
    return epoch.expiry;
}

/**
 * Construct a CBOR epoch-time value from seconds since Unix epoch.
 *
 * @param seconds seconds since Unix epoch.
 * @returns CBOR epoch-time value.
 */
export function fromEpochSeconds(seconds: bigint | number): Type {
    return fromTransactionExpiry(TransactionExpiry.fromEpochSeconds(seconds));
}

/**
 * Type predicate for {@linkcode Type}.
 *
 * @param value value to check.
 * @returns whether `value` is a CBOR epoch-time value.
 */
export function instanceOf(value: unknown): value is Type {
    return value instanceof CborEpoch;
}

/**
 * Convert a CBOR epoch-time value to its CBOR epoch-time tagged representation.
 *
 * @param epoch epoch-time value to convert.
 * @returns CBOR tag 1 containing the expiry epoch seconds.
 */
export function toCBORValue(epoch: Type): Tag {
    return new Tag(CBOR_TAG, epoch.expiry.expiryEpochSeconds);
}

/**
 * Encode a CBOR epoch-time value as bytes.
 *
 * @param epoch epoch-time value to encode.
 * @returns CBOR encoded bytes.
 */
export function toCBOR(epoch: Type): Uint8Array {
    return new Uint8Array(encode(toCBORValue(epoch)));
}

/**
 * Decode a CBOR epoch-time value.
 *
 * @param decoded decoded CBOR value. The cbor2 decoder can decode tag 1 as a `Date`, which is also accepted.
 * @returns decoded CBOR epoch-time value.
 */
export function fromCBORValue(decoded: unknown): Type {
    if (instanceOf(decoded)) {
        return decoded;
    }
    if (decoded instanceof Date) {
        return fromTransactionExpiry(TransactionExpiry.fromDate(decoded));
    }
    if (!(decoded instanceof Tag) || decoded.tag !== CBOR_TAG) {
        throw new Error('Invalid CBOR epoch time: expected CBOR tag 1');
    }
    const value = decoded.contents;
    if (typeof value !== 'number' && typeof value !== 'bigint') {
        throw new Error('Invalid CBOR epoch time: expected numeric epoch seconds');
    }
    return fromEpochSeconds(BigInt(value));
}

/**
 * Decode CBOR epoch-time bytes.
 *
 * @param bytes CBOR encoded epoch time.
 * @returns decoded CBOR epoch-time value.
 */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(decode(bytes));
}

/**
 * Register a CBOR encoder for CBOR epoch-time values with the `cbor2` library.
 */
export function registerCBOREncoder(): void {
    registerEncoder(CborEpoch, (value) => [CBOR_TAG, value.expiry.expiryEpochSeconds]);
}

/**
 * Register a CBOR decoder for CBOR epoch-time tag 1 with the `cbor2` library.
 *
 * @returns cleanup function restoring the previous decoder.
 */
export function registerCBORDecoder(): () => void {
    const old = Tag.registerDecoder(CBOR_TAG, fromCBORValue);

    return () => {
        if (old) {
            Tag.registerDecoder(CBOR_TAG, old);
        } else {
            Tag.clearDecoder(CBOR_TAG);
        }
    };
}
