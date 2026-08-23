import appstoreIcon from '@/assets/appstore-icon.svg';
import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import modalGraphic from '@/assets/modal-graphic.svg';
import playstoreIcon from '@/assets/playstore-icon.svg';
import sectionSeparator from '@/assets/section-separator.svg';
import { isMobileScreen } from '@/config.state';
import { getGlobalContainer } from '@/index';
import type { HideModalFunction, ModalFunction, ShowModalFunction } from '@/types';
import { redirectToIdAppStore } from '@/utils/mobileAppDetection';

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
              <a href="https://apps.apple.com/in/app/concordium-id-app/id6746754485" target="_blank" rel="noopener noreferrer">
                <img src="${appstoreIcon}" alt="Download on App Store" />
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.idwallet.app&hl=en" target="_blank" rel="noopener noreferrer">
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
    const startBtnLabel = startBtn?.querySelector('span');
    const startBtnDefaultLabel = startBtnLabel?.textContent?.trim() || 'Open with ID App';
    let openInFlight = false;

    const setOpenBusy = (busy: boolean) => {
        if (!startBtn) return;
        startBtn.disabled = busy;
        startBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
        startBtn.classList.toggle('desktop--primary-button--busy', busy);
        if (startBtnLabel) {
            startBtnLabel.textContent = busy ? 'Opening…' : startBtnDefaultLabel;
        }
    };

    startBtn?.addEventListener('click', async () => {
        if (openInFlight || startBtn.disabled) return;
        openInFlight = true;
        setOpenBusy(true);

        try {
        const isMobile = isMobileScreen();
        const { bridgeTrace } = await import('@/utils/bridgeTrace');
        bridgeTrace('Open with ID App tapped', { isMobile, userAgent: navigator.userAgent });

        if (isMobile) {
            // On mobile, open Concordium ID via deep link.
            // Merchant-provided: use merchant URI only — do NOT init SignClient / generate a new URI.
            // SDK-managed: init WC, generate URI, listen for session approval, then deep link.
            try {
                const { ModalConstants } = await import('@/constants/modal.constants');
                const { getConcordiumIdDeepLink } = await import('@/constants/wallet.registry');

                const connectionMode = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE);
                const merchantUri = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI);

                let uri: string;

                bridgeTrace('resolving WalletConnect URI', {
                    connectionMode: connectionMode ?? '(none)',
                    hasMerchantUri: Boolean(merchantUri),
                    merchantUriLooksValid: Boolean(merchantUri?.startsWith('wc:')),
                });

                if (connectionMode === 'merchant-provided') {
                    if (!merchantUri?.startsWith('wc:')) {
                        bridgeTrace('ABORT — merchant WalletConnect URI missing or malformed', {
                            merchantUri: merchantUri ?? '(null)',
                        });
                        throw new Error('Merchant WalletConnect URI not found');
                    }
                    uri = merchantUri;
                } else {
                    const { ServiceFactory } = await import('@/services');
                    const { WalletConnectConstants } = await import('@/constants/walletconnect.constants');

                    // Ensure __CONCORDIUM_WC_CONFIG__ is populated if we're in sdk-managed mode
                    if (!(window as any).__CONCORDIUM_WC_CONFIG__) {
                        const projectId = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_PROJECT_ID);
                        const network =
                            localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) || 'testnet';
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

                    const wcService = ServiceFactory.createWalletConnectService();
                    await wcService.initialize();
                    await wcService.clearAllSessionsForNewPairing();

                    const network =
                        (localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) as
                            | 'mainnet'
                            | 'testnet') || 'testnet';
                    const chainIds = WalletConnectConstants.CHAIN_IDS[network];

                    const { uri: generatedUri, approval } = await wcService.connect({
                        ccd: {
                            methods: [...WalletConnectConstants.ALL_METHODS],
                            chains: chainIds,
                            events: [...WalletConnectConstants.EVENTS],
                        },
                    });

                    if (!generatedUri) {
                        throw new Error('Failed to generate WalletConnect URI');
                    }

                    uri = generatedUri;
                    localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI, uri);
                    localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME, 'Concordium ID');

                    let sessionProcessed = false;

                    const processApprovedSession = async (session: any) => {
                        if (sessionProcessed) return;

                        const { handleSessionApproval } = await import('./scan');
                        try {
                            await handleSessionApproval(session);
                            sessionProcessed = true;
                        } catch (error) {
                            console.warn(
                                '[verification-web-ui] session approval / proof send failed — will retry on focus',
                                error
                            );
                        }
                    };

                    approval()
                        .then(processApprovedSession)
                        .catch(() => {});

                    const tryRecoverApprovedSession = async () => {
                        if (document.hidden || sessionProcessed) return;

                        try {
                            const signClient: any = wcService.getSignClient?.() || (wcService as any).signClient;
                            const relayer: any = signClient?.core?.relayer;
                            if (relayer && typeof relayer.restartTransport === 'function') {
                                if (!relayer.connected) {
                                    await relayer.restartTransport();
                                }
                            }
                        } catch (error) {
                            console.warn('[verification-web-ui] relay restart on focus failed', error);
                        }

                        const activeSessions = wcService.getActiveSessions();
                        if (activeSessions.length > 0) {
                            await processApprovedSession(activeSessions[0]);
                        }
                    };

                    document.addEventListener('visibilitychange', () => {
                        if (!document.hidden) void tryRecoverApprovedSession();
                    });

                    window.addEventListener('focus', () => {
                        void tryRecoverApprovedSession();
                    });

                    window.addEventListener('pageshow', () => {
                        void tryRecoverApprovedSession();
                    });
                }

                const isIOS =
                    /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
                const qs = new URLSearchParams(window.location.search);
                // Force App Store / deferred path: ?forceIdAppStore=1
                const forceStore =
                    qs.get('forceIdAppStore') === '1' || localStorage.getItem('forceIdAppStore') === '1';
                // Never open any store — register + deep link only.
                // ?skipStoreFallback=1 or localStorage skipStoreFallback=1
                const skipStoreFallback =
                    qs.get('skipStoreFallback') === '1' ||
                    localStorage.getItem('skipStoreFallback') === '1';
                // ?tf=1 sends iOS testers to TestFlight instead of the App Store.
                const { isTestFlightMode } = await import('@/constants/wallet.registry');
                const testFlightMode = isTestFlightMode();

                // Explicit deferred / store-only test path
                if (forceStore) {
                    await redirectToIdAppStore(uri);
                    return;
                }

                let deepLink: string;
                if (isIOS) {
                    // Clipboard wc: (gesture-hot) + short wake link (Safari rejects long URIs).
                    const { handoffIosClipboard } = await import('@/services/bridge.service');
                    const { getConcordiumIdWakeDeepLink } = await import('@/constants/wallet.registry');
                    try {
                        await handoffIosClipboard(uri);
                    } catch (error) {
                        console.warn('[verification-web-ui] iOS clipboard before open failed', error);
                        bridgeTrace('iOS clipboard threw before deep link', { message: String(error) });
                    }
                    deepLink = getConcordiumIdWakeDeepLink();
                } else {
                    // Android: full wc: deep link (+ Play referrer on store fallback). No clipboard.
                    deepLink = getConcordiumIdDeepLink(uri);
                }

                bridgeTrace('opening deep link', { platform: isIOS ? 'ios' : 'other', deepLink });

                console.info('[verification-web-ui] Open with ID App deep link', {
                    mode: connectionMode,
                    walletConnectUri: uri,
                    deepLink,
                    deepLinkLength: deepLink.length,
                    platform: isIOS ? 'ios' : 'other',
                    forceStore,
                    skipStoreFallback,
                    testFlightMode,
                });

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

                // Try custom scheme (TestFlight / installed). Short on iOS.
                // Tip: fresh Safari tab if you previously Cancel'd "Open in …?".
                // Never use window.location.href for custom schemes on iOS —
                // Safari shows "address is invalid" when the app does not open.
                if (isIOS) {
                    const { openIosCustomScheme } = await import('@/constants/wallet.registry');
                    openIosCustomScheme(deepLink);
                } else {
                    const link = document.createElement('a');
                    link.href = deepLink;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => link.remove(), 100);
                }

                setTimeout(() => {
                    void (async () => {
                        if (
                            !skipStoreFallback &&
                            !appOpened &&
                            !document.hidden &&
                            document.visibilityState === 'visible'
                        ) {
                            await redirectToIdAppStore(uri);
                        } else if (skipStoreFallback && !appOpened) {
                            console.info(
                                '[verification-web-ui] skipStoreFallback — not opening any store. Open the app manually; clipboard may already hold wc:.'
                            );
                            try {
                                const { showWaitingForPairingState } = await import(
                                    '@/components/desktop/processing'
                                );
                                await showWaitingForPairingState();
                            } catch {
                                /* ignore */
                            }
                        } else if (appOpened) {
                            // App installed and opened — pairing / proof is in progress.
                            try {
                                const { showVerificationInProgressState } = await import(
                                    '@/components/desktop/processing'
                                );
                                await showVerificationInProgressState();
                            } catch {
                                /* ignore */
                            }
                        }
                        document.removeEventListener('visibilitychange', visibilityHandler);
                        window.removeEventListener('pagehide', markAppOpened);
                        window.removeEventListener('blur', markAppOpened);
                    })();
                }, isIOS ? 2500 : 3500);
            } catch {
                // Fallback to app store if something goes wrong — keep button locked
                // so a second tap does not start another pairing while install/open runs.
                const fallbackUri = localStorage.getItem('walletConnectUri');
                void redirectToIdAppStore(fallbackUri);
            }
        } else {
            // On desktop, show the scan modal with QR code
            try {
                const { showScanModal } = await import('./scan');
                const { hideLandingModal } = await import('./landing');
                hideLandingModal();
                await showScanModal();
            } catch {
                openInFlight = false;
                setOpenBusy(false);
            }
        }
        } catch {
            openInFlight = false;
            setOpenBusy(false);
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
