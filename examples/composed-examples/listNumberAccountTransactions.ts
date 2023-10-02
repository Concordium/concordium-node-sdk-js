import {
    AccountAddress,
    isTransferLikeSummary,
    unwrap,
} from '@concordium/web-sdk';
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
 * List number of account transactions for each account in a given time span.
 */

(async () => {
    const cs = await client.getConsensusStatus();
    const lastFinal = await client.getBlockInfo(cs.lastFinalizedBlock);

    const from = cli.flags.from ? new Date(cli.flags.from) : cs.genesisTime;
    const to = cli.flags.to ? new Date(cli.flags.to) : lastFinal.blockSlotTime;

    // Unwrap throws error if findFirstFinalizedBlockNoLaterThan returns undefined
    const fromHeight = unwrap(
        await client.findFirstFinalizedBlockNoLaterThan(from)
    ).blockHeight;
    const toHeight = unwrap(
        await client.findFirstFinalizedBlockNoLaterThan(to)
    ).blockHeight;

    const blockStream = client.getFinalizedBlocksFrom(fromHeight, toHeight);

    // Return dictionary
    const dict: Record<string, number> = {};

    // Log progress every 5 seconds
    let progress = 0n;
    setInterval(() => console.log(Number(progress), '%'), 5000);

    // Iterate over all blocks
    console.log('processing blocks...');
    for await (const block of blockStream) {
        progress =
            ((block.height - fromHeight) * 100n) / (toHeight - fromHeight);

        // Get transactions for block
        const trxStream = client.getBlockTransactionEvents(block.hash);

        // For each transaction in the block:
        trxLoop: for await (const trx of trxStream) {
            if (isTransferLikeSummary(trx)) {
                const trxAcc = trx.sender;

                // Loop over account dictionary entries to check if account
                // is already in dictionary:
                for (const [addr, trxSent] of Object.entries(dict)) {
                    const acc = AccountAddress.fromBase58(addr);
                    if (AccountAddress.isAlias(acc, trxAcc)) {
                        dict[addr] = trxSent + 1;
                        break trxLoop;
                    }
                }

                // If account is not in dictionary, then add it:
                dict[AccountAddress.toBase58(trx.sender)] = 1;
            }
        }
    }

    console.log('Done!');

    console.dir(dict);

    process.exit(0);
})();
