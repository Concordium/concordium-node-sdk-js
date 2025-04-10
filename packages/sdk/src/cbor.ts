import { Tag, decode } from 'cbor2';

import * as AccountAddress from './types/AccountAddress.js';
import { isDefined } from './util.js';
import { TokenAmount } from './plt/types.js';

/**
 * Register CBOR encoders for all types at the top level so they are globally available in the application.
 * This is safe to do as multiple encoders for the same CBOR tag is not a problem.
 *
 * Currently, this auto-registers the following encoders:
 * - `AccountAddress`: For encoding Concordium account addresses in CBOR format
 * - `TokenAmount`: For encoding protocol-level token amounts in CBOR format
 */
AccountAddress.registerCBOREncoder();
TokenAmount.registerCBOREncoder();

/**
 * Represents a CBOR tag decoder configuration.
 *
 * A TaggedDecoder associates a specific CBOR tag number with a decoder function
 * that knows how to convert the tagged value into the appropriate type.
 */
export type TaggedDecoder = {
    /** The CBOR tag number to register the decoder for */
    tag: number;
    /** Function to decode a tagged CBOR value into the appropriate type */
    decoder: (value: unknown) => unknown;
};

/**
 * Registers all available CBOR decoders globally with the cbor2 library.
 *
 * This function currently registers the following decoders:
 * - `AccountAddress` (tag 40307): For decoding Concordium account addresses
 * - `TokenAmount` (tag 4): For decoding protocol-level token amounts as decimal fractions
 *
 * @returns {void}
 * @example
 * // Register all CBOR decoders globally
 * registerDecoders();
 * // Now `cbor2.decode` will automatically handle known Concordium types
 * const address = decode(cborBytes);
 * const tokenAmount = decode(tokenCborBytes);
 */
// We do NOT want to register all decoders, as only one decoder for each CBOR tag can exist at a time.
// As such, it should be up to the end user to decide if they want to register the decoders globally in their application.
export function registerDecoders(): void {
    AccountAddress.registerCBORDecoder();
    TokenAmount.registerCBORDecoder();
}

/**
 * Decodes CBOR-encoded data with temporary registration of the provided decoders.
 *
 * This function provides a scoped way to decode CBOR data with specific decoders,
 * without permanently altering the global decoder registry. It temporarily registers
 * the provided decoders, performs the decoding, and then restores the previous
 * decoder configuration.
 *
 * @param {Uint8Array} bytes - The CBOR encoded data to decode.
 * @param {TaggedDecoder[]} decoders - Array of decoders to temporarily register.
 * @returns {unknown} The decoded value.
 *
 * @example
 * // Decode CBOR data with the AccountAddress decoder
 * const decodedValue = cborDecode(cborBytes, [AccountAddress.taggedCBORDecoder]);
 *
 * @example
 * // Decode CBOR data with multiple decoders
 * const decodedValue = cborDecode(cborBytes, [
 *   AccountAddress.taggedCBORDecoder,
 *   someOtherTaggedDecoder
 * ]);
 */
export function cborDecode(bytes: Uint8Array, decoders: TaggedDecoder[] = []): unknown {
    // Register all the decoders, and store the old ones for restoration.
    const oldDecoders = decoders
        .map(({ tag, decoder }) => {
            const old = Tag.registerDecoder(tag, decoder);
            if (old === undefined) return undefined;
            return { tag, decoder: old };
        })
        .filter(isDefined);

    const decoded = decode(bytes);

    // Restore old decoders
    oldDecoders.forEach(({ tag, decoder }) => {
        Tag.registerDecoder(tag, decoder);
    });

    return decoded;
}
