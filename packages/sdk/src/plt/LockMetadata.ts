import { cborDecode, cborEncode } from '../types/cbor.js';

/**
 * User-facing metadata attached to a lock at creation time.
 *
 * Known fields are `name` and `description`. Additional string-keyed CBOR
 * fields are preserved for custom metadata and future extensibility.
 */
export type Type = {
    /** Optional user-facing lock name. */
    name?: string;
    /** Optional user-facing lock description. */
    description?: string;
    /** Additional user-defined metadata fields. */
    [key: string]: unknown;
};

/**
 * Encode typed lock metadata to raw CBOR bytes suitable for `LockConfig.metadata`.
 *
 * @param metadata Typed lock metadata.
 * @returns Raw CBOR bytes encoding the metadata map.
 *
 * @example
 * const metadata = LockMetadata.encode({
 *   name: 'Vesting lock',
 *   description: 'Tokens locked by vesting schedule',
 *   issuer: 'Concordium',
 * });
 */
export function encode(metadata: Type): Uint8Array {
    return cborEncode(metadata);
}

/**
 * Decode typed lock metadata from raw CBOR bytes.
 *
 * @param rawMetadata Raw CBOR bytes from `LockConfig.metadata` or `LockInfo.metadata`.
 * @returns Typed lock metadata.
 * @throws If the raw bytes do not decode to an object, or if known fields have invalid types.
 */
export function decode(rawMetadata: Uint8Array): Type {
    const decoded = cborDecode(rawMetadata);
    if (typeof decoded !== 'object' || decoded === null || Array.isArray(decoded)) {
        throw new Error('Invalid LockMetadata: expected object');
    }

    const metadata = decoded as Record<string, unknown>;
    if ('name' in metadata && typeof metadata.name !== 'string') {
        throw new Error("Invalid LockMetadata: 'name' must be a string");
    }
    if ('description' in metadata && typeof metadata.description !== 'string') {
        throw new Error("Invalid LockMetadata: 'description' must be a string");
    }

    return metadata as Type;
}
