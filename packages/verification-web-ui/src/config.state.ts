// Configuration state management
// Moved from index.ts to avoid circular dependencies

export interface ConcordiumEventData {
    type:
        | 'close'
        | 'success'
        | 'error'
        | 'qr-scan'
        | 'processing'
        | 'landing'
        | 'scan'
        | 'returning-user'
        | 'active-session-continue'
        | 'session-deleted'
        | 'session-approved'
        | 'session-rejected'
        | 'session-event'
        | 'verification-completed'
        | 'verification-failed'
        | 'session-approval-failed'
        | 'qr-code-expired'
        | 'qr-code-refreshed'
        | 'repeat-verification';
    source: 'desktop' | 'mobile';
    modalType: 'processing' | 'landing' | 'scan' | 'returning-user';
    timestamp: number;
    data?: any;
}

export type ConcordiumEventCallback = (event: ConcordiumEventData) => void;

// Configuration interface
export interface ConcordiumConfig {
    network?: 'mainnet' | 'testnet';
    mobileBreakpoint?: number;
    autoDetectMobile?: boolean;
    defaultContainer?: string | HTMLElement;
    // WalletConnect configuration - can be set at top level or nested
    projectId?: string; // Top-level shorthand for walletConnect.projectId
    metadata?: {
        name?: string;
        description?: string;
        url?: string;
        icons?: string[];
    };
    // Legacy nested format (still supported)
    walletConnect?: {
        projectId: string;
        metadata?: {
            name?: string;
            description?: string;
            url?: string;
            icons?: string[];
        };
    };
    // QR Code configuration
    qrCode?: {
        // How long before QR code expires (in milliseconds), default 5 minutes
        expiryDuration?: number;
        // Whether to auto-refresh SDK-generated QR codes, default true
        autoRefresh?: boolean;
        // Show countdown timer on QR code, default true
        showCountdown?: boolean;
    };
    // Event handling
    onEvent?: ConcordiumEventCallback;
    onClose?: (data: ConcordiumEventData) => void;
    onSuccess?: (data: ConcordiumEventData) => void;
    onError?: (data: ConcordiumEventData) => void;
    onQrScanned?: (data: ConcordiumEventData) => void;
    onQRCodeExpired?: (data: ConcordiumEventData) => void;
    onQRCodeRefreshed?: (data: ConcordiumEventData) => void;
}

// Global configuration
let globalConfig: ConcordiumConfig = {
    network: (import.meta as any).env?.VITE_NETWORK,
    mobileBreakpoint: 768,
    autoDetectMobile: true,
    defaultContainer: '#app',
    qrCode: {
        expiryDuration: 5 * 60 * 1000, // 5 minutes default
        autoRefresh: true,
        showCountdown: true,
    },
};

// Event dispatch utility
export function dispatchConcordiumEvent(eventData: Omit<ConcordiumEventData, 'timestamp'>): void {
    const fullEventData: ConcordiumEventData = {
        ...eventData,
        timestamp: Date.now(),
    };

    // Call specific callbacks if configured
    if (globalConfig.onEvent) {
        globalConfig.onEvent(fullEventData);
    }

    // Call type-specific callbacks
    switch (eventData.type) {
        case 'close':
            globalConfig.onClose?.(fullEventData);
            break;
        case 'success':
            globalConfig.onSuccess?.(fullEventData);
            break;
        case 'error':
            globalConfig.onError?.(fullEventData);
            break;
        case 'qr-scan':
            globalConfig.onQrScanned?.(fullEventData);
            break;
        case 'qr-code-expired':
            globalConfig.onQRCodeExpired?.(fullEventData);
            break;
        case 'qr-code-refreshed':
            globalConfig.onQRCodeRefreshed?.(fullEventData);
            break;
    }

    // Dispatch custom DOM event for maximum compatibility
    if (typeof window !== 'undefined' && window.dispatchEvent) {
        const customEvent = new CustomEvent('concordium-event', {
            detail: fullEventData,
            bubbles: true,
            cancelable: true,
        });
        window.dispatchEvent(customEvent);
    }
}

// Configuration functions
export function setConfig(config: Partial<ConcordiumConfig>): void {
    globalConfig = { ...globalConfig, ...config };
    // Update global variables if needed
    if (typeof window !== 'undefined') {
        (window as any).__CONCORDIUM_SDK_NETWORK__ = globalConfig.network;
    }
}

export function getConfig(): ConcordiumConfig {
    return { ...globalConfig };
}

// Utility function to get the current container from global config
export function getGlobalContainer(): HTMLElement | null {
    return resolveContainer();
}

// Utility function to detect mobile
export function isMobileScreen(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < (globalConfig.mobileBreakpoint || 768);
}

// Utility function to resolve container element
export function resolveContainer(container?: string | HTMLElement): HTMLElement | null {
    if (typeof window === 'undefined') return null;

    if (container) {
        if (typeof container === 'string') {
            let element = document.querySelector(container) as HTMLElement | null;
            // If not found, try common React root selectors as fallbacks
            if (!element && container === '#root') {
                element = (document.querySelector('#root') ||
                    document.querySelector('[id="root"]') ||
                    document.querySelector('.react-root') ||
                    document.querySelector('#app') ||
                    document.body) as HTMLElement | null;
            }
            return element;
        }
        return container;
    }

    // Use default container from config
    const defaultContainer = globalConfig.defaultContainer;
    if (typeof defaultContainer === 'string') {
        let element = document.querySelector(defaultContainer) as HTMLElement | null;
        // Fallback to common selectors if default not found
        if (!element) {
            element = (document.querySelector('#root') ||
                document.querySelector('#app') ||
                document.querySelector('[id="root"]') ||
                document.body) as HTMLElement | null;
        }
        return element;
    }
    return defaultContainer || document.body;
}
