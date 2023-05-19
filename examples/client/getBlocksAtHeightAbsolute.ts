import { parseEndpoint } from '../shared/util';
import { createConcordiumClient, HexString } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --height,     The block height to get blocks from

  Options
    --help,         Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            height: {
                type: 'number',
                alias: 'h',
                isRequired: true,
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Get a list of live blocks at a given absolute height.
 */

(async () => {
    const blocks: HexString[] = await client.getBlocksAtHeight(
        BigInt(cli.flags.height)
    );

    for (const block of blocks) {
        console.log(block);
    }
})();
