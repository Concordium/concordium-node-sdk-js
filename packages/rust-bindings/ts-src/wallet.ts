/* eslint-disable import/no-extraneous-dependencies */
import { Buffer } from 'buffer/index.js';

import { initSync } from '../lib/wallet/web/esm/index.js';
import wasmBase64 from '../lib/wallet/web/esm/index_bg.wasm';

// Expected to resolve to base64 encoded bytes of wasm module

const bytes = Buffer.from(wasmBase64, 'base64');
initSync({ module:bytes });

export * from '../lib/wallet/web/esm/index.js';
