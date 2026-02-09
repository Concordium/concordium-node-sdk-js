import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import loadingVideo from '@/assets/Loading.mp4';
import successVideo from '@/assets/success.mp4';
import type { ShowModalFunction, HideModalFunction } from '@/types';

type ProcessingState = 'loading' | 'success';

// Global variables for modal state management following your pattern
let processingModalElement: HTMLElement | null = null;
let eventListenerCleanup: (() => void) | null = null;

export const createProcessingModal = (
  state: ProcessingState = 'loading'
): HTMLElement => {
  const processingHTML = `
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
                    ${
                      state === 'loading'
                        ? `<video autoplay loop muted playsinline class="max-w-full h-auto" style="max-height: 80px; object-fit: contain;">
                           <source src="${loadingVideo}" type="video/mp4" />
                         </video>`
                        : `<video autoplay loop muted playsinline class="max-w-full h-auto" style="max-height: 80px; object-fit: contain;">
                           <source src="${successVideo}" type="video/mp4" />
                         </video>`
                    }
                </div>

                <div class="flex flex-col items-center gap-2">
                    <p class="font-medium text-[20px] leading-[25px] tracking-[0.2px] font-jakarta" style="color: #0D0F11;">
                        ${
                          state === 'loading'
                            ? 'Verification in Progress'
                            : 'Success!'
                        }
                    </p>
                    <p class="font-normal text-[12px] leading-[19px] tracking-[0px] font-inter" style="color: #0D0F11;">
                        ${
                          state === 'loading'
                            ? 'Approve in your ConcordiumID App'
                            : 'Verification completed'
                        }
                    </p>
                </div>

                <div class="flex items-center justify-center gap-3 mt-3">
                    ${
                      state === 'loading'
                        ? `
                                <button disabled class="desktop--disabled-button" id="approve-btn">
                                    <span>Please wait</span>
                                </button>
                            `
                        : `
                                <button class="desktop--primary-button" id="close-btn">
                                    <span>Close</span>
                                </button>
                            `
                    }
                </div>
            </div>
        </div>
    </div>
`;

  // Create a container div
  const processingContainer = document.createElement('div');
  processingContainer.innerHTML = processingHTML;

  // Add event listeners
  const closeBtn = processingContainer.querySelector(
    '#close-btn'
  ) as HTMLButtonElement | null;

  closeBtn?.addEventListener('click', async () => {
    console.log('Close clicked');

    // Only dispatch event if this is a success state close
    if (state === 'success') {
      const { dispatchConcordiumEvent } = await import('../../index');
      dispatchConcordiumEvent({
        type: 'close',
        source: 'desktop',
        modalType: 'processing',
        data: {
          state: 'success',
          action: 'close',
        },
      });
    }

    // Always just hide the modal, don't navigate anywhere
    hideProcessingModal();
  });

  return processingContainer.firstElementChild as HTMLElement;
};

export const showProcessingModal: ShowModalFunction = async () => {
  // Check for active sessions before showing processing modal
  // Continue with normal processing modal flow

  const { getGlobalContainer } = await import('../../index');
  const targetContainer = getGlobalContainer();

  if (!targetContainer) {
    console.error('Container not found for processing modal');
    return;
  }

  // Find existing modal to crossfade
  const existingModal = targetContainer.querySelector(
    '.desktop--modal-overlay'
  ) as HTMLElement | null;

  // Create and store modal element reference
  processingModalElement = createProcessingModal('loading');
  processingModalElement.id = 'processing-modal';

  // Get the modal container for transforms
  const modalContainer = processingModalElement.querySelector(
    '.desktop--modal-container'
  ) as HTMLElement;

  // For smooth transitions, prepare new modal completely before showing
  processingModalElement.style.opacity = '0';
  modalContainer.style.transform = 'translateY(-20px) scale(0.95)';
  modalContainer.style.transition = 'transform 0.3s ease-out';
  targetContainer.appendChild(processingModalElement);

  // Force a reflow to ensure the styles are applied
  processingModalElement.offsetHeight;

  // Now start the transition
  processingModalElement.style.transition = 'opacity 0.3s ease-out';

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
    processingModalElement!.style.opacity = '1';
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

  // Dispatch initial event
  const { dispatchConcordiumEvent } = await import('../../index');
  dispatchConcordiumEvent({
    type: 'processing',
    source: 'desktop',
    modalType: 'processing',
    data: {
      state: 'loading',
      message: 'Verification in progress',
    },
  });

  // Listen for verification-completed event to show success state
  const handleVerificationCompleted = (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail?.type === 'verification-completed') {
      console.log('Verification completed event received:', customEvent.detail);
      // Show success state in processing modal
      showSuccessState();
    }
  };

  // Add event listener with the named function for proper cleanup
  window.addEventListener('concordium-event', handleVerificationCompleted);

  // Store cleanup function with the correct reference
  eventListenerCleanup = () => {
    window.removeEventListener('concordium-event', handleVerificationCompleted);
  };
};

export const hideProcessingModal: HideModalFunction = () => {
  if (processingModalElement) {
    // Add fade-out animation
    processingModalElement.classList.add('modal-exiting');

    // Remove from DOM after animation completes
    setTimeout(() => {
      const container = processingModalElement?.parentNode;
      if (container && processingModalElement) {
        container.removeChild(processingModalElement);
      }
      processingModalElement = null;

      // Ensure any leftover scan modals are also removed
      const leftoverScanModal = document.querySelector('#scan-modal');
      if (leftoverScanModal) {
        leftoverScanModal.remove();
      }
    }, 300);
  }

  // Clean up event listeners following your cleanup pattern
  if (eventListenerCleanup) {
    eventListenerCleanup();
    eventListenerCleanup = null;
  }
};

// Function to transition to success state following your commented pattern
export async function showSuccessState(): Promise<void> {
  const { getGlobalContainer } = await import('../../index');
  const targetContainer = getGlobalContainer();

  if (!targetContainer || !processingModalElement) {
    console.error('Container or modal element not found');
    return;
  }

  // Get current modal for crossfade
  const currentModal = processingModalElement;

  // Create and show success modal with crossfade
  const newModal = createProcessingModal('success');
  newModal.id = 'processing-modal';

  // Add new modal with entering class (starts hidden)
  newModal.classList.add('modal-entering');
  targetContainer.appendChild(newModal);

  // Use requestAnimationFrame to ensure DOM is ready
  requestAnimationFrame(() => {
    // Start crossfade: fade out old, fade in new simultaneously
    if (currentModal) {
      currentModal.classList.add('modal-exiting');
    }

    // Trigger animation by removing entering class and adding visible
    requestAnimationFrame(() => {
      newModal.classList.remove('modal-entering');
      newModal.classList.add('modal-visible');
    });
  });

  // Update reference
  processingModalElement = newModal;

  // Remove old modal after transition completes
  if (currentModal) {
    setTimeout(() => {
      if (currentModal.parentNode) {
        currentModal.parentNode.removeChild(currentModal);
      }
    }, 300);
  }

  // Dispatch success event
  const { dispatchConcordiumEvent } = await import('../../index');
  dispatchConcordiumEvent({
    type: 'success',
    source: 'desktop',
    modalType: 'processing',
    data: {
      state: 'success',
      message: 'Verification completed successfully',
    },
  });
}
