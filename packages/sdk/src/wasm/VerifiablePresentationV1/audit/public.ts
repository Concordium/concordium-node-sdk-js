import { HexString, cborEncode } from '../../../index.js';

class VerificationAuditRecord {
    constructor(
        public readonly hash: Uint8Array,
        public readonly info?: string
    ) {}

    public toJSON(): JSON {
        let json: JSON = { hash: Buffer.from(this.hash).toString('hex') };
        if (this.info !== undefined) json.info = this.info;
        return json;
    }

    public toBytes(): Uint8Array {
        return cborEncode(this.toJSON());
    }
}

export type Type = VerificationAuditRecord;

export type JSON = {
    hash: HexString;
    info?: string;
};

export function fromJSON(json: JSON): VerificationAuditRecord {
    return new VerificationAuditRecord(Buffer.from(json.hash, 'hex'), json.info);
}

export function create(hash: Uint8Array, info?: string): VerificationAuditRecord {
    return new VerificationAuditRecord(hash, info);
}
