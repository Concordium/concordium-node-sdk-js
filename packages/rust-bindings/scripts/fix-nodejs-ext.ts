import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filesToRename = ['lib/dapp/node/cjs/index.js', 'lib/wallet/node/cjs/index.js'];

for (const file of filesToRename) {
    const oldPath = path.join(__dirname, '..', file);
    const newPath = oldPath.replace(/\.js$/, '.cjs');

    if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`Renamed: ${file} -> ${file.replace(/\.js$/, '.cjs')}`);
    }
}
