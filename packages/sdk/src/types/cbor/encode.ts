import { TokenAmount } from '../../plt/types.js';
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

export { encode as cborEncode } from 'cbor2/encoder';
