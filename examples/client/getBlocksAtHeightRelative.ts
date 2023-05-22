import { parseEndpoint } from '../shared/util';
import {
    BlocksAtHeightRequest,
    createConcordiumClient,
    HexString,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --height,            Height starting from the genesis block at the genesis index.
    --restrict,      -r  Whether to return results only from the specified genesis index (true),
                         or allow results from more recent genesis indices as well (false).
    --genesis-index, -g  The index of a (re)genesis block. The initial genesis block has index 0
                         and each subsequent regenesis has an incrementally higher index.

  Options
    --help,         Displays this message.
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
            restrict: {
                type: 'boolean',
                alias: 'r',
                isRequired: true,
            },
            genesisIndex: {
                type: 'number',
                alias: 'g',
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
 * Get a list of live blocks at a given relative height.
 */

(async () => {
    const request: BlocksAtHeightRequest = {
        genesisIndex: cli.flags.genesisIndex,
        height: BigInt(cli.flags.height),
        restrict: cli.flags.restrict,
    };
    const blocks: HexString[] = await client.getBlocksAtHeight(request);

    for (const block of blocks) {
        console.log(block);
    }
})();
