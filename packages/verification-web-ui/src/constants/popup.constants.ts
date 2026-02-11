// Constants for Concordium ID App Popup
export const PopupConstants = {
    // CDN for QR Code library
    CLOUDFLARE_CDN_FOR_QRCODE: 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',

    // ID App hosts for different platforms
    IDAPP_HOSTS: {
        mobile: 'concordiumid://',
        web: 'https://wallet.concordium.software/',
    },

    // App Store Links
    APP_STORE_LINKS: {
        ios: 'https://apps.apple.com/app/concordium-id/id1566996491',
        android: 'https://play.google.com/store/apps/details?id=software.concordium.mobilewallet.seedphrase',
    },

    // Popup element IDs
    ELEMENT_IDS: {
        popupWrapper: 'concordium-sdk-popup-wrapper',
        popupStyles: 'concordium-sdk-popup-styles',
        qrcodeLib: 'concordium-qrcode-lib',
        qrContainer: 'concordium-sdk-qr-code',
        openAppBtn: 'concordium-open-idapp-btn',
        createAccountBtn: 'concordium-create-id-btn',
        closeBtn: 'concordium-sdk-close-btn',
        sessionTopic: 'concordium-wallet-connect-session-topic',
    },

    // QR Code configuration
    QR_CONFIG: {
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
    },
} as const;
