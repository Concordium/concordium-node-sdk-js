/**
 * Local helpers for ID App handoff (clipboard + QR URL).
 * No remote bridge API.
 */

import { bridgeTrace } from '@/utils/bridgeTrace';

const LOG_PREFIX = '[IDApp]';

export interface QrHandoffPayload {
    qrUrl: string;
}

/**
 * Build HTTPS QR redirect URL with embedded wc: URI (no bridge register).
 */
export async function prepareQrHandoffPayload(walletConnectUri: string): Promise<QrHandoffPayload> {
    const { buildQrRedirectUrl } = await import('@/constants/wallet.registry');
    const qrUrl = buildQrRedirectUrl(walletConnectUri);
    console.log(`${LOG_PREFIX} QR handoff ready`, { qrUrlLength: qrUrl.length });
    bridgeTrace('QR handoff ready', { qrUrlLength: qrUrl.length });
    return { qrUrl };
}

/**
 * iOS only: write wc: to clipboard on user gesture (Open with ID App / store).
 * Android: no-op (deep link + Play referrer — avoids clipboard system toasts).
 * Fail-open.
 */
export async function handoffIosClipboard(walletConnectUri: string): Promise<boolean> {
    if (!walletConnectUri?.startsWith('wc:')) return false;
    try {
        const { writeIosBridgeClipboardHandoff } = await import('@/utils/iosBridgeClipboard');
        const written = await writeIosBridgeClipboardHandoff(walletConnectUri);
        bridgeTrace('iOS clipboard handoff', { written });
        return written;
    } catch (error) {
        console.warn(`${LOG_PREFIX} iOS clipboard handoff skipped`, error);
        return false;
    }
}
