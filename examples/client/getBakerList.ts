import { BakerId, createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

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
 * Retrieves a stream of ID's for registered bakers on the network at a specific
 * block.  If a blockhash is not supplied it will pick the latest finalized
 * block. An optional abort signal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const bakerIds: AsyncIterable<BakerId> = client.getBakerList(
        cli.flags.block
    );

    for await (const bakerId of bakerIds) {
        console.log(bakerId);
    }
})();
