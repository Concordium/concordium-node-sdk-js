import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import modalGraphicSuccess from '@/assets/modal-graphic-success.svg';

import type {
  ModalFunction,
  ShowModalFunction,
  HideModalFunction,
} from '@/types';
import { dispatchConcordiumEvent } from '../../index';
import { ModalConstants } from '@/constants/modal.constants';

export const createReturningUserModal: ModalFunction = () => {
  const modalHTML = `
  <div class="desktop--modal-overlay">
    <div class="desktop--modal-container">
      <div class="desktop--modal-body">
        <div class="flex items-center justify-end p-2">
          <img
            src="${concordiumModalLogo}"
            alt="concordium-modal-logo"
            class="object-cover"
          />
        </div>

        <div class="flex items-center justify-center">
          <img src="${modalGraphicSuccess}" alt="success-graphic" class="object-cover" />
        </div>

        <div class="flex flex-col items-center gap-2">
          <p class="font-medium text-[20px] leading-[25px] tracking-[0.2px] font-jakarta" style="color: #0D0F11;">Your ID is still connected</p>
        </div>

        <div class="flex flex-col items-center gap-4">
          <button class="desktop--primary-button" id="continue-btn" style="margin-bottom: 10px;">
            <span>Start private verification</span>
            <img src="${arrowRight}" alt="arrow-right-icon" class="object-cover" />
          </button>

          <button class="desktop--outline-button" id="disconnect-btn">Disconnect</button>
        </div>
      </div>
    </div>
  </div>
  `;

  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;

  const continueBtn = modalContainer.querySelector(
    '#continue-btn'
  ) as HTMLButtonElement | null;
  const disconnectBtn = modalContainer.querySelector(
    '#disconnect-btn'
  ) as HTMLButtonElement | null;

  continueBtn?.addEventListener('click', async () => {

    // Get active session from WalletConnect service
    const { ServiceFactory } = await import('@/services');
    const walletConnectService = ServiceFactory.createWalletConnectService();
    await walletConnectService.initialize();
    const activeSessions = walletConnectService.getActiveSessions();
    const activeSessionData = activeSessions[0]; // Get first active session

    // Check if session exists
    if (!activeSessionData) {
      console.error('No active session found');

      // Redirect to landing modal since session is missing
      hideReturningUserModal();
      const { showLandingModal } = await import('./landing');
      await showLandingModal();
      return;
    }

    // Extract session details
    const { topic, namespaces } = activeSessionData;
    const accounts = namespaces?.ccd?.accounts || [];

    // Emit active_session event to merchant with session data
    window.dispatchEvent(
      new CustomEvent('verification-web-ui-event', {
        detail: {
          type: 'active_session',
          data: {
            message: 'Active WalletConnect session detected',
            timestamp: Date.now(),
            topic,
            accounts,
            namespaces,
            session: activeSessionData,
          },
        },
        bubbles: true,
        composed: true,
      })
    );

    // Use existing session to continue verification
    try {
      localStorage.setItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.ACTIVE_SESSION,
        JSON.stringify(true)
      );
      hideReturningUserModal();
      const { showProcessingModal } = await import('./processing');
      await showProcessingModal();

      dispatchConcordiumEvent({
        type: 'active-session-continue',
        source: 'desktop',
        modalType: 'returning-user',
      });
    } catch (error) {
      console.error('Failed to continue with existing session:', error);
    }
  });

  disconnectBtn?.addEventListener('click', async () => {

    // Disconnect all active sessions
    try {
      const { ServiceFactory } = await import('@/services');
      const walletConnectService = ServiceFactory.createWalletConnectService();
      await walletConnectService.disconnectAll();

      // Clear localStorage flags to reset state
      const { updateWalletFlags } = await import('@/utils/sessionDetection');
      updateWalletFlags();

      // Clear any stored session data
      localStorage.removeItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION
      );
      localStorage.removeItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED
      );
      localStorage.removeItem(
        ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED
      );


      // Navigate to landing modal
      const { showLandingModal } = await import('./landing');
      await showLandingModal();
      hideReturningUserModal();
    } catch (error) {
      console.error('Failed to disconnect sessions:', error);

      // Even if disconnect fails, clear flags and redirect
      try {
        localStorage.removeItem(
          ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION
        );
        localStorage.removeItem(
          ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED
        );
        localStorage.removeItem(
          ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED
        );
      } catch (storageError) {
        console.error('Failed to clear localStorage flags:', storageError);
      }

      // Still navigate to landing modal
      const { showLandingModal } = await import('./landing');
      await showLandingModal();
      hideReturningUserModal();
    }
  });

  return modalContainer.firstElementChild as HTMLElement;
};

export const showReturningUserModal: ShowModalFunction = async () => {
  const { getGlobalContainer } = await import('../../index');
  const targetContainer = getGlobalContainer();

  if (!targetContainer) {
    console.error('Container not found for modal');
    return;
  }

  // Find existing modal to crossfade
  const existingModal = targetContainer.querySelector(
    '.desktop--modal-overlay'
  ) as HTMLElement | null;

  const modal = createReturningUserModal();
  modal.id = 'returning-user-modal';

  // Get the modal container for transforms
  const modalContainer = modal.querySelector(
    '.desktop--modal-container'
  ) as HTMLElement;

  // For smooth transitions, prepare new modal completely before showing
  modal.style.opacity = '0';
  modalContainer.style.transform = 'translateY(-20px) scale(0.95)';
  modalContainer.style.transition = 'transform 0.3s ease-out';
  targetContainer.appendChild(modal);

  // Force a reflow to ensure the styles are applied
  modal.offsetHeight;

  // Now start the transition
  modal.style.transition = 'opacity 0.3s ease-out';

  // Use a small delay to ensure DOM is fully ready
  setTimeout(() => {
    // Start simultaneous crossfade
    if (existingModal) {
      const existingContainer = existingModal.querySelector(
        '.desktop--modal-container'
      ) as HTMLElement;
      existingModal.style.transition = 'opacity 0.3s ease-in';
      if (existingContainer) {
        existingContainer.style.transition = 'transform 0.3s ease-in';
        existingContainer.style.transform = 'translateY(-20px) scale(0.95)';
      }
      existingModal.style.opacity = '0';
      existingModal.style.pointerEvents = 'none';
      existingModal.style.zIndex = '9998';
    }

    // Show new modal
    modal.style.opacity = '1';
    modalContainer.style.transform = 'translateY(0) scale(1)';

    // Remove old modal after transition completes
    if (existingModal) {
      setTimeout(() => {
        if (existingModal.parentNode) {
          existingModal.parentNode.removeChild(existingModal);
        }
      }, 350);
    }
  }, 10);
};

export const hideReturningUserModal: HideModalFunction = () => {
  const modal = document.querySelector(
    '#returning-user-modal'
  ) as HTMLElement | null;
  if (modal) {
    // Add fade-out animation
    modal.classList.add('modal-exiting');

    // Remove after animation completes
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
};
