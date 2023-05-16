import {
    ContractAddress,
    HexString,
    createConcordiumClient,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required:
    --key,      -k  The key from which to get the value from the contract state
    --contract, -c  The index of the contract to query info about

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            key: {
                type: 'string',
                alias: 'k',
                isRequired: true,
            },
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
 * Get the value at a specific key of a contract state as a hex string.
 * In contrast to `GetInstanceState` this is more efficient, but requires the
 * user to know the specific key to look for. If a blockhash is not supplied
 * it will pick the latest finalized block.
 */

(async () => {
    const contract: ContractAddress = {
        index: BigInt(cli.flags.contract),
        subindex: 0n,
    };

    const state: HexString = await client.instanceStateLookup(
        contract,
        cli.flags.key,
        cli.flags.block
    );

    console.log(state);
})();
