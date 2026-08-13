// Library entry point for npm package
// Import ServiceFactory for service management
import { ServiceFactory } from '@/services';

import { type ConcordiumConfig, getConfig, resolveContainer, setConfig } from './config.state';
import { ModalConstants } from './constants/modal.constants';
import { getQrRedirectUri } from './constants/wallet.registry';
import './styles/index.css';

// Export SDK class
export { ConcordiumVerificationWebUI, sdk } from './sdk';

// Export types
export * from './types';

// Event types for consumer callbacks
// Export configuration and state
export * from './config.state';

// Configuration functions

let qrRedirectHandled = false;
let qrRedirectHandlingPromise: Promise<boolean> | null = null;

async function tryHandleQrRedirectOnBootstrap(): Promise<boolean> {
    if (qrRedirectHandled) {
        return true;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return false;
    }

    if (qrRedirectHandlingPromise) {
        return qrRedirectHandlingPromise;
    }

    qrRedirectHandlingPromise = (async () => {
        const redirectUri = getQrRedirectUri();
        if (!redirectUri) {
            return false;
        }

        const { handleQrRedirectOnLoad } = await import('./components/desktop/wallet-selection');
        await handleQrRedirectOnLoad();
        qrRedirectHandled = true;
        return true;
    })();

    try {
        return await qrRedirectHandlingPromise;
    } finally {
        qrRedirectHandlingPromise = null;
    }
}

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
    } catch {
        // Ignore localStorage errors
    }
}

async function hasReusableWalletConnectSession(): Promise<boolean> {
    try {
        const walletConnectService = ServiceFactory.createWalletConnectService();
        await walletConnectService.initialize();
        return walletConnectService.getActiveSessions().length > 0;
    } catch {
        return false;
    }
}

// Auto-initialization function
export async function initConcordiumModal(config?: Partial<ConcordiumConfig>): Promise<void> {
    setDefaultFlags();
    if (config) {
        setConfig(config);
    }

    if (await tryHandleQrRedirectOnBootstrap()) {
        return; // Don't show modal, wallet app will handle it
    }

    // Ensure DOM is ready before resolving container
    if (document.readyState === 'loading') {
        await new Promise((resolve) => {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        });
    }

    // Resolve container with retries
    let targetContainer = resolveContainer();

    // If still not found, wait a bit and try again (for React apps that might still be mounting)
    if (!targetContainer) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        targetContainer = resolveContainer();
    }

    if (!targetContainer) {
        return;
    }

    const hasActiveSession = await hasReusableWalletConnectSession();

    if (hasActiveSession) {
        // If there's an active session, show the returning user modal directly
        const { showReturningUserModal } = await import('./components/desktop/returning-user');
        showReturningUserModal();
    } else {
        // For new users, show the landing modal
        const { showLandingModal } = await import('./components/desktop/landing');
        showLandingModal();
    }
}

// Add cleanup function for services
export function resetSDK(): void {
    ServiceFactory.resetServices();

    // Clear any localStorage flags
    Object.values(ModalConstants.LOCAL_STORAGE_FLAGS).forEach((flag) => {
        return localStorage.removeItem(flag as string);
    });
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    void tryHandleQrRedirectOnBootstrap().catch(() => {});
}

// Default export for convenience
export default {
    init: initConcordiumModal,
    setConfig,
    getConfig,
};
