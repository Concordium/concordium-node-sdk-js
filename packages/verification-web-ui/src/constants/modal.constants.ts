export const ModalConstants = {
    SELECTORS: {
        SCAN_MODAL: '#scan-modal',
        LANDING_MODAL: '#landing-modal',
        PROCESSING_MODAL: '#processing-modal',
        RETURNING_USER_MODAL: '#returning-user-modal',
        BACK_BTN: '#back-btn',
        QR_CONTAINER: '#qr-container',
        BTN_WRAPPER: '#btn-wrapper',
    },

    CSS_CLASSES: {
        HIDDEN: 'hidden',
        FLEX: 'flex',
        VISIBLE: ['opacity-100', 'visible'],
        HIDDEN_DROPDOWN: ['opacity-0', 'invisible'],
    },

    WALLET_TYPES: {
        CONCORDIUM_WALLET: 'concordium-wallet',
        BROWSER_WALLET: 'browser-wallet',
        CONCORDIUM_ID: 'concordium-id',
    },

    BREAKPOINTS: {
        MOBILE: 768,
    },

    LOCAL_STORAGE_FLAGS: {
        ONLY_ONE_OPTION: 'onlyOneOption',
        APP_NOT_INSTALLED: 'appNotInstalled',
        CONCORDIUM_ID_NOT_INSTALLED: 'concordiumIDNotInstalled',
        WALLET_CONNECT_URI: 'walletConnectUri',
        ACTIVE_SESSION: 'activeSession',
        CONNECTION_MODE: 'connectionMode',
        SDK_PROJECT_ID: 'sdkProjectId',
        SDK_NETWORK: 'sdkNetwork',
    },
} as const;
