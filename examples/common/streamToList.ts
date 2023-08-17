import {
    BakerId,
    createConcordiumClient,
    streamToList,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { parseEndpoint } from '../shared/util.js';

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

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * This example shows how the streamToList function can be used. Note that if
 * used on an infinite stream (like getBlocks), then it will never terminate.
 */

async () => {
    const bakerIds: AsyncIterable<BakerId> = client.getBakerList(
        cli.flags.block
    );

    const bakerList = await streamToList(bakerIds);

    console.log(bakerList[0]);
};
