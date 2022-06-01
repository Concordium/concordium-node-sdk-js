import { getAccountTransactionSignDigest } from './serialization';
import {
    AccountInfo,
    AccountTransaction,
    AccountTransactionSignature,
} from './types';
import * as ed from 'noble-ed25519';
import { Buffer } from 'buffer/';

export interface AccountSigner {
    sign(digest: Buffer): Promise<AccountTransactionSignature>;
    getSignatureCount(): bigint;
}

/**
 * Creates a signer for an account which uses the first credential's first keypair.
 * Note that if the account has a threshold > 1 or the first credentials has a threshold > 1, the transaction signed using this will fail.
 * @param privateKey the ed25519 private key in HEX format. (First credential's first keypair's private key)
 */
export function buildBasicAccountSigner(privateKey: string): AccountSigner {
    return {
        getSignatureCount() {
            return 1n;
        },
        async sign(digest: Buffer) {
            const signature = Buffer.from(
                await ed.sign(digest, privateKey)
            ).toString('hex');
            return {
                0: {
                    0: signature,
                },
            };
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
 * @param message the message to sign, assumed to be utf8 encoded.
 */
function getMessageDigest(message: string): Buffer {
    // TODO: use real encoding
    const prepend = Buffer.from('MyGoodPrepend', 'utf8');
    const digest = Buffer.from(message, 'utf8');
    return Buffer.concat([prepend, digest]);
}

/**
 * Helper function to sign a message.
 * Note that this function prepends the string "MyGoodPrepend" to ensure that the message is not a transaction.
 * Note that the current prepend is temporary and will later be replaced.
 * @param message the message to sign, assumed to be utf8 encoded.
 * @param signer An object that handles the keys of the account, and performs the actual signing.
 */
export function signMessage(
    message: string,
    signer: AccountSigner
): Promise<AccountTransactionSignature> {
    return signer.sign(getMessageDigest(message));
}

/**
 * Helper function to verify a signed message.
 * @param message the message to sign, assumed to be utf8 encoded.
 * @param signature the signature of a message, from a specific account.
 * @param accountCredentials the credentials of the account
 * @param signer An object that handles the keys of the account, and performs the actual signing.
 */
export async function verifyMessageSignature(
    message: string,
    signature: AccountTransactionSignature,
    accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials'>
): Promise<boolean> {
    if (Object.keys(signature).length < accountInfo.accountThreshold) {
        // Not enough credentials have signed;
        return false;
    }

    const digest = getMessageDigest(message);

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
