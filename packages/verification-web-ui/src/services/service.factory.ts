import { getConfig } from '@/config.state';
import { WalletConnectConstants } from '@/constants';

import { WalletConnectService } from './walletconnect.service';

export class ServiceFactory {
    private static walletConnectService: WalletConnectService | null = null;

    static createWalletConnectService(): WalletConnectService {
        if (!this.walletConnectService) {
            // Check if SDK-managed config is available (set by initWalletConnect)
            const sdkConfig = (window as any).__CONCORDIUM_WC_CONFIG__;

            if (sdkConfig?.projectId) {
                // Use SDK-provided configuration
                const metadata = sdkConfig.metadata || {};
                const defaultMetadata = WalletConnectConstants.getDefaultMetadata();
                this.walletConnectService = new WalletConnectService({
                    projectId: sdkConfig.projectId,
                    metadata: {
                        name: metadata.name || defaultMetadata.name,
                        description: metadata.description || defaultMetadata.description,
                        url: metadata.url || defaultMetadata.url,
                        icons: metadata.icons || defaultMetadata.icons,
                    },
                });
            } else {
                // Fall back to global config (for backward compatibility)
                const globalConfig = getConfig();

                if (!globalConfig.walletConnect?.projectId) {
                    throw new Error(
                        'WalletConnect configuration not found. Please call setConfig() with walletConnect options or use initWalletConnect().'
                    );
                }

                this.walletConnectService = new WalletConnectService({
                    projectId: globalConfig.walletConnect.projectId,
                    metadata: {
                        name: globalConfig.walletConnect.metadata?.name || 'Concordium Verification WebUI',
                        description: globalConfig.walletConnect.metadata?.description || 'Concordium wallet connection',
                        url: globalConfig.walletConnect.metadata?.url || window.location.origin,
                        icons: globalConfig.walletConnect.metadata?.icons || [],
                    },
                });
            }
        }
        return this.walletConnectService;
    }

    static resetServices(): void {
        this.walletConnectService = null;
    }

    static getWalletConnectService(): WalletConnectService | null {
        return this.walletConnectService;
    }

    static async initializeAll(): Promise<{
        walletConnectService: WalletConnectService;
    }> {
        const walletConnectService = this.createWalletConnectService();

        await walletConnectService.initialize();

        return { walletConnectService };
    }
}
