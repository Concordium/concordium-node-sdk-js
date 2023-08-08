import { Buffer } from 'buffer/';

export * from '@concordium/common-sdk';

export { Buffer };

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
