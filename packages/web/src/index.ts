/**
 * @module Web-SDK
 */

import { Buffer } from 'buffer/';

import init from '@concordium/rust-bindings';

export * from '@concordium/common-sdk';
export * from '@concordium/common-sdk/util';
export * from '@concordium/common-sdk/wasm';
export * from '@concordium/common-sdk/cis0';
export * from '@concordium/common-sdk/cis2';
export * from '@concordium/common-sdk/cis4';
export * from '@concordium/common-sdk/identity';

init();

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
