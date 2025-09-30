import path from 'node:path';

import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

//import { convertWasmToJs, copyToFolder } from '../dist/scripts/build-scripts.js';
import { copyToFolder } from '../dist/scripts/build-scripts.js';


const walletBundlerPath = path.join(__dirname, '../lib/wallet/bundler');
const walletOutPath = path.join(__dirname, '../lib/wallet/react-native');

copyToFolder(walletBundlerPath, walletOutPath);
//convertWasmToJs(walletOutPath);
