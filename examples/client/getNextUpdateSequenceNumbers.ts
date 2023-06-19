import { parseEndpoint } from '../shared/util';
import {
    createConcordiumClient,
    NextUpdateSequenceNumbers,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
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

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Get next available sequence numbers for updating chain parameters after a
 * given block.
 */

(async () => {
    // #region documentation-snippet
    const updateSeqNums: NextUpdateSequenceNumbers =
        await client.getNextUpdateSequenceNumbers(cli.flags.block);
    // #endregion documentation-snippet

    console.dir(updateSeqNums, { depth: null, colors: true });
})();
