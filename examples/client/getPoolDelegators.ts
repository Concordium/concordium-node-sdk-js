import { createConcordiumClient, DelegatorInfo } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required:
    --pool-owner, -p  The BakerId of the pool owner 

  Options
    --help,     -h  Displays this message
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
 * Get the registered delegators of a given pool at the end of a given block.
 * In contrast to the `GetPoolDelegatorsRewardPeriod` which returns delegators
 * that are fixed for the reward period of the block, this endpoint returns
 * the list of delegators that are registered in the block. Any changes to
 * delegators are immediately visible in this list. The stream will end when
 * all the delegators has been returned.

 * If a blockhash is not supplied it will pick the latest finalized block.
 * An optional abort signal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const delegators: AsyncIterable<DelegatorInfo> = client.getPoolDelegators(
        BigInt(cli.flags.poolOwner),
        cli.flags.block
    );

    console.log('Each staking account and the amount of stake they have:\n');
    for await (const delegatorInfo of delegators) {
        console.log(delegatorInfo.account, delegatorInfo.stake);
    }
})();
