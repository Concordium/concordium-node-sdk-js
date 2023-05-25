import { parseEndpoint } from '../shared/util';
import { createConcordiumClient, streamToList } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,         Displays this message
    --from,         Block height to start searching from
    --to,           Block height to end search at.
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            from: {
                type: 'number',
            },
            to: {
                type: 'number',
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
 * Find the first account which is not a genesis account on the network the
 * node specified by "--endpoint" is a member of, within the range defined by
 * the flags: "--from" and "--to"
 */

(async () => {
    const from =
        cli.flags.from !== undefined ? BigInt(cli.flags.from) : undefined;
    const to =
        cli.flags.from !== undefined ? BigInt(cli.flags.from) : undefined;
    const [genesisBlockHash] = await client.getBlocksAtHeight(0n);
    const genesisAccounts = await streamToList(
        client.getAccountList(genesisBlockHash)
    );

    const firstAccount = await client.findEarliestFinalized(
        async (bi) => {
            const accounts = await streamToList(client.getAccountList(bi.hash));

            if (accounts.length > genesisAccounts.length) {
                return accounts.filter((a) => !genesisAccounts.includes(a))[0];
            }
        },
        from,
        to
    );

    console.log(firstAccount);
})();
