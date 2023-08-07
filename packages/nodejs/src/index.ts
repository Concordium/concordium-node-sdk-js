/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @module NodeJS-SDK
 *
 */

export * from './clientV2';

export { default as ConcordiumNodeClient } from './client';
export { decryptMobileWalletExport, EncryptedData } from './wallet/crypto';
export { MobileWalletExport } from './wallet/types';
export { getModuleBuffer } from './util';

export * from '@concordium/common-sdk';
export * from '@concordium/common-sdk/util';
export * from '@concordium/common-sdk/wasm';
export * from '@concordium/common-sdk/cis0';
export * from '@concordium/common-sdk/cis2';
export * from '@concordium/common-sdk/cis4';
export * from '@concordium/common-sdk/identity';
