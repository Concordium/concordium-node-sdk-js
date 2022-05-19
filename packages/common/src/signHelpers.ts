import { getAccountTransactionSignDigest } from './serialization';
import {
    AccountTransaction,
    CredentialSignature,
    AccountTransactionSignature,
} from './types';
import { countSignatures } from './util';
import * as ed from 'noble-ed25519';
import { Buffer } from 'buffer/';

export interface AccountSigner {
    sign(digest: Buffer): Promise<AccountTransactionSignature>;
    getSignatureCount(): bigint;
}

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

export type CredentialKeyStructure = Record<number, string>;
export type AccountKeyStructure = Record<number, CredentialKeyStructure>;

export function buildAdvancedAccountSigner(
    keyStructure: AccountKeyStructure
): AccountSigner {
    const signatureCount = countSignatures(keyStructure);
    return {
        getSignatureCount() {
            return signatureCount;
        },
        async sign(digest: Buffer) {
            //const signatures: AccountTransactionSignature = Object.entries(keyStructure).map(([credIndex, credStructure]) => []Object.entries(credStructure).map(async ([keyIndex, key]) => Buffer.from(
            //    await ed.sign(digest, key)
            //).toString('hex')));

            const signatures: AccountTransactionSignature = {};
            for (const [credIndex, credStructure] of Object.entries(
                keyStructure
            )) {
                const credSignatures: CredentialSignature = {};
                for (const [keyIndex, key] of Object.entries(credStructure)) {
                    credSignatures[Number(keyIndex)] = Buffer.from(
                        await ed.sign(digest, key)
                    ).toString('hex');
                }
                signatures[Number(credIndex)] = credSignatures;
            }
            return signatures;
        },
    };
}

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
