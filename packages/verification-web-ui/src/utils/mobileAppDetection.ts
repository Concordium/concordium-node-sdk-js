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
            console.warn('Unsupported platform for app store');
            return;
        }
    } else {
        // Concordium ID
        if (isIOS) {
            storeUrl = 'https://apps.apple.com/app/concordium-id/id1504083341';
        } else if (isAndroid) {
            storeUrl = 'https://play.google.com/store/apps/details?id=com.concordium.mobile_wallet_testnet';
        } else {
            console.warn('Unsupported platform for app store');
            return;
        }
    }

    window.location.href = storeUrl;
}

/**
 * Opens the deep link for the specified app with the WalletConnect URI
 */
export function openDeepLink(appType: 'concordium-wallet' | 'concordium-id', walletConnectUri: string): void {
    const network = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) || 'testnet';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);

    let deepLink: string;

    if (appType === 'concordium-wallet') {
        if (isIOS) {
            deepLink = `cryptox${network}://wc?uri=${encodeURIComponent(walletConnectUri)}&redirect=googlechrome://`;
        } else if (isAndroid) {
            deepLink = `cryptox-wc-${network}://wc?uri=${encodeURIComponent(walletConnectUri)}&go_back=true`;
        } else {
            console.warn('Unsupported platform for deep link');
            return;
        }
    } else {
        // Concordium ID - with redirect to origin
        const redirectUrl = encodeURIComponent(window.location.origin);
        deepLink = `concordiumidapp://wc?uri=${encodeURIComponent(walletConnectUri)}&redirect=${redirectUrl}`;
    }

    // Attempt to open the deep link
    window.location.href = deepLink;

    // Fallback to app store if app doesn't open within 2 seconds
    setTimeout(() => {
        // Check if page is still visible (app didn't open)
        if (!document.hidden) {
            openAppStore(appType);
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
