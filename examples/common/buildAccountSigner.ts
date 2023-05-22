import meow from 'meow';
import fs from 'fs';
import path from 'path';
import {
    AccountAddress,
    signMessage,
    buildAccountSigner,
} from '@concordium/node-sdk';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --keyFile,   -f  A file containing the private key(s) of an account, which must be a supported format (e.g. a private key export from a Concordium wallet)

  Options
    --help,      -h  Displays this message
`,
    {
        importMeta: import.meta,
        flags: {
            keyFile: {
                type: 'string',
                alias: 'f',
                isRequired: true,
            },
        },
    }
);

const file = fs.readFileSync(path.resolve(process.cwd(), cli.flags.keyFile));
const contents = JSON.parse(file.toString('utf8'));

try {
    const signer = buildAccountSigner(contents);

    signMessage(
        new AccountAddress(
            '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5'
        ),
        'test',
        signer
    ).then(console.log);
} catch {
    console.error('File passed does not conform to a supported JSON format');
}
