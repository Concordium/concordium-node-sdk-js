import { ArrivedBlockInfo, createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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

// Split endpoint on last colon
const lastColonIndex = cli.flags.endpoint.lastIndexOf(':');
const address = cli.flags.endpoint.substring(0, lastColonIndex);
const port = cli.flags.endpoint.substring(lastColonIndex + 1);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Returns a stream of blocks that is iterable. The following code will receive
 * blocks as long as there is a connection to the node:
 */

(async () => {
    // Get block stream
    const blocks: AsyncIterable<ArrivedBlockInfo> = client.getBlocks();

    // Prints blocks infinitely
    for await (const block of blocks) {
        console.log('Arrived block height:', block.height);
        console.log('Arrived block hash:', block.hash, '\n');
    }
})();
