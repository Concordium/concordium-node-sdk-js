import path from 'node:path';

import { convertWasmToJs, copyToFolder } from './build-scripts.ts';

import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const dappBundlerPath = path.join(__dirname, '../lib/dapp/bundler');
const dappOutPath = path.join(__dirname, '../lib/dapp/react-native');

copyToFolder(dappBundlerPath, dappOutPath);
convertWasmToJs(dappOutPath);
