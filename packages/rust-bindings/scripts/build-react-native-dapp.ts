import path from 'node:path';

import { convertWasmToJs, copyToFolder } from './build-scripts';

const dappBundlerPath = path.join(__dirname, '../lib/dapp/bundler');
const dappOutPath = path.join(__dirname, '../lib/dapp/react-native');

copyToFolder(dappBundlerPath, dappOutPath);
convertWasmToJs(dappOutPath);
