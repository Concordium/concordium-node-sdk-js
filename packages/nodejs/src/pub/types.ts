import { Buffer } from 'buffer/';

export { decryptMobileWalletExport, EncryptedData } from '../wallet/crypto';
export { MobileWalletExport } from '../wallet/types';
export { getModuleBuffer } from '../util';
export { Buffer };

export * from '@concordium/common-sdk/types';

export function toBuffer(s: string, encoding?: string): Buffer {
    return Buffer.from(s, encoding);
}
