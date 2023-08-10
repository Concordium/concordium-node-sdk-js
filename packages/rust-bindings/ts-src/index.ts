import { Buffer } from 'buffer/';
import { initSync } from '../pkg/web';
import wasm from '../pkg/web/concordium_rust_bindings_bg.wasm'; // Expected to resolve to a base64 url string from webpack

const base64 = (wasm as unknown as string).split(',')[1];
const bytes = Buffer.from(base64, 'base64').buffer;
initSync(bytes);

export * from '../pkg/web';
