// Vue-specific entry point for Merchant SDK
// Import main function from index and set default container for Vue
import {
    ConcordiumConfig,
    getConfig as baseGetConfig,
    initConcordiumModal as baseInit,
    setConfig as baseSetConfig,
    getGlobalContainer,
} from './index';
import './styles/index.css';

// Export all types
export * from './types';
export * from './index';

// Export getGlobalContainer for direct access
export { getGlobalContainer };

// Vue wrapper with default container
export async function initConcordiumModal(config?: Partial<ConcordiumConfig>): Promise<void> {
    const fullConfig = {
        ...config,
        defaultContainer: config?.defaultContainer || '#app',
    };
    return baseInit(fullConfig);
}

// Vue wrapper for setConfig with default container
export function setConfig(config: Partial<ConcordiumConfig>): void {
    const fullConfig = {
        ...config,
        defaultContainer: config.defaultContainer || '#app',
    };
    return baseSetConfig(fullConfig);
}

// Vue wrapper for getConfig
export function getConfig(): ConcordiumConfig {
    return baseGetConfig();
}

// Export default for Vue
export default {
    init: initConcordiumModal,
    setConfig,
    getConfig,
};
