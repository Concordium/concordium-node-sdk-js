import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import loadingVideo from '@/assets/loading.mp4';
import modalGraphicDelete from '@/assets/modal-graphic-delete.svg';
import modalGraphicSuccess from '@/assets/modal-graphic-success.svg';
import { ModalConstants } from '@/constants/modal.constants';
import type { HideModalFunction, ShowModalFunction } from '@/types';

type ProcessingState = 'loading' | 'success' | 'error';

// Global variables for modal state management following your pattern
let processingModalElement: HTMLElement | null = null;
let eventListenerCleanup: (() => void) | null = null;

/**
 * Get the connected wallet name from localStorage, with fallback
 */
function getConnectedWalletName(): string {
    return localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME) || 'Wallet';
}

export const createProcessingModal = (state: ProcessingState = 'loading'): HTMLElement => {
    const walletName = getConnectedWalletName();

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
                            : state === 'success'
                              ? `<img src="${modalGraphicSuccess}" alt="success-graphic" class="max-w-full h-auto" style="max-height: 80px; object-fit: contain;" />`
                              : `<img src="${modalGraphicDelete}" alt="error-graphic" class="max-w-full h-auto" style="max-height: 80px; object-fit: contain;" />`
                    }
                </div>

                <div class="flex flex-col items-center gap-2">
                    <p class="font-medium text-[20px] leading-[25px] tracking-[0.2px] font-jakarta" style="color: #0D0F11;">
                        ${
                            state === 'loading'
                                ? 'Verification in Progress'
                                : state === 'success'
                                  ? 'Success!'
                                  : 'Verification Failed!'
                        }
                    </p>
                    <p class="desktop--processing-text">
                        ${
                            state === 'loading'
                                ? `Approve in your ${walletName}`
                                : state === 'success'
                                  ? 'Verification completed'
                                  : 'Something went wrong with your verification. Please repeat the process'
                        }
                    </p>
                </div>

                <div class="flex items-center justify-center gap-3 mt-3">
                    ${
                        state === 'loading'
                            ? `<button disabled class="desktop--disabled-button" id="approve-btn">
                               <span>Please wait</span>
                           </button>`
                            : state === 'success'
                              ? `<button class="desktop--primary-button" id="close-btn">
                               <span>Continue to site</span>
                           </button>`
                              : `<button class="desktop--primary-button" id="repeat-btn" style="background-color: #0D0F11;">
                               <span>Try again</span>
                           </button>`
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
    const closeBtn = processingContainer.querySelector('#close-btn') as HTMLButtonElement | null;

    closeBtn?.addEventListener('click', async () => {
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

    // Add event listener for repeat verification button (error state)
    const repeatBtn = processingContainer.querySelector('#repeat-btn') as HTMLButtonElement | null;

    repeatBtn?.addEventListener('click', async () => {
        const { dispatchConcordiumEvent } = await import('../../index');
        dispatchConcordiumEvent({
            type: 'repeat-verification',
            source: 'desktop',
            modalType: 'processing',
            data: {
                state: 'error',
                action: 'repeat',
            },
        });

        // Hide error modal and show landing modal to restart
        hideProcessingModal();
        const { showLandingModal } = await import('./landing');
        await showLandingModal();
    });

    return processingContainer.firstElementChild as HTMLElement;
};

export const showProcessingModal: ShowModalFunction = async () => {
    // Check for active sessions before showing processing modal
    // Continue with normal processing modal flow

    const { getGlobalContainer } = await import('../../index');
    const targetContainer = getGlobalContainer();

    if (!targetContainer) {
        return;
    }

    // Find existing modal to crossfade
    const existingModal = targetContainer.querySelector('.desktop--modal-overlay') as HTMLElement | null;

    // Create and store modal element reference
    processingModalElement = createProcessingModal('loading');
    processingModalElement.id = 'processing-modal';

    // For smooth transitions, start with modal-entering then transition to modal-visible
    processingModalElement.classList.add('modal-entering');
    targetContainer.appendChild(processingModalElement);

    // Force a reflow to ensure the initial hidden state is applied
    processingModalElement.offsetHeight;

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
        processingModalElement!.classList.remove('modal-entering');
        processingModalElement!.classList.add('modal-visible');
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

/**
 * Shows the error state in the processing modal.
 * This function can be called by merchants to display an error state
 * when verification fails or encounters an issue.
 */
export async function showErrorState(): Promise<void> {
    const { getGlobalContainer } = await import('../../index');
    const targetContainer = getGlobalContainer();

    if (!targetContainer) {
        return;
    }

    // Get current modal for crossfade (if exists)
    const currentModal = processingModalElement;

    // Create and show error modal with crossfade
    const newModal = createProcessingModal('error');
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

    // Dispatch error event
    const { dispatchConcordiumEvent } = await import('../../index');
    dispatchConcordiumEvent({
        type: 'error',
        source: 'desktop',
        modalType: 'processing',
        data: {
            state: 'error',
            message: 'Verification failed',
        },
    });
}
