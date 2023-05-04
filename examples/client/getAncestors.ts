import { createConcordiumClient, HexString } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --max-ancestors, -m  Maximum amount of ancestors to get

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
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
 * Retrieves all ancestors that exists in the state at the end of a given block,
 * as an async iterable of hex strings. A bigint representing the max number
 * of ancestors to get must be provided. If a blockhash is not supplied it
 * will pick the latest finalized block. An optional abortSignal can also be
 * provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const ancestors: AsyncIterable<HexString> = client.getAncestors(
        BigInt(cli.flags.maxAncestors),
        cli.flags.block
    );

    console.log('Block hashes of ancestors of input block:');
    for await (const ancestor of ancestors) {
        console.log(ancestor);
    }
})();
