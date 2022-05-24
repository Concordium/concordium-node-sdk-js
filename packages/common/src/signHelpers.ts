import { getAccountTransactionSignDigest } from './serialization';
import { AccountTransaction, AccountTransactionSignature } from './types';
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
 * Helper function to sign a message.
 * Note that this function prepends the string "MyGoodPrepend" to ensure that the message is not a transaction.
 * @param message the message to sign, assumed to be utf8 encoded.
 * @param signer An object that handles the keys of the account, and performs the actual signing.
 */
export function signMessage(
    message: string,
    signer: AccountSigner
): Promise<AccountTransactionSignature> {
    // TODO: use real encoding
    const prepend = Buffer.from('MyGoodPrepend', 'utf8');
    const digest = Buffer.from(message, 'utf8');
    return signer.sign(Buffer.concat([prepend, digest]));
}
