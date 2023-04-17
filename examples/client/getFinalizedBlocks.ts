import { FinalizedBlockInfo } from '@concordium/common-sdk';
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

/// Returns a stream of finalized blocks that is iterable. Works exactly like
/// `getBlocks()` but only returns finalized blocks.  Likewise, you can also
/// pass it an `AbortSignal`, which is optional, but the stream will continue
/// forever if you don't provide it:

(async () => {
    // Create abort controller and block stream
    const ac = new AbortController();
    const blockStream: AsyncIterable<FinalizedBlockInfo> =
        client.getFinalizedBlocks(ac.signal);

    // Only get one item then break
    for await (const block of blockStream) {
        console.dir(block, { depth: null, colors: true });
        break;
    }

    // Closes the stream
    ac.abort();
})();
