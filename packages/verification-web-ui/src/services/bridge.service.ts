/**
 * IDApp Bridge Server client — deferred deep-link session registration.
 * Registers WalletConnect context before App Store / Play Store redirect.
 */

import { bridgeTrace } from '@/utils/bridgeTrace';

const DEFAULT_BRIDGE_URL = 'https://idpp-bridge-staging.nanocorp.io';
const LOG_PREFIX = '[IDApp Bridge]';

function getBridgeBaseUrl(): string {
    const fromEnv = (import.meta as any).env?.VITE_BRIDGE_API_URL;
    return typeof fromEnv === 'string' && fromEnv.length > 0 ? fromEnv.replace(/\/$/, '') : DEFAULT_BRIDGE_URL;
}

function getBridgeApiKey(): string {
    const fromEnv = (import.meta as any).env?.VITE_BRIDGE_API_KEY;
    return typeof fromEnv === 'string' && fromEnv.length > 0
        ? fromEnv
        : 'favUhAT8Ve4iB9wDo9tsW83AFr6T85cHgSL77mboWsu8c1nVK';
}

function truncateUri(uri: string): string {
    if (uri.length <= 48) return uri;
    return `${uri.slice(0, 28)}…${uri.slice(-12)}`;
}

export interface RegisterSessionResult {
    installId: string | null;
}

export interface BridgeQrPayload {
    installId: string | null;
    qrUrl: string;
}

/**
 * Register WC session with bridge, then build HTTPS QR URL for camera scans.
 * Desktop should call this before rendering the QR so install_id is in the link.
 */
export async function prepareBridgeQrPayload(walletConnectUri: string): Promise<BridgeQrPayload> {
    const { installId } = await registerSession(walletConnectUri);
    const { buildQrRedirectUrl } = await import('@/constants/wallet.registry');
    const qrUrl = buildQrRedirectUrl(walletConnectUri, { installId });
    console.log(`${LOG_PREFIX} QR payload ready`, {
        install_id: installId,
        qrUrlLength: qrUrl.length,
    });
    return { installId, qrUrl };
}

/**
 * POST /v1/session/register — cache wc: URI + browser telemetry on the bridge.
 * Fail-open: returns null installId on any error so store redirect still proceeds.
 */
export async function registerSession(walletConnectUri: string): Promise<RegisterSessionResult> {
    if (!walletConnectUri) {
        console.warn(`${LOG_PREFIX} session/register SKIPPED — no WalletConnect URI`);
        bridgeTrace('register SKIPPED — no WalletConnect URI');
        return { installId: null };
    }

    const url = `${getBridgeBaseUrl()}/v1/session/register`;
    // eslint-disable-next-line no-console
    console.info(
        `%c${LOG_PREFIX} session/register START`,
        'background:#06c;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold',
        { url, walletConnectUri: truncateUri(walletConnectUri), hasApiKey: Boolean(getBridgeApiKey()) }
    );
    bridgeTrace('register START', { url, uri: walletConnectUri });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': getBridgeApiKey(),
            },
            body: JSON.stringify({
                context: {
                    wallet_connect_uri: walletConnectUri,
                },
            }),
        });

        const rawBody = await response.text();
        let data: { install_id?: string | null; error?: unknown } = {};
        try {
            data = rawBody ? JSON.parse(rawBody) : {};
        } catch {
            console.warn(`${LOG_PREFIX} session/register non-JSON body`, rawBody);
        }

        if (!response.ok) {
            console.error(`${LOG_PREFIX} session/register FAILED`, {
                status: response.status,
                statusText: response.statusText,
                body: data,
            });
            bridgeTrace('register FAILED', { status: response.status, body: JSON.stringify(data) });
            return { installId: null };
        }

        const installId = data.install_id ?? null;
        // eslint-disable-next-line no-console
        console.info(
            `%c${LOG_PREFIX} session/register SUCCESS`,
            'background:#0a0;color:#fff;padding:2px 6px;border-radius:3px;font-weight:bold',
            {
                status: response.status,
                install_id: installId,
                note:
                    installId == null
                        ? 'install_id is null — Android Play referrer / iOS clipboard handoff unavailable; app will fuzzy-match'
                        : 'Android: Play Store referrer; iOS: clipboard handoff (same deferred-match path)',
            }
        );
        bridgeTrace('register SUCCESS', { status: response.status, install_id: installId });

        // iOS: clipboard = Play Install Referrer. install_id + Safari browser info (never raw wc:).
        // Must stay in the Open-with-ID-App gesture window when possible.
        if (installId) {
            try {
                const { writeIosBridgeClipboardHandoff } = await import('@/utils/iosBridgeClipboard');
                const written = await writeIosBridgeClipboardHandoff(installId);
                bridgeTrace('iOS clipboard handoff', { written, install_id: installId, version: 3 });
            } catch (error) {
                console.warn(`${LOG_PREFIX} iOS clipboard handoff skipped`, error);
            }
        }

        return { installId };
    } catch (error) {
        console.error(`${LOG_PREFIX} session/register NETWORK ERROR`, error);
        bridgeTrace('register NETWORK ERROR', { message: String(error) });
        return { installId: null };
    }
}
