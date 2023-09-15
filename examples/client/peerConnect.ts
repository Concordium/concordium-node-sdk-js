import { parseEndpoint } from '../shared/util.js';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --ip,   -i  The ip of the peer to connect to.
    --port, -p  The port of the peer to connect to.

  Options
    --help,         Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            ip: {
                type: 'string',
                alias: 'i',
                isRequired: true,
            },
            port: {
                type: 'number',
                alias: 'p',
                isRequired: true,
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
 * Suggest to connect the specified address as a peer. This, if successful,
 * adds the peer to the list of given addresses, otherwise rejects. Note that
 * the peer might not be connected to instantly, in that case the node will
 * try to establish the connection in the near future.
 */

(async () => {
    // #region documentation-snippet
    await client.peerConnect(cli.flags.ip, cli.flags.port);
    console.log('Successfully connected to peer');
    // #endregion documentation-snippet
})();
