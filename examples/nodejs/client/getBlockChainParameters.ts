import { BlockHash, ChainParameters } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

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
 * Retrieves the values of the chain parameters in effect at a specific block.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const cp: ChainParameters = await client.getBlockChainParameters(blockHash);

    const euroPerEnergy = cp.euroPerEnergy.numerator + '/' + cp.euroPerEnergy.denominator;
    console.log('Account creation limit:', cp.accountCreationLimit);
    console.log('Euro per Energy:', euroPerEnergy);

    // Check version of chain parameters
    if (cp.version === 2) {
        console.log('Minimum block time', cp.minBlockTime);
    } else if (cp.version === 1) {
        console.log('Minimum equity capital:', cp.minimumEquityCapital);
    } else {
        console.log('Chain parameters is V0 and does not contain information on minimum equity capital');
    }
    // #endregion documentation-snippet
})();
