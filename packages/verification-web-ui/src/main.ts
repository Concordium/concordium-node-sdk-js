import './styles/index.css';
import { setConfig } from './index';

setConfig({
  walletConnect: {
    // Use a test project ID for development - replace with your actual project ID
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    metadata: {
      name: 'Concordium Verification WebUI Demo',
      description: 'Development demo for Concordium wallet integration',
      url: window.location.origin,
      icons: [
        'https://merchant-sdk.netlify.app/assets/browser-wallet-icon.svg',
      ],
    },
  },
});

// Screen size detection
const MOBILE_BREAKPOINT: number = 768; // pixels

function isMobileScreen(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

// Dynamic imports based on screen size
async function initializeModal(): Promise<void> {
  setDefaultFlags();

  // Check for active WalletConnect session first
  const hasActiveSession = await checkForActiveSession();

  if (hasActiveSession) {
    // Show returning user modal if active session exists
    const { showReturningUserModal } =
      await import('./components/desktop/returning-user');
    showReturningUserModal();
  } else {
    // Show landing modal if no active session
    const { showLandingModal } = await import('./components/desktop/landing');
    showLandingModal();
  }
}

// Add the session check function for dev mode
async function checkForActiveSession(): Promise<boolean> {
  try {
    const { ServiceFactory } = await import('./services');
    const walletConnectService = ServiceFactory.createWalletConnectService();

    await walletConnectService.initialize();
    const activeSessions = walletConnectService.getActiveSessions();

    if (activeSessions.length > 0) {
      console.log('Found active session(s)', activeSessions.length);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Dev mode: Failed to check for active sessions:', error);
    return false;
  }
}

// Initialize the app
const appElement = document.querySelector('#app');
if (appElement) {
  appElement.innerHTML = `
    <!-- Dynamic content will be loaded here -->
  `;
}

// Show the appropriate landing modal based on screen size
initializeModal();

// Handle window resize to reinitialize if screen size category changes
let currentIsMobile: boolean = isMobileScreen();
window.addEventListener('resize', () => {
  const newIsMobile = isMobileScreen();
  if (newIsMobile !== currentIsMobile) {
    currentIsMobile = newIsMobile;
    // Clear current modal and reinitialize
    const existingModal = document.querySelector('.mobile--modal-overlay');
    if (existingModal) {
      existingModal.remove();
      initializeModal();
    }
  }
});

import { ModalConstants } from './constants/modal.constants';

// Set related flags to false in localStorage
function setDefaultFlags(): void {
  try {
    const setIfAbsent = (key: string): void => {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, JSON.stringify(false));
      }
    };

    setIfAbsent(ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION);
    setIfAbsent(ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED);
    setIfAbsent(ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED);
  } catch (e) {
    console.error('Failed to update landing flags in localStorage:', e);
  }
}
