import { Buffer } from 'buffer/';
export * from '@concordium/common-sdk';
import init from '@concordium/rust-bindings';
export { detectConcordiumProvider } from './walletApiDetector';

init();

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
