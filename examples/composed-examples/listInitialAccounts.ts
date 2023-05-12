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
            },
            to: {
                type: 'string',
                alias: 't',
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
    const cs = await client.getConsensusStatus();
    const lastFinal = await client.getBlockInfo(cs.lastFinalizedBlock);
    const from = cli.flags.from ? new Date(cli.flags.from) : cs.genesisTime;
    const to = cli.flags.to ? new Date(cli.flags.to) : lastFinal.blockSlotTime;
    const ac = new AbortController();

    console.log(to);

    const fromBlockMaybe = await client.findFirstFinalizedBlockNoLaterThan(
        from
    );
    const fromHeight = unwrap(fromBlockMaybe).blockHeight; // Throw if fromBlockMaybe is undefined

    const toBlockMaybe = await client.findFirstFinalizedBlockNoLaterThan(to);
    const toHeight = unwrap(toBlockMaybe).blockHeight;

    const blockStream = client.getFinalizedBlocksFrom(fromHeight);

    // Log progress every 5 seconds
    let progress = 0n;
    setInterval(() => console.log(Number(progress), '%'), 5000);

    const initAccounts = [];

    //Iterate over all blocks
    console.log('Processing blocks...');
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
            if (
                trx.type === 'accountCreation' &&
                trx.credentialType === 'initial'
            ) {
                initAccounts.push(trx.address);
            }
        }
    }

    console.log('Done!');
    console.log(
        initAccounts.length,
        'initial accounts created between',
        from,
        'to',
        to
    );
    console.dir(initAccounts);

    process.exit(0);
})();
