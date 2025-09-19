import path from 'node:path';

import { convertWasmToJs, copyToFolder } from './build-scripts.js';

const walletBundlerPath = path.join(__dirname, '../lib/wallet/bundler');
const walletOutPath = path.join(__dirname, '../lib/wallet/react-native');

copyToFolder(walletBundlerPath, walletOutPath);
convertWasmToJs(walletOutPath);
