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
 * Android redirects use market:// so the Play Store *app* opens (not the web listing).
 */
export const ID_APP_PACKAGE = 'com.idwallet.app';

export const ID_APP_APPLE_ID = '6746754485';

/** TestFlight public link code (App Store Connect → TestFlight → Public Link). */
export const ID_APP_TESTFLIGHT_JOIN_CODE = 'vjDAYkyy';

export const ID_APP_STORE = {
    ios: 'https://apps.apple.com/in/app/concordium-id-app/id6746754485',
    /**
     * iOS store handoff from Safari.
     * Prefer HTTPS — `itms-apps://` often triggers Safari
     * "address is invalid" from web pages.
     */
    iosNative: `https://apps.apple.com/app/id${ID_APP_APPLE_ID}`,
    /** Opens the TestFlight app on the ID App beta page (no join code needed). */
    iosTestFlight: `itms-beta://beta.itunes.apple.com/v1/app/${ID_APP_APPLE_ID}`,
    /** HTTPS listing — badges / desktop fallback only */
    android: `https://play.google.com/store/apps/details?id=${ID_APP_PACKAGE}&hl=en`,
    /** Native Play Store app scheme */
    androidMarket: `market://details?id=${ID_APP_PACKAGE}`,
};

/**
 * TestFlight test mode — send iOS testers to TestFlight instead of the App Store.
 * Enable with `?tf=1` / `?testflight=1` or localStorage `useTestFlight=1`.
 */
export function isTestFlightMode(): boolean {
    try {
        const qs = new URLSearchParams(window.location.search);
        if (qs.get('tf') === '1' || qs.get('testflight') === '1') {
            localStorage.setItem('useTestFlight', '1');
            return true;
        }
        return localStorage.getItem('useTestFlight') === '1';
    } catch {
        return false;
    }
}

/**
 * TestFlight handoff URL. A join code (`?tfCode=…`, localStorage `testFlightJoinCode`
 * or `VITE_TESTFLIGHT_JOIN_CODE`) opens the invite page for testers who have not
 * accepted yet; otherwise open the TestFlight app directly.
 */
export function getIdAppTestFlightUrl(): string {
    let joinCode: string | null = null;
    try {
        const qs = new URLSearchParams(window.location.search);
        joinCode = qs.get('tfCode') || localStorage.getItem('testFlightJoinCode');
        if (qs.get('tfCode')) {
            localStorage.setItem('testFlightJoinCode', qs.get('tfCode') as string);
        }
    } catch {
        joinCode = null;
    }

    if (!joinCode) {
        const fromEnv = (import.meta as any).env?.VITE_TESTFLIGHT_JOIN_CODE;
        joinCode =
            typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv : ID_APP_TESTFLIGHT_JOIN_CODE;
    }

    return joinCode ? `https://testflight.apple.com/join/${joinCode}` : ID_APP_STORE.iosTestFlight;
}

/**
 * Native store URL that opens Play Store / App Store *apps* (not browser).
 * Android: attach Play Install Referrer with encoded wc: URI for deferred pairing.
 */
export function getIdAppNativeStoreUrl(walletConnectUri?: string | null): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        return isTestFlightMode() ? getIdAppTestFlightUrl() : ID_APP_STORE.iosNative;
    }

    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
        return buildAndroidPlayStoreUrl(walletConnectUri, 'intent');
    }

    return getIdAppStoreUrl(walletConnectUri);
}

/**
 * Encode wc: for Play `referrer=` (must be encodeURIComponent — raw wc: breaks the URL).
 */
export function buildPlayInstallReferrer(walletConnectUri: string): string {
    return encodeURIComponent(walletConnectUri);
}

/**
 * Android Play / market / intent URL with optional referrer=wc:…
 * @param mode intent = open Play app; market = market://; https = browser listing
 */
export function buildAndroidPlayStoreUrl(
    walletConnectUri?: string | null,
    mode: 'intent' | 'market' | 'https' = 'intent'
): string {
    const baseQuery = `id=${ID_APP_PACKAGE}`;
    const referrer =
        walletConnectUri?.startsWith('wc:') ? `&referrer=${buildPlayInstallReferrer(walletConnectUri)}` : '';

    if (mode === 'https') {
        return `https://play.google.com/store/apps/details?${baseQuery}${referrer}&hl=en`;
    }
    if (mode === 'market') {
        return `market://details?${baseQuery}${referrer}`;
    }
    // Intent opens com.android.vending with referrer intact
    return `intent://details?${baseQuery}${referrer}#Intent;scheme=market;package=com.android.vending;end`;
}

/**
 * Get ID App store URL for current platform.
 * Android: market:// with optional referrer=wc:
 * iOS: HTTPS App Store / TestFlight.
 */
export function getIdAppStoreUrl(walletConnectUri?: string | null): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        return isTestFlightMode() ? getIdAppTestFlightUrl() : ID_APP_STORE.iosNative;
    }

    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
        return buildAndroidPlayStoreUrl(walletConnectUri, 'market');
    }

    return buildAndroidPlayStoreUrl(walletConnectUri, 'https');
}

/**
 * HTTPS Play Store listing (badges / rare fallback only — prefer native store URL).
 */
export function getIdAppPlayStoreHttpsUrl(walletConnectUri?: string | null): string {
    return buildAndroidPlayStoreUrl(walletConnectUri, 'https');
}

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
 * Custom-scheme pair link with the wc: URI in the query.
 *
 * Camera QR loads this page with no user gesture, so iOS clipboard write fails.
 * Short wake (`concordiumidapp://open`) then opens the app empty → "expired" /
 * incomplete pairing. Embed the URI like Android so pair() has a payload.
 *
 * `_t` cache-busts Safari scheme blacklisting after user taps Cancel.
 */
export function getConcordiumIdPairDeepLink(wcUri: string, source = 'qr'): string {
    const encodedUri = encodeURIComponent(wcUri);
    return `concordiumidapp://wc?uri=${encodedUri}&source=${encodeURIComponent(source)}&_t=${Date.now()}`;
}

export function getConcordiumIdDeepLink(wcUri: string): string {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
        // Camera / Safari hops have no paste gesture. Put wc: on the wake link.
        return getConcordiumIdWakeDeepLink(wcUri);
    }
    return getConcordiumIdPairDeepLink(wcUri, 'mobile');
}

/**
 * Short iOS wake link — no wc: payload. App reads clipboard handoff on Create Account.
 * @deprecated alias — use getConcordiumIdWakeDeepLink
 */
export function getConcordiumIdBridgeDeepLink(wcUri?: string): string {
    return getConcordiumIdWakeDeepLink(wcUri);
}

/**
 * iOS wake link. Pass `wcUri` so camera/Safari hops can pair without clipboard.
 * Clipboard remains a fallback when the user taps Open with ID App.
 */
export function getConcordiumIdWakeDeepLink(wcUri?: string): string {
    const params = new URLSearchParams();
    params.set('source', wcUri ? 'qr' : 'clipboard');
    params.set('_t', String(Date.now()));
    if (wcUri?.startsWith('wc:')) {
        params.set('uri', wcUri);
    }
    return `concordiumidapp://open?${params.toString()}`;
}

/**
 * Open an iOS custom URL scheme without top-level navigation.
 * `window.location.href = scheme://…` makes Safari show
 * "cannot open the page because the address is invalid" when the app
 * does not open (or after Cancel). Hidden iframe / <a> avoids that.
 */
export function openIosCustomScheme(deepLink: string): void {
    try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.setAttribute('aria-hidden', 'true');
        iframe.src = deepLink;
        document.body.appendChild(iframe);
        setTimeout(() => {
            try {
                iframe.remove();
            } catch {
                /* ignore */
            }
        }, 2000);
    } catch {
        /* fall through to <a> */
    }

    try {
        const link = document.createElement('a');
        link.href = deepLink;
        link.style.display = 'none';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => link.remove(), 100);
    } catch (error) {
        console.warn('[verification-web-ui] openIosCustomScheme failed', error);
    }
}

/**
 * Build HTTPS QR redirect URL for phone camera scans.
 *
 * Camera apps open https reliably; custom schemes (`concordiumidapp://`) often fail.
 * Phone lands on this page → deep link / store with embedded wc: URI (no bridge).
 */
export function buildQrRedirectUrl(wcUri: string): string {
    const url = new URL(window.location.href);
    url.searchParams.delete('wc_redirect');
    url.searchParams.delete('uri');
    url.searchParams.delete('install_id');
    url.searchParams.delete('source');

    url.searchParams.set('wc_redirect', '1');
    url.searchParams.set('uri', wcUri);
    url.searchParams.set('source', 'qr');
    return url.toString();
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
 * Remove QR redirect parameters while preserving the rest of the current URL.
 */
export function getQrRedirectCleanUrl(): string {
    const url = new URL(window.location.href);
    url.searchParams.delete('wc_redirect');
    url.searchParams.delete('uri');
    url.searchParams.delete('install_id');
    url.searchParams.delete('source');
    return url.toString();
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

    // Concordium ID — short bridge link on iOS (Safari rejects long wc: URLs)
    if (wallet.id === 'concordium-id') {
        return getConcordiumIdDeepLink(wcUri);
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

