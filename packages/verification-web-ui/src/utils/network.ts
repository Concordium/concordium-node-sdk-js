import { getConfig } from '../config.state';

/**
 * Network resolution for the verification web UI.
 *
 * This is the single place that decides which network the UI talks to: the WalletConnect chain ID and the wallet
 * deep-link schemes. Everything else should call {@linkcode resolveNetwork}.
 */

/** A network with built-in defaults. */
export type NamedNetwork = 'mainnet' | 'testnet';

/**
 * URL schemes used to deep link into a mobile wallet, without `://`, e.g. `cryptox`.
 * The UI opens `<scheme>://wc?uri=<WalletConnect URI>...`.
 */
export interface WalletDeepLinks {
    /** Scheme to use on iOS. */
    ios?: string;
    /** Scheme to use on Android. */
    android?: string;
}

/**
 * A network without built-in defaults, identified by its CAIP-2 chain ID.
 */
export interface CustomNetworkConfig {
    /**
     * The chain ID requested from wallets over WalletConnect: `ccd:<first 32 hex characters of the genesis hash>`.
     * `ccd:testnet` and `ccd:mainnet` are also accepted.
     */
    chainId: `ccd:${string}`;
    /**
     * Schemes for deep linking into a wallet that supports this network. When a scheme is missing for the current
     * platform, the UI does not deep link into a wallet and falls back to the QR code / WalletConnect URI.
     */
    walletDeepLinks?: WalletDeepLinks;
}

/** The `network` configuration option. */
export type NetworkConfig = NamedNetwork | CustomNetworkConfig;

/** A resolved network. */
export interface ResolvedNetwork {
    /** Whether the network is one of the named networks or a custom one. */
    kind: NamedNetwork | 'custom';
    /** The chain ID to request from wallets over WalletConnect. */
    chainId: string;
    /** Schemes for deep linking into a wallet on this network. */
    walletDeepLinks: WalletDeepLinks;
}

/** Chain-ID environment overrides for the named networks. */
export interface NetworkEnv {
    VITE_CHAIN_ID_TESTNET?: string;
    VITE_CHAIN_ID_MAINNET?: string;
}

const DEFAULT_NETWORK: NamedNetwork = 'testnet';

const DEFAULT_CHAIN_IDS: Record<NamedNetwork, string> = {
    testnet: 'ccd:4221332d34e1694168c2a0c0b3fd0f27',
    mainnet: 'ccd:9dd9ca4d19e9393877d2c44b70f89acb',
};

// The schemes the CryptoX apps register: on iOS one per network build; on Android the stable (mainnet) and preview
// (testnet) builds both register `cryptox-wc`.
const DEFAULT_WALLET_DEEP_LINKS: Record<NamedNetwork, WalletDeepLinks> = {
    testnet: { ios: 'cryptoxtestnet', android: 'cryptox-wc' },
    mainnet: { ios: 'cryptox', android: 'cryptox-wc' },
};

const CHAIN_ID_REGEX = /^ccd:([0-9a-f]{32}|testnet|mainnet)$/;

function isNamedNetwork(value: unknown): value is NamedNetwork {
    return value === 'mainnet' || value === 'testnet';
}

/** Whether `value` is a valid custom network configuration. */
export function isCustomNetworkConfig(value: unknown): value is CustomNetworkConfig {
    if (typeof value !== 'object' || value === null) return false;
    const { chainId, walletDeepLinks } = value as Partial<CustomNetworkConfig>;
    if (typeof chainId !== 'string' || !CHAIN_ID_REGEX.test(chainId)) return false;
    if (walletDeepLinks === undefined) return true;
    if (typeof walletDeepLinks !== 'object' || walletDeepLinks === null) return false;
    return ['ios', 'android'].every((k) => {
        const scheme = (walletDeepLinks as Record<string, unknown>)[k];
        return scheme === undefined || typeof scheme === 'string';
    });
}

/**
 * Validate a `network` configuration value.
 *
 * @throws If `config` is neither `'mainnet'`, `'testnet'` nor a valid {@linkcode CustomNetworkConfig}.
 */
export function validateNetworkConfig(config: unknown): NetworkConfig {
    if (isNamedNetwork(config) || isCustomNetworkConfig(config)) return config;
    throw new Error(
        `Invalid network: ${JSON.stringify(config)}. Expected 'mainnet', 'testnet' or { chainId: 'ccd:<32 lowercase hex characters>' }.`
    );
}

/**
 * The value stored in localStorage for a network. Named networks are stored as plain strings (as before), custom
 * networks as JSON.
 */
export function serializeNetworkConfig(config: NetworkConfig): string {
    return isNamedNetwork(config) ? config : JSON.stringify(config);
}

/**
 * Read a value stored by {@linkcode serializeNetworkConfig}, including plain `'testnet'`/`'mainnet'` strings stored
 * by earlier versions. Returns `undefined` for missing or invalid values.
 */
export function parseStoredNetworkConfig(stored: string | null | undefined): NetworkConfig | undefined {
    if (stored === null || stored === undefined) return undefined;
    if (isNamedNetwork(stored)) return stored;
    try {
        const parsed: unknown = JSON.parse(stored);
        return isCustomNetworkConfig(parsed) ? parsed : undefined;
    } catch {
        return undefined;
    }
}

/**
 * Resolve the network from explicit inputs. The configured value wins, then the stored value, then testnet.
 *
 * @param config - The `network` configuration option, if set.
 * @param stored - The value stored in localStorage, if any.
 * @param env - Chain-ID overrides for the named networks.
 */
export function resolveNetworkFrom(
    config: NetworkConfig | undefined,
    stored: string | null | undefined,
    env: NetworkEnv = {}
): ResolvedNetwork {
    const network = config ?? parseStoredNetworkConfig(stored) ?? DEFAULT_NETWORK;
    if (isNamedNetwork(network)) {
        const override = network === 'mainnet' ? env.VITE_CHAIN_ID_MAINNET : env.VITE_CHAIN_ID_TESTNET;
        return {
            kind: network,
            chainId: override || DEFAULT_CHAIN_IDS[network],
            walletDeepLinks: DEFAULT_WALLET_DEEP_LINKS[network],
        };
    }
    validateNetworkConfig(network);
    return { kind: 'custom', chainId: network.chainId, walletDeepLinks: { ...network.walletDeepLinks } };
}

/**
 * Build a wallet deep link for the current platform, or `null` if the network has no scheme for it.
 *
 * @param network - The resolved network.
 * @param wcUri - The WalletConnect URI.
 * @param userAgent - The user agent to detect the platform from.
 */
export function walletDeepLink(network: ResolvedNetwork, wcUri: string, userAgent: string): string | null {
    const uri = encodeURIComponent(wcUri);
    if (/iPad|iPhone|iPod/.test(userAgent)) {
        const scheme = network.walletDeepLinks.ios;
        return scheme ? `${scheme}://wc?uri=${uri}&redirect=googlechrome://` : null;
    }
    if (/android/i.test(userAgent)) {
        const scheme = network.walletDeepLinks.android;
        return scheme ? `${scheme}://wc?uri=${uri}&go_back=true` : null;
    }
    return null;
}

/** The localStorage key holding the network. Matches `ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK`. */
export const NETWORK_STORAGE_KEY = 'sdkNetwork';

function readStored(): string | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage.getItem(NETWORK_STORAGE_KEY);
    } catch {
        return null;
    }
}

function readConfigured(): NetworkConfig | undefined {
    const configured = getConfig().network;
    return configured === undefined || configured === null ? undefined : validateNetworkConfig(configured);
}

/**
 * Resolve the network the UI is configured for, from the `network` configuration option, then the value stored
 * by `initWalletConnect`, then testnet.
 */
export function resolveNetwork(): ResolvedNetwork {
    const env = ((import.meta as any).env ?? {}) as NetworkEnv;
    return resolveNetworkFrom(readConfigured(), readStored(), env);
}
