import {
    ContractAddress,
    InstanceInfo,
    InstanceStateKVPair,
    PendingUpdate,
    streamToList,
} from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required:
    --contract, -c  The index of the contract to query info about

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost
`,
    {
        importMeta: import.meta,
        flags: {
            contract: {
                type: 'number',
                alias: 'c',
                isRequired: true,
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure(),
    { timeout: 15000 }
);

if (cli.flags.h) {
    cli.showHelp();
}

/// Get the exact state of a specific contract instance, streamed as a list of
/// hex string key-value pairs. If a blockhash is not supplied it will pick the
/// latest finalized block. An optional abortSignal can also be provided that
/// closes the stream.

(async () => {
    const contractAddress = {
        index: BigInt(cli.flags.contract),
        subindex: 0n,
    };
    const states: AsyncIterable<InstanceStateKVPair> = client.getInstanceState(
        contractAddress,
        cli.flags.block
    );

    console.dir(states, { depth: null, colors: true });
})();
