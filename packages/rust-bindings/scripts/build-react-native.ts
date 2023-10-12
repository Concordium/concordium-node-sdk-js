/* eslint-disable import/no-extraneous-dependencies */
import path from 'node:path';
import fs from 'node:fs';
import util from 'node:util';
import { exec as _exec } from 'node:child_process';
import copyfiles from 'copyfiles';

const exec = util.promisify(_exec);

const WASM_FILENAME = 'index_bg.wasm';
const WASM_FILENAME_JS = `${WASM_FILENAME}.js`;

const bundlerPath = path.join(__dirname, '../lib/dapp/bundler');
const outPath = path.join(__dirname, '../lib/dapp/react-native');
const wasm2js = path.join(__dirname, '../tools/binaryen/bin/wasm2js');

copyfiles(
    [`${bundlerPath}/index*`, `${bundlerPath}/package.json`, outPath],
    { up: bundlerPath.split('/').length, flat: true },
    () => {} // no-op
);

(async () => {
    await exec(
        `${wasm2js} ${path.join(outPath, WASM_FILENAME)} -o ${path.join(
            outPath,
            WASM_FILENAME_JS
        )}`
    );

    fs.rmSync(path.join(outPath, WASM_FILENAME));

    ['index.js', 'index_bg.js', 'package.json']
        .map((filename) => path.join(outPath, filename))
        .forEach((file) => {
            let content = fs.readFileSync(file, 'utf-8');
            content = content.replace(WASM_FILENAME, WASM_FILENAME_JS);
            fs.writeFileSync(file, content, 'utf-8');
        });
})();
