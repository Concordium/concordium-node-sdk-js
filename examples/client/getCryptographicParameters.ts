import { parseEndpoint } from '../shared/util';
import {
    createConcordiumClient,
    CryptographicParameters,
} from '@concordium/node-sdk';
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
 * Retrieves the global cryptographic parameters for the blockchain at a specific
 * block. These are a required input for e.g. creating credentials.
 */

(async () => {
    // #region documentation-snippet
    const parameters: CryptographicParameters =
        await client.getCryptographicParameters(cli.flags.block);

    console.log('Genesis string:', parameters.genesisString);
    // #endregion documentation-snippet
})();
