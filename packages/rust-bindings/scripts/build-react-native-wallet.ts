import path from 'node:path';
import url from 'url';

import { convertWasmToJs, copyToFolder } from './build-scripts.ts';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const walletBundlerPath = path.join(__dirname, '../lib/wallet/bundler');
const walletOutPath = path.join(__dirname, '../lib/wallet/react-native');

copyToFolder(walletBundlerPath, walletOutPath);
convertWasmToJs(walletOutPath);
