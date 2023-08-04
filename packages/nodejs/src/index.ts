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
export * from '@concordium/common-sdk';
export { getModuleBuffer } from './util';
