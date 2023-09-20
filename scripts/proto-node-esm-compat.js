/* eslint-disable import/no-extraneous-dependencies */
import { glob } from 'glob';
import fs from 'fs';

const protoRoot = process.argv[2]; // First 2 arguments are node and path to this script. 3rd is expected to be location of generated proto type files.

if (!protoRoot) {
    throw new Error('Please supply a dir for the proto types to convert');
}

const files = await glob(protoRoot + '/**/*.ts');
files.forEach((file) => {
    let content = fs.readFileSync(file, 'utf-8');

    content = content
        .split('\n')
        .map((s) =>
            s.replace(/^(import .+? from ["']\..+?)(["'];)$/, '$1.js$2')
        )
        .join('\n');

    fs.writeFileSync(file, content, 'utf-8');
});
