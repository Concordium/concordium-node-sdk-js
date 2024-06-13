import * as crypto from 'crypto';

import { MobileWalletExport } from './types.js';

interface EncryptionMetaData {
    keyLen: number;
    iterations: number;
    salt: string;
    initializationVector: string;
    encryptionMethod: string;
    keyDerivationMethod: string;
    hashAlgorithm: string;
}

export interface EncryptedData {
    cipherText: string;
    metadata: EncryptionMetaData;
}

const encoding = 'base64';
const PBKDF2keyDerivationMethodExternal = 'PBKDF2WithHmacSHA256';
const hashAlgorithmInternal = 'sha256';
const defaultKeyLength = 32;

const aes256EncryptionMethodExternal = 'AES-256';
const aes256EncryptionMethod = 'AES-256-CBC';

function getEncryptionMethodImport(method: string) {
    if (method === aes256EncryptionMethodExternal) {
        return aes256EncryptionMethod;
    }
    throw new Error(`An unsupported encryption method was used: " ${method}`);
}

/**
 * Decrypts the data using the metadata in the file that was given as input
 * and the provided password.
 */
function decrypt({ cipherText, metadata }: EncryptedData, password: string): string {
    const { keyLen, iterations, salt, initializationVector, encryptionMethod, hashAlgorithm, keyDerivationMethod } =
        metadata;

    if (keyDerivationMethod !== PBKDF2keyDerivationMethodExternal) {
        throw new Error('An unsupported key derivation method was used: ' + keyDerivationMethod);
    }

    const key = crypto.pbkdf2Sync(
        password,
        Buffer.from(salt, encoding),
        iterations,
        keyLen || defaultKeyLength,
        hashAlgorithm || hashAlgorithmInternal
    );

    const internalEncryptionMethod = getEncryptionMethodImport(encryptionMethod);
    const decipher = crypto.createDecipheriv(
        internalEncryptionMethod,
        key,
        Buffer.from(initializationVector, encoding)
    );
    let data = decipher.update(cipherText, encoding, 'utf8');
    data += decipher.final('utf8');
    return data;
}

/**
 * Decrypts and parses a mobile wallet export. If the provided password is incorrect, then
 * an error will be thrown.
 * @param mobileWalletExport the encrypted mobile wallet export
 * @param password the decryption password for the mobile wallet export
 * @returns the decrypted mobile wallet export
 */
export function decryptMobileWalletExport(mobileWalletExport: EncryptedData, password: string): MobileWalletExport {
    const decryptedMobileWalletExport: MobileWalletExport = JSON.parse(decrypt(mobileWalletExport, password));
    return decryptedMobileWalletExport;
}
