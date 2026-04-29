import { Tag } from 'cbor2/tag';

import * as TransactionExpiry from '../types/TransactionExpiry.js';
import * as Cbor from './Cbor.js';
import * as CborAccountAddress from './CborAccountAddress.js';
import * as LockController from './LockController.js';

/** Lock configuration used by `lockCreate` meta update operations. */
export type Type = {
    /** Accounts that are permitted to receive funds controlled by the lock. */
    recipients: CborAccountAddress.Type[];
    /** Lock expiry time. */
    expiry: TransactionExpiry.Type;
    /** Lock controller configuration. */
    controller: LockController.Type;
};

/**
 * Construct a lock configuration.
 *
 * @param recipients accounts that may receive funds controlled by the lock.
 * @param expiry lock expiry time.
 * @param controller lock controller configuration.
 * @returns a lock configuration.
 */
export function create(
    recipients: CborAccountAddress.Type[],
    expiry: TransactionExpiry.Type,
    controller: LockController.Type
): Type {
    return {
        recipients,
        expiry,
        controller,
    };
}

function epochTimeToCBOR(expiry: TransactionExpiry.Type): Tag {
    return new Tag(1, expiry.expiryEpochSeconds);
}

function epochTimeFromCBOR(decoded: unknown): TransactionExpiry.Type {
    if (decoded instanceof Date) {
        return TransactionExpiry.fromDate(decoded);
    }
    if (!(decoded instanceof Tag) || decoded.tag !== 1) {
        throw new Error('Invalid lock config: expected expiry as CBOR epoch time tag');
    }
    const value = decoded.contents;
    if (typeof value !== 'number' && typeof value !== 'bigint') {
        throw new Error('Invalid lock config: expected numeric expiry');
    }
    return TransactionExpiry.fromEpochSeconds(BigInt(value));
}

/**
 * Convert a lock configuration to its CBOR-compatible intermediary value.
 *
 * @param config lock configuration to convert.
 * @returns a value suitable for CBOR encoding.
 */
export function toCBORValue(config: Type): object {
    return {
        recipients: config.recipients,
        expiry: epochTimeToCBOR(config.expiry),
        controller: LockController.toCBORValue(config.controller),
    };
}

/**
 * Encode a lock configuration to CBOR bytes.
 *
 * @param config lock configuration to encode.
 * @returns CBOR encoded bytes.
 */
export function toCBOR(config: Type): Uint8Array {
    return Cbor.encode(toCBORValue(config)).bytes;
}

/**
 * Decode a CBOR-compatible intermediary value as a lock configuration.
 *
 * @param decoded decoded CBOR value.
 * @returns the decoded lock configuration.
 */
export function fromCBORValue(decoded: unknown): Type {
    if (typeof decoded !== 'object' || decoded === null) {
        throw new Error('Invalid lock config: expected object');
    }

    const value = decoded as Record<string, unknown>;
    if (!Array.isArray(value.recipients) || !value.recipients.every(CborAccountAddress.instanceOf)) {
        throw new Error('Invalid lock config: expected recipients array');
    }

    return create(value.recipients, epochTimeFromCBOR(value.expiry), LockController.fromCBORValue(value.controller));
}

/**
 * Decode CBOR bytes as a lock configuration.
 *
 * @param bytes CBOR encoded lock configuration.
 * @returns the decoded lock configuration.
 */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(Cbor.decode(Cbor.fromBuffer(bytes)));
}
