import { entropyToMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

import { getKeyDerivationNetwork } from '../networkHelpers.js';
import { indexInRange, loadBindings } from '../react-native/bindings.js';
import type { NativeWorkOptions } from '../react-native/nativeBridge.js';
import type { IdObjectRequestV1, Versioned } from '../types.js';
import type {
    IdentityRecoveryRequestInput,
    IdentityRecoveryRequestWithKeysInput,
    IdentityRequestInput,
    IdentityRequestWithKeysInput,
} from '../wasm/identity.js';

export type {
    ArInfo,
    CryptographicParameters,
    IdObjectRequestV1,
    IdentityObjectV1,
    IpInfo,
    Versioned,
} from '../types.js';
export type {
    IdentityRecoveryRequestInput,
    IdentityRecoveryRequestWithKeysInput,
    IdentityRequestInput,
    IdentityRequestWithKeysInput,
} from '../wasm/identity.js';
export { seedFromPhrase } from '../wasm/seedPhrase.js';
export { AttributesKeys } from '../types/attributes.js';
export { ConcordiumHdWallet } from '../react-native/HdWallet.js';
export * from '../react-native/credentials.js';
export * from '../react-native/presentation.js';
export * from '../react-native/schema.js';
export * from '../react-native/web3Id.js';
export { Parameter, ReturnValue, ContractEvent } from '../react-native/contractValues.js';
export type { NativeError, NativeWorkOptions } from '../react-native/nativeBridge.js';

/** Creates a V1 identity request on a native Rust worker thread. */
export async function createIdentityRequest(
    { seed, net, identityIndex, ...parameters }: IdentityRequestInput,
    options?: NativeWorkOptions
): Promise<Versioned<IdObjectRequestV1>> {
    const native = await loadBindings();
    const request = await native.createIdentityRequest(
        seed,
        getKeyDerivationNetwork(net),
        indexInRange(identityIndex, 'identityIndex'),
        JSON.stringify(parameters),
        options
    );
    return JSON.parse(request).idObjectRequest;
}

/** Creates a V1 identity request using externally managed keys. */
export async function createIdentityRequestWithKeys(
    input: IdentityRequestWithKeysInput,
    options?: NativeWorkOptions
): Promise<Versioned<IdObjectRequestV1>> {
    const native = await loadBindings();
    return JSON.parse(await native.createIdentityRequestWithKeys(JSON.stringify(input), options)).idObjectRequest;
}

/** JSON representation consumed by an identity provider's recovery endpoint. */
export type IdentityRecoveryRequest = Versioned<{ idCredPub: string; timestamp: number; proof: string }>;

/** Creates a recovery request for the identity at the specified wallet path. */
export async function createIdentityRecoveryRequest(
    { seedAsHex, net, identityIndex, ...parameters }: IdentityRecoveryRequestInput,
    options?: NativeWorkOptions
): Promise<IdentityRecoveryRequest> {
    const native = await loadBindings();
    const request = await native.createIdentityRecoveryRequest(
        seedAsHex,
        getKeyDerivationNetwork(net),
        indexInRange(identityIndex, 'identityIndex'),
        JSON.stringify(parameters),
        options
    );
    return JSON.parse(request).idRecoveryRequest;
}

/** Creates a recovery request using an externally managed identity credential secret. */
export async function createIdentityRecoveryRequestWithKeys(
    input: IdentityRecoveryRequestWithKeysInput,
    options?: NativeWorkOptions
): Promise<IdentityRecoveryRequest> {
    const native = await loadBindings();
    return JSON.parse(await native.createIdentityRecoveryRequestWithKeys(JSON.stringify(input), options))
        .idRecoveryRequest;
}

/** Generates a 64-byte hex seed using the device's cryptographic randomness. */
export async function generateIdentitySeed(): Promise<string> {
    return (await loadBindings()).generateIdentitySeed();
}

/** Generates a 24-word English BIP-39 mnemonic using the device's cryptographic randomness. */
export async function generateSeedPhrase(): Promise<string> {
    const native = await loadBindings();
    return entropyToMnemonic(new Uint8Array(native.generateMnemonicEntropy()), wordlist);
}

/** Generates public validator keys and ownership proofs for a test fixture. */
export async function generateValidatorKeyFixture(
    account: import('../types/AccountAddress.js').Type
): Promise<import('../types.js').BakerKeysWithProofs> {
    return JSON.parse(await (await loadBindings()).generateValidatorKeyFixture(account.address));
}
