/* eslint-disable import/no-extraneous-dependencies */
import { glob } from 'glob';
import fs from 'fs';

const protoRoot = 'src/grpc-api';
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
