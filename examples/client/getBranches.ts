import { Branch, createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';
import chalk from 'chalk';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,         Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
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
 * Get the current branches of blocks starting from and including the last
 * finalized block.
 */

(async () => {
    const branch: Branch = await client.getBranches();

    console.log('Root hash:', chalk.blue(branch.blockHash));
    console.log("Root's children:");
    console.dir(branch.children, { depth: null, colors: true });
})();
