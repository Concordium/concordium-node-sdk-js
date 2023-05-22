import { parseEndpoint } from '../shared/util';
import { createConcordiumClient, HexString } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
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

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves all smart contract modules, as an async iterable, that exists in
 * the state at the end of a given block. If a blockhash is not supplied it
 * will pick the latest finalized block. An optional abortSignal can also be
 * provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    // #region documentation-snippet
    const moduleRefs: AsyncIterable<HexString> = client.getModuleList(
        cli.flags.block
    );

    // Prints module references
    for await (const moduleRef of moduleRefs) {
        console.log(moduleRef);
    }
    // #endregion documentation-snippet
})();
