import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --height,           The block height to get blocks from

  Options
    --help,             Displays this message
    --endpoint,     -e  Specify endpoint of the form "address:port", defaults to localhost:20000
    --numBlocks,    -n  The number of blocks to process
`,
    {
        importMeta: import.meta,
        flags: {
            height: {
                type: 'number',
                alias: 'h',
                isRequired: true,
            },
            numBlocks: {
                type: 'number',
                alias: 'n',
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
 * Get a stream of finalized blocks from "--endpoint", starting from "--height".
 */

(async () => {
    const ac = new AbortController();
    const bis = await client.getFinalizedBlocksFrom(
        BigInt(cli.flags.height),
        ac.signal
    );

    let i = 0;
    const n = cli.flags.numBlocks;

    for await (const bi of bis) {
        console.log(bi);

        i++;
        if (n !== undefined && i > n - 1) {
            ac.abort();
            break;
        }
    }
})();
