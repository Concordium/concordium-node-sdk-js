import { parseEndpoint } from '../shared/util';
import {
    BlockFinalizationSummary,
    createConcordiumClient,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

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
 * Get the summary of the finalization data in a given block. Only finalized
 * blocks will return a finalization summary, if the summary is requested for
 * a non-finalized block, this will return an object with only the tag field,
 * with value "none".  If a blockhash is not supplied it will pick the latest
 * finalized block.
 */

(async () => {
    // #region documentation-snippet
    const summary: BlockFinalizationSummary =
        await client.getBlockFinalizationSummary(cli.flags.block);

    if (summary.tag === 'record') {
        // Response contains finalization summary for the given block:
        console.log('block:', summary.record.block);
        console.log('index:', summary.record.index);
        console.log('delay:', summary.record.delay);
        console.log('Amount of finalizers:', summary.record.finalizers.length);
    } else {
        console.log(
            'Given block has not been finalized, and no information can be gotten'
        );
    }
    // #endregion documentation-snippet
})();
