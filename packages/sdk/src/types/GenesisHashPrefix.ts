import { MAINNET_GENESIS_HASH, TESTNET_GENESIS_HASH } from '../constants.js';
import type { HexString } from '../types.js';
import * as BlockHash from './BlockHash.js';

/** The number of hex characters of a genesis block hash used to identify a network. */
const GENESIS_HASH_PREFIX_HEX_LENGTH = 32;
const GENESIS_HASH_PREFIX_REGEX = /^[0-9a-f]{32}$/;

declare const genesisHashPrefixBrand: unique symbol;

/**
 * The first 32 lowercase hex characters (16 bytes) of the hash of a chain's genesis block.
 * Identifies a Concordium network without relying on a name, and matches the reference part of
 * `ccd:<prefix>` chain IDs and the network segment of `did:ccd:<prefix>:...` DIDs.
 */
export type Type = HexString & { readonly [genesisHashPrefixBrand]: true };

/** Genesis hash prefix of Concordium testnet. */
export const TESTNET = TESTNET_GENESIS_HASH.slice(0, GENESIS_HASH_PREFIX_HEX_LENGTH) as Type;
/** Genesis hash prefix of Concordium mainnet. */
export const MAINNET = MAINNET_GENESIS_HASH.slice(0, GENESIS_HASH_PREFIX_HEX_LENGTH) as Type;

/**
 * Type predicate for {@linkcode Type}: exactly 32 lowercase hex characters.
 *
 * @param value - The value to check.
 * @returns Whether `value` is a genesis hash prefix.
 */
export function instanceOf(value: unknown): value is Type {
    return typeof value === 'string' && GENESIS_HASH_PREFIX_REGEX.test(value);
}

/**
 * Create a genesis hash prefix from a hex string.
 *
 * @param hex - Exactly 32 lowercase hex characters.
 * @throws If `hex` is not a genesis hash prefix.
 * @returns The genesis hash prefix.
 */
export function fromHexString(hex: HexString): Type {
    if (!instanceOf(hex)) {
        throw new Error(
            `Invalid genesis hash prefix: ${hex}. Expected ${GENESIS_HASH_PREFIX_HEX_LENGTH} lowercase hex characters.`
        );
    }
    return hex;
}

/**
 * Take the prefix of a full genesis block hash.
 *
 * @param hash - The genesis block hash, as a {@linkcode BlockHash.Type} or a hex string.
 * @returns The genesis hash prefix.
 */
export function fromGenesisHash(hash: BlockHash.Type | HexString): Type {
    const hex = typeof hash === 'string' ? hash.toLowerCase() : BlockHash.toHexString(hash);
    return fromHexString(hex.slice(0, GENESIS_HASH_PREFIX_HEX_LENGTH));
}

/**
 * Get the hex string representation of a genesis hash prefix.
 *
 * @param prefix - The genesis hash prefix.
 * @returns The 32 lowercase hex characters.
 */
export function toHexString(prefix: Type): HexString {
    return prefix;
}
