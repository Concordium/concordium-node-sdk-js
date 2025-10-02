/* eslint-disable import/no-extraneous-dependencies */
import { Buffer } from 'buffer/index.js';

import { initSync } from '../lib/dapp/web/esm/index.js';
import wasmBase64 from '../lib/dapp/web/esm/index_bg.wasm';

// Expected to resolve to base64 encoded bytes of wasm module
const bytes = Buffer.from(wasmBase64, 'base64');
initSync(bytes);

export * from '../lib/dapp/web/esm/index.js';
