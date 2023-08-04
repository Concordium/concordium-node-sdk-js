import { Buffer } from 'buffer/';
import { sha256 as libSha256 } from 'hash.js';

export function sha256(data: (Buffer | Uint8Array)[]): Buffer {
    const sha256Hash = libSha256();
    data.forEach((input) => sha256Hash.update(input));
    return Buffer.from(sha256Hash.digest('hex'), 'hex');
}
