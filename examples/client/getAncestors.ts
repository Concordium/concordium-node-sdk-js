import { HexString, streamToList } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Requiered
    --max-ancestors, -m  Maximum amount of ancestors to get

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            maxAncestors: {
                type: 'number',
                alias: 'm',
                isRequired: true,
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

/// Retrieves all smart contract modules that exists in the state at the end of
/// a given block, as an async iterable of hex strings. A bigint representing
/// the max number of ancestors to get must be provided.  If a blockhash is not
/// supplied it will pick the latest finalized block. An optional abortSignal
/// can also be provided that closes the stream.

(async () => {
    const ancestors: AsyncIterable<HexString> = client.getAncestors(
        BigInt(cli.flags.maxAncestors),
        cli.flags.block
    );

    for await (const ancestor of ancestors) {
        console.dir(ancestor, { depth: null, colors: true });
    }

    // Can also be collected to a list with:
    const ancestorList: HexString[] = await streamToList(ancestors);
})();
