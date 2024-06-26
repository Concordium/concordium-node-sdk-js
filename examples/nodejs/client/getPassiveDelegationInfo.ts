import { BlockHash, CcdAmount, PassiveDelegationStatus } from '@concordium/web-sdk';
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
 * Retrieves information about the passive delegation, including the total
 * capital delegation and the current commission rates for passive delegation,
 * at the end of the specified block.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const passiveDelegationInfo: PassiveDelegationStatus = await client.getPassiveDelegationInfo(blockHash);

    console.log('CCD provided by the delegators to the pool:', CcdAmount.toCcd(passiveDelegationInfo.delegatedCapital));
    console.log('Total capital in CCD of ALL pools:', CcdAmount.toCcd(passiveDelegationInfo.allPoolTotalCapital));
    console.log('Pool commision rates:', passiveDelegationInfo.commissionRates);
    // #endregion documentation-snippet
})();
