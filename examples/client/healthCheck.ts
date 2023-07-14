import { parseEndpoint } from '../shared/util';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,         Displays this message
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
 * Queries the node for its health
 */
(async () => {
    // #region documentation-snippet
    const isHealthy = await client.healthCheck();
    if (isHealthy) {
        console.log('The node is healthy!');
    } else {
        console.log('The node is not healthy');
    }
    // #endregion documentation-snippet
})();
