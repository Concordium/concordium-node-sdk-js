import meow from 'meow';
import fs from 'fs';
import path from 'path';
import {
    AccountAddress,
    signMessage,
    buildAccountSigner,
    parseWallet,
} from '@concordium/node-sdk';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --walletFile, -w  A file containing the private key(s) of an account, which must be a supported format (e.g. a private key export from a Concordium wallet)

  Options
    --help,     Displays this message
`,
    {
        importMeta: import.meta,
        flags: {
            walletFile: {
                type: 'string',
                alias: 'w',
                isRequired: true,
            },
        },
    }
);

/**
 * Shows how to build an account signer
 */

const walletFile = fs.readFileSync(
    path.resolve(process.cwd(), cli.flags.walletFile),
    'utf8'
);
const wallet = parseWallet(walletFile);

try {
    const signer = buildAccountSigner(wallet);

    signMessage(new AccountAddress(wallet.value.address), 'test', signer).then(
        console.log
    );
} catch {
    console.error('File passed does not conform to a supported JSON format');
}
