import { parseEndpoint } from '../shared/util.js';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --ip, -i  The ip of the peer to ban.

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
 * Bans the specified peer.
 * Rejects if the action fails.
 */

(async () => {
    // #region documentation-snippet
    await client.banPeer(cli.flags.ip);
    console.log('Specified peer successfully banned');
    // #endregion documentation-snippet
})();
