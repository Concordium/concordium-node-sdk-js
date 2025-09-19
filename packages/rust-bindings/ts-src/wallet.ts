/* eslint-disable import/no-extraneous-dependencies */
import { Buffer } from 'buffer/index.js';

import wasmBase64 from '../lib/wallet/web/esm/index_bg.wasm';

// Expected to resolve to base64 encoded bytes of wasm module

async function init() {
    const { initSync } = await import('../lib/wallet/web/esm/index.js');
    const bytes = Buffer.from(wasmBase64 as unknown as string, 'base64');
    initSync(bytes);

    // If you need to export things from that module:
    return import('../lib/wallet/web/esm/index.js');
}

export const walletModule = init();