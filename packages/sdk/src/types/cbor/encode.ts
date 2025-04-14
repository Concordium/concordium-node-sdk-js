import { dcborEncodeOptions, encode } from 'cbor2/encoder';

import { TokenAmount } from '../../plt/index.js';
import * as AccountAddress from '../AccountAddress.js';

/**
 * Register CBOR encoders for all types at the top level so they are globally available in the application.
 * This is safe to do as multiple encoders for the same CBOR tag is not a problem.
 *
 * This produces side effects and thus disables tree-shaking for this module. As such, functionality added to this
 * module should be kept to a minimum of only the functionality benefitting from these type-specific encoders.
 *
 * Currently, this auto-registers the following encoders:
 * - `AccountAddress`: For encoding Concordium account addresses in CBOR format
 * - `TokenAmount`: For encoding protocol-level token amounts in CBOR format
 */
AccountAddress.registerCBOREncoder();
TokenAmount.registerCBOREncoder();

/**
 * Encodes a value into a dCBOR (Deterministic Concise Binary Object Representation) byte array.
 *
 * @param value - The value to encode into CBOR format.
 * @returns A Uint8Array containing the CBOR-encoded data.
 */
export function cborEncode(value: unknown): Uint8Array {
    return encode(value, dcborEncodeOptions);
}
