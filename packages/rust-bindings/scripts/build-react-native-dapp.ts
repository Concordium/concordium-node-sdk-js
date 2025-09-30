import path from 'node:path';

import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//import { convertWasmToJs, copyToFolder } from '../dist/scripts/build-scripts.js';
import { copyToFolder } from '../dist/scripts/build-scripts.js';

const dappBundlerPath = path.join(__dirname, '../lib/dapp/bundler');
const dappOutPath = path.join(__dirname, '../lib/dapp/react-native');

copyToFolder(dappBundlerPath, dappOutPath);
//convertWasmToJs(dappOutPath);
