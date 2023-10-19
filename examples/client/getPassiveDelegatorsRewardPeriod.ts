import { parseEndpoint } from '../shared/util.js';
import { BlockHash, DelegatorRewardPeriodInfo } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

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

const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Get the fixed passive delegators for the reward period of the given block.
 * In contracts to the `GetPassiveDelegators` which returns delegators registered
 * for the given block, this endpoint returns the fixed delegators contributing
 * stake in the reward period containing the given block.
 * The stream will end when all the delegators has been returned.

 * If a blockhash is not supplied it will pick the latest finalized block.
 * An optional abort signal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    // #region documentation-snippet
    const blockHash =
        cli.flags.block === undefined
            ? undefined
            : BlockHash.fromHexString(cli.flags.block);
    const delegators: AsyncIterable<DelegatorRewardPeriodInfo> =
        client.getPassiveDelegatorsRewardPeriod(blockHash);

    console.log('Each staking account and the amount of stake they have:\n');
    for await (const delegatorInfo of delegators) {
        console.log(delegatorInfo.account, delegatorInfo.stake);
    }
    // #endregion documentation-snippet
})();
