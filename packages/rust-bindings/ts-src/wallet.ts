import { Buffer } from 'buffer/';

import { initSync } from '../pkg/wallet/web';
import wasmBase64 from '../pkg/wallet/web/index_bg.wasm'; // Expected to resolve to base64 encoded bytes of wasm module

const bytes = Buffer.from(wasmBase64 as unknown as string, 'base64');
initSync(bytes);

export * from '../pkg/wallet/web';
