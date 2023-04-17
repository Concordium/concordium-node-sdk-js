import { ArrivedBlockInfo, streamToList } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
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
    credentials.createInsecure(),
    { timeout: 15000 }
);

if (cli.flags.h) {
    cli.showHelp();
}

/// Returns a stream of blocks that is iterable. The following code will receive
/// blocks as long as there is a connection to the node:

(async () => {
    // Get block stream
    const blocks: AsyncIterable<ArrivedBlockInfo> = client.getBlocks();

    // Prints blocks infinitely
    for await (const block of blocks) {
        console.dir(block, { depth: null, colors: true });
    }

    // Can also be collected to a list with:
    const blockList: ArrivedBlockInfo[] = await streamToList(blocks);
})();
