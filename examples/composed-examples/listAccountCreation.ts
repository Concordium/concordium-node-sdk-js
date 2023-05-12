import {
    createConcordiumClient,
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
    const time = new Date('11/5/2000');
    console.log(time);
    const bi = await client.findFirstFinalizedBlockNoLaterThan(time);
    console.log(bi);

    const from = new Date(cli.flags.from);
    const to = new Date(cli.flags.to);

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
