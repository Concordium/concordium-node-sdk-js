import { Base58String, streamToList } from '@concordium/common-sdk';
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
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20001
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

/// Retrieves the accounts that exists at the end of a given block as an async
/// iterable. If a blockhash is not supplied it will pick the latest finalized
/// block. An optional abortSignal can also be provided that closes the stream.

(async () => {
    const accounts: AsyncIterable<Base58String> = client.getAccountList(
        cli.flags.block
    );

    for await (const account of accounts) {
        console.dir(account, { depth: null, colors: true });
    }

    // Can also be collected to a list with:
    const accountList: Base58String[] = await streamToList(accounts);
})();
