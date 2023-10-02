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
    $ yarn run-example <path-to-this-file> [options]

  Required
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet

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

// #region documentation-snippet
const walletFile = fs.readFileSync(
    path.resolve(process.cwd(), cli.flags.walletFile),
    'utf8'
);
const wallet = parseWallet(walletFile);

try {
    const signer = buildAccountSigner(wallet);

    signMessage(
        AccountAddress.fromBase58(wallet.value.address),
        'test',
        signer
    ).then(console.log);
} catch {
    console.error('File passed does not conform to a supported JSON format');
}
// #endregion documentation-snippet
