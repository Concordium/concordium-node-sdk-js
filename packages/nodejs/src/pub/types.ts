import { Buffer } from 'buffer/index.js';

export { decryptMobileWalletExport, EncryptedData } from '../wallet/crypto.js';
export { MobileWalletExport } from '../wallet/types.js';
export { getModuleBuffer } from '../util.js';
export { Buffer }; // TODO: remove this export as it doesn't make much sense to provide a Buffer polyfill  for nodejs

export * from '@concordium/common-sdk/types';

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
