import { Buffer } from 'buffer/index.js';

import { HexString } from '../../../types.js';
import { cborDecode, cborEncode } from '../../../types/cbor.js';

/**
 * A public verification audit record that contains only a hash of the private
 * verification data. This record is designed to be published on-chain to provide
 * a verifiable timestamp and immutable proof of a verification event while
 * preserving the privacy of the underlying verification data.
 *
 * Public audit records serve as privacy-preserving anchors that can be used to
 * prove that a verification occurred at a specific time without revealing the
 * contents of the verification.
 */
class VerificationAuditRecord {
    /**
     * Creates a new public verification audit record.
     *
     * @param hash - SHA-256 hash of the private verification audit record
     * @param info - Optional additional public information about the verification
     */
    constructor(
        // TODO: possibly add a specialized type for sha256 hashes
        public readonly hash: Uint8Array,
        public readonly info?: string
    ) {}

    /**
     * Serializes the public audit record to a JSON representation.
     *
     * @returns The JSON representation of this audit record
     */
    public toJSON(): JSON {
        let json: JSON = { hash: Buffer.from(this.hash).toString('hex') };
        if (this.info !== undefined) json.info = this.info;
        return json;
    }
}

/**
 * A public verification audit record that contains only a hash of the private
 * verification data. This record is designed to be published on-chain to provide
 * a verifiable timestamp and immutable proof of a verification event while
 * preserving the privacy of the underlying verification data.
 *
 * Public audit records serve as privacy-preserving anchors that can be used to
 * prove that a verification occurred at a specific time without revealing the
 * contents of the verification.
 */
export type Type = VerificationAuditRecord;

/**
 * JSON representation of a public verification audit record.
 * Contains the hash as a hex string and optional public information.
 */
export type JSON = {
    /** The SHA-256 hash of the private audit record, encoded as a hex string */
    hash: HexString;
    /** Optional additional public information about the verification */
    info?: string;
};

/**
 * Deserializes a public verification audit record from its JSON representation.
 *
 * @param json - The JSON representation to deserialize
 * @returns The deserialized public verification audit record
 */
export function fromJSON(json: JSON): VerificationAuditRecord {
    return new VerificationAuditRecord(Uint8Array.from(Buffer.from(json.hash, 'hex')), json.info);
}

/**
 * Creates a new public verification audit record.
 *
 * @param hash - SHA-256 hash of the private verification data
 * @param info - Optional additional public information
 * @returns A new public verification audit record instance
 */
export function create(hash: Uint8Array, info?: string): VerificationAuditRecord {
    return new VerificationAuditRecord(hash, info);
}

/**
 * Data structure for CBOR-encoded verification audit anchors.
 * This format is used when storing audit records on the Concordium blockchain.
 */
export type AnchorData = {
    /** Type identifier for _Concordium Verification Audit Anchor_ */
    type: 'CCDVAA';
    /** Version of the anchor data format */
    version: number;
    /** SHA-256 hash of the private audit record */
    hash: Uint8Array; // TODO: possibly add a specialized type for sha256 hashes
    /** Optional public information that can be included in the anchor */
    public?: Record<string, any>;
};

/**
 * Creates a CBOR-encoded anchor for a verification audit record.
 *
 * This function creates a standardized CBOR-encoded representation of the
 * audit record that can be stored on the Concordium blockchain as transaction data.
 * The anchor includes the audit record hash and optional public metadata.
 *
 * @param value - The verification audit record to create an anchor for
 * @param publicInfo - Optional public information to include in the anchor
 *
 * @returns CBOR-encoded anchor data suitable for blockchain storage
 */
export function createAnchor(value: VerificationAuditRecord, publicInfo?: Record<string, any>): Uint8Array {
    const data: AnchorData = {
        type: 'CCDVAA',
        version: 1,
        hash: value.hash,
        public: publicInfo,
    };
    return cborEncode(data);
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
export function decodeAnchor(cbor: Uint8Array): AnchorData {
    const value = cborDecode(cbor);
    if (typeof value !== 'object' || value === null) throw new Error('Expected a cbor encoded object');
    // required fields
    if (!('type' in value) || value.type !== 'CCDVAA') throw new Error('Expected "type" to be "CCDVAA"');
    if (!('version' in value) || typeof value.version !== 'number')
        throw new Error('Expected "version" to be a number');
    if (!('hash' in value) || !(value.hash instanceof Uint8Array))
        throw new Error('Expected "hash" to be a Uint8Array');
    // optional fields
    if ('public' in value && typeof value.public !== 'object') throw new Error('Expected "public" to be an object');
    return value as AnchorData;
}
