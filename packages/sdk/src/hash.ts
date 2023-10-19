import { Buffer } from 'buffer/index.js';
import hash from 'hash.js';

export function sha256(data: (Buffer | Uint8Array)[]): Buffer {
    const sha256Hash = hash.sha256();
    data.forEach((input) => sha256Hash.update(input));
    return Buffer.from(sha256Hash.digest('hex'), 'hex');
}
