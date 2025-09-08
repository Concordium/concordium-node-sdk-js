import { decode, encode } from 'cbor2';

import { CborAccountAddress, CborMemo, TokenAmount, TokenMetadataUrl } from '../plt/index.js';

/**
 * Register CBOR encoders for all types.
 * This is safe to do as multiple encoders for the same CBOR tag is not a problem.
 *
 * Currently, this auto-registers the following encoders:
 * - `AccountAddress`: For encoding Concordium account addresses in CBOR format
 * - `TokenAmount`: For encoding protocol-level token amounts in CBOR format
 * - `CborMemo`: For encoding protocol-level token memos in CBOR format
 */
export function registerCBOREncoders(): void {
    CborAccountAddress.registerCBOREncoder();
    TokenAmount.registerCBOREncoder();
    CborMemo.registerCBOREncoder();
    TokenMetadataUrl.registerCBOREncoder();
}

/**
 * Removes undefined fields from plain objects (not class instances).
 * This function handles nested objects recursively.
 *
 * @param value - The value to process.
 * @returns The processed value with undefined fields removed.
 */
function removeUndefined(value: unknown): unknown {
    // Handle null early
    if (value === null) {
        return value;
    }

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(removeUndefined);
    }

    // Only process plain objects, not class instances
    if (typeof value !== 'object' || Object.getPrototypeOf(value) !== Object.prototype) {
        return value;
    }

    return Object.entries(value).reduce<Record<string, unknown>>((result, [key, val]) => {
        if (val !== undefined) {
            result[key] = removeUndefined(val);
        }
        return result;
    }, {});
}

/**
 * Encodes a value into a dCBOR (Deterministic Concise Binary Object Representation) byte array.
 * Undefined fields in plain objects are automatically removed before encoding.
 *
 * @param value - The value to encode into CBOR format.
 * @returns A Uint8Array containing the CBOR-encoded data.
 */
export function cborEncode(value: unknown): Uint8Array {
    registerCBOREncoders();
    const processedValue = removeUndefined(value);
    return encode(processedValue, { dcbor: true });
}

/**
 * Registers all available CBOR decoders globally with the cbor2 library.
 *
 * This function currently registers the following decoders:
 * - `AccountAddress` (tag 40307): For decoding Concordium account addresses
 * - `TokenAmount` (tag 4): For decoding protocol-level token amounts as decimal fractions
 * - `CborMemo` (tag 24): For decoding protocol-level token memos as cbor encoded data items
 *
 * @returns {(() => void)[]} An array of functions to clean up decoder registrations, i.e. restore the decoders
 * registered prior to registering the Concordium-specific ones.
 * @example
 * // Register all CBOR decoders globally
 * const oldDecoders = registerDecoders();
 * // Now `cbor2.decode` will automatically handle known Concordium types
 * const address = decode(cborBytes);
 * const tokenAmount = decode(tokenCborBytes);
 * // Restore old decoders
 * oldDecoders.forEach((cleanup) => {
 *     cleanup();
 * });
 */
// We do NOT want to register all decoders, as only one decoder for each CBOR tag can exist at a time.
// As such, it should be up to the end user to decide if they want to register the decoders globally in their application.
export function registerCBORDecoders(): (() => void)[] {
    return [
        CborAccountAddress.registerCBORDecoder(),
        TokenAmount.registerCBORDecoder(),
        CborMemo.registerCBORDecoder(),
    ];
}

/**
 * Decodes CBOR-encoded data with temporary registration of the provided decoders.
 *
 * This function provides a scoped way to decode CBOR data with concordium-specific decoders,
 * without permanently altering the global decoder registry. It temporarily registers
 * the custom type decoders, performs the decoding, and then restores the previous
 * decoder configuration.
 *
 * @param {Uint8Array} bytes - The CBOR encoded data to decode.
 * @returns {unknown} The decoded value.
 */
export function cborDecode(bytes: Uint8Array): unknown {
    // Register all the decoders, and store the old ones for restoration.
    const oldDecoders = registerCBORDecoders();
    const decoded = decode(bytes);

    // Restore old decoders
    oldDecoders.forEach((cleanup) => {
        cleanup();
    });

    return decoded;
}
