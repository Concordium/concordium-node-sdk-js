import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import * as path from 'path';

/**
 * The point of this script is to convert the ESM produced by wasm-pack to something that can be compiled by bundlers.
 *
 * The error happening when _not_ running the script is related to the `new URL('index_bg.wasm', import.meta.url)`, as
 * bundlers will try to read the file at the location. The function this code snippet is embedded in, is not used in the
 * format exposed by the rust-bindings library.
 */

const name = process.argv[2];
if (!name) {
    console.error('Usage: tsx scripts/web-esm-remove-init.ts <name>');
    process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.resolve(__dirname, '..', `lib/${name}/web/esm/index.js`);

if (!fs.existsSync(filePath)) {
    console.warn(`${filePath} not found.`);
    process.exit(0);
}
const content = fs.readFileSync(filePath, 'utf8');
const updated = content.replace("module_or_path = new URL('index_bg.wasm', import.meta.url);", '');
if (updated !== content) {
    fs.writeFileSync(filePath, updated);
} else {
    console.warn(`No line to remove in ${filePath}`);
}
