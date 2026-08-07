import concordiumModalLogo from '@/assets/concordium-modal-logo.svg';
import loadingVideo from '@/assets/loading.mp4';
import modalGraphicDelete from '@/assets/modal-graphic-delete.svg';
import modalGraphicSuccess from '@/assets/modal-graphic-success.svg';
import { ModalConstants } from '@/constants/modal.constants';
import type { HideModalFunction, ShowModalFunction } from '@/types';

type ProcessingState = 'loading' | 'success' | 'error';

export type ProcessingCopy = {
    title?: string;
    message?: string;
    buttonLabel?: string;
};

// Global variables for modal state management following your pattern
let processingModalElement: HTMLElement | null = null;
let eventListenerCleanup: (() => void) | null = null;
let currentProcessingState: ProcessingState | null = null;
let successShown = false;

/**
 * Get the connected wallet name from localStorage, with fallback
 */
function getConnectedWalletName(): string {
    return localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONNECTED_WALLET_NAME) || 'Wallet';
}

function resolveLoadingCopy(copy?: ProcessingCopy): { title: string; message: string; buttonLabel: string } {
    return {
        title: copy?.title || 'Verification in Progress',
        message: copy?.message || `Approve in your ${getConnectedWalletName()}`,
        buttonLabel: copy?.buttonLabel || 'Please wait',
    };
}

export const createProcessingModal = (
    state: ProcessingState = 'loading',
    copy?: ProcessingCopy
): HTMLElement => {
    const loading = resolveLoadingCopy(copy);

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
                                ? loading.title
                                : state === 'success'
                                  ? 'Success!'
                                  : 'Verification Failed!'
                        }
                    </p>
                    <p class="desktop--processing-text">
                        ${
                            state === 'loading'
                                ? loading.message
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
                               <span>${loading.buttonLabel}</span>
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

async function mountProcessingModal(state: ProcessingState, copy?: ProcessingCopy, eventMessage?: string): Promise<void> {
    const { getGlobalContainer } = await import('../../index');
    const targetContainer = getGlobalContainer();

    if (!targetContainer) {
        return;
    }

    if (state === 'loading') {
        successShown = false;
    }

    // Avoid remount flicker when already on success
    if (state === 'success' && successShown && processingModalElement) {
        return;
    }

    const existingModal =
        processingModalElement ||
        (targetContainer.querySelector('.desktop--modal-overlay') as HTMLElement | null);

    const newModal = createProcessingModal(state, copy);
    newModal.id = 'processing-modal';
    newModal.classList.add('modal-entering');
    targetContainer.appendChild(newModal);

    requestAnimationFrame(() => {
        if (existingModal && existingModal !== newModal) {
            existingModal.classList.add('modal-exiting');
            setTimeout(() => existingModal.parentNode?.removeChild(existingModal), 350);
        }
        requestAnimationFrame(() => {
            newModal.classList.remove('modal-entering');
            newModal.classList.add('modal-visible');
        });
    });

    processingModalElement = newModal;
    currentProcessingState = state;

    const { dispatchConcordiumEvent } = await import('../../index');
    dispatchConcordiumEvent({
        type: state === 'loading' ? 'processing' : state === 'success' ? 'success' : 'error',
        source: 'desktop',
        modalType: 'processing',
        data: {
            state,
            message: eventMessage || copy?.message || resolveLoadingCopy(copy).message,
        },
    });
}

export const showProcessingModal: ShowModalFunction = async () => {
    successShown = false;
    await mountProcessingModal('loading');

    // Listen for verification-completed event to show success state (once)
    const handleVerificationCompleted = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.type === 'verification-completed' && !successShown) {
            void showSuccessState();
        }
    };

    window.addEventListener('concordium-event', handleVerificationCompleted);

    if (eventListenerCleanup) {
        eventListenerCleanup();
    }
    eventListenerCleanup = () => {
        window.removeEventListener('concordium-event', handleVerificationCompleted);
    };
};

/** No app installed — redirecting user to store (or TestFlight in beta test mode). */
export async function showStoreRedirectState(): Promise<void> {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const { isTestFlightMode } = await import('@/constants/wallet.registry');
    const storeName = isIOS ? (isTestFlightMode() ? 'TestFlight' : 'App Store') : 'Play Store';
    console.log('[verification-web-ui] Showing store redirect loading state', { storeName });
    await mountProcessingModal(
        'loading',
        {
            title: 'Opening store…',
            message: `Concordium ID is not installed. Redirecting you to the ${storeName} to download it.`,
            buttonLabel: 'Please wait',
        },
        `Redirecting to ${storeName}`
    );
}

/** After store open — wait while user installs, creates identity, then pairs. */
export async function showWaitingForPairingState(): Promise<void> {
    console.log('[verification-web-ui] Showing waiting-for-pairing loading state');
    await mountProcessingModal(
        'loading',
        {
            title: 'Waiting for pairing…',
            message:
                'Install Concordium ID (TestFlight for beta testers), create your account and identity, then return here. We will continue automatically when pairing starts.',
            buttonLabel: 'Waiting…',
        },
        'Waiting for pairing'
    );

    // When the wallet pairs, upgrade copy to Verification in Progress.
    void watchForSessionThenShowVerificationProgress();
}

/**
 * App already opened / pairing in flight — show Verification in Progress immediately.
 */
export async function showVerificationInProgressState(): Promise<void> {
    console.log('[verification-web-ui] Showing verification-in-progress loading state');
    await showProcessingModal();
}

async function watchForSessionThenShowVerificationProgress(): Promise<void> {
    const started = Date.now();
    const timeoutMs = 5 * 60 * 1000;

    while (Date.now() - started < timeoutMs) {
        try {
            const { ServiceFactory } = await import('@/services');
            const wcService =
                ServiceFactory.getWalletConnectService() || ServiceFactory.createWalletConnectService();
            await wcService.initialize();
            const sessions = wcService.getActiveSessions();
            if (sessions.length > 0) {
                console.log(
                    '[verification-web-ui] Active WC session detected — switching to Verification in Progress'
                );
                await showProcessingModal();
                return;
            }
        } catch {
            /* keep waiting */
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
    }
}

export const hideProcessingModal: HideModalFunction = () => {
    successShown = false;
    currentProcessingState = null;
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
    // Prevent flicker from multiple callers (scan + merchant poll + event loop).
    if (successShown && currentProcessingState === 'success' && processingModalElement) {
        console.log('[verification-web-ui] Success modal already visible — skip remount');
        return;
    }
    successShown = true;
    currentProcessingState = 'success';

    const { getGlobalContainer } = await import('../../index');
    const targetContainer = getGlobalContainer();

    if (!targetContainer) {
        console.warn('[verification-web-ui] showSuccessState: no container');
        successShown = false;
        return;
    }

    const currentModal = processingModalElement;

    // Create and show success modal (works even if processing modal was closed)
    const newModal = createProcessingModal('success');
    newModal.id = 'processing-modal';
    newModal.classList.add('modal-entering');
    targetContainer.appendChild(newModal);

    requestAnimationFrame(() => {
        if (currentModal && currentModal !== newModal) {
            currentModal.classList.add('modal-exiting');
        }
        requestAnimationFrame(() => {
            newModal.classList.remove('modal-entering');
            newModal.classList.add('modal-visible');
        });
    });

    processingModalElement = newModal;

    if (currentModal && currentModal !== newModal) {
        setTimeout(() => {
            if (currentModal.parentNode) {
                currentModal.parentNode.removeChild(currentModal);
            }
        }, 300);
    }

    // Remove leftover non-processing overlays without remounting success again
    targetContainer.querySelectorAll('.desktop--modal-overlay').forEach((el) => {
        if (el !== newModal) {
            el.classList.add('modal-exiting');
            setTimeout(() => el.parentNode?.removeChild(el), 300);
        }
    });

    console.log('[verification-web-ui] Showing Verification Success modal');

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

    // Do NOT dispatch verification-completed here — that re-enters showSuccessState via listener.

    window.dispatchEvent(
        new CustomEvent('verification-web-ui-event', {
            detail: {
                type: 'verification_success',
                data: { message: 'Verification completed successfully' },
            },
            bubbles: true,
            composed: true,
        })
    );
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
