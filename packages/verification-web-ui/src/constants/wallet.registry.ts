/**
 * Wallet Registry
 * Contains information about supported wallets for WalletConnect integration
 *
 */
import { ModalConstants } from '@/constants/modal.constants';

export interface WalletInfo {
    id: string;
    name: string;
    icon: string; // URL or data URI for wallet icon
    scheme: string; // Base scheme for deep links
    deepLinkScheme: {
        ios: string;
        android: string;
    };
    universalLink?: string;
    appStore: {
        ios: string;
        android: string;
    };
    // Custom handler for wallets that need special deep link logic
    customDeepLink?: boolean;
}

/**
 * App Store URLs for ID App
 */
export const ID_APP_STORE = {
    ios: 'https://apps.apple.com/ca/app/concordium-id/id6746754485',
    android: 'https://play.google.com/store/apps/details?id=com.idwallet.app&hl=en_CA',
};

/**
 * Get network-aware deep link for Concordium Wallet
 */
export function getConcordiumWalletDeepLink(wcUri: string): string | null {
    const ua = navigator.userAgent || '';
    const network = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) || 'testnet';
    const isTestnet = network === 'testnet';

    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        const scheme = isTestnet ? 'cryptoxtestnet' : 'cryptox';
        return `${scheme}://wc?uri=${encodeURIComponent(wcUri)}&redirect=googlechrome://`;
    }
    if (/android/i.test(ua)) {
        const scheme = isTestnet ? 'cryptox-wc-testnet' : 'cryptox-wc';
        return `${scheme}://wc?uri=${encodeURIComponent(wcUri)}&go_back=true`;
    }
    return null;
}

/**
 * Get deep link for Concordium ID App
 * Returns simple deep link - fallback handling is done by the caller
 */
export function getConcordiumIdDeepLink(wcUri: string): string {
    const encodedUri = encodeURIComponent(wcUri);
    return `concordiumidapp://wc?uri=${encodedUri}`;
}

/**
 * Build QR redirect URL (for desktop wallet compatibility)
 */
export function buildQrRedirectUrl(wcUri: string): string {
    const base = window.location.origin + window.location.pathname;
    return `${base}?wc_redirect=1&uri=${encodeURIComponent(wcUri)}`;
}

/**
 * Check if current page load is from QR redirect
 */
export function getQrRedirectUri(): string | null {
    const params = new URLSearchParams(window.location.search);
    if (params.get('wc_redirect') !== '1') return null;
    return params.get('uri');
}

/**
 * List of supported wallets that work with Concordium WalletConnect
 * Order matters for iOS - it will try each wallet in sequence
 */
export const WALLET_REGISTRY: WalletInfo[] = [
    {
        id: 'coin98',
        name: 'Coin98',
        icon: 'https://registry.walletconnect.com/api/v2/logo/md/dee547be-936a-4c92-9e3f-7a2350a62e00',
        scheme: 'coin98',
        deepLinkScheme: {
            ios: 'coin98://',
            android: 'coin98://',
        },
        universalLink: 'https://coin98.com/wc',
        appStore: {
            ios: 'https://apps.apple.com/app/coin98-wallet/id1561969966',
            android: 'https://play.google.com/store/apps/details?id=coin98.crypto.finance.media',
        },
    },
    {
        id: 'bitcoin-com',
        name: 'Bitcoin.com',
        icon: 'https://registry.walletconnect.com/api/v2/logo/md/0b415a74-6db6-4a52-9ee0-33f1d486a300',
        scheme: 'bitcoincom',
        deepLinkScheme: {
            ios: 'bitcoincom://',
            android: 'bitcoincom://',
        },
        universalLink: 'https://wallet.bitcoin.com/wc',
        appStore: {
            ios: 'https://apps.apple.com/app/bitcoin-com-wallet/id1252903728',
            android: 'https://play.google.com/store/apps/details?id=com.bitcoin.mwallet',
        },
    },
    {
        id: 'ledger-live',
        name: 'Ledger Live',
        icon: 'https://registry.walletconnect.com/api/v2/logo/md/a7f416de-aa03-4c5e-3280-ab49269aef00',
        scheme: 'ledgerlive',
        deepLinkScheme: {
            ios: 'ledgerlive://',
            android: 'ledgerlive://',
        },
        appStore: {
            ios: 'https://apps.apple.com/app/ledger-live-crypto-wallet/id1361671700',
            android: 'https://play.google.com/store/apps/details?id=com.ledger.live',
        },
    },
    {
        id: 'concordium-id',
        name: 'Concordium ID',
        icon: 'https://play-lh.googleusercontent.com/xJ5JnKGJ-zKLx93Sj9AH9KnxOYAGvraPqWzBG0FpXAhJSPKkKQaWGKGQYZoGRBQIBw=w240-h480-rw',
        scheme: 'concordiumidapp',
        deepLinkScheme: {
            ios: 'concordiumidapp://',
            android: 'concordiumidapp://',
        },
        universalLink: 'https://concordiumid.app/wc',
        appStore: ID_APP_STORE,
    },
    {
        id: 'concordium-wallet',
        name: 'Concordium Wallet',
        icon: 'https://play-lh.googleusercontent.com/K4VnV-LdYqL8fvJYKCfv8p6K5YCUJkbV8ZDZP1Qn3F1bUGnSTlUzFe3m8vQM7fI5ZQ=w240-h480-rw',
        scheme: 'cryptox',
        deepLinkScheme: {
            ios: 'cryptox://',
            android: 'cryptox-wc://',
        },
        universalLink: 'https://wallet.concordium.com/wc',
        appStore: {
            ios: 'https://apps.apple.com/app/concordium-wallet/id1566996491',
            android:
                'https://play.google.com/store/apps/details?id=software.concordium.mobilewallet.seedphrase.mainnet',
        },
        customDeepLink: true, // Uses getConcordiumWalletDeepLink()
    },
];

/**
 * Get wallet info by ID
 */
export function getWalletById(id: string): WalletInfo | undefined {
    return WALLET_REGISTRY.find((w) => w.id === id);
}

/**
 * Build wallet deep link with WalletConnect URI
 */
export function buildWalletDeepLink(wallet: WalletInfo, wcUri: string): string | null {
    // Special handling for Concordium Wallet (network-aware)
    if (wallet.customDeepLink && wallet.id === 'concordium-wallet') {
        return getConcordiumWalletDeepLink(wcUri);
    }

    // Standard deep link format
    const encodedUri = encodeURIComponent(wcUri);
    return `${wallet.scheme}://wc?uri=${encodedUri}`;
}

/**
 * Get the appropriate app store URL based on platform
 */
export function getAppStoreUrl(wallet: WalletInfo): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    return isIOS ? wallet.appStore.ios : wallet.appStore.android;
}

/**
 * Get ID App store URL for current platform
 */
export function getIdAppStoreUrl(): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    return isIOS ? ID_APP_STORE.ios : ID_APP_STORE.android;
}
