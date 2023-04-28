import { getAccountTransactionSignDigest } from './serialization';
import {
    AccountInfo,
    AccountKeys,
    AccountTransaction,
    AccountTransactionSignature,
    CredentialKeys,
    CredentialSignature,
    HexString,
    WalletExportFormat,
    WithAccountKeys,
} from './types';
import * as ed from '@noble/ed25519';
import { Buffer } from 'buffer/';
import { AccountAddress } from './types/accountAddress';
import { sha256 } from './hash';

/**
 * A structure to use for creating signatures on a given digest.
 */
export interface AccountSigner {
    /**
     * Creates a signature of the provided digest
     *
     * @param {Buffer} digest - The digest to create signatures on.
     *
     * @returns {Promise<AccountTransactionSignature>} A promise resolving with a set of signatures for a set of credentials corresponding to some account
     */
    sign(digest: Buffer): Promise<AccountTransactionSignature>;
    /**
     * Amount of signatures created
     */
    getSignatureCount(): bigint;
}

const getSignature = async (
    digest: Buffer,
    privateKey: string
): Promise<HexString> =>
    Buffer.from(await ed.sign(digest, privateKey)).toString('hex');

/**
 * Creates an `AccountSigner` for an account which uses the first credential's first keypair.
 * Note that if the account has a threshold > 1 or the first credentials has a threshold > 1, the transaction signed using this will fail.
 *
 * @param privateKey the ed25519 private key in HEX format. (First credential's first keypair's private key)
 *
 * @returns {AccountSigner} an `AccountSigner` which creates a signature using the first credentials first keypair
 */
export function buildBasicAccountSigner(privateKey: string): AccountSigner {
    return {
        getSignatureCount() {
            return 1n;
        },
        async sign(digest: Buffer) {
            return {
                0: {
                    0: await getSignature(digest, privateKey),
                },
            };
        },
    };
}

const isWalletExport = <T extends WithAccountKeys>(
    value: T | WalletExportFormat
): value is WalletExportFormat =>
    (value as WalletExportFormat).value?.accountKeys !== undefined;

const getCredentialSignature = async (
    digest: Buffer,
    { keys }: CredentialKeys
): Promise<CredentialSignature> => {
    const sig: CredentialSignature = {};
    for (const key in keys) {
        sig[key] = await getSignature(digest, keys[key].signKey);
    }
    return sig;
};

/**
 * Creates an `AccountSigner` for an account exported from a Concordium wallet.
 * Creating signatures using the `AccountSigner` will hold signatures for all credentials and all their respective keys included in the export.
 *
 * @param {WalletExportFormat} walletExport - The wallet export object.
 *
 * @returns {AccountSigner} an `AccountSigner` which creates signatures using all keys for all credentials
 */
export function buildAccountSigner(
    walletExport: WalletExportFormat
): AccountSigner;
/**
 * Creates a signer for an arbitrary format extending the {@link WithAccountKeys} type.
 * Creating signatures using the `AccountSigner` will hold signatures for all credentials and all their respective keys included.
 *
 * @param {AccountKeys} value.accountKeys - Account keys of type {@link AccountKeys} to use for creating signatures
 *
 * @returns {AccountSigner} an `AccountSigner` which creates signatures using all keys for all credentials
 */
export function buildAccountSigner<T extends WithAccountKeys>(
    value: T
): AccountSigner;
export function buildAccountSigner<T extends WithAccountKeys>(
    value: T | WalletExportFormat
): AccountSigner {
    const { keys }: AccountKeys = isWalletExport(value)
        ? value.value.accountKeys
        : value.accountKeys;

    const numKeys = Object.values(keys).reduce(
        (acc, credKeys) => acc + BigInt(Object.keys(credKeys).length),
        0n
    );
    return {
        getSignatureCount() {
            return numKeys;
        },
        async sign(digest: Buffer) {
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
    const digest = getAccountTransactionSignDigest(
        transaction,
        signer.getSignatureCount()
    );
    return signer.sign(digest);
}

/**
 * @param account the address of the account that will sign this message.
 * @param message the message to sign, assumed to be utf8 encoded string or a Uint8Array/buffer.
 */
function getMessageDigest(
    account: AccountAddress,
    message: string | Uint8Array
): Buffer {
    const prepend = Buffer.alloc(8, 0);
    const rawMessage =
        typeof message === 'string' ? Buffer.from(message, 'utf8') : message;
    return sha256([account.decodedAddress, prepend, rawMessage]);
}

/**
 * Helper function to sign a message.
 * Note that this function prepends the account address (32 bytes) and 8 zero-bytes to ensure that the message is not a transaction.
 * Note that the current prepend is temporary and will later be replaced.
 * @param message the message to sign, assumed to be utf8 encoded string or a Uint8Array/buffer.
 * @param signer An object that handles the keys of the account, and performs the actual signing.
 */
export function signMessage(
    account: AccountAddress,
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
    accountInfo: Pick<
        AccountInfo,
        'accountThreshold' | 'accountCredentials' | 'accountAddress'
    >
): Promise<boolean> {
    if (Object.keys(signature).length < accountInfo.accountThreshold) {
        // Not enough credentials have signed;
        return false;
    }

    const digest = getMessageDigest(
        new AccountAddress(accountInfo.accountAddress),
        message
    );

    for (const credentialIndex of Object.keys(signature)) {
        const credential =
            accountInfo.accountCredentials[Number(credentialIndex)];
        if (!credential) {
            throw new Error(
                'Signature contains signature for non-existing credential'
            );
        }
        const credentialSignature = signature[Number(credentialIndex)];
        const credentialKeys = credential.value.contents.credentialPublicKeys;

        if (
            Object.keys(credentialSignature).length < credentialKeys.threshold
        ) {
            // Not enough signatures for the current credential;
            return false;
        }

        for (const keyIndex of Object.keys(credentialSignature)) {
            if (!credentialKeys.keys[Number(keyIndex)]) {
                throw new Error(
                    'Signature contains signature for non-existing keyIndex'
                );
            }
            if (
                !(await ed.verify(
                    credentialSignature[Number(keyIndex)],
                    digest,
                    credentialKeys.keys[Number(keyIndex)].verifyKey
                ))
            ) {
                // Incorrect signature;
                return false;
            }
        }
    }
    return true;
}
