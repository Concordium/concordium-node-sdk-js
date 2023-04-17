import { DelegatorInfo, streamToList } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
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

/// Get the registered passive delegators at the end of a given block. In
/// contrast to the `GetPassiveDelegatorsRewardPeriod` which returns delegators
/// that are fixed for the reward period of the block, this endpoint returns
/// the list of delegators that are registered in the block. Any changes to
/// delegators are immediately visible in this list. The stream will end when
/// all the delegators has been returned.

/// If a blockhash is not supplied it will pick the latest finalized block.
/// An optional abort signal can also be provided that closes the stream.

(async () => {
    const delegators: AsyncIterable<DelegatorInfo> =
        client.getPassiveDelegators(cli.flags.block);

    for await (const delegatorInfo of delegators) {
        console.dir(delegatorInfo, { depth: null, colors: true });
    }

    // Can also be collected to a list with:
    const delegatorList: DelegatorInfo[] = await streamToList(delegators);
})();
