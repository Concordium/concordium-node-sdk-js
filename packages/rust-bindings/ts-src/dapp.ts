import { Buffer } from 'buffer/index.js';

import { initSync } from '../pkg/dapp/web';
import wasmBase64 from '../pkg/dapp/web/index_bg.wasm'; // Expected to resolve to base64 encoded bytes of wasm module

const bytes = Buffer.from(wasmBase64 as unknown as string, 'base64');
initSync(bytes);

export * from '../pkg/dapp/web';
