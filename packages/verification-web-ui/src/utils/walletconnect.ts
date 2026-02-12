// WalletConnect initialization and configuration
import { SignClient } from '@walletconnect/sign-client';
import type { ISignClient, SessionTypes } from '@walletconnect/types';

// WalletConnect configuration interface
export interface WalletConnectConfig {
    projectId: string;
    metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
    };
    relayUrl?: string;
}

// Default configuration
const DEFAULT_CONFIG: WalletConnectConfig = {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    metadata: {
        name: 'Concordium Verification WebUI',
        description: 'Concordium wallet integration for merchants',
        url: window.location.origin,
        icons: ['@/assets/concordium-wallet-icon.svg'],
    },
    relayUrl: 'wss://relay.walletconnect.com',
};

// Global WalletConnect client instance
let signClient: ISignClient | null = null;

/**
 * Initialize WalletConnect SignClient
 * @param config WalletConnect configuration
 * @returns Promise<SignClient>
 */
export async function initializeWalletConnect(config?: Partial<WalletConnectConfig>): Promise<ISignClient> {
    if (signClient) {
        return signClient;
    }

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    if (!finalConfig.projectId) {
        throw new Error('WalletConnect projectId is required. Get one from https://cloud.walletconnect.com');
    }

    // Warn about test/development project IDs
    if (finalConfig.projectId.includes('test') || finalConfig.projectId.includes('development')) {
        console.warn(
            '🚨 Using test/development WalletConnect project ID. This may not work properly. Get a real project ID from https://cloud.walletconnect.com'
        );
    }

    try {
        signClient = await SignClient.init({
            projectId: finalConfig.projectId,
            metadata: finalConfig.metadata,
            relayUrl: finalConfig.relayUrl,
        });

        return signClient;
    } catch (error) {
        console.error('Failed to initialize WalletConnect:', error);
        if (
            (error instanceof Error && error.message?.includes('projectId')) ||
            finalConfig.projectId.includes('test')
        ) {
            throw new Error(
                'WalletConnect initialization failed. Please ensure you have a valid project ID from https://cloud.walletconnect.com'
            );
        }
        throw error;
    }
}

/**
 * Get the current SignClient instance
 * @returns ISignClient | null
 */
export function getSignClient(): ISignClient | null {
    return signClient;
}

/**
 * Handle session approval and return the session
 * @param approval Promise that resolves to session when user approves
 * @returns Promise<SessionTypes.Struct>
 */
export async function handleSessionApproval(approval: Promise<SessionTypes.Struct>): Promise<SessionTypes.Struct> {
    try {
        const session = await approval;
        return session;
    } catch (error) {
        console.error('Failed to get session approval:', error);
        throw error;
    }
}

/**
 * Connect to a wallet using WalletConnect
 * @param namespaces Required namespaces for the session
 * @returns Promise<{ uri: string; approval: Promise<SessionTypes.Struct> }>
 */
export async function connectWallet(namespaces: Record<string, any>) {
    if (!signClient) {
        throw new Error('WalletConnect not initialized. Call initializeWalletConnect() first.');
    }

    try {
        const { uri, approval } = await signClient.connect({
            requiredNamespaces: namespaces,
        });
        return { uri, approval };
    } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
    }
}

/**
 * Disconnect from all sessions
 */
export async function disconnectAll(): Promise<void> {
    if (!signClient) {
        return;
    }

    try {
        const sessions = signClient.session.getAll();
        const disconnectPromises = sessions.map((session) =>
            signClient!.disconnect({
                topic: session.topic,
                reason: {
                    code: 6000,
                    message: 'User disconnected',
                },
            })
        );

        await Promise.all(disconnectPromises);
    } catch (error) {
        console.error('Failed to disconnect:', error);
        throw error;
    }
}

/**
 * Get active sessions
 * @returns SessionTypes.Struct[]
 */
export function getActiveSessions(): SessionTypes.Struct[] {
    if (!signClient) {
        return [];
    }

    return signClient.session.getAll();
}

/**
 * Generate QR code URI for wallet connection
 * @param namespaces Required namespaces
 * @returns Promise<string> - The URI for QR code display
 */
export async function generateConnectionUri(namespaces: Record<string, any>): Promise<string> {
    const { uri } = await connectWallet(namespaces);

    if (!uri) {
        throw new Error('Failed to generate connection URI');
    }

    return uri;
}

// Concordium-specific namespace configuration
// Get the network-specific chain ID
export function getChainId(): string[] {
    const network = import.meta.env.VITE_NETWORK;

    if (network === 'testnet') {
        return [import.meta.env.VITE_CHAIN_ID_TESTNET || 'ccd:4221332d34e1694168c2a0c0b3fd0f27']; // Testnet chain
    } else {
        return [import.meta.env.VITE_CHAIN_ID_MAINNET || 'ccd:9dd9ca4d19e9393877d2c44b70f89acb']; // Mainnet chain
    }
}

export const NAMESPACE = {
    ccd: {
        methods: ['sign_and_send_transaction', 'sign_message', 'request_verifiable_presentation_v1'],
        chains: getChainId(),
        events: ['session_ping', 'chain_changed', 'accounts_changed', 'account_disconnected', 'session_event'],
    },
};
