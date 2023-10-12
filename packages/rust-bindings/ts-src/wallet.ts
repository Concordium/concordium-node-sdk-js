/* eslint-disable import/no-extraneous-dependencies */
import { Buffer } from 'buffer/index.js';

import * as pkg from '../lib/wallet/web/esm';
const { initSync, default: _, ...toExport } = pkg;
import wasmBase64 from '../lib/wallet/web/esm/index_bg.wasm'; // Expected to resolve to base64 encoded bytes of wasm module

const bytes = Buffer.from(wasmBase64 as unknown as string, 'base64');
initSync(bytes);

export default toExport;
