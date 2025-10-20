import { Buffer } from 'buffer/index.js';

import { HexString } from '../../../types.js';
import { cborDecode, cborEncode } from '../../../types/cbor.js';

class VerificationAuditRecord {
    constructor(
        // TODO: possibly add a specialized type for sha256 hashes
        public readonly hash: Uint8Array,
        public readonly info?: string
    ) {}

    public toJSON(): JSON {
        let json: JSON = { hash: Buffer.from(this.hash).toString('hex') };
        if (this.info !== undefined) json.info = this.info;
        return json;
    }
}

export type Type = VerificationAuditRecord;

export type JSON = {
    hash: HexString;
    info?: string;
};

export function fromJSON(json: JSON): VerificationAuditRecord {
    return new VerificationAuditRecord(Uint8Array.from(Buffer.from(json.hash, 'hex')), json.info);
}

export function create(hash: Uint8Array, info?: string): VerificationAuditRecord {
    return new VerificationAuditRecord(hash, info);
}

export type AnchorData = {
    type: 'CCDVAA';
    version: number;
    hash: Uint8Array; // TODO: possibly add a specialized type for sha256 hashes
    public?: Record<string, any>;
};

export function createAnchor(value: VerificationAuditRecord, publicInfo?: Record<string, any>): Uint8Array {
    const data: AnchorData = {
        type: 'CCDVAA',
        version: 1,
        hash: value.hash,
        public: publicInfo,
    };
    return cborEncode(data);
}

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
