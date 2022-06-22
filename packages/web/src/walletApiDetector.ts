import { WalletApi } from '@concordium/browser-wallet-api-types';

/**
 * Detect the Concordium browser wallet API by waiting for it to have been successfully injected
 * into the window so that it is ready for use.
 * @param timeout determines how long to wait before rejecting if the Concordium provider is not available, in milliseconds.
 * @returns a promise containing the Concordium Wallet provider API.
 */
export async function detectConcordiumProvider(
    timeout = 5000
): Promise<WalletApi> {
    return new Promise((resolve, reject) => {
        if (window.concordium) {
            resolve(window.concordium);
        } else {
            const t = setTimeout(() => {
                if (window.concordium) {
                    resolve(window.concordium);
                } else {
                    reject();
                }
            }, timeout);
            window.addEventListener(
                'concordium#initialized',
                () => {
                    if (window.concordium) {
                        clearTimeout(t);
                        resolve(window.concordium);
                    }
                },
                { once: true }
            );
        }
    });
}
