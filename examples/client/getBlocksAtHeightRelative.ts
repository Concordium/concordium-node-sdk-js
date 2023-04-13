import { BlocksAtHeightRequest, HexString } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --height,        -h  Height starting from the genesis block at the genesis index.
    --restrict,      -r  Whether to return results only from the specified genesis index (true),
                         or allow results from more recent genesis indices as well (false).
    --genesis-index, -g  Genesis index to start from. 

  Options
    --help,     -h  Displays this message.
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost.
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
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

/// Get a list of live blocks at a given relative height.

(async () => {
    const request: BlocksAtHeightRequest = {
        genesisIndex: 1,
        height: BigInt(cli.flags.height),
        restrict: cli.flags.restrict,
    };
    const blocks: HexString[] = await client.getBlocksAtHeight(request);

    console.dir(blocks, { depth: null, colors: true });
})();
