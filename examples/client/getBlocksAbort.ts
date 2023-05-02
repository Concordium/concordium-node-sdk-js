import { createConcordiumClient, ArrivedBlockInfo } from '@concordium/node-sdk';
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
    credentials.createInsecure()
);

/**
 * Returns a stream of blocks that is iterable. The following code will receive
 * a single block and then abort:
 */

(async () => {
    // Create abort controller and block stream
    const ac = new AbortController();
    const blockStream: AsyncIterable<ArrivedBlockInfo> = client.getBlocks(
        ac.signal
    );

    // Only get one item then break
    for await (const block of blockStream) {
        console.dir(block, { depth: null, colors: true });
        break;
    }

    // Closes the stream
    ac.abort();
})();
