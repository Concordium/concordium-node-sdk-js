import { Buffer } from 'buffer/';

import { initSync } from '../pkg/web';
import wasmBase64 from '../pkg/web/concordium_rust_bindings_bg.wasm'; // Expected to resolve to base64 encoded bytes of wasm module

const bytes = Buffer.from(wasmBase64 as unknown as string, 'base64');
initSync(bytes);

export * from '../pkg/web';
