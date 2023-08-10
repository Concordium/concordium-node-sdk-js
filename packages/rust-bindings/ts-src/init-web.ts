import { Buffer } from 'buffer/';
import { initSync } from '../pkg/web';
import wasm from '../pkg/web/concordium_rust_bindings_bg.wasm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bytes = Buffer.from((wasm as any).split(',')[1], 'base64').buffer;
console.log('source type:', typeof wasm);
console.log('bytes length:', bytes.byteLength);
initSync(bytes);

export * from '../pkg/web';
