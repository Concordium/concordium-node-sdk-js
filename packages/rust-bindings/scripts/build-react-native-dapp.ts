import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { convertWasmToJs, copyToFolder } from './build-scripts.js';

const dappBundlerPath = path.join(__dirname, '../lib/dapp/bundler');
const dappOutPath = path.join(__dirname, '../lib/dapp/react-native');

copyToFolder(dappBundlerPath, dappOutPath);
convertWasmToJs(dappOutPath);
