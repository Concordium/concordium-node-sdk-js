import { createConcordiumClient, PendingUpdate } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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
            },
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
 * Get the pending updates to chain parameters at the end of a given block.
 * The stream will end when all the pending updates for a given block have
 * been returned.

 * If a blockhash is not supplied it will pick the latest finalized block. An
 * optional abort signal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const pendingUpdates: AsyncIterable<PendingUpdate> =
        client.getBlockPendingUpdates(cli.flags.block);

    for await (const pendingUpdate of pendingUpdates) {
        console.dir(pendingUpdate, { depth: null, colors: true });
    }
})();
