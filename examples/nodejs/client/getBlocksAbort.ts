import { ArrivedBlockInfo } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Returns a stream of blocks that is iterable. The following code will receive
 * a single block and then abort:
 */

(async () => {
    // #region documentation-snippet
    // Create abort controller and block stream
    const ac = new AbortController();
    const blockStream: AsyncIterable<ArrivedBlockInfo> = client.getBlocks(ac.signal);

    // Only get one item then break
    for await (const block of blockStream) {
        console.log('Arrived block height:', block.height);
        console.log('Arrived block hash:', block.hash, '\n');
        break;
    }

    // Closes the stream
    ac.abort();
    // #endregion documentation-snippet
})();
