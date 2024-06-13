import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

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

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Queries the node for its health
 */
(async () => {
    // #region documentation-snippet
    const check = await client.healthCheck();
    if (check.isHealthy) {
        console.log('The node is healthy!');
    } else {
        console.log('The node is not healthy');
        console.log('Message: ' + check.message);
    }
    // #endregion documentation-snippet
})();
