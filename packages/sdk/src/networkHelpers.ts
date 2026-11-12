import type { Network } from './types.js';
import * as GenesisHashPrefix from './types/GenesisHashPrefix.js';

/**
 * Get the string form of a network used in DIDs (`did:ccd:<network>:...`) and CAIP-2 chain IDs (`ccd:<network>`):
 * `testnet`, `mainnet` or the genesis hash prefix.
 *
 * @param network - The network.
 * @throws If `network` is not a valid network.
 * @returns The string form of `network`.
 */
export function networkToString(network: Network): string {
    if (GenesisHashPrefix.instanceOf(network)) return GenesisHashPrefix.toHexString(network);
    // Accept any casing of the names, as the SDK has always lowercased them.
    switch ((network as string).toLowerCase()) {
        case 'testnet':
            return 'testnet';
        case 'mainnet':
            return 'mainnet';
    }
    throw new Error(`Unsupported network: ${network}`);
}

/**
 * Parse the string form of a network, as used in DIDs and CAIP-2 chain IDs.
 *
 * `testnet`/`mainnet` parse to `'Testnet'`/`'Mainnet'`, and 32 lowercase hex characters parse to a
 * {@linkcode GenesisHashPrefix.Type}. The form is preserved: a genesis hash prefix is never turned into a name,
 * or the other way round.
 *
 * @param value - `testnet`, `mainnet` or a genesis hash prefix.
 * @throws If `value` is not a valid network.
 * @returns The network.
 */
export function networkFromString(value: string): Network {
    switch (value) {
        case 'testnet':
            return 'Testnet';
        case 'mainnet':
            return 'Mainnet';
    }
    if (GenesisHashPrefix.instanceOf(value)) return value;
    throw new Error(`Unsupported network: ${value}`);
}

/**
 * Get the genesis hash prefix of the chain a network refers to.
 *
 * @param network - The network.
 * @returns The genesis hash prefix of `network`.
 */
export function getNetworkGenesisHashPrefix(network: Network): GenesisHashPrefix.Type {
    switch (networkToString(network)) {
        case 'testnet':
            return GenesisHashPrefix.TESTNET;
        case 'mainnet':
            return GenesisHashPrefix.MAINNET;
        default:
            return network as GenesisHashPrefix.Type;
    }
}

/**
 * Whether two networks refer to the same chain, regardless of how they are written. For example
 * `isSameNetwork('Testnet', GenesisHashPrefix.TESTNET)` is `true`.
 *
 * @param a - A network.
 * @param b - Another network.
 * @returns Whether `a` and `b` refer to the same chain.
 */
export function isSameNetwork(a: Network, b: Network): boolean {
    return getNetworkGenesisHashPrefix(a) === getNetworkGenesisHashPrefix(b);
}

/**
 * Get the network from a CAIP-2 chain ID in the `ccd` namespace: `ccd:testnet`, `ccd:mainnet` or
 * `ccd:<genesis hash prefix>`. The form is preserved.
 *
 * @param chainId - The chain ID.
 * @throws If `chainId` is not a supported chain ID.
 * @returns The network.
 */
export function networkFromChainId(chainId: string): Network {
    const match = chainId.match(/^ccd:(.+)$/);
    if (match === null) throw new Error(`Unsupported chain ID: ${chainId}`);
    try {
        return networkFromString(match[1]);
    } catch {
        throw new Error(`Unsupported chain ID: ${chainId}`);
    }
}

/**
 * Get the CAIP-2 chain ID of a network: `ccd:testnet`, `ccd:mainnet` or `ccd:<genesis hash prefix>`.
 *
 * @param network - The network.
 * @returns The chain ID.
 */
export function networkToChainId(network: Network): string {
    return `ccd:${networkToString(network)}`;
}

/**
 * Get the network used for key derivation (the BIP-44 coin type). There are only two: mainnet (by name or genesis
 * hash prefix) derives as `'Mainnet'`, and every other network derives as `'Testnet'`.
 *
 * @param network - The network.
 * @returns `'Mainnet'` or `'Testnet'`.
 */
export function getKeyDerivationNetwork(network: Network): 'Testnet' | 'Mainnet' {
    return isSameNetwork(network, 'Mainnet') ? 'Mainnet' : 'Testnet';
}
