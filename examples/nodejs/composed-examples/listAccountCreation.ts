import { streamToList, unwrap } from '@concordium/web-sdk';
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
 * List all account creations in a given time span.
 */

(async () => {
    const cs = await client.getConsensusStatus();
    const lastFinal = await client.getBlockInfo(cs.lastFinalizedBlock);

    const from = cli.flags.from ? new Date(cli.flags.from) : cs.genesisTime;
    const to = cli.flags.to ? new Date(cli.flags.to) : lastFinal.blockSlotTime;

    // Unwrap throws error if findFirstFinalizedBlockNoLaterThan returns undefined
    const fromBlock = unwrap(
        await client.findFirstFinalizedBlockNoLaterThan(from)
    ).blockHash;
    const toBlock = unwrap(
        await client.findFirstFinalizedBlockNoLaterThan(to)
    ).blockHash;

    // In this case it's more convenient to work with lists rather than streams,
    // so we convert them
    const fromAccounts = await streamToList(client.getAccountList(fromBlock));
    const toAccounts = await streamToList(client.getAccountList(toBlock));

    // We want to find the accounts that are in toAccounts but not fromAccounts,
    // so we take the set-wise difference
    const diff = toAccounts.filter(
        (element) => !fromAccounts.includes(element)
    );

    console.log('All account created between', from, 'and', to, '\n');
    for (const account of diff) {
        console.dir(account);
    }

    console.log('\nLength of fromAccounts:', fromAccounts.length);
    console.log('Length of toAccounts:', toAccounts.length);
    console.log('Length of diff:', diff.length);
})();
