import { createConcordiumClient, Base58String } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';
import chalk from 'chalk';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves the accounts that exists at the end of a given block as an async
 * iterable. If a blockhash is not supplied it will pick the latest finalized
 * block. An optional abortSignal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const accounts: AsyncIterable<Base58String> = client.getAccountList(
        cli.flags.block
    );

    console.log('Accounts that exists at the end of the given block:');
    for await (const account of accounts) {
        console.log(chalk.green(account));
    }
})();
