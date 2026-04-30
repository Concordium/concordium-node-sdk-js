import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import modalGraphicSuccess from '@/assets/modal-graphic-success.svg';
import { ModalConstants } from '@/constants/modal.constants';
import type { HideModalFunction, ModalFunction, ShowModalFunction } from '@/types';

import { dispatchConcordiumEvent } from '../../index';

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

    const continueBtn = modalContainer.querySelector('#continue-btn') as HTMLButtonElement | null;
    const disconnectBtn = modalContainer.querySelector('#disconnect-btn') as HTMLButtonElement | null;

    continueBtn?.addEventListener('click', async () => {
        // Get active session from WalletConnect service
        const { ServiceFactory } = await import('@/services');
        const walletConnectService = ServiceFactory.createWalletConnectService();
        await walletConnectService.initialize();
        // Get the most recent session (sorted by expiry - most recent first)
        const activeSessionData = walletConnectService.getMostRecentSession();

        // Check if session exists
        if (!activeSessionData) {
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
            localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.ACTIVE_SESSION, JSON.stringify(true));
            hideReturningUserModal();
            const { showProcessingModal } = await import('./processing');
            await showProcessingModal();

            dispatchConcordiumEvent({
                type: 'active-session-continue',
                source: 'desktop',
                modalType: 'returning-user',
            });

            // Auto-send presentation request if configured
            const { autoSendPresentationRequestIfConfigured } = await import('./scan');
            await autoSendPresentationRequestIfConfigured(topic);
        } catch {
            // Session continuation failed
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
            localStorage.removeItem(ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION);
            localStorage.removeItem(ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED);
            localStorage.removeItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED);

            // Navigate to landing modal
            const { showLandingModal } = await import('./landing');
            await showLandingModal();
            hideReturningUserModal();
        } catch {
            // Even if disconnect fails, clear flags and redirect
            try {
                localStorage.removeItem(ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION);
                localStorage.removeItem(ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED);
                localStorage.removeItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED);
            } catch {
                // Ignore localStorage errors
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
        return;
    }

    // Find existing modal to crossfade
    const existingModal = targetContainer.querySelector('.desktop--modal-overlay') as HTMLElement | null;

    const modal = createReturningUserModal();
    modal.id = 'returning-user-modal';

    // For smooth transitions, start with modal-entering then transition to modal-visible
    modal.classList.add('modal-entering');
    targetContainer.appendChild(modal);

    // Force a reflow to ensure the initial hidden state is applied
    modal.offsetHeight;

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
        modal.classList.remove('modal-entering');
        modal.classList.add('modal-visible');
    }, 10);
};

export const hideReturningUserModal: HideModalFunction = () => {
    const modal = document.querySelector('#returning-user-modal') as HTMLElement | null;
    if (modal) {
        // Add fade-out animation
        modal.classList.add('modal-exiting');

        // Remove after animation completes
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};
