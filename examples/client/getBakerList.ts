import { BakerId, streamToList } from '@concordium/common-sdk';
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

/// Retrieves a stream of ID's for registered bakers on the network at a specific
/// block.  If a blockhash is not supplied it will pick the latest finalized
/// block. An optional abort signal can also be provided that closes the stream.

(async () => {
    const bakerIds: AsyncIterable<BakerId> = client.getBakerList(
        cli.flags.block
    );

    for await (const bakerId of bakerIds) {
        console.dir(bakerId, { depth: null, colors: true });
    }

    // Can also be collected to a list with:
    const bakerIdList: BakerId[] = await streamToList(bakerIds);
})();
