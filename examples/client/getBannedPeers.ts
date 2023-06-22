import { parseEndpoint } from '../shared/util';
import { createConcordiumClient, IpAddressString } from '@concordium/node-sdk';
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
 * Get a list of banned peers.
 */

(async () => {
    // #region documentation-snippet
    const bannedPeers: IpAddressString[] = await client.getBannedPeers();
    // #endregion documentation-snippet

    console.log('Banned peers:');
    console.log(bannedPeers);
})();
