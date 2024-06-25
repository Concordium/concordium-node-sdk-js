import { BlockHash, ContractAddress, HexString } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Get the value at a specific key of a contract state as a hex string.
 * In contrast to `GetInstanceState` this is more efficient, but requires the
 * user to know the specific key to look for. If a blockhash is not supplied
 * it will pick the latest finalized block.
 */

(async () => {
    // #region documentation-snippet
    const contract = ContractAddress.create(cli.flags.contract);
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);

    const state: HexString = await client.instanceStateLookup(contract, cli.flags.key, blockHash);
    // #endregion documentation-snippet

    console.log(state);
})();
