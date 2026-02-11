import arrowRight from '@/assets/arrow-right.svg';
import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import modalGraphic from '@/assets/modal-graphic.svg';
import sectionSeparator from '@/assets/section-separator.svg';
import { getConfig, getGlobalContainer } from '@/index';
import type { HideModalFunction, ModalFunction, ShowModalFunction } from '@/types';

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
              <span>Start private verification</span>
              <img src="${arrowRight}" alt="arrow-right-icon" />
            </button>
          </div>
          <img src="${sectionSeparator}" alt="" class="mx-auto" />
          <div class="flex items-center justify-center">
            <p class="desktop--download-text">Download & Install the <a href="#">Concordium ID App</a> and come back here to verify.</p>
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
        const { showScanModal } = await import('./scan');
        const { hideLandingModal } = await import('./landing');
        hideLandingModal();
        await showScanModal();
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
        console.error('Container not found for modal');
        console.error(`Container not found for Concordium modal. Tried: ${getConfig().defaultContainer}`);
        console.error('Available elements:', {
            root: document.querySelector('#root'),
            app: document.querySelector('#app'),
            body: document.body,
        });
        return;
    }

    // Prevent horizontal scrolling on body
    document.body.style.overflowX = 'hidden';

    // Find existing modal to crossfade
    const existingModal = targetContainer.querySelector('.desktop--modal-overlay') as HTMLElement | null;

    const landing = createLandingModal();
    landing.id = 'landing-modal';

    // Get the modal container for transforms
    const modalContainer = landing.querySelector('.desktop--modal-container') as HTMLElement;

    // For smooth transitions, prepare new modal completely before showing
    landing.style.opacity = '0';
    modalContainer.style.transform = 'translateY(-20px) scale(0.95)';
    modalContainer.style.transition = 'transform 0.3s ease-out';
    targetContainer.appendChild(landing);

    // Force a reflow to ensure the styles are applied
    landing.offsetHeight;

    // Now start the transition
    landing.style.transition = 'opacity 0.3s ease-out';

    // Use a small delay to ensure DOM is fully ready
    setTimeout(() => {
        // Start simultaneous crossfade
        if (existingModal) {
            const existingContainer = existingModal.querySelector('.desktop--modal-container') as HTMLElement;
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
        landing.style.opacity = '1';
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
