import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { convertWasmToJs, copyToFolder } from './build-scripts.js';

const walletBundlerPath = path.join(__dirname, '../lib/wallet/bundler');
const walletOutPath = path.join(__dirname, '../lib/wallet/react-native');

copyToFolder(walletBundlerPath, walletOutPath);
convertWasmToJs(walletOutPath);
