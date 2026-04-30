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
    buildQrRedirectUrl,
    buildWalletDeepLink,
    getIdAppStoreUrl,
    getQrRedirectCleanUrl,
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

type OpenWalletOptions = {
    redirectToStoreOnFailure?: boolean;
};

const REDIRECT_FALLBACK_CONTAINER_ID = 'wc-redirect-fallback';
const REDIRECT_FALLBACK_OPEN_BUTTON_ID = 'wc-redirect-open-button';

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
                didHide = true;
            }
        };
        const onPageHide = () => {
            didHide = true;
        };
        const onBlur = () => {
            didHide = true;
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('pagehide', onPageHide, { once: true });
        window.addEventListener('blur', onBlur, { once: true });

        window.location.href = url;

        setTimeout(() => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            resolve(didHide);
        }, timeoutMs);
    });
}

/**
 * Handle WalletConnect URI - opens wallets on mobile, shows QR on desktop
 * On mobile: tries to open each wallet in sequence (Coin98, Bitcoin.com, Ledger, ID App, Concordium Wallet)
 * On desktop: renders QR code for scan flow
 */
async function handleWalletUri(uri: string, options: OpenWalletOptions = {}): Promise<boolean> {
    currentWcUri = uri;

    if (isMobile) {
        // On mobile, try to open wallets in sequence
        return await openWalletApp(uri, options);
    } else {
        // Desktop: render QR code for scan flow
        await renderDesktopQr(uri);
        return true;
    }
}

/**
 * Try to open wallet apps on mobile in sequence
 * Tries each wallet until one opens or falls back to app store
 */
async function openWalletApp(wcUri: string, options: OpenWalletOptions = {}): Promise<boolean> {
    const shouldRedirectToStore = options.redirectToStoreOnFailure !== false;

    if (isIOS) {
        // iOS: Try each wallet in the registry order
        for (const wallet of WALLET_REGISTRY) {
            const deepLink = buildWalletDeepLink(wallet, wcUri);
            if (!deepLink) {
                continue;
            }

            if (document.hidden) {
                // Store wallet name
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
                return true;
            }

            const opened = await tryOpenDeepLink(deepLink, 1500);
            if (opened) {
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
                return true;
            }
        }

        if (shouldRedirectToStore) {
            // No wallet opened, redirect to ID app store as fallback
            setTimeout(() => {
                if (!document.hidden) {
                    window.location.href = getIdAppStoreUrl();
                }
            }, 400);
        }
        return false;
    }

    // Android: Try ID app first, then Concordium Wallet, then other wallets
    const idAppWallet = WALLET_REGISTRY.find((w) => w.id === 'concordium-id');
    const concordiumWallet = WALLET_REGISTRY.find((w) => w.id === 'concordium-wallet');
    const otherWallets = WALLET_REGISTRY.filter((w) => w.id !== 'concordium-id' && w.id !== 'concordium-wallet');

    // Try ID app first
    if (idAppWallet) {
        const idDeepLink = buildWalletDeepLink(idAppWallet, wcUri);
        if (idDeepLink) {
            const idOpened = await tryOpenDeepLink(idDeepLink, 1200);
            if (idOpened) {
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, 'Concordium ID');
                return true;
            }
        }
    }

    // Then try Concordium Wallet
    if (concordiumWallet) {
        const walletDeepLink = buildWalletDeepLink(concordiumWallet, wcUri);
        if (walletDeepLink) {
            const walletOpened = await tryOpenDeepLink(walletDeepLink, 2200);
            if (walletOpened) {
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, 'Concordium Wallet');
                return true;
            }
        }
    }

    // Try other wallets
    for (const wallet of otherWallets) {
        const deepLink = buildWalletDeepLink(wallet, wcUri);
        if (!deepLink) continue;

        if (document.hidden) {
            localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
            return true;
        }
        const opened = await tryOpenDeepLink(deepLink, 1500);
        if (opened) {
            localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, wallet.name);
            return true;
        }
    }

    if (shouldRedirectToStore) {
        // No wallet opened, redirect to ID app store
        setTimeout(() => {
            if (!document.hidden) {
                window.location.href = getIdAppStoreUrl();
            }
        }, 400);
    }

    return false;
}

/**
 * Render QR code for desktop with a redirect URL.
 * Camera apps reliably handle https URLs, then the redirect page deep-links into installed wallets.
 */
async function renderDesktopQr(uri: string): Promise<void> {
    const qrContainer = document.querySelector('#wallet-qr-container');

    if (!qrContainer) {
        return;
    }
    if (!uri) {
        return;
    }

    try {
        const { default: QRCode } = await import('qrcode');

        // Use a web redirect URL so camera scans trigger the mobile deep-link flow.
        const qrValue = buildQrRedirectUrl(uri);

        const qrCodeDataURL = await QRCode.toDataURL(qrValue, {
            width: 200,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' },
        });

        const hostname = window.location.hostname;
        const isLoopbackHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        const loopbackWarning = isLoopbackHost
            ? '<p class="text-xs text-center mt-3 text-amber-700 max-w-[280px]">This page is running on localhost. Phone camera scans cannot open localhost on another device. Use a LAN/public URL.</p>'
            : '';

        qrContainer.innerHTML = `
            <div class="text-center min-h-[200px] flex flex-col justify-center items-center">
                <img src="${qrCodeDataURL}" alt="WalletConnect QR Code" class="w-48 h-48 mx-auto rounded-xl border border-black/10" />
                ${loopbackWarning}
            </div>
        `;
    } catch {
        qrContainer.innerHTML = `
            <div class="text-center text-red-500 min-h-[200px] flex flex-col justify-center items-center">
                <p>Failed to generate QR code</p>
            </div>
        `;
    }
}

function removeRedirectFallbackPanel(): void {
    const existing = document.getElementById(REDIRECT_FALLBACK_CONTAINER_ID);
    if (existing) {
        existing.remove();
    }
}

async function ensureDocumentBody(): Promise<void> {
    if (document.body) {
        return;
    }

    await new Promise<void>((resolve) => {
        document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    });
}

async function showRedirectFallbackPanel(uri: string): Promise<void> {
    if (!isMobile) return;

    await ensureDocumentBody();
    removeRedirectFallbackPanel();

    const panel = document.createElement('div');
    panel.id = REDIRECT_FALLBACK_CONTAINER_ID;
    panel.className = 'mobile--redirect-fallback-panel';
    panel.innerHTML = `
        <p class="mobile--redirect-fallback-panel__text">Tap to open an installed wallet app.</p>
        <button id="${REDIRECT_FALLBACK_OPEN_BUTTON_ID}" class="mobile--redirect-fallback-panel__button">Open Wallet App</button>
        <p class="mobile--redirect-fallback-panel__footer">No wallet installed? <a href="${getIdAppStoreUrl()}" target="_blank" rel="noopener noreferrer" class="mobile--redirect-fallback-panel__link">Install Concordium ID</a></p>
    `;

    document.body.appendChild(panel);

    const openBtn = panel.querySelector(`#${REDIRECT_FALLBACK_OPEN_BUTTON_ID}`) as HTMLButtonElement | null;
    openBtn?.addEventListener('click', async () => {
        if (openBtn.disabled) return;

        openBtn.disabled = true;
        openBtn.textContent = 'Opening...';

        const opened = await openWalletApp(uri, { redirectToStoreOnFailure: false });
        if (!opened && !document.hidden) {
            window.location.href = getIdAppStoreUrl();
        }
    });

    const maybeRemove = () => {
        if (document.hidden) {
            removeRedirectFallbackPanel();
            document.removeEventListener('visibilitychange', maybeRemove);
        }
    };

    document.addEventListener('visibilitychange', maybeRemove);
}

/**
 * Returns true when there is already an active WalletConnect session.
 * Used to avoid repeatedly triggering mobile deep-link prompts.
 */
async function hasActiveWalletConnectSession(): Promise<boolean> {
    try {
        const wcService = ServiceFactory.getWalletConnectService() || ServiceFactory.createWalletConnectService();
        await wcService.initialize();
        return wcService.getActiveSessions().length > 0;
    } catch {
        return false;
    }
}

/**
 * Handle QR redirect on page load
 * When user scans QR code on mobile, they land on this page with uri param
 */
export async function handleQrRedirectOnLoad(): Promise<void> {
    const uri = getQrRedirectUri();
    if (!uri) return;

    // Clean up URL without redirect params while preserving route/search/hash context.
    const cleanUrl = getQrRedirectCleanUrl();
    window.history.replaceState({}, document.title, cleanUrl);

    // If pairing already succeeded, do not trigger another app-open attempt.
    const hasActiveSession = await hasActiveWalletConnectSession();
    if (hasActiveSession) {
        removeRedirectFallbackPanel();
        return;
    }

    // Try opening wallets without forcing immediate app-store redirect.
    const opened = await handleWalletUri(uri, { redirectToStoreOnFailure: false });

    // Some mobile browsers block automatic deep-link opens unless initiated by a user tap.
    if (isMobile && !opened && !document.hidden) {
        await showRedirectFallbackPanel(uri);
    }
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
          <div id="qr-section" class="flex flex-col items-center py-4 px-4 min-h-[340px]">
            <div id="wallet-qr-container" class="flex items-center justify-center min-h-[220px]">
              <div class="animate-pulse text-center flex flex-col justify-center items-center">
                <div class="w-48 h-48 bg-gray-200 rounded mb-2"></div>
                <p class="text-sm text-dark">Generating QR code...</p>
              </div>
            </div>
            <p class="desktop--scan-text mt-2">Scan the QR code with your <br/>Concordium ID compatible app</p>
            <p class="text-xs text-center mt-2 text-gray-400">Scan via wallet app or phone camera to open installed wallets</p>
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

            // Handle session approval in background
            approval()
                .then(async (session) => {
                    const { handleSessionApproval } = await import('./scan');
                    await handleSessionApproval(session);
                })
                .catch(() => {});
        }
    } catch (error) {
        throw error; // Re-throw to handle in caller
    }
}

export const showWalletSelectionModal: ShowModalFunction = async () => {
    const { getGlobalContainer } = await import('../../index');
    const targetContainer = getGlobalContainer();

    if (!targetContainer) {
        return;
    }

    const isMobileView = isMobileScreen();

    // Detect available wallets
    detectedWallets = await detectInstalledWallets();

    // Initialize WalletConnect URI
    try {
        await initializeWalletConnect();
    } catch {
        alert(
            'WalletConnect not configured. Please ensure the SDK is properly initialized with initWalletConnect() before opening the wallet selection.'
        );
        return;
    }

    // On mobile, directly open wallet deep links instead of showing QR code
    if (isMobileView && currentWcUri) {
        await openWalletApp(currentWcUri);
        return;
    }

    // Desktop: Create and show modal with QR code
    walletSelectionModalElement = createWalletSelectionModal();
    walletSelectionModalElement.id = 'wallet-selection-modal';

    // For smooth transitions, start hidden then trigger enter
    walletSelectionModalElement.classList.add('modal-wrapper');
    targetContainer.appendChild(walletSelectionModalElement);

    // Force a reflow to ensure the initial hidden state is applied
    walletSelectionModalElement.offsetHeight;

    setTimeout(() => {
        if (!walletSelectionModalElement) return;
        walletSelectionModalElement.classList.add('is-visible');
    }, 10);

    // Display QR code on desktop using redirect URL for camera compatibility
    if (currentWcUri) {
        // Small delay to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 50));
        await renderDesktopQr(currentWcUri);
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
