import _JB from 'json-bigint';

import { sha256 } from '../../../hash.js';
import { cborDecode, cborEncode } from '../../../types/cbor.js';
import { VerificationAuditRecordV1 } from '../index.js';
import { VERSION } from './common.js';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

/**
 * Describes the verification audit anchor data registered on chain.
 */
type Anchor = {
    /** Type identifier for _Concordium Verification Audit Anchor_ */
    type: 'CCDVAA';
    /** Version of the anchor data format */
    version: number;
    /** The SHA-256 hash of the audit record, encoded as a hex string */
    hash: Uint8Array;
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

/**
 * Describes the verification audit anchor data registered on chain.
 */
export type Type = Anchor;

/**
 * Converts a verification audit record to its corresopnding anchor representation encoding.
 *
 * This function creates a privacy-preserving public record that contains only
 * a hash of the record data, suitable for publishing on-chain while
 * maintaining the privacy of the original verification interaction.
 *
 * @param record - The audit record to convert
 * @param info - Optional additional public information to include
 *
 * @returns The anchor encoding corresponding to the audit record
 */
export function createAnchor(record: VerificationAuditRecordV1.Type, info?: Record<string, any>): Uint8Array {
    const message = Buffer.from(JSONBig.stringify(record)); // TODO: replace this with proper hashing.. properly from @concordium/rust-bindings
    const hash = Uint8Array.from(sha256([message]));
    let anchor: Anchor = { hash: hash, version: VERSION, type: 'CCDVAA', public: info };
    return cborEncode(anchor);
}

/**
 * Decodes a CBOR-encoded verification audit anchor.
 *
 * This function parses and validates a CBOR-encoded anchor that was previously
 * created with `createAnchor`. It ensures the anchor has the correct format
 * and contains all required fields.
 *
 * @param cbor - The CBOR-encoded anchor data to decode
 * @returns The decoded anchor data structure
 * @throws Error if the CBOR data is invalid or doesn't match expected format
 */
export function decodeAnchor(cbor: Uint8Array): Anchor {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVAA') throw new Error('Expected "type" to be "CCDVAA"');
    if (!('version' in value) || value.version !== VERSION) throw new Error('Expected "version" to be 1');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as Anchor;
}
