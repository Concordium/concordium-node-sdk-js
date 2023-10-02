import { parseEndpoint } from '../shared/util.js';
import {
    BlockHash,
    ContractAddress,
    createConcordiumClient,
    InstanceStateKVPair,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required:
    --contract, -c  The index of the contract to query info about

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            contract: {
                type: 'number',
                alias: 'c',
                isRequired: true,
            },
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
 * Get the exact state of a specific contract instance, streamed as a list of
 * hex string key-value pairs. If a blockhash is not supplied it will pick the
 * latest finalized block. An optional abortSignal can also be provided that
 * closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    // #region documentation-snippet
    const contractAddress = ContractAddress.create(cli.flags.contract);
    const blockHash =
        cli.flags.block === undefined
            ? undefined
            : BlockHash.fromHexString(cli.flags.block);
    const states: AsyncIterable<InstanceStateKVPair> = client.getInstanceState(
        contractAddress,
        blockHash
    );
    // #endregion documentation-snippet

    for await (const state of states) {
        console.dir(state, { depth: null, colors: true });
    }
})();
