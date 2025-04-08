/* eslint-disable import/no-extraneous-dependencies */

/**
 * Builds package for react native by:
 * 1. Copying output from wasm-pack built with bundler target
 * 2. Converting wasm file to js with [wasm2js]{@link https://github.com/WebAssembly/binaryen/blob/main/src/wasm2js.h}
 * 3. Replacing references to wasm file with corresponding references to converted file.
 */
import copyfiles from 'copyfiles';
import { exec as _exec } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import util from 'node:util';

const exec = util.promisify(_exec);

const WASM_FILENAME = 'index_bg.wasm';
const WASM_FILENAME_JS = `${WASM_FILENAME}.js`;

// Copy files to react native folder
export const copyToFolder = (bundlerPath: string, outPath: string) =>
    copyfiles(
        [`${bundlerPath}/index*`, `${bundlerPath}/package.json`, outPath],
        { up: bundlerPath.split('/').length, flat: true },
        () => {} // no-op
    );

export const convertWasmToJs = async (outPath: string) => {
    // Convert files using `wasm2js`
    await exec(`wasm2js ${path.join(outPath, WASM_FILENAME)} -o ${path.join(outPath, WASM_FILENAME_JS)}`);

    // Remove unused wasm file
    fs.rmSync(path.join(outPath, WASM_FILENAME));

    // Replace references to wasm file with references to converted file
    ['index.js', 'index_bg.js']
        .map((filename) => path.join(outPath, filename))
        .forEach((file) => {
            let content = fs.readFileSync(file, 'utf-8');
            content = content.replace(WASM_FILENAME, WASM_FILENAME_JS);
            fs.writeFileSync(file, content, 'utf-8');
        });
};
