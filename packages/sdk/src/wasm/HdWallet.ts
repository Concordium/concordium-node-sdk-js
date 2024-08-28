import * as wasm from '@concordium/rust-bindings/wallet';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Buffer } from 'buffer/index.js';

import { AttributesKeys, CryptographicParameters, Network } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';
import { isHex } from '../util.js';

/**
 * Class for Hierarchical Deterministic key derivation for Concordium identities and accounts.
 */
export class ConcordiumHdWallet {
    static fromSeedPhrase(seedPhrase: string, network: Network): ConcordiumHdWallet {
        if (!validateMnemonic(seedPhrase, wordlist)) {
            throw new Error('Invalid seed phrase.');
        }
        const seedAsHex = Buffer.from(mnemonicToSeedSync(seedPhrase)).toString('hex');
        return new ConcordiumHdWallet(seedAsHex, network);
    }

    static fromHex(seedAsHex: string, network: Network): ConcordiumHdWallet {
        if (seedAsHex.length !== 128) {
            throw new Error('The provided seed ' + seedAsHex + ' is invalid as its length was not 128');
        }
        if (!isHex(seedAsHex)) {
            throw new Error('The provided seed ' + seedAsHex + ' does not represent a hexidecimal value');
        }
        return new ConcordiumHdWallet(seedAsHex, network);
    }
    private constructor(
        private seedAsHex: string,
        private network: Network
    ) {}

    getAccountSigningKey(identityProviderIndex: number, identityIndex: number, credentialCounter: number): Buffer {
        return Buffer.from(
            wasm.getAccountSigningKey(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex,
                credentialCounter
            ),
            'hex'
        );
    }
    getAccountPublicKey(identityProviderIndex: number, identityIndex: number, credentialCounter: number): Buffer {
        return Buffer.from(
            wasm.getAccountPublicKey(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex,
                credentialCounter
            ),
            'hex'
        );
    }

    getCredentialId(
        identityProviderIndex: number,
        identityIndex: number,
        credentialCounter: number,
        { onChainCommitmentKey }: Pick<CryptographicParameters, 'onChainCommitmentKey'>
    ): Buffer {
        return Buffer.from(
            wasm.getCredentialId(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex,
                credentialCounter,
                onChainCommitmentKey
            ),
            'hex'
        );
    }

    getPrfKey(identityProviderIndex: number, identityIndex: number): Buffer {
        return Buffer.from(wasm.getPrfKey(this.seedAsHex, this.network, identityProviderIndex, identityIndex), 'hex');
    }

    getIdCredSec(identityProviderIndex: number, identityIndex: number): Buffer {
        return Buffer.from(
            wasm.getIdCredSec(this.seedAsHex, this.network, identityProviderIndex, identityIndex),
            'hex'
        );
    }

    getSignatureBlindingRandomness(identityProviderIndex: number, identityIndex: number): Buffer {
        return Buffer.from(
            wasm.getSignatureBlindingRandomness(this.seedAsHex, this.network, identityProviderIndex, identityIndex),
            'hex'
        );
    }
    getAttributeCommitmentRandomness(
        identityProviderIndex: number,
        identityIndex: number,
        credentialCounter: number,
        attribute: AttributesKeys
    ): Buffer {
        return Buffer.from(
            wasm.getAttributeCommitmentRandomness(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex,
                credentialCounter,
                attribute
            ),
            'hex'
        );
    }

    getVerifiableCredentialSigningKey(issuer: ContractAddress.Type, verifiableCredentialIndex: number): Buffer {
        return Buffer.from(
            wasm.getVerifiableCredentialSigningKey(
                this.seedAsHex,
                this.network,
                issuer.index,
                issuer.subindex,
                verifiableCredentialIndex
            ),
            'hex'
        );
    }

    getVerifiableCredentialPublicKey(issuer: ContractAddress.Type, verifiableCredentialIndex: number): Buffer {
        return Buffer.from(
            wasm.getVerifiableCredentialPublicKey(
                this.seedAsHex,
                this.network,
                issuer.index,
                issuer.subindex,
                verifiableCredentialIndex
            ),
            'hex'
        );
    }

    getVerifiableCredentialBackupEncryptionKey(): Buffer {
        return Buffer.from(wasm.getVerifiableCredentialBackupEncryptionKey(this.seedAsHex, this.network), 'hex');
    }
}
