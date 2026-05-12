import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';
import { decode } from 'cbor2/decoder';
import { encode, registerEncoder } from 'cbor2/encoder';
import { Tag } from 'cbor2/tag';

import { MAX_U64 } from '../constants.js';
import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import type * as AccountAddress from '../types/AccountAddress.js';
import { uleb128DecodeWithIndex, uleb128Encode } from '../uleb128.js';

/** JSON representation of a lock identifier. */
export type JSON = {
    /** Account index of the account that created the lock. */
    accountIndex: bigint;
    /** Sequence number of the transaction that created the lock. */
    sequenceNumber: bigint;
    /** 0-based creation order of the lock within the transaction. */
    creationOrder: bigint;
};

class LockId {
    #nominal = true;

    constructor(
        public readonly accountIndex: bigint,
        public readonly sequenceNumber: bigint,
        public readonly creationOrder: bigint
    ) {
        for (const [field, value] of Object.entries({ accountIndex, sequenceNumber, creationOrder })) {
            if (value < 0n) {
                throw new Error(`LockId ${field} cannot be negative`);
            }
            if (value > MAX_U64) {
                throw new Error(`LockId ${field} cannot be larger than ${MAX_U64}`);
            }
        }
    }

    /**
     * Encode the lock id as Base58Check with version byte 3 over the concatenated ULEB128 encodings of
     * `(accountIndex, sequenceNumber, creationOrder)`.
     *
     * @returns the string representation.
     */
    public toString(): string {
        return bs58check.encode(
            Buffer.concat([
                Buffer.of(BASE58CHECK_VERSION),
                uleb128Encode(this.accountIndex),
                uleb128Encode(this.sequenceNumber),
                uleb128Encode(this.creationOrder),
            ])
        );
    }

    public toJSON(): JSON {
        return {
            accountIndex: this.accountIndex,
            sequenceNumber: this.sequenceNumber,
            creationOrder: this.creationOrder,
        };
    }
}

/** Lock identifier. */
export type Type = LockId;

/** CBOR tag used to encode a lock identifier (tag 40920). */
const CBOR_TAG = 40920;
/** Base58Check version byte used for lock identifier string representations. */
const BASE58CHECK_VERSION = 3;

/**
 * Construct a lock identifier.
 *
 * @param accountIndex account index of the account that created the lock.
 * @param sequenceNumber sequence number of the transaction that created the lock.
 * @param creationOrder 0-based creation order of the lock within the transaction.
 * @returns a lock identifier.
 */
export function create(accountIndex: bigint, sequenceNumber: bigint, creationOrder: bigint): LockId {
    return new LockId(accountIndex, sequenceNumber, creationOrder);
}

/**
 * Construct the lock identifier that would be assigned to the next lock created by an account.
 *
 * This resolves the account's current nonce and account index from chain and combines them with
 * the provided creation order. The returned identifier is only accurate as long as no other
 * transaction consumes the account's next nonce before the lock creation transaction is submitted.
 *
 * @param grpc gRPC client used to resolve account info.
 * @param account account address or account index of the account that will create the lock.
 * @param creationOrder 0-based creation order of the lock within the transaction. Defaults to `0`.
 * @returns a lock identifier for the next lock created by the account.
 */
export async function fromAccount(
    grpc: ConcordiumGRPCClient,
    account: AccountAddress.Type | bigint,
    creationOrder: bigint | number = 0n
): Promise<LockId> {
    const accountInfo = await grpc.getAccountInfo(account);
    return create(accountInfo.accountIndex, accountInfo.accountNonce.value, BigInt(creationOrder));
}

/**
 * Construct a lock identifier from its JSON representation.
 *
 * @param json JSON representation of a lock identifier.
 * @returns a lock identifier.
 */
export function fromJSON(json: JSON): LockId {
    return create(BigInt(json.accountIndex), BigInt(json.sequenceNumber), BigInt(json.creationOrder));
}

/**
 * Construct a lock identifier from its Base58Check string representation.
 *
 * The encoded bytes are expected to consist of version byte 3 followed by the ULEB128 encodings of
 * `(accountIndex, sequenceNumber, creationOrder)`.
 *
 * @param value string representation of a lock identifier.
 * @returns a lock identifier.
 */
export function fromString(value: string): LockId {
    const bytes = Buffer.from(bs58check.decode(value));
    if (bytes[0] !== BASE58CHECK_VERSION) {
        throw new Error(
            `Invalid lock ID format "${value}". Expected a Base58Check string with version byte ${BASE58CHECK_VERSION}.`
        );
    }

    const [accountIndex, i] = uleb128DecodeWithIndex(bytes, 1);
    const [sequenceNumber, j] = uleb128DecodeWithIndex(bytes, i);
    const [creationOrder, k] = uleb128DecodeWithIndex(bytes, j);
    if (k !== bytes.length) {
        throw new Error(`Invalid lock ID format "${value}". Expected exactly three ULEB128-encoded components.`);
    }

    return create(accountIndex, sequenceNumber, creationOrder);
}

/**
 * Construct a lock identifier from its protobuf representation.
 *
 * @param lockId protobuf lock id.
 * @returns a lock identifier.
 */
export function fromProto(lockId: Proto.LockId): LockId {
    return create(lockId.accountIndex, lockId.sequenceNumber, lockId.creationOrder);
}

/**
 * Convert a lock identifier into its protobuf representation.
 *
 * @param lockId lock identifier.
 * @returns protobuf lock id.
 */
export function toProto(lockId: LockId): Proto.LockId {
    return {
        accountIndex: lockId.accountIndex,
        sequenceNumber: lockId.sequenceNumber,
        creationOrder: lockId.creationOrder,
    };
}

/**
 * Type predicate — returns `true` if `value` is a {@linkcode Type}.
 *
 * @param value value to check.
 */
export function instanceOf(value: unknown): value is LockId {
    return value instanceof LockId;
}

function toCBORValue(value: LockId): [bigint, bigint, bigint] {
    return [value.accountIndex, value.sequenceNumber, value.creationOrder];
}

/**
 * Encode a lock identifier as CBOR bytes.
 *
 * @param value lock identifier to encode.
 * @returns CBOR encoded bytes.
 */
export function toCBOR(value: LockId): Uint8Array {
    return new Uint8Array(encode(new Tag(CBOR_TAG, toCBORValue(value))));
}

/**
 * Decode a CBOR-compatible intermediary value as a lock identifier.
 *
 * @param decoded decoded CBOR value.
 * @returns a lock identifier.
 */
export function fromCBORValue(decoded: unknown): LockId {
    if (!(decoded instanceof Tag) || decoded.tag !== CBOR_TAG) {
        throw new Error(`Invalid CBOR encoded lock id: expected tag ${CBOR_TAG}`);
    }

    const value = decoded.contents;
    if (!Array.isArray(value) || value.length !== 3) {
        throw new Error('Invalid CBOR encoded lock id: expected an array with three elements');
    }

    const [accountIndex, sequenceNumber, creationOrder] = value;
    if (
        (typeof accountIndex !== 'number' && typeof accountIndex !== 'bigint') ||
        (typeof sequenceNumber !== 'number' && typeof sequenceNumber !== 'bigint') ||
        (typeof creationOrder !== 'number' && typeof creationOrder !== 'bigint')
    ) {
        throw new Error('Invalid CBOR encoded lock id: expected numeric components');
    }

    return create(BigInt(accountIndex), BigInt(sequenceNumber), BigInt(creationOrder));
}

/**
 * Decode CBOR bytes as a lock identifier.
 *
 * @param bytes CBOR encoded lock identifier.
 * @returns a lock identifier.
 */
export function fromCBOR(bytes: Uint8Array): LockId {
    return fromCBORValue(decode(bytes));
}

/** Register the lock identifier CBOR encoder globally with cbor2. */
export function registerCBOREncoder(): void {
    registerEncoder(LockId, (value) => [CBOR_TAG, toCBORValue(value)]);
}

/**
 * Register the lock identifier CBOR decoder globally with cbor2.
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
