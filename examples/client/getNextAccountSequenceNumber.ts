import { AccountAddress, NextAccountNonce } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required:
    --account, -a  The account to get the next nonce for

  Options
    --help,     -h  Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            account: {
                type: 'string',
                alias: 'a',
                isRequired: true,
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure(),
    { timeout: 15000 }
);

if (cli.flags.h) {
    cli.showHelp();
}

/// Retrieves the next account sequence number (nonce), i.e. the number that must
/// be set in the account transaction header for the next transaction submitted
/// by that account. Along with the sequence number there is a boolean that
/// indicates whether all transactions are finalized. If this is true, then the
/// sequence number is reliable, if not then the next sequence number might be off.

(async () => {
    const account = new AccountAddress(cli.flags.account);
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        account
    );

    console.log(nextNonce);

    const nonce: bigint = nextNonce.nonce;
    const allFinal: boolean = nextNonce.allFinal;
    if (allFinal) {
        // nonce is reliable
    }
})();
