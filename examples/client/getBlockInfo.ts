import { parseEndpoint } from '../shared/util.js';
import {
    BlockHash,
    BlockInfo,
    createConcordiumClient,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
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
            block: {
                type: 'string',
                alias: 'b',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = createConcordiumClient(
    address,
    port,
    credentials.createInsecure()
);

/**
 * Retrieves information about a specific block.
 * If a blockhash is not supplied it will pick the latest finalized block.
 */

(async () => {
    // #region documentation-snippet
    const blockHash =
        cli.flags.block === undefined
            ? undefined
            : BlockHash.fromHexString(cli.flags.block);
    const blockInfo: BlockInfo = await client.getBlockInfo(blockHash);
    // #endregion documentation-snippet

    console.dir(blockInfo, { depth: null, colors: true });
})();
