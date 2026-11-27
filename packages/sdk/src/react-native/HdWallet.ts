import { Buffer } from 'buffer/index.js';

import { getKeyDerivationNetwork } from '../networkHelpers.js';
import type { AttributesKeys, CryptographicParameters, Network } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';
import { seedFromPhrase } from '../wasm/seedPhrase.js';
import { indexInRange, loadBindings } from './bindings.js';

function identityPath(provider: number, index: number) {
    return { provider: indexInRange(provider, 'identityProviderIndex'), index: indexInRange(index, 'identityIndex') };
}

/** Native HD wallet derivations using the same paths and encodings as the synchronous SDK wallet. */
export class ConcordiumHdWallet {
    static fromSeedPhrase(phrase: string, network: Network): ConcordiumHdWallet {
        return ConcordiumHdWallet.fromHex(seedFromPhrase(phrase), network);
    }

    static fromHex(seed: string, network: Network): ConcordiumHdWallet {
        if (!/^[\da-f]{128}$/i.test(seed)) {
            throw new Error('Expected a 64-byte seed encoded as hex');
        }
        return new ConcordiumHdWallet({ seed, network: getKeyDerivationNetwork(network) });
    }

    private constructor(private readonly seed: { seed: string; network: 'Testnet' | 'Mainnet' }) {}

    async getAccountSigningKey(provider: number, index: number, counter: number): Promise<Buffer> {
        const native = await loadBindings();
        return Buffer.from(
            native.getAccountSigningKey(
                this.seed,
                identityPath(provider, index),
                indexInRange(counter, 'credentialCounter')
            )
        );
    }

    async getAccountPublicKey(provider: number, index: number, counter: number): Promise<Buffer> {
        const native = await loadBindings();
        return Buffer.from(
            native.getAccountPublicKey(
                this.seed,
                identityPath(provider, index),
                indexInRange(counter, 'credentialCounter')
            )
        );
    }

    async getCredentialId(
        provider: number,
        index: number,
        counter: number,
        { onChainCommitmentKey }: Pick<CryptographicParameters, 'onChainCommitmentKey'>
    ): Promise<Buffer> {
        const native = await loadBindings();
        return Buffer.from(
            native.getCredentialId(
                this.seed,
                identityPath(provider, index),
                indexInRange(counter, 'credentialCounter', 255),
                onChainCommitmentKey
            )
        );
    }

    async getPrfKey(provider: number, index: number): Promise<Buffer> {
        return Buffer.from((await loadBindings()).getPrfKey(this.seed, identityPath(provider, index)));
    }

    async getIdCredSec(provider: number, index: number): Promise<Buffer> {
        return Buffer.from((await loadBindings()).getIdCredSec(this.seed, identityPath(provider, index)));
    }

    async getSignatureBlindingRandomness(provider: number, index: number): Promise<Buffer> {
        return Buffer.from(
            (await loadBindings()).getSignatureBlindingRandomness(this.seed, identityPath(provider, index))
        );
    }

    async getAttributeCommitmentRandomness(
        provider: number,
        index: number,
        counter: number,
        attribute: AttributesKeys
    ): Promise<Buffer> {
        const native = await loadBindings();
        return Buffer.from(
            native.getAttributeCommitmentRandomness(
                this.seed,
                identityPath(provider, index),
                indexInRange(counter, 'credentialCounter'),
                indexInRange(attribute, 'attribute', 255)
            )
        );
    }

    async getVerifiableCredentialSigningKey(issuer: ContractAddress.Type, index: number): Promise<Buffer> {
        return Buffer.from(
            (await loadBindings()).getVerifiableCredentialSigningKey(
                this.seed,
                issuer,
                indexInRange(index, 'verifiableCredentialIndex')
            )
        );
    }

    async getVerifiableCredentialPublicKey(issuer: ContractAddress.Type, index: number): Promise<Buffer> {
        return Buffer.from(
            (await loadBindings()).getVerifiableCredentialPublicKey(
                this.seed,
                issuer,
                indexInRange(index, 'verifiableCredentialIndex')
            )
        );
    }

    async getVerifiableCredentialBackupEncryptionKey(): Promise<Buffer> {
        return Buffer.from((await loadBindings()).getVerifiableCredentialBackupEncryptionKey(this.seed));
    }
}
