import { Buffer } from 'buffer/';

export { decryptMobileWalletExport, EncryptedData } from '../wallet/crypto';
export { MobileWalletExport } from '../wallet/types';
export { getModuleBuffer } from '../util';
export { Buffer }; // TODO: remove this export as it doesn't make much sense to provide a Buffer polyfill  for nodejs

export * from '@concordium/common-sdk/types';

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
