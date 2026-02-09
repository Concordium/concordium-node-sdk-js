// scan.ts - Scan Modal Implementation

import arrowLeft from '@/assets/arrow-left.svg';
import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import appstoreIcon from '@/assets/appstore-icon.svg';
import playstoreIcon from '@/assets/playstore-icon.svg';
import concordiumWalletIcon from '@/assets/concordium-wallet-icon.svg';
import browserWalletIcon from '@/assets/browser-wallet-icon.svg';
import concordiumIDIcon from '@/assets/concordium-ID-icon.svg';
import webStoreIcon from '@/assets/web-store.svg';
import mobileBlue from '@/assets/mobile-blue.png';
import mobileGrey from '@/assets/mobile-grey.svg';
import laptopBlue from '@/assets/laptop-blue.svg';
import laptopGrey from '@/assets/laptop-grey.svg';

import type {
  WalletOption,
  StepConfiguration,
  ModalElements,
  ModalFunction,
  ShowModalFunction,
  HideModalFunction,
} from '@/types';
import { Dropdown, createDropdownHTML } from '@/utils/dropdown';
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

const WALLET_OPTIONS: WalletOption[] = [
  {
    value: WALLET_TYPES.CONCORDIUM_WALLET,
    text: 'Concordium Wallet',
    icon: concordiumWalletIcon,
    checked: false,
  },
  {
    value: WALLET_TYPES.BROWSER_WALLET,
    text: 'Concordium Browser Wallet',
    icon: browserWalletIcon,
    checked: false,
  },
  {
    value: WALLET_TYPES.CONCORDIUM_ID,
    text: 'ConcordiumID',
    icon: concordiumIDIcon,
    checked: true,
  },
];

const STEP_CONFIGURATIONS: Record<
  WalletTypeValues | 'default',
  StepConfiguration[]
> = {
  [WALLET_TYPES.CONCORDIUM_WALLET]: [
    { count: '1', text: 'Download & set-up' },
    { count: '2', text: 'Scan QR & approve' },
    { count: '3', text: 'Return and finish' },
  ],
  [WALLET_TYPES.BROWSER_WALLET]: [
    { count: '1', text: 'Install Concordium Browser Wallet' },
    { count: '2', text: 'Create Account' },
    { count: '3', text: 'Return and start verification' },
  ],
  [WALLET_TYPES.CONCORDIUM_ID]: [
    { count: '1', text: 'Download Concordium ID' },
    { count: '2', text: 'Create Account' },
    { count: '3', text: 'Return and scan QR' },
  ],
  default: [
    { count: '1', text: 'Download & set-up' },
    { count: '2', text: 'Scan QR & approve' },
    { count: '3', text: 'Return and finish' },
  ],
};

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
  POINT_LIST: '#point-list',
  BROWSER_BTN: '#browser-btn',
  BROWSER_WALLET_BTN: '#browser-wallet-btn',
  FOOTER_ICON: '#footer-icon',
  DROPDOWN_LIST: '[data-dropdown-list]',
} as const;

// Mobile wallet options (only 2 options)
const MOBILE_WALLET_OPTIONS: WalletOption[] = [
  {
    value: WALLET_TYPES.CONCORDIUM_WALLET,
    text: 'Concordium Wallet',
    icon: concordiumWalletIcon,
    checked: false,
  },
  {
    value: WALLET_TYPES.CONCORDIUM_ID,
    text: 'ConcordiumID',
    icon: concordiumIDIcon,
    checked: true,
  },
];

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

          <div id="dropdown-wrapper" class="${CSS_CLASSES.HIDDEN}">
            ${createDropdownHTML(WALLET_OPTIONS)}
          </div>

          <div id="point-list" class="desktop--point-list ${CSS_CLASSES.HIDDEN}" style="display: none;">
            ${createStepHTML(STEP_CONFIGURATIONS.default)}
          </div>

          <div id="browser-btn" class="${CSS_CLASSES.HIDDEN} ${CSS_CLASSES.FLEX_COL} items-center gap-4">
            <button class="desktop--primary-button" id="browser-wallet-btn">
              <span>Verify with Browser Wallet</span>
              <img src="${arrowRight}" alt="arrow-right-icon" />
            </button>
          </div>

          <div class="desktop--scan-footer ${CSS_CLASSES.HIDDEN}" style="display: none;">
            <div id="footer-title" class="font-inter font-medium text-[16px] leading-[18px]" style="color: #0D0F11;">
              Download Concordium ID
            </div>
            <div id="footer-icon" class="flex items-center justify-center gap-2">
              <img src="${appstoreIcon}" alt="app-store-icon" />
              <img src="${playstoreIcon}" alt="play-store-icon" />
            </div>
            <div class="font-normal text-[14px] leading-5" style="color: #0D0F11;">
              Come back here and continue after installing the app.
            </div>
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
            <div id="dropdown-wrapper">
              ${createDropdownHTML(MOBILE_WALLET_OPTIONS)}
            </div>

            <div id="point-list" class="mobile--point-list">
              ${createMobileStepHTML()}
            </div>

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

          <div class="mobile--scan-footer ${CSS_CLASSES.HIDDEN}">
            <div class="font-inter font-medium text-[16px] leading-[18px]" style="color: #0D0F11;">
              Download Concordium ID
            </div>
            <div id="footer-icon" class="flex items-center justify-center gap-2">
              <img src="${appstoreIcon}" alt="app-store-icon" />
              <img src="${playstoreIcon}" alt="play-store-icon" />
            </div>
            <div class="font-normal text-[14px] leading-5" style="color: #0D0F11;">
              Come back here and continue after installing the app.
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to create mobile steps
function createMobileStepHTML(): string {
  const steps = [
    { count: '1', text: 'Open in your Concordium Wallet' },
    { count: '2', text: 'Approve the request' },
    { count: '3', text: 'Return and finish' },
  ];

  return steps
    .map(
      ({ count, text }) => `
      <div class="flex items-center gap-4">
        <span class="mobile--point-count">${count}</span>
        <span class="mobile--point-text">${text}</span>
      </div>`
    )
    .join('');
}

export const createScanModal: ModalFunction = () => {
  // Detect if mobile screen
  const isMobile = isMobileScreen();

  console.log(
    '[Scan Modal] Creating modal for:',
    isMobile ? 'MOBILE' : 'DESKTOP'
  );

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
    console.log('Back button clicked');
    const { showLandingModal } = await import('./landing');
    hideScanModal();
    await showLandingModal();
  };

  const handleBrowserWallet = async (): Promise<void> => {
    console.log('Browser wallet button clicked');
    // Processing modal will be shown automatically after session approval
    // Don't hide scan modal - keep it visible until session is established
  };

  // Mobile-specific handlers
  const handleOpenInWallet = async (): Promise<void> => {
    console.log(
      '[Mobile] Open in wallet clicked, selected:',
      currentSelectedWallet
    );

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

      console.log('[Mobile] App detection:', {
        installedApps: detection.installedApps,
        recommendedAction: detection.recommendedAction,
      });

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
    console.log('[Mobile] Verify on Another Device clicked');
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

  // Initialize dropdown - always show
  const dropdownContainer = scanContainer.querySelector(
    SELECTORS.DROPDOWN_LIST
  ) as HTMLElement | null;
  if (dropdownContainer) {
    const dropdown = new Dropdown(dropdownContainer, {
      onSelect: (selected: WalletOption) => {
        console.log('Wallet selected:', selected);
        currentSelectedWallet = selected.value as WalletTypeValues;

        if (isMobile) {
          // Update button text for mobile
          const walletBtnText = scanContainer.querySelector('#wallet-btn-text');
          if (walletBtnText) {
            walletBtnText.textContent = `Verify with ${selected.text}`;
          }
        } else {
          // Update content for desktop
          requestAnimationFrame(() => updateContent(selected));

          // Update footer text based on selection
          const footerTitle = scanContainer.querySelector('#footer-title');
          if (footerTitle) {
            if (selected.value === WALLET_TYPES.CONCORDIUM_ID) {
              footerTitle.textContent = 'Download Concordium ID';
            } else if (selected.value === WALLET_TYPES.CONCORDIUM_WALLET) {
              footerTitle.textContent = 'Download Concordium Wallet';
            } else if (selected.value === WALLET_TYPES.BROWSER_WALLET) {
              footerTitle.textContent = 'Download Concordium Browser Wallet';
            }
          }
        }
      },
    });
    // Store dropdown instance for cleanup
    (scanContainer as any).dropdownInstance = dropdown;
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
          console.log(
            'Active session detected, redirecting to returning user modal...'
          );

          // // Extract session details
          // const { topic, namespaces } = activeSessionData;
          // const accounts = namespaces?.ccd?.accounts || [];

          // // Emit active_session event to merchant with session data
          // window.dispatchEvent(
          //   new CustomEvent('concordium-merchant-sdk-event', {
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
    console.log('No active session, displaying QR code...');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Initializing WalletConnect in Scan Modal');
    console.log('   Mode:', connectionMode || 'merchant-provided (default)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

  console.log(' SDK-Managed Connection');
  console.log('   → Merchant provided projectId to SDK');
  console.log('   → SDK is generating WalletConnect URI');
  console.log('   → Project ID:', projectId.substring(0, 20) + '...');
  console.log('   → Network:', network);

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

  console.log('SDK generated WalletConnect URI successfully');

  // Store URI for mobile deep linking
  currentQRCodeUri = uri;

  // Handle session approval in the background
  approval()
    .then(async session => {
      console.log('Wallet connected! Session approved');
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

  console.log(' Merchant-Provided Connection');
  console.log('   → Merchant is managing their own WalletConnect');
  console.log('   → Using merchant-generated URI');
  console.log('   → URI:', storedUri.substring(0, 30) + '...');

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
    console.log('WalletConnect session approved');

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
      new CustomEvent('concordium-merchant-sdk-event', {
        detail: {
          type: 'session_approved',
          data: sessionEvent,
        },
        bubbles: true,
        composed: true,
      })
    );

    console.log('Session approved event emitted to merchant');
    console.log('   → Topic:', topic);
    console.log('   → Accounts:', accounts);

    // Show the processing modal (it will handle crossfade with scan modal)
    const { showProcessingModal } = await import('./processing');
    await showProcessingModal();

    console.log('Waiting for merchant to send presentation request...');
    console.log('   → Merchant should call sdk.sendPresentationRequest()');
  } catch (error) {
    console.error('Error handling session approval:', error);

    // Emit error event
    window.dispatchEvent(
      new CustomEvent('concordium-merchant-sdk-event', {
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
    console.log('Generating QR code for URI:', uri);
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
          <img src="${qrCodeDataURL}" alt="QR Code for wallet connection" class="w-48 h-48 mx-auto mb-2" />
          <p class="text-sm mt-2" style="color: #0D0F11;">Scan the QR code using a supported app</p>
          ${countdownHTML}
          
          <!-- Toggle Switch -->
          <div class="mt-4 flex items-center justify-center gap-2 p-1 mx-auto" style="background: #E4E6E7; border-radius: 1000px; height: 45px; width: 400px;">
            <button id="toggle-mobile" class="flex items-center gap-2 px-3 transition-all flex-1 justify-center" style="color: #2667FF; background: #D4D6D9; border-radius: 1000px; height: 36px;">
              <img id="mobile-icon" src="${mobileBlue}" alt="Mobile" />
              <span class="text-sm font-medium">Mobile App</span>
            </button>
            <div style="width: 1px; height: 24px; background: #00000033;"></div>
            <button id="toggle-browser" class="flex items-center gap-2 px-3 transition-all flex-1 justify-center" style="color: #00000099; border-radius: 1000px; height: 36px;">
              <img id="browser-icon" src="${laptopGrey}" alt="Browser" />
              <span class="text-sm font-medium">Browser App</span>
            </button>
          </div>
        </div>
      `;

      // Set up toggle functionality
      setupToggleSwitch();

      // Set up QR code expiry
      setupQRCodeExpiry();

      // Show the hidden elements now that QR code is ready
      const dropdownWrapper = document.querySelector('#dropdown-wrapper');
      const pointList = document.querySelector(
        '#point-list'
      ) as HTMLElement | null;
      const footer = document.querySelector(
        '.desktop--scan-footer'
      ) as HTMLElement | null;

      dropdownWrapper?.classList.remove(CSS_CLASSES.HIDDEN);
      if (pointList) {
        pointList.classList.remove(CSS_CLASSES.HIDDEN);
        pointList.style.display = 'flex';
      }
      if (footer) {
        footer.classList.remove(CSS_CLASSES.HIDDEN);
        footer.style.display = 'flex';
      }
    }
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    showQRError('Failed to generate QR code. Please try again.');
  }
}

/**
 * Sets up toggle switch functionality for Mobile/Browser app selection
 */
function setupToggleSwitch(): void {
  const mobileBtn = document.querySelector(
    '#toggle-mobile'
  ) as HTMLButtonElement;
  const browserBtn = document.querySelector(
    '#toggle-browser'
  ) as HTMLButtonElement;
  const mobileIcon = document.querySelector('#mobile-icon') as HTMLImageElement;
  const browserIcon = document.querySelector(
    '#browser-icon'
  ) as HTMLImageElement;

  if (!mobileBtn || !browserBtn || !mobileIcon || !browserIcon) return;

  const setActiveButton = (
    active: HTMLButtonElement,
    inactive: HTMLButtonElement,
    activeIcon: HTMLImageElement,
    inactiveIcon: HTMLImageElement,
    activeSrc: string,
    inactiveSrc: string
  ) => {
    // Active button styles
    active.style.background = '#D4D6D9';
    active.style.color = '#2667FF';
    activeIcon.src = activeSrc;

    // Inactive button styles
    inactive.style.background = 'transparent';
    inactive.style.color = '#00000099';
    inactiveIcon.src = inactiveSrc;
  };

  mobileBtn.addEventListener('click', () => {
    setActiveButton(
      mobileBtn,
      browserBtn,
      mobileIcon,
      browserIcon,
      mobileBlue,
      laptopGrey
    );
    console.log('Mobile app option selected');
  });

  browserBtn.addEventListener('click', () => {
    setActiveButton(
      browserBtn,
      mobileBtn,
      browserIcon,
      mobileIcon,
      laptopBlue,
      mobileGrey
    );
    console.log('Browser app option selected');
  });
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

  console.log('QR Code expired', {
    mode: connectionMode,
    autoRefresh: isMerchantProvided ? 'N/A (merchant-provided)' : autoRefresh,
  });

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
    console.log(
      '🔔 Merchant-provided QR code expired. Waiting for new URI from merchant...'
    );
    showQRExpiredMessage(false);
  } else if (autoRefresh) {
    // SDK-managed QR code with auto-refresh enabled
    console.log('Auto-refreshing SDK-generated QR code...');
    showQRRefreshing();
    await refreshQRCode();
  } else {
    // SDK-managed but auto-refresh disabled
    console.log('QR code expired. Auto-refresh disabled.');
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

    console.log('QR code refreshed successfully');
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
  console.log('Received new URI from merchant, updating QR code...');

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

  console.log('Merchant-provided QR code updated successfully');
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
  const handleSessionApproved = async (event: Event) => {
    const customEvent = event as CustomEvent;
    console.log('Session approved event received:', customEvent.detail);

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

// Helper functions
function toggleElementVisibility(
  element: HTMLElement | null,
  show: boolean
): void {
  if (!element) return;

  if (show) {
    element.classList.remove(CSS_CLASSES.HIDDEN);
    element.style.display = CSS_CLASSES.FLEX;
  } else {
    element.style.display = 'none';
  }
}

function getModalElements(): ModalElements | null {
  const modal = document.querySelector(
    SELECTORS.SCAN_MODAL
  ) as HTMLElement | null;
  if (!modal) return null;

  return {
    modal,
    qrContainer: modal.querySelector(
      SELECTORS.QR_CONTAINER
    ) as HTMLElement | null,
    footerIcon: modal.querySelector(
      SELECTORS.FOOTER_ICON
    ) as HTMLElement | null,
    pointList: modal.querySelector(SELECTORS.POINT_LIST) as HTMLElement | null,
    browserBtn: modal.querySelector(
      SELECTORS.BROWSER_BTN
    ) as HTMLElement | null,
  };
}

function createStepHTML(steps: StepConfiguration[]): string {
  if (!steps || !Array.isArray(steps)) return '';

  return steps
    .map(
      ({ count, text }) => `
      <div class="flex items-center gap-4">
        <span class="desktop--point-count">${count}</span>
        <span class="desktop--point-text">${text}</span>
      </div>`
    )
    .join('');
}

function updateUIForBrowserWallet(elements: ModalElements): void {
  const { qrContainer, footerIcon, pointList, browserBtn } = elements;

  toggleElementVisibility(qrContainer, false);
  toggleElementVisibility(browserBtn, true);

  if (footerIcon) {
    footerIcon.innerHTML = `<img src="${webStoreIcon}" alt="Web Store" />`;
  }

  if (pointList) {
    pointList.innerHTML = createStepHTML(
      STEP_CONFIGURATIONS[WALLET_TYPES.BROWSER_WALLET]
    );
  }
}

function updateUIForOtherWallets(elements: ModalElements): void {
  const { qrContainer, footerIcon, pointList, browserBtn } = elements;

  toggleElementVisibility(qrContainer, true);
  toggleElementVisibility(browserBtn, false);

  if (footerIcon) {
    footerIcon.innerHTML = `
      <img src="${appstoreIcon}" alt="App Store" />
      <img src="${playstoreIcon}" alt="Play Store" />
    `;
  }

  if (pointList) {
    pointList.innerHTML = createStepHTML(STEP_CONFIGURATIONS.default);
  }

  // Re-initialize QR code for wallet types that need it
  initializeWalletConnection().catch(console.error);
}

function updateContent(selected: WalletOption): void {
  if (!selected?.value) {
    console.error('Invalid selection provided');
    return;
  }

  const elements = getModalElements();
  if (!elements) {
    console.error('Modal elements not found');
    return;
  }

  // Update UI based on wallet type
  if (selected.value === WALLET_TYPES.BROWSER_WALLET) {
    updateUIForBrowserWallet(elements);
  } else {
    updateUIForOtherWallets(elements);
  }
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
      console.log('Found active session(s):', activeSessions.length);
      // Return the first active session data
      return activeSessions[0];
    }

    console.log('No active sessions found');
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

  console.log('[Mobile] Generating deep link:');
  console.log('  - Wallet type:', walletType);
  console.log('  - Network:', network);
  console.log('  - URI:', uri?.substring(0, 30) + '...');

  if (walletType === WALLET_TYPES.CONCORDIUM_WALLET) {
    // Check device type for Concordium Wallet
    if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
      // iOS
      deepLink = `cryptox${network}://wc?uri=${encodeURIComponent(uri)}&redirect=googlechrome://`;
      console.log('  - Platform: iOS');
    } else if (/android/i.test(ua)) {
      // Android
      deepLink = `cryptox-wc-${network}://wc?uri=${encodeURIComponent(uri)}&go_back=true`;
      console.log('  - Platform: Android');
    }
  } else if (walletType === WALLET_TYPES.CONCORDIUM_ID) {
    // Concordium ID - same for all devices
    deepLink = `concordiumidapp://wc?uri=${encodeURIComponent(uri)}`;
    console.log('  - Platform: All (Concordium ID)');
  }

  if (deepLink) {
    console.log('  - Generated deep link:', deepLink.substring(0, 50) + '...');
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
    console.log('[Mobile] Generating QR code for cross-device verification');
    const { default: QRCode } = await import('qrcode');

    const qrCodeDataURL = await QRCode.toDataURL(uri, {
      width: 200,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });

    container.innerHTML = `
      <div class="text-center py-4">
        <img src="${qrCodeDataURL}" alt="QR Code for wallet connection" class="w-48 h-48 mx-auto mb-2" />
        <p class="text-sm" style="color: #0D0F11;">Scan the QR code using a supported app</p>
        
        <!-- Toggle Switch -->
        <div class="mt-4 flex items-center justify-center gap-2 p-1 max-w-[280px] mx-auto" style="background: #E4E6E7; border-radius: 1000px; height: 45px;">
          <button id="toggle-mobile-mobile" class="flex items-center gap-2 px-3 transition-all flex-1 justify-center" style="color: #2667FF; background: #D4D6D9; border-radius: 1000px; height: 36px;">
            <img id="mobile-icon-mobile" src="${mobileBlue}" alt="Mobile" class="w-5 h-5" />
            <span class="text-sm font-medium">Mobile App</span>
          </button>
          <div style="width: 1px; height: 24px; background: #00000033;"></div>
          <button id="toggle-browser-mobile" class="flex items-center gap-2 px-3 transition-all flex-1 justify-center" style="color: #00000099; border-radius: 1000px; height: 36px;">
            <img id="browser-icon-mobile" src="${laptopGrey}" alt="Browser" class="w-5 h-5" />
            <span class="text-sm font-medium">Browser App</span>
          </button>
        </div>
      </div>
    `;

    // Set up toggle functionality for mobile view
    setupToggleSwitchMobile();

    // Show the container
    container.classList.remove(CSS_CLASSES.HIDDEN);
    container.style.display = 'flex';
  } catch (error) {
    console.error('[Mobile] Failed to generate QR code:', error);
  }
}

/**
 * Sets up toggle switch functionality for Mobile/Browser app selection (mobile view)
 */
function setupToggleSwitchMobile(): void {
  const mobileBtn = document.querySelector(
    '#toggle-mobile-mobile'
  ) as HTMLButtonElement;
  const browserBtn = document.querySelector(
    '#toggle-browser-mobile'
  ) as HTMLButtonElement;
  const mobileIcon = document.querySelector(
    '#mobile-icon-mobile'
  ) as HTMLImageElement;
  const browserIcon = document.querySelector(
    '#browser-icon-mobile'
  ) as HTMLImageElement;

  if (!mobileBtn || !browserBtn || !mobileIcon || !browserIcon) return;

  const setActiveButton = (
    active: HTMLButtonElement,
    inactive: HTMLButtonElement,
    activeIcon: HTMLImageElement,
    inactiveIcon: HTMLImageElement,
    activeSrc: string,
    inactiveSrc: string
  ) => {
    // Active button styles
    active.style.background = '#D4D6D9';
    active.style.color = '#2667FF';
    activeIcon.src = activeSrc;

    // Inactive button styles
    inactive.style.background = 'transparent';
    inactive.style.color = '#00000099';
    inactiveIcon.src = inactiveSrc;
  };

  mobileBtn.addEventListener('click', () => {
    setActiveButton(
      mobileBtn,
      browserBtn,
      mobileIcon,
      browserIcon,
      mobileBlue,
      laptopGrey
    );
    console.log('[Mobile] Mobile app option selected');
  });

  browserBtn.addEventListener('click', () => {
    setActiveButton(
      browserBtn,
      mobileBtn,
      browserIcon,
      mobileIcon,
      laptopBlue,
      mobileGrey
    );
    console.log('[Mobile] Browser app option selected');
  });
}
