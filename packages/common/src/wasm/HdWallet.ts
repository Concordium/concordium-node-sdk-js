import {
    getAccountPublicKey,
    getAccountSigningKey,
    getAttributeCommitmentRandomness,
    getCredentialId,
    getIdCredSec,
    getPrfKey,
    getSignatureBlindingRandomness,
    getVerifiableCredentialEncryptionKey,
    getVerifiableCredentialPublicKey,
    getVerifiableCredentialSigningKey,
} from '@concordium/rust-bindings/wallet';
import { mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { Buffer } from 'buffer/';
import { AttributesKeys, Network, CryptographicParameters } from '../types';
import { isHex } from '../util';

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
        identityProviderIndex: number,
        identityIndex: number,
        credentialCounter: number
    ): Buffer {
        return Buffer.from(
            getAccountSigningKey(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex,
                credentialCounter
            ),
            'hex'
        );
    }
    getAccountPublicKey(
        identityProviderIndex: number,
        identityIndex: number,
        credentialCounter: number
    ): Buffer {
        return Buffer.from(
            getAccountPublicKey(
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
        {
            onChainCommitmentKey,
        }: Pick<CryptographicParameters, 'onChainCommitmentKey'>
    ): Buffer {
        return Buffer.from(
            getCredentialId(
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
        return Buffer.from(
            getPrfKey(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex
            ),
            'hex'
        );
    }

    getIdCredSec(identityProviderIndex: number, identityIndex: number): Buffer {
        return Buffer.from(
            getIdCredSec(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex
            ),
            'hex'
        );
    }

    getSignatureBlindingRandomness(
        identityProviderIndex: number,
        identityIndex: number
    ): Buffer {
        return Buffer.from(
            getSignatureBlindingRandomness(
                this.seedAsHex,
                this.network,
                identityProviderIndex,
                identityIndex
            ),
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
            getAttributeCommitmentRandomness(
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

    getVerifiableCredentialSigningKey(
        verifiableCredentialIndex: number
    ): Buffer {
        return Buffer.from(
            getVerifiableCredentialSigningKey(
                this.seedAsHex,
                this.network,
                verifiableCredentialIndex
            ),
            'hex'
        );
    }

    getVerifiableCredentialPublicKey(
        verifiableCredentialIndex: number
    ): Buffer {
        return Buffer.from(
            getVerifiableCredentialPublicKey(
                this.seedAsHex,
                this.network,
                verifiableCredentialIndex
            ),
            'hex'
        );
    }

    getVerifiableCredentialEncryptionKey(
        verifiableCredentialIndex: number
    ): Buffer {
        return Buffer.from(
            getVerifiableCredentialEncryptionKey(
                this.seedAsHex,
                this.network,
                verifiableCredentialIndex
            ),
            'hex'
        );
    }
}
