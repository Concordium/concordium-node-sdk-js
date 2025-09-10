import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';

import type * as Proto from '../grpc-api/v2/concordium/kernel.js';
import { Base58String } from '../types.js';
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

export const BYTES_LENGTH = 32;
const ALIAS_BYTES_LENGTH = 3;
const COMMON_BYTES_LENGTH = BYTES_LENGTH - ALIAS_BYTES_LENGTH;
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
export function fromProto(accountAddress: Proto.AccountAddress): AccountAddress {
    return fromBuffer(accountAddress.value);
}

/**
 * Convert an account address into its protobuf encoding.
 * @param {AccountAddress} accountAddress The account address.
 * @returns {Proto.AccountAddress} The protobuf encoding.
 */
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
