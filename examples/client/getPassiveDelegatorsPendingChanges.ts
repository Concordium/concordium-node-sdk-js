import { parseEndpoint } from '../shared/util.js';
import {
    BlockHash,
    createConcordiumClient,
    DelegatorInfo,
} from '@concordium/node-sdk';
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

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Get the registered passive delegators at the end of a given block. In
 * contrast to the `GetPassiveDelegatorsRewardPeriod` which returns delegators
 * that are fixed for the reward period of the block, this endpoint returns
 * the list of delegators that are registered in the block. Any changes to
 * delegators are immediately visible in this list. The stream will end when
 * all the delegators has been returned.

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
    const delegators: AsyncIterable<DelegatorInfo> =
        client.getPassiveDelegators(blockHash);

    console.log('Each staking account and the amount of stake they have:\n');
    for await (const delegatorInfo of delegators) {
        if (delegatorInfo.pendingChange) {
            console.log('Account:', delegatorInfo.account);
            console.log('Pending Change:', delegatorInfo.pendingChange, '\n');
        }
    }
    // #endregion documentation-snippet
})();
