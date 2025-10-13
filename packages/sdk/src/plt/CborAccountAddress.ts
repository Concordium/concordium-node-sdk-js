import { Tag, decode } from 'cbor2';
import { encode, registerEncoder } from 'cbor2/encoder';

import { Base58String } from '../index.js';
import { AccountAddress } from '../types/index.js';
import { bail } from '../util.js';

const CCD_NETWORK_ID = 919; // Concordium network identifier - Did you know 919 is a palindromic prime and a centred hexagonal number?

/** JSON representation of a {@link Type}. */
export type JSON = {
    /** The address of the account holding the token. */
    address: Base58String;
    /** Optional coininfo describing the network for the account. */
    coinInfo?: typeof CCD_NETWORK_ID;
};

class CborAccountAddress {
    #nominal = true;

    constructor(
        /** The address of the account holding the token. */
        public readonly address: AccountAddress.Type,
        /**
         * Optional coin info describing the network for the account. If this is `undefined`
         * it is interpreted as a Concordium account.
         */
        public readonly coinInfo: typeof CCD_NETWORK_ID | undefined
    ) {}

    public toString(): string {
        return this.address.toString();
    }

    /**
     * Get a JSON-serializable representation of the account address. This is called implicitly when serialized with JSON.stringify.
     * @returns {JSON} The JSON representation.
     */
    public toJSON(): JSON {
        return {
            address: this.address.toJSON(),
            coinInfo: this.coinInfo,
        };
    }
}

/**
 * Public type alias for the CBOR aware AccountAddress wrapper.
 * Instances are created via the helper factory functions rather than the class constructor.
 */
export type Type = CborAccountAddress;

/**
 * Construct a {@link Type} from an existing {@link AccountAddress.Type}.
 * Coin information will default to the Concordium network id (919).
 */
export function fromAccountAddress(address: AccountAddress.Type): CborAccountAddress {
    return new CborAccountAddress(address, CCD_NETWORK_ID);
}

/**
 * Recreate a {@link Type} from its JSON form.
 * @throws {Error} If the supplied coinInfo is present and not the Concordium network id.
 */
export function fromJSON(json: JSON): Type {
    if (json.coinInfo !== undefined && json.coinInfo !== CCD_NETWORK_ID) {
        throw new Error(`Unsupported coin info for account address: ${json.coinInfo}. Expected ${CCD_NETWORK_ID}.`);
    }
    return new CborAccountAddress(AccountAddress.fromJSON(json.address), json.coinInfo);
}

/**
 * Construct a CborAccountAddress from a base58check string.
 *
 * @param {string} address String of base58check encoded account address, must use a byte version of 1.
 * @returns {CborAccountAddress} The CborAccountAddress.
 * @throws If the provided string is not: exactly 50 characters, a valid base58check encoding using version byte 1.
 */
export function fromBase58(address: string): CborAccountAddress {
    return fromAccountAddress(AccountAddress.fromBase58(address));
}

/**
 * Get a base58check string of the account address.
 * @param {CborAccountAddress} accountAddress The account address.
 */
export function toBase58(accountAddress: CborAccountAddress): string {
    return accountAddress.address.address;
}

/**
 * Type predicate which checks if a value is an instance of {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Type {
    return value instanceof CborAccountAddress;
}

// CBOR
const TAGGED_ADDRESS = 40307;
const TAGGED_COININFO = 40305;

/**
 * Converts an {@linkcode Account} to a CBOR tagged value.
 * This encodes the account address as a CBOR tagged value with tag 40307, containing both
 * the coin information (tagged as 40305) and the account's decoded address.
 */
function toCBORValue(value: Type): Tag {
    let mapContents: [number, any][];
    if (value.coinInfo === undefined) {
        mapContents = [[3, value.address.decodedAddress]];
    } else {
        const taggedCoinInfo = new Tag(TAGGED_COININFO, new Map([[1, CCD_NETWORK_ID]]));
        mapContents = [
            [1, taggedCoinInfo],
            [3, value.address.decodedAddress],
        ];
    }

    const map = new Map<number, any>(mapContents);
    return new Tag(TAGGED_ADDRESS, map);
}

/**
 * Converts an CborAccountAddress to its CBOR (Concise Binary Object Representation) encoding.
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
 * @param {Type} value - The token holder to convert to CBOR format.
 * @throws {Error} - If an unsupported CBOR encoding is specified.
 * @returns {Uint8Array} The CBOR encoded representation of the token holder.
 */
export function toCBOR(value: Type): Uint8Array {
    return new Uint8Array(encode(toCBORValue(value)));
}

/**
 * Registers a CBOR encoder for the CborAccountAddress type with the `cbor2` library.
 * This allows CborAccountAddress instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now CborAccountAddress instances can be encoded directly
 * const encoded = encode(myCborAccountAddress);
 */
export function registerCBOREncoder(): void {
    registerEncoder(CborAccountAddress, (value) => [TAGGED_ADDRESS, toCBORValue(value).contents]);
}

/**
 * Decodes a CBOR-encoded token holder account into an {@linkcode Account} instance.
 * @param {unknown} decoded - The CBOR decoded value, expected to be a tagged value with tag 40307.
 * @throws {Error} - If the decoded value is not a valid CBOR encoded token holder account.
 * @returns {Account} The decoded account address as a CborAccountAddress instance.
 */
function fromCBORValueAccount(decoded: unknown): CborAccountAddress {
    // Verify we have a tagged value with tag 40307 (tagged-address)
    if (!(decoded instanceof Tag) || decoded.tag !== TAGGED_ADDRESS) {
        throw new Error(`Invalid CBOR encoded token holder account: expected tag ${TAGGED_ADDRESS}`);
    }

    const value = decoded.contents;

    if (!(value instanceof Map)) {
        throw new Error('Invalid CBOR encoded token holder account: expected a map');
    }

    // Verify the map corresponds to the BCR-2020-009 `address` format
    const validKeys = [1, 2, 3]; // we allow 2 here, as it is in the spec for BCR-2020-009 `address`, but we don't use it
    for (const key of value.keys()) {
        validKeys.includes(key) || bail(`Invalid CBOR encoded token holder account: unexpected key ${key}`);
    }

    // Extract the token holder account bytes (key 3)
    const addressBytes = value.get(3);
    if (
        !addressBytes ||
        !(addressBytes instanceof Uint8Array) ||
        addressBytes.byteLength !== AccountAddress.BYTES_LENGTH
    ) {
        throw new Error('Invalid CBOR encoded token holder account: missing or invalid address bytes');
    }

    // Optional validation for coin information if present (key 1)
    const coinInfo = value.get(1);
    let coinInfoValue = undefined;
    if (coinInfo !== undefined) {
        // Verify coin info has the correct tag if present
        if (!(coinInfo instanceof Tag) || coinInfo.tag !== TAGGED_COININFO) {
            throw new Error(
                `Invalid CBOR encoded token holder account: coin info has incorrect tag (expected ${TAGGED_COININFO})`
            );
        }

        // Verify coin info contains Concordium network identifier if present
        const coinInfoMap = coinInfo.contents;
        if (!(coinInfoMap instanceof Map) || coinInfoMap.get(1) !== CCD_NETWORK_ID) {
            throw new Error(
                `Invalid CBOR token holder account: coin info does not contain Concordium network identifier ${CCD_NETWORK_ID}`
            );
        }
        coinInfoValue = coinInfoMap.get(1);

        // Verify the map corresponds to the BCR-2020-007 `coininfo` format
        const validKeys = [1, 2]; // we allow 2 here, as it is in the spec for BCR-2020-007 `coininfo`, but we don't use it
        for (const key of coinInfoMap.keys()) {
            validKeys.includes(key) || bail(`Invalid CBOR encoded coininfo: unexpected key ${key}`);
        }
    }

    // Create the AccountAddress from the extracted bytes
    return new CborAccountAddress(AccountAddress.fromBuffer(addressBytes), coinInfoValue);
}

/**
 * Decodes a CBOR value into a CborAccountAddress instance.
 * This function checks if the value is a tagged address (40307) and decodes it accordingly.
 *
 * @param {unknown} value - The CBOR decoded value, expected to be a tagged address.
 * @throws {Error} - If the value is not a valid CBOR encoded token holder account.
 * @returns {Type} The decoded CborAccountAddress instance.
 */
export function fromCBORValue(value: unknown): Type {
    if (value instanceof Tag && value.tag === TAGGED_ADDRESS) {
        return fromCBORValueAccount(value);
    }

    throw new Error(`Failed to decode 'CborAccountAddress.Type' from CBOR value: ${value}`);
}

/**
 * Decodes a CBOR-encoded account address into an CborAccountAddress instance.
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
 * @returns {Type} The decoded CborAccountAddress instance.
 */
export function fromCBOR(bytes: Uint8Array): Type {
    return fromCBORValue(decode(bytes));
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
 * const tokenHolder = decode(cborBytes); // Returns CborAccountAddress if format matches
 * // Later, unregister the decoder
 * cleanup();
 */
export function registerCBORDecoder(): () => void {
    const old = [Tag.registerDecoder(TAGGED_ADDRESS, fromCBORValue)];

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
