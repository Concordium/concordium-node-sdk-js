import {
    createConcordiumClient,
    isAccountTransactionType,
    isTransferLikeSummary,
    streamToList,
    unwrap,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --from, -f  From some time
    --to,   -t  To some time

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            from: {
                type: 'string',
                alias: 'f',
                isRequired: true,
            },
            to: {
                type: 'string',
                alias: 't',
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

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * List all account creations in a given time span.
 */

(async () => {
    const from = new Date(cli.flags.from);
    const ac = new AbortController();

    const fromBlockMaybe = await client.findFirstFinalizedBlockNoLaterThan(
        from
    );
    const fromHeight = unwrap(fromBlockMaybe).blockHeight; // Throw if fromBlockMaybe is undefined
    const toHeight = (await client.getConsensusStatus())
        .lastFinalizedBlockHeight;

    const blockStream = client.getFinalizedBlocksFrom(fromHeight);

    // Return dictionary
    const dict: Record<string, number> = {};

    // Log progress every 5 seconds
    let progress = 0n;
    setInterval(() => console.log(Number(progress), '%'), 5000);

    //Iterate over all blocks
    console.log('processing blocks...');
    for await (const block of blockStream) {
        // Stop stream when all known blocks are processed
        if (block.height > toHeight) {
            ac.abort();
            break;
        }

        progress =
            ((block.height - fromHeight) * 100n) / (toHeight - fromHeight);

        // Get transactions for block
        const trxStream = client.getBlockTransactionEvents(block.hash);
        for await (const trx of trxStream) {
            if (isTransferLikeSummary(trx)) {
                if (!dict[trx.sender]) {
                    dict[trx.sender] = 1;
                } else {
                    dict[trx.sender]++;
                }
            }
        }
    }

    console.log('Done!');

    console.dir(dict);

    process.exit(0);
})();
