// Library entry point for npm package
import './styles/index.css';
import {
  isConcordiumIDInstalled,
  isAppInstalled,
} from './utils/sessionDetection';

// Export SDK class
export { ConcordiumVerificationWebUI, sdk } from './sdk';

// Export types
export * from './types';

// Event types for consumer callbacks
// Export configuration and state
export * from './config.state';
import {
  setConfig,
  getConfig,
  type ConcordiumConfig,
  resolveContainer,
} from './config.state';
import { ModalConstants } from './constants/modal.constants';

// Configuration functions

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

// Auto-initialization function
export async function initConcordiumModal(
  config?: Partial<ConcordiumConfig>
): Promise<void> {
  setDefaultFlags();
  if (config) {
    setConfig(config);
  }

  // Ensure DOM is ready before resolving container
  if (document.readyState === 'loading') {
    await new Promise(resolve => {
      document.addEventListener('DOMContentLoaded', resolve, { once: true });
    });
  }

  // Resolve container with retries
  let targetContainer = resolveContainer();

  // If still not found, wait a bit and try again (for React apps that might still be mounting)
  if (!targetContainer) {
    await new Promise(resolve => setTimeout(resolve, 100));
    targetContainer = resolveContainer();
  }

  if (!targetContainer) {
    console.error(
      `Container not found for Concordium modal. Tried: ${getConfig().defaultContainer}`
    );
    console.error('Available elements:', {
      root: document.querySelector('#root'),
      app: document.querySelector('#app'),
      body: document.body,
    });
    return;
  }

  const hasActiveSession = isConcordiumIDInstalled() || isAppInstalled();
  const currentConfig = getConfig();

  if (currentConfig.autoDetectMobile && typeof window !== 'undefined') {
    // Use desktop returning-user modal for both mobile and desktop
    const { showReturningUserModal } =
      await import('./components/desktop/returning-user');
    showReturningUserModal();
  } else if (hasActiveSession) {
    // If there's an active session, show the returning user modal directly
    const { showReturningUserModal } =
      await import('./components/desktop/returning-user');
    showReturningUserModal();
  } else {
    // For new users, show the landing modal
    const { showLandingModal } = await import('./components/desktop/landing');
    showLandingModal();
  }
}

// Import ServiceFactory for service management
import { ServiceFactory } from '@/services';

// Add cleanup function for services
export function resetSDK(): void {
  ServiceFactory.resetServices();

  // Clear any localStorage flags
  Object.values(ModalConstants.LOCAL_STORAGE_FLAGS).forEach(flag => {
    return localStorage.removeItem(flag as string);
  });
}

// Default export for convenience
export default {
  init: initConcordiumModal,
  setConfig,
  getConfig,
};
