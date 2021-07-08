import { Buffer } from 'buffer/';
import * as crypto from 'crypto';

export function sha256(data: (Buffer | Uint8Array)[]): Buffer {
    const hash = crypto.createHash('sha256');
    data.forEach((input) => hash.update(input));
    return Buffer.from(hash.digest());
}
