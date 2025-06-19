import { Tag, decode } from 'cbor2';
import { registerEncoder } from 'cbor2/encoder';

import { Base58String } from '../index.js';
import { AccountAddress } from '../types/index.js';

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
const TAGGED_ADDRESS = 40307;

/**
 * Converts an TokenHolder to its CBOR (Concise Binary Object Representation) encoding.
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
    switch (value.type) {
        case 'account':
            return AccountAddress.toCBOR(value.address);
    }
}

/**
 * Registers a CBOR encoder for the TokenHolder type with the `cbor2` library.
 * This allows TokenHolder instances to be automatically encoded when used with
 * the `cbor2` library's encode function.
 *
 * @returns {void}
 * @example
 * // Register the encoder
 * registerCBOREncoder();
 * // Now TokenHolder instances can be encoded directly
 * const encoded = encode(myTokenHolder);
 */
export function registerCBOREncoder(): void {
    registerEncoder(TokenHolderAccount, (value) => [
        TAGGED_ADDRESS,
        AccountAddress.toCBORValue(value.address).contents,
    ]);
}

export function fromCBORValue(value: unknown): Type {
    if (value instanceof Tag && value.tag === TAGGED_ADDRESS) {
        return fromAccountAddress(AccountAddress.fromCBORValue(value));
    }

    throw new Error(`Faid to decode 'TokenHolder.Type' from CBOR value: ${value}`);
}

/**
 * Decodes a CBOR-encoded account address into an TokenHolder instance.
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
 * @returns {Type} The decoded TokenHolder instance.
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
 * const tokenHolder = decode(cborBytes); // Returns TokenHolder if format matches
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
