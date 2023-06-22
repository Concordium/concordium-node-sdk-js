import { parseEndpoint } from '../shared/util';
import { createConcordiumClient, PeerInfo } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
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
 * Get a list of the peers that the node is connected to and associated network
 * related information for each peer.
 */

(async () => {
    // #region documentation-snippet
    const peerInfo: PeerInfo[] = await client.getPeersInfo();
    // #endregion documentation-snippet

    console.dir(peerInfo, { depth: null, colors: true });
})();
