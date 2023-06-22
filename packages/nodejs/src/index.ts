/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @module NodeJS-SDK
 *
 */

import ConcordiumNodeClient from './client';
export * from './clientV2';

export { ConcordiumNodeClient };
export { decryptMobileWalletExport, EncryptedData } from './wallet/crypto';
export { MobileWalletExport } from './wallet/types';
export * from '@concordium/common-sdk';
export { getModuleBuffer } from './util';
