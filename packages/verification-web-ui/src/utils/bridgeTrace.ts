/**
 * Persistent trace for the bridge / deferred deep-link flow.
 *
 * The merchant tab is frozen or discarded while the user is in the store and then in
 * the app, so console output from before the hop is usually gone by the time anyone
 * looks at it. Entries are mirrored into localStorage and replayed on the next load,
 * which makes the store detour debuggable after the fact.
 *
 * WalletConnect URIs carry a symKey, so values are redacted before they are stored.
 */

const STORAGE_KEY = 'CONCORDIUM_BRIDGE_TRACE';
const MAX_ENTRIES = 60;
const PREFIX = '[BRIDGE-TRACE]';

/** Loud style so Safari "Logs" filter still surfaces these. */
const STYLE_BANNER =
    'background:#0a7;color:#fff;padding:4px 8px;border-radius:4px;font-weight:bold;font-size:13px';
const STYLE_STEP = 'color:#0a7;font-weight:bold';
const STYLE_OK = 'color:#0a0;font-weight:bold';
const STYLE_FAIL = 'color:#c00;font-weight:bold';

export interface BridgeTraceEntry {
    time: string;
    step: string;
    data?: Record<string, unknown>;
}

/** wc: URIs embed a symKey — never persist one in full. */
function redact(value: unknown): unknown {
    if (typeof value !== 'string') return value;
    if (value.startsWith('wc:')) {
        const topic = value.slice(3, value.indexOf('@') > 0 ? value.indexOf('@') : 15);
        return `wc:${topic}…redacted`;
    }
    if (value.length > 120) return `${value.slice(0, 100)}…`;
    return value;
}

function sanitize(data?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!data) return undefined;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
        out[key] = redact(value);
    }
    return out;
}

function read(): BridgeTraceEntry[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function write(entries: BridgeTraceEntry[]): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
    } catch {
        /* storage full or blocked (Private Browsing) — console output still works */
    }
}

/**
 * Log a step to the console and persist it so it survives the store handoff.
 */
export function bridgeTrace(step: string, data?: Record<string, unknown>): void {
    const safe = sanitize(data);
    const entry: BridgeTraceEntry = { time: new Date().toISOString(), step, data: safe };

    const isFail = /fail|error|abort|404|not.?found|skip/i.test(step);
    const isOk = /success|matched|connected|GO\b/i.test(step);
    const style = isFail ? STYLE_FAIL : isOk ? STYLE_OK : STYLE_STEP;

    // eslint-disable-next-line no-console
    console.info(`%c${PREFIX}%c ${step}`, STYLE_BANNER, style, safe ?? '');

    const entries = read();
    entries.push(entry);
    write(entries);
}

/** Print everything captured so far, including entries from before a store hop. */
export function dumpBridgeTrace(): BridgeTraceEntry[] {
    const entries = read();
    if (entries.length === 0) {
        // eslint-disable-next-line no-console
        console.info(`%c${PREFIX}%c no entries recorded yet — tap "Open with ID App" first`, STYLE_BANNER, STYLE_STEP);
        return entries;
    }

    const first = Date.parse(entries[0].time);
    // eslint-disable-next-line no-console
    console.info(
        `%c${PREFIX}%c ${entries.length} entries, spanning ${Math.round((Date.parse(entries[entries.length - 1].time) - first) / 1000)}s`,
        STYLE_BANNER,
        STYLE_STEP
    );
    // eslint-disable-next-line no-console
    console.table(
        entries.map((entry) => ({
            'T+s': Math.round((Date.parse(entry.time) - first) / 1000),
            step: entry.step,
            data: entry.data ? JSON.stringify(entry.data) : '',
        }))
    );
    return entries;
}

export function clearBridgeTrace(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch {
        /* ignore */
    }
    // eslint-disable-next-line no-console
    console.info(`%c${PREFIX}%c cleared`, STYLE_BANNER, STYLE_STEP);
}

let installed = false;

/**
 * Expose the trace helpers on window and replay anything recorded before this load.
 * Safe to call more than once.
 */
export function installBridgeTrace(): void {
    if (installed || typeof window === 'undefined') return;
    installed = true;

    (window as any).concordiumBridgeTrace = {
        dump: dumpBridgeTrace,
        clear: clearBridgeTrace,
        entries: read,
    };

    // Always dump a loud banner so testers know the SDK build is current.
    // eslint-disable-next-line no-console
    console.info(
        `%c${PREFIX} SDK LOADED — bridge debug active`,
        STYLE_BANNER
    );
    // eslint-disable-next-line no-console
    console.info(
        `%c${PREFIX}%c Look for "register START / SUCCESS" after tapping Open with ID App.\n` +
            `  Dump history:  concordiumBridgeTrace.dump()\n` +
            `  Clear history: concordiumBridgeTrace.clear()\n` +
            `  Filter console for: BRIDGE-TRACE`,
        STYLE_BANNER,
        STYLE_STEP
    );

    const previous = read();
    if (previous.length > 0) {
        // eslint-disable-next-line no-console
        console.info(
            `%c${PREFIX}%c ${previous.length} entries carried over from before this page load — dumping now:`,
            STYLE_BANNER,
            STYLE_STEP
        );
        dumpBridgeTrace();
    } else {
        // eslint-disable-next-line no-console
        console.info(`%c${PREFIX}%c no prior entries in localStorage`, STYLE_BANNER, STYLE_STEP);
    }
}
