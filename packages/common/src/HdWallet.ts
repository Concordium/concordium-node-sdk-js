import * as wasm from '@concordium/rust-bindings';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Buffer } from 'buffer/';
import { AttributesKeys, Network } from './types';
import { isHex } from './util';

/**
 * Class for Hierarchical Deterministic key derivation for Concordium identities and accounts.
 */
export class ConcordiumHdWallet {
    static fromSeedPhrase(
        seedPhrase: string,
        network: Network
    ): ConcordiumHdWallet {
        if (!validateMnemonic(seedPhrase, wordlist)) {
            throw new Error('Invalid seed phrase.');
        }
        const seedAsHex = Buffer.from(mnemonicToSeedSync(seedPhrase)).toString(
            'hex'
        );
        return new ConcordiumHdWallet(seedAsHex, network);
    }

    static fromHex(seedAsHex: string, network: Network): ConcordiumHdWallet {
        if (seedAsHex.length !== 128) {
            throw new Error(
                'The provided seed ' +
                    seedAsHex +
                    ' is invalid as its length was not 128'
            );
        }
        if (!isHex(seedAsHex)) {
            throw new Error(
                'The provided seed ' +
                    seedAsHex +
                    ' does not represent a hexidecimal value'
            );
        }
        return new ConcordiumHdWallet(seedAsHex, network);
    }
    private constructor(private seedAsHex: string, private network: Network) {}

    getAccountSigningKey(
        identityIndex: number,
        credentialCounter: number
    ): Buffer {
        return Buffer.from(
            wasm.getAccountSigningKey(
                this.seedAsHex,
                this.network,
                identityIndex,
                credentialCounter
            ),
            'hex'
        );
    }
    getAccountPublicKey(
        identityIndex: number,
        credentialCounter: number
    ): Buffer {
        return Buffer.from(
            wasm.getAccountPublicKey(
                this.seedAsHex,
                this.network,
                identityIndex,
                credentialCounter
            ),
            'hex'
        );
    }

    getPrfKey(identityIndex: number): Buffer {
        return Buffer.from(
            wasm.getPrfKey(this.seedAsHex, this.network, identityIndex),
            'hex'
        );
    }

    getIdCredSec(identityIndex: number): Buffer {
        return Buffer.from(
            wasm.getIdCredSec(this.seedAsHex, this.network, identityIndex),
            'hex'
        );
    }

    getSignatureBlindingRandomness(identityIndex: number): Buffer {
        return Buffer.from(
            wasm.getSignatureBlindingRandomness(
                this.seedAsHex,
                this.network,
                identityIndex
            ),
            'hex'
        );
    }
    getAttributeCommitmentRandomness(
        identityIndex: number,
        credentialCounter: number,
        attribute: AttributesKeys
    ): Buffer {
        return Buffer.from(
            wasm.getAttributeCommitmentRandomness(
                this.seedAsHex,
                this.network,
                identityIndex,
                credentialCounter,
                attribute
            ),
            'hex'
        );
    }
}
