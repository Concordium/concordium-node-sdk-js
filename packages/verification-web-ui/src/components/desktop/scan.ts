// scan.ts - Scan Modal Implementation

import arrowLeft from '@/assets/arrow-left.svg';
import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import sectionSeparator from '@/assets/section-separator.svg';

import type {
  ModalFunction,
  ShowModalFunction,
  HideModalFunction,
} from '@/types';
import { ServiceFactory } from '@/services';
import { dispatchConcordiumEvent } from '@/index';
import { ModalConstants } from '@/constants/modal.constants';
import { isMobileScreen } from '@/config.state';

// Global variables for modal state management
let scanModalElement: HTMLElement | null = null;
let processingTimeout: ReturnType<typeof setTimeout> | null = null;
let qrExpiryTimer: ReturnType<typeof setTimeout> | null = null;
let qrCountdownInterval: ReturnType<typeof setInterval> | null = null;
let currentQRCodeUri: string | null = null;
let currentSelectedWallet: WalletTypeValues;

// Constants
const WALLET_TYPES = {
  CONCORDIUM_WALLET: 'concordium-wallet',
  BROWSER_WALLET: 'browser-wallet',
  CONCORDIUM_ID: 'concordium-id',
} as const;

// Initialize after WALLET_TYPES is defined
currentSelectedWallet = WALLET_TYPES.CONCORDIUM_ID;

type WalletTypeKeys = keyof typeof WALLET_TYPES;
type WalletTypeValues = (typeof WALLET_TYPES)[WalletTypeKeys];

const CSS_CLASSES = {
  HIDDEN: 'hidden',
  FLEX: 'flex',
  FLEX_COL: 'flex-col',
} as const;

const SELECTORS = {
  APP: '#app',
  SCAN_MODAL: '#scan-modal',
  BACK_BTN: '#back-btn',
  QR_CONTAINER: '#qr-container',
  BROWSER_BTN: '#browser-btn',
  BROWSER_WALLET_BTN: '#browser-wallet-btn',
} as const;

// Helper function to create desktop HTML
function createDesktopScanHTML(): string {
  return `
    <div class="desktop--modal-overlay">
      <div class="desktop--modal-container">
        <div class="desktop--modal-body">
          <div class="flex items-center justify-between p-2">
            <button class="desktop--navigation-button" id="back-btn">
              <img src="${arrowLeft}" alt="arrow-left-icon" />
              <span>Back</span>
            </button>
            <div>
              <img src="${concordiumModalLogo}" alt="concordium-modal-logo" />
            </div>
          </div>

          <div id="qr-container" class="${CSS_CLASSES.FLEX} items-center justify-center min-h-[200px]">
            <div class="animate-pulse text-center">
              <div class="w-48 h-48 bg-gray-200 rounded mb-2"></div>
              <p class="text-sm" style="color: #0D0F11;">Generating QR code...</p>
            </div>
          </div>

          <div id="browser-btn" class="${CSS_CLASSES.HIDDEN} ${CSS_CLASSES.FLEX_COL} items-center gap-4">
            <button class="desktop--primary-button" id="browser-wallet-btn">
              <span>Verify with Browser Wallet</span>
              <img src="${arrowRight}" alt="arrow-right-icon" />
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to create mobile HTML
function createMobileScanHTML(): string {
  return `
    <div class="mobile--modal-overlay position-relative">
      <div class="mobile--modal-container">
        <div class="mobile--modal-body">
          <div class="flex items-center justify-between p-2">
            <button class="mobile--navigation-button" id="back-btn">
              <img src="${arrowLeft}" alt="arrow-left-icon" />
              <span>Back</span>
            </button>
            <div>
              <img src="${concordiumModalLogo}" alt="concordium-modal-logo" />
            </div>
          </div>

          <div id="mobile-loading" class="${CSS_CLASSES.FLEX} items-center justify-center min-h-[300px]">
            <div class="animate-pulse text-center">
              <div class="w-48 h-48 bg-gray-200 rounded mb-2 mx-auto"></div>
              <p class="text-sm" style="color: #0D0F11;">Preparing wallet connection...</p>
            </div>
          </div>

          <div id="mobile-content" class="${CSS_CLASSES.HIDDEN}">
            <div id="btn-wrapper" class="flex flex-col w-full items-center gap-2 mt-4">
            <button class="mobile--primary-button w-full" id="open-in-wallet-btn">
              <span id="wallet-btn-text">Verify with ConcordiumID</span>
              <img src="${arrowRight}" alt="arrow-right-icon" />
            </button>
            <button class="mobile--primary-outline-button w-full" id="open-other-device-btn">
              <span>Verify on Another Device</span>
            </button>
          </div>

          <div id="qr-container" class="${CSS_CLASSES.HIDDEN}" style="display: none;">
            <!-- QR code will be generated here when user clicks "Verify on Another Device" -->
          </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export const createScanModal: ModalFunction = () => {
  // Detect if mobile screen
  const isMobile = isMobileScreen();

  const scanHTML = isMobile ? createMobileScanHTML() : createDesktopScanHTML();

  const scanContainer = document.createElement('div');
  scanContainer.innerHTML = scanHTML;
  scanContainer.id = 'scan-modal';

  // Cache DOM elements for better performance
  const elements = {
    backBtn: scanContainer.querySelector(
      SELECTORS.BACK_BTN
    ) as HTMLButtonElement | null,
    browserWalletBtn: scanContainer.querySelector(
      SELECTORS.BROWSER_WALLET_BTN
    ) as HTMLButtonElement | null,
    openInWalletBtn: scanContainer.querySelector(
      '#open-in-wallet-btn'
    ) as HTMLButtonElement | null,
    openOtherDeviceBtn: scanContainer.querySelector(
      '#open-other-device-btn'
    ) as HTMLButtonElement | null,
    qrContainer: scanContainer.querySelector(
      SELECTORS.QR_CONTAINER
    ) as HTMLElement | null,
  };

  // Event handlers following your modal navigation pattern
  const handleBack = async (): Promise<void> => {
    const { showLandingModal } = await import('./landing');
    hideScanModal();
    await showLandingModal();
  };

  const handleBrowserWallet = async (): Promise<void> => {
    // Processing modal will be shown automatically after session approval
    // Don't hide scan modal - keep it visible until session is established
  };

  // Mobile-specific handlers
  const handleOpenInWallet = async (): Promise<void> => {
    // Check if URI is available
    if (!currentQRCodeUri) {
      const storedUri = localStorage.getItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI
      );
      if (storedUri) {
        currentQRCodeUri = storedUri;
      } else {
        await initializeWalletConnection();
        if (!currentQRCodeUri) {
          alert('Connection URI not available. Please refresh and try again.');
          return;
        }
      }
    }

    // Use smart mobile routing with app detection
    const { detectInstalledApps, openDeepLink, openAppStore } =
      await import('@/utils/mobileAppDetection');

    try {
      const detection = await detectInstalledApps();

      // Handle based on detection result
      if (detection.recommendedAction === 'show-store') {
        // No apps installed - take to store
        const appType =
          currentSelectedWallet === WALLET_TYPES.CONCORDIUM_ID
            ? 'concordium-id'
            : 'concordium-wallet';
        openAppStore(appType);
      } else if (detection.recommendedAction === 'show-selection') {
        // Multiple apps - let user choose (they already selected via dropdown)
        const appType =
          currentSelectedWallet === WALLET_TYPES.CONCORDIUM_ID
            ? 'concordium-id'
            : 'concordium-wallet';
        openDeepLink(appType, currentQRCodeUri!);
      } else {
        // Single app or direct open
        const appType =
          detection.recommendedAction === 'open-id'
            ? 'concordium-id'
            : 'concordium-wallet';
        openDeepLink(appType, currentQRCodeUri!);
      }

      // Processing modal will be shown automatically after session approval
      // Keep scan modal visible until session is established
    } catch (error) {
      console.error('[Mobile] Smart routing failed:', error);
      // Fallback to old behavior
      const deepLink = generateDeepLink(
        currentSelectedWallet,
        currentQRCodeUri!
      );
      if (deepLink) {
        window.location.href = deepLink;
      } else {
        alert('Failed to open app. Please try again.');
      }
    }
  };

  const handleOpenOtherDevice = async (): Promise<void> => {
    const btnWrapper = scanContainer.querySelector('#btn-wrapper');
    if (btnWrapper) {
      btnWrapper.classList.add(CSS_CLASSES.HIDDEN);
    }

    if (currentQRCodeUri && elements.qrContainer) {
      await displayQRCodeMobile(currentQRCodeUri, elements.qrContainer);
    }
  };

  // Attach event listeners with null safety
  elements.backBtn?.addEventListener('click', handleBack);
  elements.browserWalletBtn?.addEventListener('click', handleBrowserWallet);

  // Mobile-specific event listeners
  if (isMobile) {
    elements.openInWalletBtn?.addEventListener('click', handleOpenInWallet);
    elements.openOtherDeviceBtn?.addEventListener(
      'click',
      handleOpenOtherDevice
    );
  }

  return scanContainer;
};

export const showScanModal: ShowModalFunction = async () => {
  const { getGlobalContainer } = await import('../../index');
  const targetContainer = getGlobalContainer();

  if (!targetContainer) {
    console.error('Container not found for modal');
    return;
  }

  // Detect mobile/desktop mode
  const isMobile = isMobileScreen();
  const containerClass = isMobile
    ? '.mobile--modal-container'
    : '.desktop--modal-container';

  // Create and store modal element reference
  scanModalElement = createScanModal();
  scanModalElement.id = 'scan-modal';

  // Get the modal container for transforms
  const modalContainer = scanModalElement.querySelector(
    containerClass
  ) as HTMLElement | null;

  // For smooth transitions, prepare new modal completely before showing
  scanModalElement.style.opacity = '0';
  if (modalContainer) {
    modalContainer.style.transform = 'translateY(-20px) scale(0.95)';
    modalContainer.style.transition = 'transform 0.3s ease-out';
  }
  targetContainer.appendChild(scanModalElement);

  // Force a reflow to ensure the styles are applied
  scanModalElement.offsetHeight;

  // Now start the transition
  scanModalElement.style.transition = 'opacity 0.3s ease-out';

  // Use a small delay to ensure DOM is fully ready
  setTimeout(() => {
    // Check if modal still exists (may have been removed by active session detection)
    if (!scanModalElement) {
      return;
    }

    // Show new modal
    scanModalElement.style.opacity = '1';
    if (modalContainer) {
      modalContainer.style.transform = 'translateY(0) scale(1)';
    }
  }, 10);

  // Set up event listeners for session approval and verification completion
  setupEventListeners();

  // Initialize WalletConnect after modal is mounted
  await initializeWalletConnection();
};

export const hideScanModal: HideModalFunction = () => {
  if (scanModalElement) {
    // Clean up dropdown instance following your cleanup pattern
    if ((scanModalElement as any).dropdownInstance?.destroy) {
      (scanModalElement as any).dropdownInstance.destroy();
    }

    // Add fade-out animation
    scanModalElement.classList.add('modal-exiting');

    // Remove from DOM after animation completes
    setTimeout(() => {
      const container = scanModalElement?.parentNode;
      if (container && scanModalElement) {
        container.removeChild(scanModalElement);
      }
      scanModalElement = null;
      // Restore body overflow if no other modals are present
      if (
        !document.querySelector('.desktop--modal-overlay') &&
        !document.querySelector('.mobile--modal-overlay')
      ) {
        document.body.style.overflowX = '';
      }
    }, 300);
  }

  // Clear any active timers
  if (processingTimeout) {
    clearTimeout(processingTimeout);
    processingTimeout = null;
  }

  // Clear QR code expiry timers
  if (qrExpiryTimer) {
    clearTimeout(qrExpiryTimer);
    qrExpiryTimer = null;
  }

  if (qrCountdownInterval) {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = null;
  }

  // Clean up event listeners following your cleanup pattern
  if ((window as any).scanEventCleanup) {
    (window as any).scanEventCleanup();
    (window as any).scanEventCleanup = null;
  }

  // Clean up custom event listeners
  if ((window as any).scanEventListeners) {
    (window as any).scanEventListeners.forEach((cleanup: () => void) =>
      cleanup()
    );
    (window as any).scanEventListeners = null;
  }
};

// WalletConnect initialization function
async function initializeWalletConnection(): Promise<void> {
  try {
    // Check connection mode to determine how to handle WalletConnect
    const connectionMode = localStorage.getItem(
      ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE
    );

    // Set up WalletConnect config early if in SDK-managed mode
    if (connectionMode === 'sdk-managed') {
      const projectId = localStorage.getItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.SDK_PROJECT_ID
      );
      const network = localStorage.getItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK
      );
      const metadataStr = localStorage.getItem('sdkWalletConnectMetadata');
      const metadata = metadataStr ? JSON.parse(metadataStr) : null;

      if (projectId && network) {
        // Store the config globally so ServiceFactory can use it
        (window as any).__CONCORDIUM_WC_CONFIG__ = {
          projectId,
          network,
          metadata,
        };

        // Only check for active sessions in SDK-managed mode where we have config
        const activeSessionData = await checkForActiveSession();

        if (activeSessionData) {
          // // Extract session details
          // const { topic, namespaces } = activeSessionData;
          // const accounts = namespaces?.ccd?.accounts || [];

          // // Emit active_session event to merchant with session data
          // window.dispatchEvent(
          //   new CustomEvent('verification-web-ui-event', {
          //     detail: {
          //       type: 'active_session',
          //       data: {
          //         message: 'Active WalletConnect session detected',
          //         timestamp: Date.now(),
          //         topic,
          //         accounts,
          //         namespaces,
          //         session: activeSessionData,
          //       },
          //     },
          //     bubbles: true,
          //     composed: true,
          //   })
          // );

          // Close all existing modals (scan, landing, or any other modal)
          const allModals = document.querySelectorAll(
            '.desktop--modal-overlay, .mobile--modal-overlay'
          );
          allModals.forEach(modal => {
            if (modal.parentNode) {
              modal.parentNode.removeChild(modal);
            }
          });

          // Reset scan modal reference
          scanModalElement = null;

          // Wait a moment to ensure DOM is cleaned
          await new Promise(resolve => setTimeout(resolve, 100));

          // Show returning user modal
          const { showReturningUserModal } = await import('./returning-user');
          await showReturningUserModal();
          return;
        }
      }
    }

    // No active session, proceed with QR code display

    if (connectionMode === 'sdk-managed') {
      // SDK manages WalletConnect - initialize and generate QR code
      await initializeSDKManagedConnection();
    } else {
      // Merchant provides the URI - use stored URI
      await initializeMerchantProvidedConnection();
    }
  } catch (error) {
    console.error('Wallet connection failed:', error);
    showQRError('Failed to generate QR code. Please try again.');
  }
}

/**
 * Initialize SDK-managed WalletConnect connection
 * SDK generates the QR code using project ID and network from localStorage
 */
async function initializeSDKManagedConnection(): Promise<void> {
  const projectId = localStorage.getItem(
    ModalConstants.LOCAL_STORAGE_FLAGS.SDK_PROJECT_ID
  );
  const network = localStorage.getItem(
    ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK
  ) as 'mainnet' | 'testnet';

  if (!projectId || !network) {
    throw new Error(
      'SDK project ID or network not found. Please call initWalletConnect() first.'
    );
  }

  // Get WalletConnect service and generate URI
  const wcService = ServiceFactory.createWalletConnectService();
  await wcService.initialize();

  // Import WalletConnect constants for namespace configuration
  const { WalletConnectConstants } =
    await import('@/constants/walletconnect.constants');

  // Get the chain ID for the network
  const chainIds = WalletConnectConstants.CHAIN_IDS[network];

  // Generate WalletConnect URI by calling connect()
  const { uri, approval } = await wcService.connect({
    ccd: {
      methods: [
        WalletConnectConstants.METHODS.REQUEST_VERIFIABLE_PRESENTATION_V1,
      ],
      chains: chainIds,
      events: [...WalletConnectConstants.EVENTS],
    },
  });

  if (!uri) {
    throw new Error('Failed to generate WalletConnect URI from SDK');
  }

  // Store URI for mobile deep linking
  currentQRCodeUri = uri;

  // Handle session approval in the background
  approval()
    .then(async session => {
      await handleSessionApproval(session);
    })
    .catch(error => {
      console.error('Session approval failed:', error);
    });

  // Check if mobile screen
  if (isMobileScreen()) {
    // For mobile, reveal the content (buttons, dropdown, steps)
    const mobileLoading = document.querySelector('#mobile-loading');
    const mobileContent = document.querySelector('#mobile-content');

    if (mobileLoading && mobileContent) {
      mobileLoading.classList.add(CSS_CLASSES.HIDDEN);
      mobileContent.classList.remove(CSS_CLASSES.HIDDEN);
    }
  } else {
    // For desktop, display QR code (which will also reveal elements)
    await displayQRCode(uri);
  }
}

/**
 * Initialize merchant-provided WalletConnect connection
 * Uses the URI provided by merchant via showWalletConnectPopup()
 */
async function initializeMerchantProvidedConnection(): Promise<void> {
  const storedUri = localStorage.getItem(
    ModalConstants.LOCAL_STORAGE_FLAGS.WALLET_CONNECT_URI
  );

  if (!storedUri) {
    showQRError(
      'WalletConnect not configured. Please set up WalletConnect first by calling setWalletConnectUri() or initWalletConnect().'
    );
    return;
  }

  // Store URI for mobile deep linking
  currentQRCodeUri = storedUri;

  // Check if mobile screen
  if (isMobileScreen()) {
    // For mobile, reveal the content (buttons, dropdown, steps)
    const mobileLoading = document.querySelector('#mobile-loading');
    const mobileContent = document.querySelector('#mobile-content');

    if (mobileLoading && mobileContent) {
      mobileLoading.classList.add(CSS_CLASSES.HIDDEN);
      mobileContent.classList.remove(CSS_CLASSES.HIDDEN);
    }
  } else {
    // For desktop, display QR code (which will also reveal elements)
    await displayQRCode(storedUri);
  }
}

/**
 * Handles session approval and transitions to processing modal
 * Called when QR code is scanned and wallet approves the connection
 * @param sessionData - The session data from WalletConnect approval
 */
/**
 * Handle WalletConnect session approval
 * Emits session_approved event to merchant and transitions to processing modal
 */
export async function handleSessionApproval(sessionData: any): Promise<void> {
  try {
    // Extract session details
    const { topic, namespaces } = sessionData;
    const accounts = namespaces?.ccd?.accounts || [];

    // Emit session approved event to merchant
    const sessionEvent = {
      topic,
      accounts,
      namespaces,
    };

    window.dispatchEvent(
      new CustomEvent('verification-web-ui-event', {
        detail: {
          type: 'session_approved',
          data: sessionEvent,
        },
        bubbles: true,
        composed: true,
      })
    );

    // Show the processing modal (it will handle crossfade with scan modal)
    const { showProcessingModal } = await import('./processing');
    await showProcessingModal();
  } catch (error) {
    console.error('Error handling session approval:', error);

    // Emit error event
    window.dispatchEvent(
      new CustomEvent('verification-web-ui-event', {
        detail: {
          type: 'error',
          data: {
            message: 'Failed to handle session approval',
            error,
          },
        },
        bubbles: true,
        composed: true,
      })
    );

    showQRError('Failed to process wallet connection. Please try again.');
  }
}

async function displayQRCode(uri: string): Promise<void> {
  try {
    // Dynamic import following your coding instructions pattern
    const { default: QRCode } = await import('qrcode');
    const { getConfig } = await import('@/config.state');
    const config = getConfig();

    const qrContainer = document.querySelector(SELECTORS.QR_CONTAINER);

    if (qrContainer) {
      const qrCodeDataURL = await QRCode.toDataURL(uri, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });

      const showCountdown = config.qrCode?.showCountdown !== false;
      const countdownHTML = showCountdown
        ? '<p id="qr-countdown" class="text-sm text-inverse-tertiary mt-2">Expires in: <span class="font-semibold">5:00</span></p>'
        : '';

      qrContainer.innerHTML = `
        <div class="text-center">
          <img src="${qrCodeDataURL}" alt="QR Code for wallet connection" class="w-48 h-48 mx-auto mb-2" style="border-radius: 12.414px; border: 1px solid rgba(0, 0, 0, 0.10); background: #FFF;" />
          <p class="desktop--scan-text mt-2">Scan the QR code with your<br>Concordium ID compatible device</p>
          ${countdownHTML}
          <img src="${sectionSeparator}" alt="" class="mx-auto mt-4" />
          <div class="flex items-center justify-center mt-4">
            <p class="desktop--download-text">Download & Install the <a href="#">Concordium ID App</a> and come back here to verify.</p>
          </div>
        </div>
      `;

      // Set up QR code expiry
      setupQRCodeExpiry();
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    showQRError('Failed to generate QR code. Please try again.');
  }
}

/**
 * Sets up QR code expiry timer and countdown
 */
async function setupQRCodeExpiry(): Promise<void> {
  // Clear any existing timers
  if (qrExpiryTimer) {
    clearTimeout(qrExpiryTimer);
    qrExpiryTimer = null;
  }
  if (qrCountdownInterval) {
    clearInterval(qrCountdownInterval);
    qrCountdownInterval = null;
  }

  const { getConfig } = await import('@/config.state');
  const config = getConfig();

  const expiryDuration = config.qrCode?.expiryDuration || 5 * 60 * 1000; // Default 5 minutes
  const showCountdown = config.qrCode?.showCountdown !== false;
  const autoRefresh = config.qrCode?.autoRefresh !== false;

  const expiryTime = Date.now() + expiryDuration;

  // Set up countdown display
  if (showCountdown) {
    const countdownElement = document.querySelector('#qr-countdown span');
    if (countdownElement) {
      qrCountdownInterval = setInterval(() => {
        const remaining = Math.max(0, expiryTime - Date.now());
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining <= 0) {
          if (qrCountdownInterval) {
            clearInterval(qrCountdownInterval);
            qrCountdownInterval = null;
          }
        }
      }, 1000);
    }
  }

  // Set up expiry timer
  qrExpiryTimer = setTimeout(async () => {
    await handleQRCodeExpiry(autoRefresh);
  }, expiryDuration);
}

/**
 * Handles QR code expiry event
 * @param autoRefresh - Whether to automatically refresh the QR code
 */
async function handleQRCodeExpiry(autoRefresh: boolean): Promise<void> {
  const connectionMode = localStorage.getItem(
    ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTION_MODE
  );
  const isMerchantProvided = connectionMode !== 'sdk-managed';

  // Dispatch expiry event
  dispatchConcordiumEvent({
    type: 'qr-code-expired',
    source: 'desktop',
    modalType: 'scan',
    data: {
      connectionMode,
      isMerchantProvided,
      autoRefresh: isMerchantProvided ? false : autoRefresh,
    },
  });

  if (isMerchantProvided) {
    // Merchant-provided QR code expired - notify merchant, don't auto-refresh
    showQRExpiredMessage(false);
  } else if (autoRefresh) {
    // SDK-managed QR code with auto-refresh enabled
    showQRRefreshing();
    await refreshQRCode();
  } else {
    // SDK-managed but auto-refresh disabled
    showQRExpiredMessage(true);
  }
}

/**
 * Refreshes the QR code (SDK-managed only)
 */
async function refreshQRCode(): Promise<void> {
  try {
    // Re-initialize SDK-managed connection to get new URI
    await initializeSDKManagedConnection();

    // Dispatch refresh event
    dispatchConcordiumEvent({
      type: 'qr-code-refreshed',
      source: 'desktop',
      modalType: 'scan',
      data: {
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('Failed to refresh QR code:', error);
    showQRError('Failed to refresh QR code. Please try again.');
  }
}

/**
 * Shows QR expired message with optional manual refresh button
 */
function showQRExpiredMessage(canRefresh: boolean): void {
  const qrContainer = document.querySelector(SELECTORS.QR_CONTAINER);
  if (qrContainer) {
    const refreshButtonHTML = canRefresh
      ? `<button id="refresh-qr" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
           Refresh QR Code
         </button>`
      : `<p class="text-sm text-inverse-tertiary mt-2">Waiting for new QR code from merchant...</p>`;

    qrContainer.innerHTML = `
      <div class="text-center">
        <div class="w-48 h-48 bg-yellow-50 border-2 border-yellow-200 rounded flex items-center justify-center mx-auto mb-2">
          <svg class="w-16 h-16 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <p class="text-sm text-yellow-600 font-semibold">QR Code Expired</p>
        ${refreshButtonHTML}
      </div>
    `;

    // Add manual refresh functionality
    if (canRefresh) {
      const refreshBtn = qrContainer.querySelector('#refresh-qr');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
          showQRRefreshing();
          await refreshQRCode();
        });
      }
    }
  }
}

/**
 * Shows QR refreshing loading state
 */
function showQRRefreshing(): void {
  const qrContainer = document.querySelector(SELECTORS.QR_CONTAINER);
  if (qrContainer) {
    qrContainer.innerHTML = `
      <div class="animate-pulse text-center">
        <div class="w-48 h-48 bg-gray-200 rounded mb-2 mx-auto"></div>
        <p class="text-sm text-inverse-tertiary">Refreshing QR code...</p>
      </div>
    `;
  }
}

/**
 * Updates QR code from merchant-provided URI
 * Called when merchant provides a new URI after expiry
 * @param newUri - The new WalletConnect URI from merchant
 */
export async function updateQRCodeFromMerchant(newUri: string): Promise<void> {
  // Display the new QR code
  await displayQRCode(newUri);

  // Dispatch refresh event
  dispatchConcordiumEvent({
    type: 'qr-code-refreshed',
    source: 'desktop',
    modalType: 'scan',
    data: {
      timestamp: Date.now(),
      source: 'merchant',
    },
  });
}

function showQRError(message: string): void {
  const qrContainer = document.querySelector(SELECTORS.QR_CONTAINER);
  if (qrContainer) {
    qrContainer.innerHTML = `
      <div class="text-center">
        <div class="w-48 h-48 bg-red-50 border-2 border-red-200 rounded flex items-center justify-center mx-auto mb-2">
          <svg class="w-16 h-16 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <p class="text-sm text-red-600">${message}</p>
        <button id="retry-qr" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
          Retry
        </button>
      </div>
    `;

    // Add retry functionality
    const retryBtn = qrContainer.querySelector('#retry-qr');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        // Reset to loading state
        qrContainer.innerHTML = `
          <div class="animate-pulse text-center">
            <div class="w-48 h-48 bg-gray-200 rounded mb-2 mx-auto"></div>
            <p class="text-sm text-inverse-tertiary">Generating QR code...</p>
          </div>
        `;

        // Retry connection
        await initializeWalletConnection();
      });
    }
  }
}

/**
 * Sets up event listeners for session approval and verification
 */
function setupEventListeners(): void {
  const listeners: Array<() => void> = [];

  // Listen for session-approved event to transition to processing modal
  const handleSessionApproved = async (_event: Event) => {
    // Hide scan modal first and wait for it to be removed
    hideScanModal();

    // Wait for scan modal to be fully removed from DOM
    await new Promise(resolve => setTimeout(resolve, 350));

    // Transition to processing modal
    const { showProcessingModal } = await import('./processing');
    await showProcessingModal();
  };

  // Add event listeners
  window.addEventListener('concordium-event', event => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.type === 'session-approved') {
      handleSessionApproved(event);
    }
  });

  // Store cleanup function
  const cleanup = () => {
    window.removeEventListener('concordium-event', handleSessionApproved);
  };

  listeners.push(cleanup);
  (window as any).scanEventListeners = listeners;
}

/**
 * Checks for active WalletConnect sessions
 * @returns Session data if there are active sessions, null otherwise
 */
async function checkForActiveSession(): Promise<any | null> {
  try {
    const { ServiceFactory } = await import('@/services');
    const walletConnectService = ServiceFactory.createWalletConnectService();

    await walletConnectService.initialize();
    const activeSessions = walletConnectService.getActiveSessions();

    if (activeSessions.length > 0) {
      // Return the first active session data
      return activeSessions[0];
    }

    return null;
  } catch (error) {
    console.error('Failed to check for active sessions:', error);
    return null;
  }
}

/**
 * Generates deep link for mobile wallets
 * @param walletType - The wallet type (concordium-wallet or concordium-id)
 * @param uri - The WalletConnect URI
 * @returns The deep link URL
 */
function generateDeepLink(
  walletType: WalletTypeValues,
  uri: string
): string | null {
  const network =
    localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.SDK_NETWORK) ||
    'testnet';
  const ua = navigator.userAgent;
  let deepLink: string | null = null;

  if (walletType === WALLET_TYPES.CONCORDIUM_WALLET) {
    // Check device type for Concordium Wallet
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      // iOS
      deepLink = `cryptox${network}://wc?uri=${encodeURIComponent(uri)}&redirect=googlechrome://`;
    } else if (/android/i.test(ua)) {
      // Android
      deepLink = `cryptox-wc-${network}://wc?uri=${encodeURIComponent(uri)}&go_back=true`;
    }
  } else if (walletType === WALLET_TYPES.CONCORDIUM_ID) {
    // Concordium ID - same for all devices, with redirect to origin
    const redirectUrl = encodeURIComponent(window.location.origin);
    deepLink = `concordiumidapp://wc?uri=${encodeURIComponent(uri)}&redirect=${redirectUrl}`;
  }

  return deepLink;
}

/**
 * Displays QR code on mobile (when user chooses to verify on another device)
 * @param uri - The WalletConnect URI
 * @param container - The container element to display QR code in
 */
async function displayQRCodeMobile(
  uri: string,
  container: HTMLElement
): Promise<void> {
  try {
    const { default: QRCode } = await import('qrcode');

    const qrCodeDataURL = await QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    container.innerHTML = `
      <div class="text-center py-4">
        <img src="${qrCodeDataURL}" alt="QR Code for wallet connection" class="w-48 h-48 mx-auto mb-2" style="border-radius: 12.414px; border: 1px solid rgba(0, 0, 0, 0.10); background: #FFF;" />
        <p class="desktop--scan-text">Scan the QR code with your<br>Concordium ID compatible device</p>
        <img src="${sectionSeparator}" alt="" class="mx-auto mt-4" />
        <div class="flex items-center justify-center mt-4">
          <p class="desktop--download-text">Download & Install the <a href="#">Concordium ID App</a> and come back here to verify.</p>
        </div>
      </div>
    `;

    // Show the container
    container.classList.remove(CSS_CLASSES.HIDDEN);
    container.style.display = 'flex';
  } catch (error) {
    console.error('[Mobile] Failed to generate QR code:', error);
  }
}
