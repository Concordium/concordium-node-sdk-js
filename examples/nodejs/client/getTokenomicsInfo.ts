import { BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required:
    --pool-owner, -p  The BakerId of the pool owner

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            poolOwner: {
                type: 'number',
                alias: 'p',
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
 * Retrieves the current amount of funds in the system at a specific block,
 * and the state of the special accounts.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const tokenomics = await client.getTokenomicsInfo(blockHash);

    // Protocol version 4 expanded the amount of information in the response, so one should check the type to access that.
    // This information includes information about the payday and total amount of funds staked.
    if (tokenomics.version === 1) {
        console.log('Next payday time:', tokenomics.nextPaydayTime);
        console.log('Total staked amount by bakers and delegators', tokenomics.totalStakedCapital);
    }

    // While other information is in both V1 and V0
    console.log('The amount in the baking reward account:', tokenomics.bakingRewardAccount);
    console.log('Total amount in existence:', tokenomics.totalAmount);
    // #endregion documentation-snippet
})();
