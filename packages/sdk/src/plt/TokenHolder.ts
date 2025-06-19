import { Tag, decode } from 'cbor2';
import { encode, registerEncoder } from 'cbor2/encoder';

import { Base58String } from '../index.js';
import { AccountAddress } from '../types/index.js';
import { bail } from '../util.js';

interface TokenHolder<T extends string> {
    readonly type: T;
}

type TokenHolderAccountJSON = {
    type: 'account';
    address: Base58String;
};

class TokenHolderAccount implements TokenHolder<'account'> {
    #nominal = true;
    public readonly type = 'account';

    constructor(
        /** The address of the account holding the token. */
        public readonly address: AccountAddress.Type
    ) {}

    public toString(): string {
        return this.address.toString();
    }

    public toJSON(): TokenHolderAccountJSON {
        return {
            type: this.type,
            address: this.address.toJSON(),
        };
    }
}

export type Type = TokenHolderAccount;
export type JSON = TokenHolderAccountJSON;

export function fromAccountAddress(address: AccountAddress.Type): TokenHolderAccount {
    return new TokenHolderAccount(address);
}

export function fromJSON(json: JSON): Type {
    switch (json.type) {
        case 'account':
            return fromAccountAddress(AccountAddress.fromJSON(json.address));
    }
}

export function instanceOf(value: unknown): value is Type {
    return value instanceof TokenHolderAccount;
}

// CBOR

type AccountCBOR = Map<number, any>;

type CBOR = AccountCBOR;

const TAGGED_COININFO = 40305;
const TAGGED_ADDRESS = 40307;
const CCD_NETWORK_ID = 919; // Concordium network identifier - Did you know 919 is a palindromic prime and a centred hexagonal number?

function toCBORValue(value: Type): CBOR {
    switch (value.type) {
        case 'account':
            return toCBORValueAccount(value as TokenHolderAccount);
    }
}

function toCBORValueAccount(value: TokenHolderAccount): AccountCBOR {
    const taggedCoinInfo = new Tag(TAGGED_COININFO, new Map([[1, CCD_NETWORK_ID]]));
    return new Map<number, any>([
        [1, taggedCoinInfo],
        [3, value.address.decodedAddress],
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
export function toCBOR(value: Type): Uint8Array {
    switch (value.type) {
        case 'account':
            return toCBORAccount(value as TokenHolderAccount);
    }
}

function toCBORAccount(value: TokenHolderAccount): Uint8Array {
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
    registerEncoder(TokenHolderAccount, (value) => [TAGGED_ADDRESS, toCBORValue(value)]);
}

function parseCBORValue(value: unknown): Type {
    if (value instanceof Tag && value.tag === TAGGED_ADDRESS) {
        return parseCBORValueAccount(value.contents);
    }

    throw new Error(`Faid to decode 'TokenHolder.Type' from CBOR value: ${value}`);
}

function parseCBORValueAccount(value: unknown): TokenHolderAccount {
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
    if (
        !addressBytes ||
        !(addressBytes instanceof Uint8Array) ||
        addressBytes.byteLength !== AccountAddress.BYTES_LENGTH
    ) {
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
    const account = AccountAddress.fromBuffer(addressBytes);
    return fromAccountAddress(account);
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
export function fromCBOR(bytes: Uint8Array): Type {
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
    const old = [Tag.registerDecoder(TAGGED_ADDRESS, parseCBORValue)];

    // return cleanup function to restore the old decoder
    return () => {
        for (const decoder of old) {
            if (decoder) {
                Tag.registerDecoder(TAGGED_ADDRESS, decoder);
            } else {
                Tag.clearDecoder(TAGGED_ADDRESS);
            }
        }
    };
}
