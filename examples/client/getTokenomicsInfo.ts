import { isRewardStatusV1, createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

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

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves the current amount of funds in the system at a specific block,
 * and the state of the special accounts.
 */

(async () => {
    const tokenomics = await client.getTokenomicsInfo(cli.flags.block);

    // Protocol version 4 expanded the amount of information in the response, so one should check the type to access that.
    // This information includes information about the payday and total amount of funds staked.
    if (isRewardStatusV1(tokenomics)) {
        console.log('Next payday time:', tokenomics.nextPaydayTime);
        console.log(
            'Total staked amount by bakers and delegators',
            tokenomics.totalStakedCapital
        );
    }

    // While other information is in both V1 and V0
    console.log(
        'The amount in the baking reward account:',
        tokenomics.bakingRewardAccount
    );
    console.log('Total amount in existence:', tokenomics.totalAmount);
})();
