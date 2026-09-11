import appstoreIcon from '@/assets/appstore-icon.svg';
import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import modalGraphic from '@/assets/modal-graphic.svg';
import playstoreIcon from '@/assets/playstore-icon.svg';
import sectionSeparator from '@/assets/section-separator.svg';
import { isMobileScreen } from '@/config.state';
import { ID_APP_STORE } from '@/constants/wallet.registry';
import { getGlobalContainer } from '@/index';
import type { HideModalFunction, ModalFunction, ShowModalFunction } from '@/types';
import { openAppStoreForConcordiumID } from '@/utils/mobileAppDetection';

export const createLandingModal: ModalFunction = () => {
    const landingHTML = `
    <div class="desktop--modal-overlay">
      <div class="desktop--modal-container">
        <div class="desktop--modal-body">
          <div class="flex items-center justify-end p-1 md:p-2">
            <img
              src="${concordiumModalLogo}"
              alt="concordium-modal-logo"
              class="max-w-full h-auto py-4"
            />
          </div>

          <div class="flex flex-col items-center gap-4 text-center px-4">
            <img
              src="${modalGraphic}"
              alt="modal-graphic"
              class="max-w-full h-auto py-4"
            />
            <h1 class="desktop--landing-title">Fast, one click, Anonymous Verification</h1>
            <p class="desktop--landing-description">Connect and verify in seconds. This process uses your Concordium ID to confirm who you are without your details ever leaving your device.</p>
          </div>

          <div class="flex flex-col items-center py-4">
            <button class="desktop--primary-button" id="start-verification-btn">
              <span>Open with ID App</span>
              <img src="${arrowRight}" alt="arrow-right-icon" />
            </button>
          </div>

          <div class="flex flex-col items-center" style="border-radius: var(--semantic-radius-l, 16px); background: var(--semantic-surface-primary-a5, rgba(0, 0, 0, 0.05)); padding: 16px; gap: 12px;">
            <p class="desktop--landing-description" style="margin: 0;">Download Concordium ID</p>
            <div class="flex items-center justify-center" style="gap: 8px;">
              <a href="https://apps.apple.com/ca/app/concordium-id/id6746754485" target="_blank" rel="noopener noreferrer">
                <img src="${appstoreIcon}" alt="Download on App Store" />
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.idwallet.app&hl=en_CA" target="_blank" rel="noopener noreferrer">
                <img src="${playstoreIcon}" alt="Get it on Google Play" />
              </a>
            </div>
            <p class="desktop--landing-description" style="margin: 0;">Come back here and continue after installing the app.</p>
          </div>

          <img src="${sectionSeparator}" alt="" class="mx-auto" />
          <div class="flex items-center justify-center">
            <p class="desktop--download-text">or <a href="#" id="open-with-wallet-link">Open with Wallet</a> via Concordium Wallet, Bitcoin.com, Coin98, <a href="#" id="show-more-wallets-link">Ledger</a></p>
          </div>
        </div>
      </div>
    </div>
  `;

    const landingContainer = document.createElement('div');
    landingContainer.innerHTML = landingHTML;

    // Add event listener for the start verification button
    const startBtn = landingContainer.querySelector('#start-verification-btn') as HTMLButtonElement | null;
    startBtn?.addEventListener('click', async () => {
        const isMobile = isMobileScreen();

        if (isMobile) {
            // On mobile, try to open the Concordium ID app directly
            // First, we need to initialize WalletConnect to get a URI
            try {
                const { ServiceFactory } = await import('@/services');
                const { ModalConstants } = await import('@/constants/modal.constants');
                const { WalletConnectConstants } = await import('@/constants/walletconnect.constants');
                const { getConcordiumIdDeepLink } = await import('@/constants/wallet.registry');

                // Ensure __CONCORDIUM_WC_CONFIG__ is populated if we're in sdk-managed mode
                if (!(window as any).__CONCORDIUM_WC_CONFIG__) {
                    const projectId = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_PROJECT_ID);
                    const network = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) || 'testnet';
                    const storedMetadata = localStorage.getItem('sdkWalletConnectMetadata');
                    const metadata = storedMetadata ? JSON.parse(storedMetadata) : null;

                    if (projectId) {
                        (window as any).__CONCORDIUM_WC_CONFIG__ = {
                            projectId,
                            network,
                            metadata: metadata || WalletConnectConstants.getDefaultMetadata(),
                        };
                    }
                }

                // Get WalletConnect service and generate URI
                const wcService = ServiceFactory.createWalletConnectService();
                await wcService.initialize();

                // Clear existing sessions to ensure fresh pairing
                await wcService.clearAllSessionsForNewPairing();

                const network =
                    (localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) as 'mainnet' | 'testnet') ||
                    'testnet';
                const chainIds = WalletConnectConstants.CHAIN_IDS[network];

                // Generate WalletConnect URI by calling connect()
                const { uri, approval } = await wcService.connect({
                    ccd: {
                        // Request all methods for broad wallet compatibility
                        methods: [...WalletConnectConstants.ALL_METHODS],
                        chains: chainIds,
                        events: [...WalletConnectConstants.EVENTS],
                    },
                });

                if (!uri) {
                    throw new Error('Failed to generate WalletConnect URI');
                }

                // Store URI for later use
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI, uri);

                // Store connected wallet name
                localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, 'Concordium ID');

                let sessionProcessed = false;

                const processApprovedSession = async (session: any) => {
                    if (sessionProcessed) return;
                    sessionProcessed = true;

                    const { handleSessionApproval } = await import('./scan');
                    await handleSessionApproval(session);
                };

                // Handle session approval in the background
                approval()
                    .then(processApprovedSession)
                    .catch(() => {});

                const tryRecoverApprovedSession = async () => {
                    if (document.hidden || sessionProcessed) return;

                    const activeSessions = wcService.getActiveSessions();
                    if (activeSessions.length > 0) {
                        await processApprovedSession(activeSessions[0]);
                    }
                };

                document.addEventListener('visibilitychange', () => {
                    void tryRecoverApprovedSession();
                });

                window.addEventListener('focus', () => {
                    void tryRecoverApprovedSession();
                });

                // Generate deep link
                const deepLink = getConcordiumIdDeepLink(uri);

                // Track if app opened (page loses visibility)
                let appOpened = false;
                const markAppOpened = () => {
                    appOpened = true;
                };

                const visibilityHandler = () => {
                    if (document.hidden) markAppOpened();
                };

                document.addEventListener('visibilitychange', visibilityHandler);
                window.addEventListener('pagehide', markAppOpened);
                window.addEventListener('blur', markAppOpened);

                // Use one direct deep link format on both Android and iOS.
                // This avoids Android intent chooser edge-cases where the browser prompt can remain stuck.
                const link = document.createElement('a');
                link.href = deepLink;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();

                setTimeout(() => {
                    if (!appOpened && !document.hidden && document.visibilityState === 'visible') {
                        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
                        window.location.href = isIOS ? ID_APP_STORE.ios : ID_APP_STORE.android;
                    }

                    document.removeEventListener('visibilitychange', visibilityHandler);
                    window.removeEventListener('pagehide', markAppOpened);
                    window.removeEventListener('blur', markAppOpened);

                    if (link.parentNode) {
                        link.parentNode.removeChild(link);
                    }
                }, 3500);
            } catch {
                // Fallback to app store if something goes wrong
                openAppStoreForConcordiumID();
            }
        } else {
            // On desktop, show the scan modal with QR code
            const { showScanModal } = await import('./scan');
            const { hideLandingModal } = await import('./landing');
            hideLandingModal();
            await showScanModal();
        }
    });

    // Add event listener for "Open with Wallet" link
    const openWalletLink = landingContainer.querySelector('#open-with-wallet-link') as HTMLAnchorElement | null;
    openWalletLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { showWalletSelectionModal } = await import('./wallet-selection');
        const { hideLandingModal } = await import('./landing');
        hideLandingModal();
        await showWalletSelectionModal();
    });

    // Add event listener for "more" link (shows same wallet selection modal)
    const moreWalletsLink = landingContainer.querySelector('#show-more-wallets-link') as HTMLAnchorElement | null;
    moreWalletsLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        const { showWalletSelectionModal } = await import('./wallet-selection');
        const { hideLandingModal } = await import('./landing');
        hideLandingModal();
        await showWalletSelectionModal();
    });

    return landingContainer;
};

export const showLandingModal: ShowModalFunction = async () => {
    // Ensure DOM is ready before resolving container
    if (document.readyState === 'loading') {
        await new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }

    // Resolve container with retries (similar to initConcordiumModal)
    let targetContainer = getGlobalContainer();

    // If still not found, wait a bit and try again (for React apps that might still be mounting)
    if (!targetContainer) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        targetContainer = getGlobalContainer();
    }

    if (!targetContainer) {
        return;
    }

    // Prevent horizontal scrolling on body
    document.body.style.overflowX = 'hidden';

    // Find existing modal to crossfade
    const existingModal = targetContainer.querySelector('.desktop--modal-overlay') as HTMLElement | null;

    const landing = createLandingModal();
    landing.id = 'landing-modal';

    // For smooth transitions, start hidden then trigger enter
    landing.classList.add('modal-wrapper');
    targetContainer.appendChild(landing);

    // Force a reflow to ensure the initial hidden state is applied
    landing.offsetHeight;

    // Use a small delay to ensure DOM is fully ready
    setTimeout(() => {
        // Start simultaneous crossfade
        if (existingModal) {
            existingModal.classList.add('modal-exiting');
            setTimeout(() => {
                existingModal.parentNode?.removeChild(existingModal);
            }, 350);
        }

        // Reveal new modal
        landing.classList.add('is-visible');
    }, 10);
};

export const hideLandingModal: HideModalFunction = () => {
    const modal = document.querySelector('#landing-modal') as HTMLElement | null;
    if (modal) {
        // Add fade-out animation
        modal.classList.add('modal-exiting');

        // Remove after animation completes
        setTimeout(() => {
            modal.remove();
            // Restore body overflow if no other modals are present
            if (
                !document.querySelector('.desktop--modal-overlay') &&
                !document.querySelector('.mobile--modal-overlay')
            ) {
                document.body.style.overflowX = '';
            }
        }, 300);
    }
};
