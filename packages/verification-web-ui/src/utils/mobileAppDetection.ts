/**
 * Mobile App Detection and Routing Utilities
 * Handles intelligent app detection and routing for mobile devices
 */
import { ModalConstants } from '@/constants/modal.constants';

export interface AppDetectionResult {
    concordiumWalletInstalled: boolean;
    concordiumIDInstalled: boolean;
    installedApps: Array<'concordium-wallet' | 'concordium-id'>;
    recommendedAction: 'open-wallet' | 'open-id' | 'show-selection' | 'show-store';
}

/**
 * Detects which Concordium apps are installed on the mobile device
 * Uses timeout-based detection by attempting to open app schemes
 */
export async function detectInstalledApps(): Promise<AppDetectionResult> {
    const network = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) || 'testnet';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    const result: AppDetectionResult = {
        concordiumWalletInstalled: false,
        concordiumIDInstalled: false,
        installedApps: [],
        recommendedAction: 'show-store',
    };

    // Check localStorage cache first (faster)
    const cachedWallet = localStorage.getItem('concordiumWalletInstalled');
    const cachedID = localStorage.getItem('concordiumIDInstalled');
    const cacheTimestamp = localStorage.getItem('appDetectionTimestamp');
    const now = Date.now();

    // Use cache if less than 5 minutes old
    if (cacheTimestamp && now - parseInt(cacheTimestamp) < 5 * 60 * 1000) {
        result.concordiumWalletInstalled = cachedWallet === 'true';
        result.concordiumIDInstalled = cachedID === 'true';
    } else {
        // Perform fresh detection
        try {
            // Try to detect Concordium Wallet
            result.concordiumWalletInstalled = await tryOpenApp(
                isIOS ? `cryptox${network}://` : `cryptox-wc-${network}://`,
                500
            );

            // Try to detect Concordium ID
            result.concordiumIDInstalled = await tryOpenApp('concordiumidapp://', 500);

            // Cache the results
            localStorage.setItem('concordiumWalletInstalled', result.concordiumWalletInstalled.toString());
            localStorage.setItem('concordiumIDInstalled', result.concordiumIDInstalled.toString());
            localStorage.setItem('appDetectionTimestamp', now.toString());
        } catch (error) {
            console.error('App detection failed:', error);
        }
    }

    // Build installed apps list
    if (result.concordiumWalletInstalled) {
        result.installedApps.push('concordium-wallet');
    }
    if (result.concordiumIDInstalled) {
        result.installedApps.push('concordium-id');
    }

    // Determine recommended action
    if (result.installedApps.length === 0) {
        result.recommendedAction = 'show-store';
    } else if (result.installedApps.length === 1) {
        result.recommendedAction = result.installedApps[0] === 'concordium-wallet' ? 'open-wallet' : 'open-id';
    } else {
        result.recommendedAction = 'show-selection';
    }

    return result;
}

/**
 * Attempts to open an app using its URL scheme
 * Returns true if app appears to be installed, false otherwise
 */
async function tryOpenApp(scheme: string, timeout: number = 500): Promise<boolean> {
    return new Promise((resolve) => {
        // Create an invisible iframe to try opening the app
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        let detected = false;
        let timer: ReturnType<typeof setTimeout>;

        // If the app is installed, the page will blur/hide
        const handleBlur = () => {
            detected = true;
            clearTimeout(timer);
            cleanup();
            resolve(true);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                detected = true;
                clearTimeout(timer);
                cleanup();
                resolve(true);
            }
        };

        const cleanup = () => {
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (iframe.parentNode) {
                iframe.parentNode.removeChild(iframe);
            }
        };

        // Set up detection listeners
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Timeout if app doesn't open
        timer = setTimeout(() => {
            cleanup();
            resolve(detected);
        }, timeout);

        // Try to open the app
        try {
            iframe.src = scheme;
        } catch (error) {
            cleanup();
            resolve(false);
        }
    });
}

/**
 * Opens the appropriate app store based on the device platform
 */
export function openAppStore(appType: 'concordium-wallet' | 'concordium-id' = 'concordium-wallet'): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);

    let storeUrl: string;

    if (appType === 'concordium-wallet') {
        if (isIOS) {
            storeUrl = 'https://apps.apple.com/app/concordium-wallet/id1566996491';
        } else if (isAndroid) {
            storeUrl =
                'https://play.google.com/store/apps/details?id=software.concordium.mobilewallet.seedphrase.mainnet';
        } else {
            return;
        }
    } else {
        // Concordium ID — open Play Store / App Store *app*
        if (isIOS) {
            // HTTPS opens App Store app from Safari without itms-apps "invalid address"
            storeUrl = 'https://apps.apple.com/app/id6746754485';
        } else if (isAndroid) {
            storeUrl = 'intent://details?id=com.idwallet.app#Intent;scheme=market;package=com.android.vending;end';
        } else {
            return;
        }
    }

    window.location.href = storeUrl;
}

/**
 * Show waiting UI and open native store app.
 * Does NOT navigate this tab to play.google.com — keeps dApp page alive for pairing.
 * iOS: clipboard should already hold wc: (written on Open tap). No bridge register.
 */
export async function redirectToIdAppStore(walletConnectUri?: string | null): Promise<void> {
    const { getIdAppNativeStoreUrl } = await import('@/constants/wallet.registry');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);
    const platform = isIOS ? 'ios' : isAndroid ? 'android' : 'other';

    console.log('[IDApp] store redirect START', {
        platform,
        hasWalletConnectUri: Boolean(walletConnectUri),
    });
    const { bridgeTrace } = await import('@/utils/bridgeTrace');
    bridgeTrace('store redirect START', {
        platform,
        hasWalletConnectUri: Boolean(walletConnectUri),
    });

    // Mobile: clipboard wc: before store — iOS only (Android uses Play referrer).
    if (isIOS && walletConnectUri) {
        try {
            const { handoffIosClipboard } = await import('@/services/bridge.service');
            await handoffIosClipboard(walletConnectUri);
        } catch {
            /* fail-open */
        }
    }

    try {
        const { showStoreRedirectState } = await import('@/components/desktop/processing');
        await showStoreRedirectState();
    } catch (error) {
        console.warn('[IDApp] could not show store redirect UI', error);
    }

    const { isTestFlightMode } = await import('@/constants/wallet.registry');
    const storeUrl = getIdAppNativeStoreUrl(walletConnectUri);

    console.log('[IDApp] store redirect GO (native app only)', {
        platform,
        storeUrl: storeUrl.replace(/referrer=[^&#]+/, 'referrer=…'),
        hasReferrer: Boolean(walletConnectUri?.startsWith('wc:')),
        target: isIOS && isTestFlightMode() ? 'TestFlight' : isIOS ? 'App Store' : 'Play Store',
        keepPageAlive: true,
    });
    bridgeTrace('store redirect GO', {
        platform,
        target: isIOS && isTestFlightMode() ? 'TestFlight' : isIOS ? 'App Store' : 'Play Store',
        hasReferrer: Boolean(walletConnectUri?.startsWith('wc:')),
    });

    await new Promise((resolve) => setTimeout(resolve, 600));

    const link = document.createElement('a');
    link.href = storeUrl;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();

    try {
        const { showWaitingForPairingState } = await import('@/components/desktop/processing');
        setTimeout(() => {
            void showWaitingForPairingState();
        }, 900);
    } catch (error) {
        console.warn('[IDApp] could not show waiting-for-pairing UI', error);
    }
}

/**
 * Opens the app store specifically for Concordium ID app
 * Convenience function that ensures correct store URLs are used
 */
export function openAppStoreForConcordiumID(): void {
    openAppStore('concordium-id');
}

/**
 * Async Concordium ID store redirect.
 */
export async function openAppStoreForConcordiumIDAsync(walletConnectUri?: string | null): Promise<void> {
    await redirectToIdAppStore(walletConnectUri);
}

/**
 * Attempts to open the Concordium ID app with a WalletConnect URI
 * Returns true if the app appears to have opened, false otherwise
 *
 * Note: On iOS Safari, we can't reliably detect if an app opened.
 * We use a timing-based approach and always attempt to open the app first.
 */
export async function tryOpenConcordiumIDApp(walletConnectUri: string): Promise<boolean> {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // iOS: clipboard wc: + short wake (full wc: URI → Safari "address is invalid").
    // Android: full deep link only (Play referrer on store fallback — no clipboard toast).
    let deepLink: string;
    if (isIOS) {
        try {
            const { handoffIosClipboard } = await import('@/services/bridge.service');
            await handoffIosClipboard(walletConnectUri);
        } catch (error) {
            console.warn('[verification-web-ui] clipboard before tryOpen failed', error);
        }
        const { getConcordiumIdWakeDeepLink, openIosCustomScheme } = await import(
            '@/constants/wallet.registry'
        );
        deepLink = getConcordiumIdWakeDeepLink();
        openIosCustomScheme(deepLink);
    } else {
        deepLink = `concordiumidapp://wc?uri=${encodeURIComponent(walletConnectUri)}&_t=${Date.now()}`;
    }

    return new Promise((resolve) => {
        let appOpened = false;
        let timeoutId: ReturnType<typeof setTimeout>;
        const startTime = Date.now();

        // Track if the app opens by detecting blur or visibility change
        const handleBlur = () => {
            appOpened = true;
            clearTimeout(timeoutId);
            cleanup();
            resolve(true);
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                appOpened = true;
                clearTimeout(timeoutId);
                cleanup();
                resolve(true);
            }
        };

        const handlePageHide = () => {
            appOpened = true;
            clearTimeout(timeoutId);
            cleanup();
            resolve(true);
        };

        const handleFocus = () => {
            // If we get focus back quickly (< 1.5s), app probably didn't open
            const elapsed = Date.now() - startTime;
            if (elapsed < 1500 && !appOpened) {
                // Quick return to browser means app didn't open
            }
        };

        const cleanup = () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('pagehide', handlePageHide);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

        // Set up detection listeners
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('pagehide', handlePageHide, { once: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);

        if (!isIOS) {
            if (/android/i.test(navigator.userAgent)) {
                const intentUrl = `intent://wc?uri=${encodeURIComponent(
                    walletConnectUri
                )}#Intent;scheme=concordiumidapp;package=com.idwallet.app;end`;
                window.location.href = intentUrl;
            } else {
                window.location.href = deepLink;
            }
        }

        // Timeout - if we haven't detected app opening by now, assume not installed
        const timeout = isIOS ? 1500 : 2500;
        timeoutId = setTimeout(() => {
            cleanup();

            // On iOS, if we're still here and document is visible, app didn't open
            if (isIOS && !document.hidden && !appOpened) {
                resolve(false);
            } else {
                resolve(appOpened);
            }
        }, timeout);
    });
}

/**
 * Opens the deep link for the specified app with the WalletConnect URI
 */
export function openDeepLink(appType: 'concordium-wallet' | 'concordium-id', walletConnectUri: string): void {
    const network = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) || 'testnet';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);

    const openScheme = (deepLink: string) => {
        if (isIOS) {
            void import('@/constants/wallet.registry').then(({ openIosCustomScheme }) => {
                openIosCustomScheme(deepLink);
            });
        } else {
            window.location.href = deepLink;
        }
    };

    if (appType === 'concordium-wallet') {
        if (isIOS) {
            openScheme(
                `cryptox${network}://wc?uri=${encodeURIComponent(walletConnectUri)}&redirect=googlechrome://`
            );
        } else if (isAndroid) {
            openScheme(`cryptox-wc-${network}://wc?uri=${encodeURIComponent(walletConnectUri)}&go_back=true`);
        } else {
            return;
        }
    } else if (isIOS) {
        // Clipboard wc: + short wake — long wc: URI → Safari "address is invalid".
        void (async () => {
            try {
                const { handoffIosClipboard } = await import('@/services/bridge.service');
                await handoffIosClipboard(walletConnectUri);
            } catch {
                /* fail-open */
            }
            const { getConcordiumIdWakeDeepLink, openIosCustomScheme } = await import(
                '@/constants/wallet.registry'
            );
            openIosCustomScheme(getConcordiumIdWakeDeepLink());
        })();
    } else {
        // Android: full wc: Intent (+ Play referrer if store fallback). No clipboard.
        const redirectUrl = encodeURIComponent(window.location.origin);
        openScheme(
            `concordiumidapp://wc?uri=${encodeURIComponent(walletConnectUri)}&redirect=${redirectUrl}&_t=${Date.now()}`
        );
    }

    // Fallback to app store if app doesn't open within 2 seconds
    setTimeout(() => {
        if (!document.hidden) {
            if (appType === 'concordium-id') {
                void redirectToIdAppStore(walletConnectUri);
            } else {
                openAppStore(appType);
            }
        }
    }, 2000);
}

/**
 * Smart routing logic that detects apps and routes accordingly
 */
export async function smartMobileRoute(walletConnectUri: string): Promise<void> {
    // Detect installed apps
    const detection = await detectInstalledApps();

    // Execute recommended action
    switch (detection.recommendedAction) {
        case 'open-wallet':
            openDeepLink('concordium-wallet', walletConnectUri);
            break;

        case 'open-id':
            openDeepLink('concordium-id', walletConnectUri);
            break;

        case 'show-selection':
            // Return control to show selection UI
            // This will be handled by the calling component
            break;

        case 'show-store':
            openAppStore('concordium-wallet');
            break;
    }
}

/**
 * Clear app detection cache (useful for testing)
 */
export function clearAppDetectionCache(): void {
    localStorage.removeItem('concordiumWalletInstalled');
    localStorage.removeItem('concordiumIDInstalled');
    localStorage.removeItem('appDetectionTimestamp');
}
