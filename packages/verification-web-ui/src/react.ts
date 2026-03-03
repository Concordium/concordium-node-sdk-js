// React-specific entry point for Merchant SDK
// Import main function from index and set default container for React
import {
    ConcordiumConfig,
    getConfig as baseGetConfig,
    initConcordiumModal as baseInit,
    setConfig as baseSetConfig,
} from './index';
import './styles/index.css';

// Export all types
export * from './types';

// Re-export SDK class and other non-overridden exports
export { ConcordiumVerificationWebUI, getGlobalContainer } from './index';

// React wrapper with default container
export async function initConcordiumModal(config?: Partial<ConcordiumConfig>): Promise<void> {
    const fullConfig = {
        ...config,
        defaultContainer: config?.defaultContainer || '#root',
    };
    return baseInit(fullConfig);
}

// React wrapper for setConfig with default container
export function setConfig(config: Partial<ConcordiumConfig>): void {
    const fullConfig = {
        ...config,
        defaultContainer: config.defaultContainer || '#root',
    };
    return baseSetConfig(fullConfig);
}

// React wrapper for getConfig
export function getConfig(): ConcordiumConfig {
    return baseGetConfig();
}

// Export default for React
export default {
    init: initConcordiumModal,
    setConfig,
    getConfig,
};
