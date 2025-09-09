// self-referencing not allowed by eslint resolver
// eslint-disable-next-line import/no-extraneous-dependencies
import * as ed from '@concordium/web-sdk/shims/ed25519';
import { Buffer } from 'buffer/index.js';

import { sha256 } from './hash.js';
import { getAccountTransactionSignDigest } from './serialization.js';
import {
    AccountInfo,
    AccountTransaction,
    AccountTransactionSignature,
    Base58String,
    CredentialSignature,
    HexString,
    JsonString,
} from './types.js';
import * as AccountAddress from './types/AccountAddress.js';
import { mapRecord } from './util.js';

export interface KeyPair {
    signKey: HexString;
    verifyKey: HexString;
}

export interface CredentialKeys {
    keys: Record<number, KeyPair>;
    threshold: number;
}

export interface AccountKeys {
    keys: Record<number, CredentialKeys>;
    threshold: number;
}

export type SimpleAccountKeys = Record<number, Record<number, HexString>>;

export interface WithAccountKeys {
    accountKeys: AccountKeys;
}

export type SimpleWalletFormat = WithAccountKeys & {
    address: Base58String;
    credentials: Record<number, HexString>;
};

export type GenesisFormat = SimpleWalletFormat;

export interface WalletExportFormat {
    type: string;
    v: number;
    environment: string;
    value: SimpleWalletFormat;
}

function validateSimpleWallet(wallet: SimpleWalletFormat): void {
    if (typeof wallet.address !== 'string') {
        throw Error('Expected field "address" to be of type "string" but was of type "' + typeof wallet.address + '"');
    }
    if (typeof wallet.credentials !== 'object') {
        throw Error(
            'Expected field "credentials" to be of type "object" but was of type "' + typeof wallet.credentials + '"'
        );
    }
    if (wallet.accountKeys === undefined) {
        throw Error('Expected field "accountKeys" to be defined, but was not');
    }
}

/**
 * Parses a wallet export file into a `SimpleWalletFormat`. This format is a subset of the `GenesisFormat`.
 */
export function parseSimpleWallet(walletString: JsonString): SimpleWalletFormat {
    const wallet = JSON.parse(walletString);
    validateSimpleWallet(wallet);
    return wallet;
}

/**
 * Parses a wallet export file into a WalletExportFormat. The wallet export
 * file is exported from a concordium wallet.
 */
export function parseWallet(walletString: JsonString): WalletExportFormat {
    const wallet = JSON.parse(walletString);
    if (typeof wallet.type !== 'string') {
        throw Error('Expected field "type" to be of type "string" but was of type "' + typeof wallet.type + '"');
    }
    if (typeof wallet.v !== 'number') {
        throw Error('Expected field "v" to be of type "number" but was of type "' + typeof wallet.v + '"');
    }
    if (typeof wallet.environment !== 'string') {
        throw Error(
            'Expected field "environment" to be of type "string" but was of type "' + typeof wallet.environment + '"'
        );
    }
    validateSimpleWallet(wallet.value);
    return wallet;
}

/**
 * A structure to use for creating signatures on a given digest.
 */
export interface AccountSigner {
    /**
     * Creates a signature of the provided digest
     *
     * @param {ArrayBuffer} digest - The digest to create signatures on.
     *
     * @returns {Promise<AccountTransactionSignature>} A promise resolving with a set of signatures for a set of credentials corresponding to some account
     */
    sign(digest: ArrayBuffer): Promise<AccountTransactionSignature>;
    /**
     * Returns the amount of signatures that the signer produces
     */ getSignatureCount(): bigint;
}

/**
 * Gets Ed25519 signature for `digest`.
 *
 * @param {ArrayBuffer} digest - the message to sign.
 * @param {HexString} privateKey - the ed25519 private key in HEX format.
 *
 * @returns {Buffer} the signature.
 */
export const getSignature = async (digest: ArrayBuffer, privateKey: HexString): Promise<Buffer> =>
    Buffer.from(await ed.signAsync(new Uint8Array(digest), privateKey));

/**
 * Creates an `AccountSigner` for an account which uses the first credential's first keypair.
 * Note that if the account has a threshold > 1 or the first credentials has a threshold > 1, the transaction signed using this will fail.
 *
 * @param {HexString} privateKey - the ed25519 private key in HEX format. (First credential's first keypair's private key)
 *
 * @returns {AccountSigner} an `AccountSigner` which creates a signature using the first credentials first keypair
 */
export function buildBasicAccountSigner(privateKey: HexString): AccountSigner {
    return {
        getSignatureCount() {
            return 1n;
        },
        async sign(digest: ArrayBuffer) {
            const sig = await getSignature(digest, privateKey);
            return {
                0: {
                    0: sig.toString('hex'),
                },
            };
        },
    };
}

const isWalletExport = <T extends WithAccountKeys>(value: T | WalletExportFormat): value is WalletExportFormat =>
    (value as WalletExportFormat).value?.accountKeys !== undefined;

const isSimpleAccountKeys = <T extends WithAccountKeys>(
    value: T | WalletExportFormat | SimpleAccountKeys
): value is SimpleAccountKeys =>
    (value as WalletExportFormat).value?.accountKeys === undefined && (value as T).accountKeys === undefined;

const getKeys = <T extends WithAccountKeys>(value: T | WalletExportFormat | SimpleAccountKeys): SimpleAccountKeys => {
    if (isSimpleAccountKeys(value)) {
        return value;
    }
    const { keys } = isWalletExport(value) ? value.value.accountKeys : value.accountKeys;

    return mapRecord(keys, (credKeys) => mapRecord(credKeys.keys, (keyPair) => keyPair.signKey));
};

const getCredentialSignature = async (
    digest: ArrayBuffer,
    keys: Record<number, HexString>
): Promise<CredentialSignature> => {
    const sig: CredentialSignature = {};
    for (const key in keys) {
        const signature = await getSignature(digest, keys[key]);
        sig[key] = signature.toString('hex');
    }
    return sig;
};

/**
 * Creates an `AccountSigner` for an account exported from a Concordium wallet.
 * Creating signatures using the `AccountSigner` will hold signatures for all credentials and all their respective keys included in the export.
 *
 * @param {WalletExportFormat} walletExport - The wallet export object.
 *
 * @returns {AccountSigner} An `AccountSigner` which creates signatures using all keys for all credentials
 */
export function buildAccountSigner(walletExport: WalletExportFormat): AccountSigner;
/**
 * Creates an `AccountSigner` for an arbitrary format extending the {@link WithAccountKeys} type.
 * Creating signatures using the `AccountSigner` will hold signatures for all credentials and all their respective keys included.
 *
 * @param {AccountKeys} value.accountKeys - Account keys of type {@link AccountKeys} to use for creating signatures
 *
 * @returns {AccountSigner} An `AccountSigner` which creates signatures using all keys for all credentials
 */
export function buildAccountSigner<T extends WithAccountKeys>(value: T): AccountSigner;
/**
 * Creates an `AccountSigner` for the {@link SimpleAccountKeys} type.
 * Creating signatures using the `AccountSigner` will hold signatures for all credentials and all their respective keys included.
 *
 * @param {SimpleAccountKeys} keys - Account keys to use for creating signatures
 *
 * @returns {AccountSigner} An `AccountSigner` which creates signatures using all keys for all credentials
 */
export function buildAccountSigner(keys: SimpleAccountKeys): AccountSigner;
/**
 * Creates an `AccountSigner` for an account which uses the first credential's first keypair.
 * Note that if the account has a threshold > 1 or the first credentials has a threshold > 1, the transaction signed using this will fail.
 *
 * @param {HexString} key - The ed25519 private key in HEX format. (First credential's first keypair's private key)
 *
 * @returns {AccountSigner} An `AccountSigner` which creates a signature using the first credentials first keypair
 */
export function buildAccountSigner(key: HexString): AccountSigner;
export function buildAccountSigner<T extends WithAccountKeys>(
    value: T | WalletExportFormat | SimpleAccountKeys | string
): AccountSigner {
    if (typeof value === 'string') {
        return buildBasicAccountSigner(value);
    }

    const keys = getKeys<T>(value);
    const numKeys = Object.values(keys).reduce((acc, credKeys) => acc + BigInt(Object.keys(credKeys).length), 0n);

    return {
        getSignatureCount() {
            return numKeys;
        },
        async sign(digest: ArrayBuffer) {
            const sig: AccountTransactionSignature = {};
            for (const key in keys) {
                sig[key] = await getCredentialSignature(digest, keys[key]);
            }
            return sig;
        },
    };
}

/**
 * Helper function to sign an AccountTransaction.
 * @param transaction the account transaction to sign
 * @param signer An object that handles the keys of the account, and performs the actual signing.
 */
export function signTransaction(
    transaction: AccountTransaction,
    signer: AccountSigner
): Promise<AccountTransactionSignature> {
    const digest = getAccountTransactionSignDigest(transaction, signer.getSignatureCount());
    return signer.sign(digest);
}

/**
 * @param account the address of the account that will sign this message.
 * @param message the message to sign, assumed to be utf8 encoded string or a Uint8Array/buffer.
 */
function getMessageDigest(account: AccountAddress.Type, message: string | Uint8Array): Buffer {
    const prepend = Buffer.alloc(8, 0);
    const rawMessage = typeof message === 'string' ? Buffer.from(message, 'utf8') : message;
    return sha256([AccountAddress.toBuffer(account), prepend, rawMessage]);
}

/**
 * Helper function to sign a message.
 * Note that this function prepends the account address (32 bytes) and 8 zero-bytes to ensure that the message is not a transaction.
 * Note that the current prepend is temporary and will later be replaced.
 * @param message the message to sign, assumed to be utf8 encoded string or a Uint8Array/buffer.
 * @param signer An object that handles the keys of the account, and performs the actual signing.
 */
export function signMessage(
    account: AccountAddress.Type,
    message: string | Uint8Array,
    signer: AccountSigner
): Promise<AccountTransactionSignature> {
    return signer.sign(getMessageDigest(account, message));
}

/**
 * Helper function to verify a signed message.
 * @param message the message to sign, assumed to be utf8 encoded string or a Uint8Array/buffer.
 * @param signature the signature of a message, from a specific account.
 * @param accountInfo the address and credentials of the account
 */
export async function verifyMessageSignature(
    message: string | Uint8Array,
    signature: AccountTransactionSignature,
    accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'>
): Promise<boolean> {
    if (Object.keys(signature).length < accountInfo.accountThreshold) {
        // Not enough credentials have signed;
        return false;
    }

    const digest = getMessageDigest(accountInfo.accountAddress, message);

    for (const credentialIndex of Object.keys(signature)) {
        const credential = accountInfo.accountCredentials[Number(credentialIndex)];
        if (!credential) {
            throw new Error('Signature contains signature for non-existing credential');
        }
        const credentialSignature = signature[Number(credentialIndex)];
        const credentialKeys = credential.value.contents.credentialPublicKeys;

        if (Object.keys(credentialSignature).length < credentialKeys.threshold) {
            // Not enough signatures for the current credential;
            return false;
        }

        for (const keyIndex of Object.keys(credentialSignature)) {
            const key = credentialKeys.keys[Number(keyIndex)];
            switch (key) {
                case undefined:
                    throw new Error('Signature contains signature for non-existing keyIndex');
                case null:
                    throw new Error('Found "null" (represents unknown key variants) in credential keys');
                default:
                    break;
            }

            if (!(await ed.verifyAsync(credentialSignature[Number(keyIndex)], digest, key.verifyKey))) {
                // Incorrect signature;
                return false;
            }
        }
    }
    return true;
}
