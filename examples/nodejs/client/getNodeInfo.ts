import { NodeInfo } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

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

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Get information about the node.

 * The `NodeInfo` includes information of:
 *  - Meta information, such as the, version of the node, type of the node, uptime
 *    and the local time of the node.
 *  - NetworkInfo, which yields data such as the node id, packets sent/received,
 *    average bytes per second sent/received.
 *  - ConsensusStatus. The `ConsensusStatus` returned depends on if the node supports
 *    the protocol on chain and whether the node is configured as a baker or not.
 */

(async () => {
    // #region documentation-snippet
    const nodeInfo: NodeInfo = await client.getNodeInfo();
    // #endregion documentation-snippet

    console.dir(nodeInfo, { depth: null, colors: true });
})();
