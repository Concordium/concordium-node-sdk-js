import { HexString, streamToList } from '@concordium/common-sdk';
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

/// Retrieves all smart contract modules, as an async iterable, that exists in
/// the state at the end of a given block. If a blockhash is not supplied it
/// will pick the latest finalized block. An optional abortSignal can also be
/// provided that closes the stream.

(async () => {
    const moduleRefs: AsyncIterable<HexString> = client.getModuleList(
        cli.flags.block
    );

    // Prints module references
    for await (const moduleRef of moduleRefs) {
        console.dir(moduleRef, { depth: null, colors: true });
    }

    // Can also be collected to a list with:
    const moduleRefList: HexString[] = await streamToList(moduleRefs);
})();