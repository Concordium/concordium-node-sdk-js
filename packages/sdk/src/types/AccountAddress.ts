import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';
import type * as Proto from '../grpc-api/v2/concordium/types.js';
import { TypeBase, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';
import { Base58String } from '../types.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.AccountAddress;
type Serializable = Base58String;

/**
 * Representation of an account address, which enforces that it:
 * - Is a valid base58 string with version byte of 1.
 * - The base58 string is a length of 50 (encoding exactly 32 bytes).
 */
class AccountAddress extends TypeBase<Serializable> {
    protected typedJsonType = JSON_DISCRIMINATOR;

    constructor(
        /** The account address represented in base58check. */
        public readonly address: string,
        /** The account address represented in bytes. */
        public readonly decodedAddress: Uint8Array
    ) {
        super();
    }

    protected get serializable(): Serializable {
        return this.address;
    }
}

/**
 * Representation of an account address, which enforces that it:
 * - Is a valid base58 string with version byte of 1.
 * - The base58 string is a length of 50 (encoding exactly 32 bytes).
 */
export type Type = AccountAddress;
export const instanceOf = (value: unknown): value is AccountAddress =>
    value instanceof AccountAddress;

/**
 * Type guard for AccountAddress
 * @param {unknown} input Input to check.
 * @returns {boolean} Boolean indicating whether input is an account address.
 */
export function isAccountAddress(input: unknown): input is AccountAddress {
    return (
        typeof input === 'object' &&
        input !== null &&
        'address' in input &&
        'decodedAddress' in input &&
        typeof input.address === 'string' &&
        input.address.length === 50
    );
}

/**
 * Construct an AccountAddress from a buffer of bytes.
 * @param {ArrayBuffer} buffer Buffer containing exactly 32 bytes representing the address of the account.
 * @throws If the provided buffer does not contain exactly 32 bytes.
 * @returns {AccountAddress} The AccountAddress.
 */
export function fromBuffer(buffer: ArrayBuffer): AccountAddress {
    if (buffer.byteLength !== 32) {
        throw new Error(
            `The provided buffer '${buffer}' is invalid as its length was not 32`
        );
    }

    const address = bs58check.encode(
        Buffer.concat([Uint8Array.of(1), new Uint8Array(buffer)])
    );
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
        throw new Error(
            `The provided address '${address}' is invalid as its length was not 50`
        );
    }
    const buffer = bs58check.decode(address);
    const versionByte = buffer.at(0);
    if (versionByte !== 1) {
        throw new Error(
            `The provided address '${address}' does not use version byte with value of 1`
        );
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

/** Type used when encoding the account address using a schema. */
export type SchemaValue = string;

/**
 * Get account address in the format used by schema.
 * @param {AccountAddress} accountAddress The account address.
 * @returns {SchemaValue} The schema value representation.
 */
export function toSchemaValue(accountAddress: AccountAddress): SchemaValue {
    return accountAddress.address;
}

const addressByteLength = 32;
const aliasBytesLength = 3;
const commonBytesLength = addressByteLength - aliasBytesLength;
const maxCount = 16777215; // 2^(8 * 3) - 1

/**
 * Given two accountAddresses, return whether they are aliases.
 * @param address an AccountAddress
 * @param alias another AccountAddress
 * @returns boolean that indicates whether address and alias are aliases
 */
export function isAlias(
    address: AccountAddress,
    alias: AccountAddress
): boolean {
    return (
        0 ===
        Buffer.from(address.decodedAddress).compare(
            alias.decodedAddress,
            0,
            commonBytesLength,
            0,
            commonBytesLength
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
export function getAlias(
    address: AccountAddress,
    counter: number
): AccountAddress {
    if (counter < 0 || counter > maxCount) {
        throw new Error(
            `An invalid counter value was given: ${counter}. The value has to satisfy that 0 <= counter < 2^24`
        );
    }
    const commonBytes = address.decodedAddress.slice(0, commonBytesLength);
    const aliasBytes = Buffer.alloc(aliasBytesLength);
    aliasBytes.writeUIntBE(counter, 0, aliasBytesLength);
    return fromBuffer(Buffer.concat([commonBytes, aliasBytes]));
}

/**
 * Convert an account address from its protobuf encoding.
 * @param {Proto.AccountAddress} accountAddress The account address in protobuf.
 * @returns {AccountAddress} The account address
 */
export function fromProto(
    accountAddress: Proto.AccountAddress
): AccountAddress {
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
 * Takes a JSON string and converts it to instance of type {@linkcode AccountAddress}.
 *
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {AccountAddress} The parsed instance.
 */
export const fromTypedJSON = makeFromTypedJson(JSON_DISCRIMINATOR, fromBase58);
