/**
 * Session detection utilities for Concordium wallet connections
 * Manages localStorage flags and wallet availability detection
 */
import { ModalConstants } from '@/constants/modal.constants';

/**
 * Checks if Concordium ID browser extension is installed
 */
export function isConcordiumIDInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    // Check if the Concordium ID extension has injected its API
    return !!(window as any).concordium || !!(window as any).ConcordiumProvider;
}

/**
 * Checks if Concordium mobile app is installed/accessible
 * Uses localStorage flags set by user interactions
 */
export function isAppInstalled(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        // Check localStorage flag - if explicitly marked as not installed, return false
        const appNotInstalled = localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED);
        if (appNotInstalled === 'true') {
            return false;
        }

        // If flag doesn't exist or is false, we consider app potentially available
        // This follows the pattern where flags are set to false by default in setDefaultFlags()
        return appNotInstalled === 'false' || appNotInstalled === null;
    } catch (e) {
        console.error('Error checking app installation status:', e);
        return false;
    }
}

/**
 * Checks if there's an active wallet session
 */
export function hasActiveWalletSession(): boolean {
    return isConcordiumIDInstalled() || isAppInstalled();
}

/**
 * Detects the user's preferred wallet type based on environment
 */
export function detectPreferredWallet(): 'browser' | 'mobile' | 'none' {
    if (isConcordiumIDInstalled()) {
        return 'browser';
    }

    if (isAppInstalled()) {
        return 'mobile';
    }

    return 'none';
}

/**
 * Updates localStorage flags based on current wallet detection state
 * Called during modal interactions to track user preferences
 */
export function updateWalletFlags(): void {
    try {
        const concordiumIDInstalled = isConcordiumIDInstalled();
        const appInstalled = isAppInstalled();

        // Update individual wallet flags
        localStorage.setItem(
            ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED,
            JSON.stringify(!concordiumIDInstalled)
        );
        localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED, JSON.stringify(!appInstalled));

        // Set onlyOneOption flag if only one wallet type is available
        const onlyOneOption = (concordiumIDInstalled && !appInstalled) || (!concordiumIDInstalled && appInstalled);
        localStorage.setItem(ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION, JSON.stringify(onlyOneOption));
    } catch (e) {
        console.error('Failed to update wallet flags:', e);
    }
}

/**
 * Reads AppState from localStorage flags
 * Used by modal components to determine UI state
 */
export function getAppState(): {
    onlyOneOption: boolean;
    appNotInstalled: boolean;
    concordiumIDNotInstalled: boolean;
} {
    try {
        return {
            onlyOneOption: JSON.parse(
                localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.ONLY_ONE_OPTION) || 'false'
            ),
            appNotInstalled: JSON.parse(
                localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.APP_NOT_INSTALLED) || 'false'
            ),
            concordiumIDNotInstalled: JSON.parse(
                localStorage.getItem(ModalConstants.LOCAL_STORAGE_FLAGS.CONCORDIUM_ID_NOT_INSTALLED) || 'false'
            ),
        };
    } catch (e) {
        console.error('Error reading app state from localStorage:', e);
        return {
            onlyOneOption: false,
            appNotInstalled: false,
            concordiumIDNotInstalled: false,
        };
    }
}
