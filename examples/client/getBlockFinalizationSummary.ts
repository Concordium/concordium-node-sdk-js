import { BlockFinalizationSummary } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
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
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
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

/// Get the summary of the finalization data in a given block. Only finalized
/// blocks will return a finalization summary, if the summary is requested for
/// a non-finalized block, this will return an object with only the tag field,
/// with value "none".  If a blockhash is not supplied it will pick the latest
/// finalized block.

(async () => {
    const summary: BlockFinalizationSummary =
        await client.getBlockFinalizationSummary(cli.flags.block);

    if (summary.tag === 'record') {
        // Response contains finalization summary for the given block:
        const { block, index, delay, finalizers } = summary.record;
    } else {
        // Given block has not been finalized, and no information can be gotten
    }

    console.dir(summary, { depth: null, colors: true });
})();
