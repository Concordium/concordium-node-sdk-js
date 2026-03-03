/**
 * Wallet Selection Modal
 * Shows available wallets for WalletConnect connection
 * Implements device-specific wallet discovery
 * Based on walletconnect-module.js logic
 */
import arrowLeft from '@/assets/arrow-left.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import { isMobileScreen } from '@/config.state';
import { ModalConstants } from '@/constants/modal.constants';
import {
    WALLET_REGISTRY,
    type WalletInfo,
    buildWalletDeepLink,
    getIdAppStoreUrl,
    getQrRedirectUri,
} from '@/constants/wallet.registry';
import { WalletConnectConstants } from '@/constants/walletconnect.constants';
import { ServiceFactory } from '@/services';
import type { HideModalFunction, ModalFunction, ShowModalFunction } from '@/types';

// Store detected wallets
let detectedWallets: WalletInfo[] = [];
let currentWcUri: string | null = null;
let walletSelectionModalElement: HTMLElement | null = null;

// Platform detection
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isIOS =
    /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

/**
 * Get wallets for selection (excludes Concordium ID which is handled by "Open ID App" button)
 */
function getSelectableWallets(): WalletInfo[] {
    return WALLET_REGISTRY.filter((w) => w.id !== 'concordium-id');
}

/**
 * Try to open a deep link and detect if app opened
 * Returns true if app appears to have opened, false otherwise
 */
function tryOpenDeepLink(url: string, timeoutMs: number = 1800): Promise<boolean> {
    return new Promise((resolve) => {
        let didHide = false;

        const onVisibilityChange = () => {
            if (document.hidden) {
                console.log('[tryOpenDeepLink] Visibility changed - app opened');
                didHide = true;
            }
        };
        const onPageHide = () => {
            console.log('[tryOpenDeepLink] Page hide - app opened');
            didHide = true;
        };
        const onBlur = () => {
            console.log('[tryOpenDeepLink] Blur - app opened');
            didHide = true;
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide, { once: true });
        window.addEventListener('blur', onBlur, { once: true });

        console.log('[tryOpenDeepLink] Opening:', url.substring(0, 50) + '...');
        window.location.href = url;

        setTimeout(() => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            console.log(`[tryOpenDeepLink] Timeout reached, didHide: ${didHide}`);
            resolve(didHide);
        }, timeoutMs);
    });
}

/**
 * Handle WalletConnect URI - opens wallets on mobile, shows QR on desktop
 * On mobile: tries to open each wallet in sequence (Coin98, Bitcoin.com, Ledger, ID App, Concordium Wallet)
 * On desktop: shows QR code with raw WC URI for any wallet to scan
 */
async function handleWalletUri(uri: string): Promise<void> {
    currentWcUri = uri;

    if (isMobile) {
        // On mobile, try to open wallets in sequence
        await openWalletApp(uri);
    } else {
        // Desktop: render QR code with raw WC URI
        await renderDesktopQr(uri);
    }
}

/**
 * Try to open wallet apps on mobile in sequence
 * Tries each wallet until one opens or falls back to app store
 */
async function openWalletApp(wcUri: string): Promise<void> {
    console.log('[openWalletApp] Starting mobile wallet deep link flow...');
    console.log('[openWalletApp] Platform:', isIOS ? 'iOS' : 'Android');

    if (isIOS) {
        // iOS: Try each wallet in the registry order
        for (const wallet of WALLET_REGISTRY) {
            const deepLink = buildWalletDeepLink(wallet, wcUri);
            if (!deepLink) {
                console.log(`[openWalletApp] Skipping ${wallet.name} - no deep link`);
                continue;
            }

            console.log(`[openWalletApp] Trying ${wallet.name}:`, deepLink.substring(0, 60) + '...');

            if (document.hidden) {
                console.log('[openWalletApp] App opened (document hidden)');
                // Store wallet name
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
                return;
            }

            const opened = await tryOpenDeepLink(deepLink, 1500);
            if (opened) {
                console.log(`[openWalletApp] ${wallet.name} opened successfully`);
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
                return;
            }
            console.log(`[openWalletApp] ${wallet.name} not installed or failed`);
        }

        // No wallet opened, redirect to ID app store as fallback
        console.log('[openWalletApp] No wallet found, redirecting to app store...');
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = getIdAppStoreUrl();
            }
        }, 400);
        return;
    }

    // Android: Try ID app first, then Concordium Wallet, then other wallets
    const idAppWallet = WALLET_REGISTRY.find((w) => w.id === 'concordium-id');
    const concordiumWallet = WALLET_REGISTRY.find((w) => w.id === 'concordium-wallet');
    const otherWallets = WALLET_REGISTRY.filter((w) => w.id !== 'concordium-id' && w.id !== 'concordium-wallet');

    // Try ID app first
    if (idAppWallet) {
        const idDeepLink = buildWalletDeepLink(idAppWallet, wcUri);
        if (idDeepLink) {
            console.log('[openWalletApp] Trying Concordium ID App:', idDeepLink.substring(0, 60) + '...');
            const idOpened = await tryOpenDeepLink(idDeepLink, 1200);
            if (idOpened) {
                console.log('[openWalletApp] Concordium ID opened');
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, 'Concordium ID');
                return;
            }
        }
    }

    // Then try Concordium Wallet
    if (concordiumWallet) {
        const walletDeepLink = buildWalletDeepLink(concordiumWallet, wcUri);
        if (walletDeepLink) {
            console.log('[openWalletApp] Trying Concordium Wallet:', walletDeepLink.substring(0, 60) + '...');
            const walletOpened = await tryOpenDeepLink(walletDeepLink, 2200);
            if (walletOpened) {
                console.log('[openWalletApp] Concordium Wallet opened');
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, 'Concordium Wallet');
                return;
            }
        }
    }

    // Try other wallets
    for (const wallet of otherWallets) {
        const deepLink = buildWalletDeepLink(wallet, wcUri);
        if (!deepLink) continue;

        console.log(`[openWalletApp] Trying ${wallet.name}:`, deepLink.substring(0, 60) + '...');

        if (document.hidden) {
            localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
            return;
        }
        const opened = await tryOpenDeepLink(deepLink, 1500);
        if (opened) {
            console.log(`[openWalletApp] ${wallet.name} opened`);
            localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
            return;
        }
    }

    // No wallet opened, redirect to ID app store
    console.log('[openWalletApp] No wallet found, redirecting to app store...');
    setTimeout(() => {
        if (!document.hidden) {
            window.location.href = getIdAppStoreUrl();
        }
    }, 400);
}

/**
 * Render QR code for desktop with raw WalletConnect URI
 * Uses raw wc: URI so any WalletConnect compatible wallet can scan it
 * (Coin98, Bitcoin.com, Ledger, Concordium Wallet, ID App, etc.)
 */
async function renderDesktopQr(uri: string): Promise<void> {
    console.log('[renderDesktopQr] Looking for QR container...');
    const qrContainer = document.querySelector('#wallet-qr-container');

    if (!qrContainer) {
        console.error('[renderDesktopQr] QR container #wallet-qr-container not found!');
        return;
    }
    if (!uri) {
        console.error('[renderDesktopQr] No URI provided!');
        return;
    }

    console.log('[renderDesktopQr] Generating QR code for URI:', uri.substring(0, 50) + '...');

    try {
        const { default: QRCode } = await import('qrcode');

        // Use raw WalletConnect URI (wc:...) for multi-wallet compatibility
        // This allows any WalletConnect compatible wallet to scan:
        // - Coin98, Bitcoin.com, Ledger Live, Concordium Wallet, ID App, etc.
        const qrValue = uri;

        const qrCodeDataURL = await QRCode.toDataURL(qrValue, {
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
        });

        console.log('[renderDesktopQr] QR code generated successfully');

        qrContainer.innerHTML = `
            <div class="text-center" style="min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <img src="${qrCodeDataURL}" alt="WalletConnect QR Code" class="w-48 h-48 mx-auto" style="border-radius: 12px; border: 1px solid rgba(0, 0, 0, 0.10);" />
            </div>
        `;
    } catch (error) {
        console.error('[renderDesktopQr] Failed to generate QR code:', error);
        qrContainer.innerHTML = `
            <div class="text-center text-red-500" style="min-height: 200px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <p>Failed to generate QR code</p>
            </div>
        `;
    }
}

/**
 * Handle QR redirect on page load
 * When user scans QR code on mobile, they land on this page with uri param
 */
export async function handleQrRedirectOnLoad(): Promise<void> {
    const uri = getQrRedirectUri();
    if (!uri) return;

    // Clean up URL without redirect params
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);

    // Handle the wallet URI
    await handleWalletUri(uri);
}

/**
 * Detects installed wallets on the device
 * Android: Uses visibility detection
 * iOS: Shows manual selection (can't detect installed apps)
 */
export async function detectInstalledWallets(): Promise<WalletInfo[]> {
    const selectableWallets = getSelectableWallets();

    if (!isMobile) {
        // Desktop: Return all wallets
        return selectableWallets;
    }

    if (isIOS) {
        // iOS: Return all wallets for manual selection
        return selectableWallets;
    }

    // Android: Try to detect installed wallets
    return await detectAndroidWallets(selectableWallets);
}

/**
 * Android wallet detection using visibility change detection
 */
async function detectAndroidWallets(walletsToCheck: WalletInfo[]): Promise<WalletInfo[]> {
    const installedWallets: WalletInfo[] = [];

    // Check cached detection results first
    const cacheKey = 'detectedWallets';
    const cacheTimestamp = localStorage.getItem('walletDetectionTimestamp');
    const cachedWallets = localStorage.getItem(cacheKey);
    const now = Date.now();

    // Use cache if less than 10 minutes old
    if (cacheTimestamp && cachedWallets && now - parseInt(cacheTimestamp) < 10 * 60 * 1000) {
        try {
            const cachedIds = JSON.parse(cachedWallets) as string[];
            const cached = walletsToCheck.filter((w) => cachedIds.includes(w.id));
            if (cached.length > 0) return cached;
        } catch {
            // Cache corrupted, continue with fresh detection
        }
    }

    // Try to detect each wallet using iframe (less intrusive than location.href)
    for (const wallet of walletsToCheck) {
        const scheme = `${wallet.scheme}://`;
        const isInstalled = await tryDetectAppWithIframe(scheme, 300);
        if (isInstalled) {
            installedWallets.push(wallet);
        }
    }

    // Cache results
    if (installedWallets.length > 0) {
        localStorage.setItem(cacheKey, JSON.stringify(installedWallets.map((w) => w.id)));
        localStorage.setItem('walletDetectionTimestamp', now.toString());
    }

    // If no wallets detected, return all for manual selection
    return installedWallets.length > 0 ? installedWallets : walletsToCheck;
}

/**
 * Try to detect app using invisible iframe
 */
async function tryDetectAppWithIframe(scheme: string, timeout: number = 300): Promise<boolean> {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        let detected = false;
        let timer: ReturnType<typeof setTimeout>;

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

        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        timer = setTimeout(() => {
            cleanup();
            resolve(detected);
        }, timeout);

        try {
            iframe.src = scheme;
        } catch {
            cleanup();
            resolve(false);
        }
    });
}

/**
 * Creates the wallet selection modal HTML
 */
function createWalletSelectionHTML(_wallets: WalletInfo[], isMobileView: boolean): string {
    const modalClass = isMobileView ? 'mobile' : 'desktop';

    return `
    <div class="${modalClass}--modal-overlay">
      <div class="${modalClass}--modal-container">
        <div class="${modalClass}--modal-body">
          <div class="flex items-center justify-between p-2">
            <button class="${modalClass}--navigation-button" id="wallet-back-btn">
              <img src="${arrowLeft}" alt="arrow-left-icon" />
              <span>Back</span>
            </button>
            <div>
              <img src="${concordiumModalLogo}" alt="concordium-modal-logo" />
            </div>
          </div>
          <div id="qr-section" class="flex flex-col items-center py-4 px-4" style="min-height: 340px;">
            <div id="wallet-qr-container" class="flex items-center justify-center" style="min-height: 220px;">
              <div class="animate-pulse text-center" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                <div class="w-48 h-48 bg-gray-200 rounded mb-2"></div>
                <p class="text-sm" style="color: #0D0F11;">Generating QR code...</p>
              </div>
            </div>
            <p class="desktop--scan-text mt-2">Scan the QR code with your <br/>Concordium ID compatible app</p>
            <p class="text-xs text-center mt-2" style="color: #9CA3AF;">Scan via Concordium Wallet, Bitcoin.com, Coin98 + more</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export const createWalletSelectionModal: ModalFunction = () => {
    const isMobileView = isMobileScreen();
    const wallets = detectedWallets.length > 0 ? detectedWallets : getSelectableWallets();

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = createWalletSelectionHTML(wallets, isMobileView);
    modalContainer.id = 'wallet-selection-modal';

    // Attach event listeners
    const backBtn = modalContainer.querySelector('#wallet-back-btn') as HTMLButtonElement | null;
    backBtn?.addEventListener('click', async () => {
        const { showLandingModal } = await import('./landing');
        hideWalletSelectionModal();
        await showLandingModal();
    });

    return modalContainer;
};

/**
 * Initialize WalletConnect and get URI
 */
async function initializeWalletConnect(): Promise<void> {
    try {
        // Check for SDK-managed config in localStorage
        const projectId = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_PROJECT_ID);
        const network =
            (localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) as 'mainnet' | 'testnet') ||
            'testnet';
        const metadataStr = localStorage.getItem('sdkWalletConnectMetadata');
        const metadata = metadataStr ? JSON.parse(metadataStr) : null;

        if (!projectId) {
            throw new Error(
                'WalletConnect configuration not found. Please call initWalletConnect() with a projectId first.'
            );
        }

        // Store the config globally so ServiceFactory can use it
        (window as any).__CONCORDIUM_WC_CONFIG__ = {
            projectId,
            network,
            metadata,
        };

        const wcService = ServiceFactory.createWalletConnectService();
        await wcService.initialize();

        // Clear all existing sessions before creating new pairing
        // This prevents conflicts when user tries different wallets
        await wcService.clearAllSessionsForNewPairing();

        const chainIds = WalletConnectConstants.CHAIN_IDS[network];

        const { uri, approval } = await wcService.connect({
            ccd: {
                // Request all methods for broad wallet compatibility
                // - ID App supports request_verifiable_presentation_v1
                // - Concordium Wallet (CryptoX) supports request_verifiable_presentation (v0)
                methods: [...WalletConnectConstants.ALL_METHODS],
                chains: chainIds,
                events: [...WalletConnectConstants.EVENTS],
            },
        });

        if (uri) {
            currentWcUri = uri;
            localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI, uri);
            console.log('WalletConnect URI generated:', uri);

            // Handle session approval in background
            approval()
                .then(async (session) => {
                    console.log('Session approved:', session);
                    console.log('Wallet name:', session.peer?.metadata?.name);
                    const { handleSessionApproval } = await import('./scan');
                    await handleSessionApproval(session);
                })
                .catch((error) => {
                    console.error('Session approval failed:', error);
                });
        }
    } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        throw error; // Re-throw to handle in caller
    }
}

export const showWalletSelectionModal: ShowModalFunction = async () => {
    const { getGlobalContainer } = await import('../../index');
    const targetContainer = getGlobalContainer();

    if (!targetContainer) {
        console.error('Container not found for modal');
        return;
    }

    const isMobileView = isMobileScreen();
    const containerClass = isMobileView ? '.mobile--modal-container' : '.desktop--modal-container';

    // Detect available wallets
    detectedWallets = await detectInstalledWallets();

    // Initialize WalletConnect URI
    try {
        await initializeWalletConnect();
    } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        // Show error alert - SDK not properly initialized
        alert(
            'WalletConnect not configured. Please ensure the SDK is properly initialized with initWalletConnect() before opening the wallet selection.'
        );
        return;
    }

    // On mobile, directly open wallet deep links instead of showing QR code
    if (isMobileView && currentWcUri) {
        console.log('Mobile detected, opening wallet via deep link...');
        await openWalletApp(currentWcUri);
        return; // Don't show modal on mobile - just open wallet app
    }

    // Desktop: Create and show modal with QR code
    walletSelectionModalElement = createWalletSelectionModal();
    walletSelectionModalElement.id = 'wallet-selection-modal';

    // Get the modal container for transforms
    const modalContainer = walletSelectionModalElement.querySelector(containerClass) as HTMLElement | null;

    // Set up transition
    walletSelectionModalElement.style.opacity = '0';
    if (modalContainer) {
        modalContainer.style.transform = 'translateY(-20px) scale(0.95)';
        modalContainer.style.transition = 'transform 0.3s ease-out';
    }
    targetContainer.appendChild(walletSelectionModalElement);

    // Force reflow
    walletSelectionModalElement.offsetHeight;

    walletSelectionModalElement.style.transition = 'opacity 0.3s ease-out';

    setTimeout(() => {
        if (!walletSelectionModalElement) return;
        walletSelectionModalElement.style.opacity = '1';
        if (modalContainer) {
            modalContainer.style.transform = 'translateY(0) scale(1)';
        }
    }, 10);

    // Display QR code on desktop using raw WC URI
    if (currentWcUri) {
        // Small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 50));
        await renderDesktopQr(currentWcUri);
    } else {
        console.error('[showWalletSelectionModal] No WC URI available for QR code');
    }
};

export const hideWalletSelectionModal: HideModalFunction = () => {
    if (walletSelectionModalElement) {
        walletSelectionModalElement.classList.add('modal-exiting');

        setTimeout(() => {
            const container = walletSelectionModalElement?.parentNode;
            if (container && walletSelectionModalElement) {
                container.removeChild(walletSelectionModalElement);
            }
            walletSelectionModalElement = null;
            currentWcUri = null;

            if (
                !document.querySelector('.desktop--modal-overlay') &&
                !document.querySelector('.mobile--modal-overlay')
            ) {
                document.body.style.overflowX = '';
            }
        }, 300);
    }
};

/**
 * Clear wallet detection cache
 */
export function clearWalletDetectionCache(): void {
    localStorage.removeItem('detectedWallets');
    localStorage.removeItem('walletDetectionTimestamp');
    detectedWallets = [];
}

// Handle QR redirect when module loads
handleQrRedirectOnLoad();
