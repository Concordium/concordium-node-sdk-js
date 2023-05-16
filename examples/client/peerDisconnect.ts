import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

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

// Split endpoint on last colon
const lastColonIndex = cli.flags.endpoint.lastIndexOf(':');
const address = cli.flags.endpoint.substring(0, lastColonIndex);
const port = cli.flags.endpoint.substring(lastColonIndex + 1);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Disconnect from the peer and remove them from the given addresses list
 * if they are on it. Resolves if the request was processed successfully.
 * Otherwise rejects.
 */

(async () => {
    await client.peerDisconnect(cli.flags.ip, cli.flags.port);

    console.log('Successfully disconnected from peer');
})();
