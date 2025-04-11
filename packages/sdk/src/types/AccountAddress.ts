import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';
import { decode } from 'cbor2/decoder';
import { encode, registerEncoder } from 'cbor2/encoder';
import { Tag } from 'cbor2/tag';

import type * as Proto from '../grpc-api/v2/concordium/kernel.js';
import { Base58String } from '../types.js';
import { bail } from '../util.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.AccountAddress;
/**
 * @deprecated
 */
export type Serializable = Base58String;

/**
 * Representation of an account address, which enforces that it:
 * - Is a valid base58 string with version byte of 1.
 * - The base58 string is a length of 50 (encoding exactly 32 bytes).
 */
class AccountAddress {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** The account address represented in base58check. */
        public readonly address: string,
        /** The account address represented in bytes. */
        public readonly decodedAddress: Uint8Array
    ) {}

    /**
     * Get a string representation of the account address.
     *
     * @returns {string} The string representation.
     */
    public toString(): string {
        return toBase58(this);
    }

    /**
     * Get a JSON-serializable representation of the account address.
     * @returns {Base58String} The JSON-serializable representation.
     */
    public toJSON(): Base58String {
        return toBase58(this);
    }
}

/**
 * Converts a {@linkcode Base58String} to an account address.
 * @param {Base58String} json The JSON representation of the account address.
 * @returns {AccountAddress} The account address.
 */
export function fromJSON(json: Base58String): AccountAddress {
    return fromBase58(json);
}

/**
 * Unwraps {@linkcode Type} value.
 * @deprecated Use the {@linkcode AccountAddress.toJSON} method instead.
 * @param value value to unwrap.
 * @returns the unwrapped {@linkcode Serializable} value
 */
export function toUnwrappedJSON(value: Type): Serializable {
    return toBase58(value);
}

/**
 * Representation of an account address, which enforces that it:
 * - Is a valid base58 string with version byte of 1.
 * - The base58 string is a length of 50 (encoding exactly 32 bytes).
 */
export type Type = AccountAddress;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is AccountAddress {
    return value instanceof AccountAddress;
}

/**
 * Construct an AccountAddress from a buffer of bytes.
 * @param {ArrayBuffer} buffer Buffer containing exactly 32 bytes representing the address of the account.
 * @throws If the provided buffer does not contain exactly 32 bytes.
 * @returns {AccountAddress} The AccountAddress.
 */
export function fromBuffer(buffer: ArrayBuffer): AccountAddress {
    if (buffer.byteLength !== 32) {
        throw new Error(`The provided buffer '${buffer}' is invalid as its length was not 32`);
    }

    const address = bs58check.encode(Buffer.concat([Uint8Array.of(1), new Uint8Array(buffer)]));
    return new AccountAddress(address, new Uint8Array(buffer));
}

/**
 * Construct an AccountAddress from a base58check string.
 * @param {string} address String of base58check encoded account address, must use a byte version of 1.
 * @throws If the provided string is not: exactly 50 characters, a valid base58check encoding using version byte 1.
 * @returns {AccountAddress} The AccountAddress.
 */
export function fromBase58(address: string): AccountAddress {
    if (address.length !== 50) {
        throw new Error(`The provided address '${address}' is invalid as its length was not 50`);
    }
    const buffer = bs58check.decode(address);
    const versionByte = buffer.at(0);
    if (versionByte !== 1) {
        throw new Error(`The provided address '${address}' does not use version byte with value of 1`);
    }
    const decodedAddress = buffer.subarray(1, 33); // Ensure only the 32 bytes for the address is kept.
    return new AccountAddress(address, new Uint8Array(decodedAddress));
}

/**
 * Get the bytes corresponding to the account address.
 * @param {AccountAddress} accountAddress The account address.
 */
export function toBuffer(accountAddress: AccountAddress): Uint8Array {
    return accountAddress.decodedAddress;
}
/**
 * Get a base58check string of the account address.
 * @param {AccountAddress} accountAddress The account address.
 */
export function toBase58(accountAddress: AccountAddress): string {
    return accountAddress.address;
}

/** Type used when encoding an account address in the JSON format used when serializing using a smart contract schema type. */
export type SchemaValue = string;

/**
 * Get account address in the JSON format used when serializing using a smart contract schema type.
 * @param {AccountAddress} accountAddress The account address.
 * @returns {SchemaValue} The schema JSON representation.
 */
export function toSchemaValue(accountAddress: AccountAddress): SchemaValue {
    return accountAddress.address;
}

/**
 * Convert to account address from JSON format used when serializing using a smart contract schema type.
 * @param {SchemaValue} accountAddress The account address in schema JSON format.
 * @returns {AccountAddress} The account address.
 */
export function fromSchemaValue(accountAddress: SchemaValue): AccountAddress {
    return fromBase58(accountAddress);
}

const ADDRESS_BYTES_LENGTH = 32;
const ALIAS_BYTES_LENGTH = 3;
const COMMON_BYTES_LENGTH = ADDRESS_BYTES_LENGTH - ALIAS_BYTES_LENGTH;
const MAX_COUNT = 16777215; // 2^(8 * 3) - 1

/**
 * Given two accountAddresses, return whether they are aliases.
 * @param address an AccountAddress
 * @param alias another AccountAddress
 * @returns boolean that indicates whether address and alias are aliases
 */
export function isAlias(address: AccountAddress, alias: AccountAddress): boolean {
    return (
        0 ===
        Buffer.from(address.decodedAddress).compare(
            alias.decodedAddress,
            0,
            COMMON_BYTES_LENGTH,
            0,
            COMMON_BYTES_LENGTH
        )
    );
}

/**
 * Given an AccountAddress and a counter, returns an alias for the address.
 * @param address the account address for which the function should get an alias for
 * @param counter number s.t. 0 <= counter < 2^24, decides which alias is returned.
 * If a counter outside this scope is given, then the function will throw an exception
 * @returns an AccountAddress, which is an alias to the given address
 */
export function getAlias(address: AccountAddress, counter: number): AccountAddress {
    if (counter < 0 || counter > MAX_COUNT) {
        throw new Error(
            `An invalid counter value was given: ${counter}. The value has to satisfy that 0 <= counter < 2^24`
        );
    }
    const commonBytes = address.decodedAddress.slice(0, COMMON_BYTES_LENGTH);
    const aliasBytes = Buffer.alloc(ALIAS_BYTES_LENGTH);
    aliasBytes.writeUIntBE(counter, 0, ALIAS_BYTES_LENGTH);
    return fromBuffer(Buffer.concat([commonBytes, aliasBytes]));
}

/**
 * Convert an account address from its protobuf encoding.
 * @param {Proto.AccountAddress} accountAddress The account address in protobuf.
 * @returns {AccountAddress} The account address
 */
// TODO: figure out a way to exclude this from the public entrypoint
export function fromProto(accountAddress: Proto.AccountAddress): AccountAddress {
    return fromBuffer(accountAddress.value);
}

/**
 * Convert an account address into its protobuf encoding.
 * @param {AccountAddress} accountAddress The account address.
 * @returns {Proto.AccountAddress} The protobuf encoding.
 */
// TODO: figure out a way to exclude this from the public entrypoint
export function toProto(accountAddress: AccountAddress): Proto.AccountAddress {
    return {
        value: accountAddress.decodedAddress,
    };
}

/**
 * Check if two account addresses are the exact same. This will not consider different aliases for the same account as equal.
 * @param {AccountAddress} left
 * @param {AccountAddress} right
 * @returns {boolean} True if they are equal.
 */
export function equals(left: AccountAddress, right: AccountAddress): boolean {
    return left.address === right.address;
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode AccountAddress.toJSON} method instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: AccountAddress): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toBase58(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the {@linkcode fromJSON} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromBase58);

const TAGGED_COININFO = 40305;
const TAGGED_ADDRESS = 40307;
const CCD_NETWORK_ID = 919; // Concordium network identifier - Did you know 919 is a palindromic prime and a centred hexagonal number?

function toCBORValue(value: AccountAddress): Map<number, any> {
    const taggedCoinInfo = new Tag(TAGGED_COININFO, new Map([[1, CCD_NETWORK_ID]]));
    return new Map<number, any>([
        [1, taggedCoinInfo],
        [3, value.decodedAddress],
    ]);
}

/**
 * Converts an AccountAddress to its CBOR (Concise Binary Object Representation) encoding.
 * This encodes the account address as a CBOR tagged value with tag 40307, containing both
 * the coin information (tagged as 40305) and the account's decoded address.
 *
 * This corresponds to a concordium-specific subtype of the `tagged-address` type from
 * [BCR-2020-009]{@link https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-009-address.md},
 * identified by `tagged-coininfo` corresponding to the Concordium network from
 * [BCR-2020-007]{@link https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-007-hdkey.md}
 *
 * Example of CBOR diagnostic notation for an encoded account address:
 * ```
 * 40307({
 *   1: 40305({1: 919}),
 *   3: h'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
 * })
 * ```
 * Where 919 is the Concordium network identifier and the hex string is the raw account address.
 *
 * @param {AccountAddress} value - The account address to convert to CBOR format.
 * @throws {Error} - If an unsupported CBOR encoding is specified.
 * @returns {Uint8Array} The CBOR encoded representation of the account address.
 */
export function toCBOR(value: AccountAddress): Uint8Array {
    const tagged = new Tag(TAGGED_ADDRESS, toCBORValue(value));
    return new Uint8Array(encode(tagged));
}

/**
 * Registers a CBOR encoder for the AccountAddress type with the `cbo2` library.
 * This allows AccountAddress instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now AccountAddress instances can be encoded directly
 * const encoded = encode(myAccountAddress);
 */
export function registerCBOREncoder(): void {
    registerEncoder(AccountAddress, (value) => [TAGGED_ADDRESS, toCBORValue(value)]);
}

function parseCBORValue(decoded: unknown): AccountAddress {
    // Verify we have a tagged value with tag 40307 (tagged-address)
    if (!(decoded instanceof Tag) || decoded.tag !== TAGGED_ADDRESS) {
        throw new Error(`Invalid CBOR encoded account address: expected tag ${TAGGED_ADDRESS}`);
    }

    const value = decoded.contents;

    if (!(value instanceof Map)) {
        throw new Error('Invalid CBOR encoded account address: expected a map');
    }

    // Verify the map corresponds to the BCR-2020-009 `address` format
    const validKeys = [1, 2, 3]; // we allow 2 here, as it is in the spec for BCR-2020-009 `address`, but we don't use it
    for (const key of value.keys()) {
        validKeys.includes(key) || bail(`Invalid CBOR encoded account address: unexpected key ${key}`);
    }

    // Extract the account address bytes (key 3)
    const addressBytes = value.get(3);
    if (!addressBytes || !(addressBytes instanceof Uint8Array) || addressBytes.byteLength !== ADDRESS_BYTES_LENGTH) {
        throw new Error('Invalid CBOR encoded account address: missing or invalid address bytes');
    }

    // Optional validation for coin information if present (key 1)
    const coinInfo = value.get(1);
    if (coinInfo !== undefined) {
        // Verify coin info has the correct tag if present
        if (!(coinInfo instanceof Tag) || coinInfo.tag !== TAGGED_COININFO) {
            throw new Error(
                `Invalid CBOR encoded account address: coin info has incorrect tag (expected ${TAGGED_COININFO})`
            );
        }

        // Verify coin info contains Concordium network identifier if present
        const coinInfoMap = coinInfo.contents;
        if (!(coinInfoMap instanceof Map) || coinInfoMap.get(1) !== CCD_NETWORK_ID) {
            throw new Error(
                `Invalid CBOR encoded account address: coin info does not contain Concordium network identifier ${CCD_NETWORK_ID}`
            );
        }

        // Verify the map corresponds to the BCR-2020-007 `coininfo` format
        const validKeys = [1, 2]; // we allow 2 here, as it is in the spec for BCR-2020-007 `coininfo`, but we don't use it
        for (const key of coinInfoMap.keys()) {
            validKeys.includes(key) || bail(`Invalid CBOR encoded coininfo: unexpected key ${key}`);
        }
    }

    // Create the AccountAddress from the extracted bytes
    return fromBuffer(addressBytes);
}

/**
 * Decodes a CBOR-encoded account address into an AccountAddress instance.
 * This function can handle both the full tagged format (with coin information)
 * and a simplified format with just the address bytes.
 *
 * 1. With `tagged-coininfo` (40305):
 * ```
 * 40307({
 *   1: 40305({1: 919}),  // Optional coin information
 *   3: h'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
 * })
 * ```
 *
 * 2. Without `tagged-coininfo`:
 * ```
 * 40307({
 *   3: h'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
 * }) // The address is assumed to be a Concordium address
 * ```
 *
 * @param {Uint8Array} bytes - The CBOR encoded representation of an account address.
 * @throws {Error} - If the input is not a valid CBOR encoding of an account address.
 * @returns {AccountAddress} The decoded AccountAddress instance.
 */
export function fromCBOR(bytes: Uint8Array): AccountAddress {
    return parseCBORValue(decode(bytes));
}

/**
 * Registers a CBOR decoder for the tagged-address (40307) format with the `cbor2` library.
 * This enables automatic decoding of CBOR data containing Concordium account addresses
 * when using the `cbor2` library's decode function.
 *
 * @returns {() => void} A cleanup function that, when called, will restore the previous
 * decoder (if any) that was registered for the tagged-address format. This is useful
 * when used in an existing `cbor2` use-case.
 *
 * @example
 * // Register the decoder
 * const cleanup = registerCBORDecoder();
 * // Use the decoder
 * const address = decode(cborBytes); // Returns AccountAddress if format matches
 * // Later, unregister the decoder
 * cleanup();
 */
export function registerCBORDecoder(): () => void {
    const old = Tag.registerDecoder(TAGGED_ADDRESS, parseCBORValue);

    // return cleanup function to restore the old decoder
    return () => {
        if (old) {
            Tag.registerDecoder(TAGGED_ADDRESS, old);
        } else {
            Tag.clearDecoder(TAGGED_ADDRESS);
        }
    };
}
