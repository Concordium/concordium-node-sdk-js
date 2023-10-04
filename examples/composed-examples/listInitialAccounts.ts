import { unwrap } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { parseEndpoint } from '../shared/util.js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --from, -f  A timestamp of the form "YYYY-MM-DD", defaults to genesis time
    --to,   -t  A timestamp of the form "YYYY-MM-DD", defaults to the timestamp for the last finalized block

  Options
    --help,         Displays this message
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

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * List all initial account creations in a given time span.
 */

(async () => {
    const cs = await client.getConsensusStatus();
    const lastFinal = await client.getBlockInfo(cs.lastFinalizedBlock);

    const from = cli.flags.from ? new Date(cli.flags.from) : cs.genesisTime;
    const to = cli.flags.to ? new Date(cli.flags.to) : lastFinal.blockSlotTime;

    const fromHeight = unwrap(
        await client.findFirstFinalizedBlockNoLaterThan(from)
    ).blockHeight;
    const toHeight = unwrap(
        await client.findFirstFinalizedBlockNoLaterThan(to)
    ).blockHeight;

    const blockStream = client.getFinalizedBlocksFrom(fromHeight, toHeight);

    // Log progress every 5 seconds
    let progress = 0n;
    setInterval(() => console.log(Number(progress), '%'), 5000);

    const initAccounts = [];

    //Iterate over all blocks
    console.log('Processing blocks...');
    for await (const block of blockStream) {
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
