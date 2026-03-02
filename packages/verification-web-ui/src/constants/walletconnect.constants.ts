// Note: Icon import moved inline to avoid circular dependency issues
export const WalletConnectConstants = {
    DEFAULT_RELAY_URL: 'wss://relay.walletconnect.com',

    // Universal link base URL for Concordium ID app
    // This allows QR codes to be scanned by standard camera apps
    CONCORDIUM_ID_UNIVERSAL_LINK: 'https://concordiumid.app/wc',

    DISCONNECT_REASON: {
        code: 6000,
        message: 'User disconnected',
    },

    getDefaultMetadata: () => ({
        name: 'Concordium Verification WebUI',
        description: 'Concordium wallet integration for merchants',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons: [
            // Inline the icon URL - Vite will process this during build
            new URL('../assets/browser-wallet-icon.svg', import.meta.url).href,
        ],
    }),

    METHODS: {
        SIGN_AND_SEND_TRANSACTION: 'sign_and_send_transaction',
        SIGN_MESSAGE: 'sign_message',
        // v1 is used by Concordium ID App
        REQUEST_VERIFIABLE_PRESENTATION_V1: 'request_verifiable_presentation_v1',
        // v0 is used by Concordium Wallet (CryptoX)
        REQUEST_VERIFIABLE_PRESENTATION: 'request_verifiable_presentation',
    },

    // All methods for broad wallet compatibility
    ALL_METHODS: [
        'sign_and_send_transaction',
        'sign_message',
        'request_verifiable_presentation_v1',
        'request_verifiable_presentation',
    ] as const,

    EVENTS: ['session_ping', 'chain_changed', 'accounts_changed', 'account_disconnected', 'session_event'] as const,

    CHAIN_IDS: {
        mainnet: [import.meta.env.VITE_CHAIN_ID_MAINNET || 'ccd:9dd9ca4d19e9393877d2c44b70f89acb'],
        testnet: [import.meta.env.VITE_CHAIN_ID_TESTNET || 'ccd:4221332d34e1694168c2a0c0b3fd0f27'],
    },
} as const;
