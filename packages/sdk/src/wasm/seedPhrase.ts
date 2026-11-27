import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Buffer } from 'buffer/index.js';

/** Derives the 64-byte Concordium wallet seed with the empty BIP-39 passphrase. */
export function seedFromPhrase(phrase: string): string {
    if (!validateMnemonic(phrase, wordlist)) {
        throw new Error('Invalid seed phrase.');
    }
    return Buffer.from(mnemonicToSeedSync(phrase)).toString('hex');
}
