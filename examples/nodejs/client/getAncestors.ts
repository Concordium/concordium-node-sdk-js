import { BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Retrieves all ancestors that exists in the state at the end of a given block,
 * as an async iterable of hex strings. A bigint representing the max number
 * of ancestors to get must be provided. If a blockhash is not supplied it
 * will pick the latest finalized block. An optional abortSignal can also be
 * provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const ancestors: AsyncIterable<BlockHash.Type> = client.getAncestors(BigInt(cli.flags.maxAncestors), blockHash);
    // #endregion documentation-snippet

    console.log('Block hashes of ancestors of input block:');
    for await (const ancestor of ancestors) {
        console.log(ancestor);
    }
})();
