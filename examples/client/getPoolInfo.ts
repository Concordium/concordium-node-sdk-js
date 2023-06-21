import { parseEndpoint } from '../shared/util';
import { BakerPoolStatus, createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrives various information on the specified baker pool, at the end of the
 * specified block.
 */

(async () => {
    const bakerPool: BakerPoolStatus = await client.getPoolInfo(
        BigInt(cli.flags.poolOwner),
        cli.flags.block
    );

    console.log('Open status:', bakerPool.poolInfo.openStatus);
    console.log('Baker address:', bakerPool.bakerAddress);
    console.log(
        'CCD provided by the baker to the pool:',
        bakerPool.bakerEquityCapital / 1000000n
    );
    console.log(
        'CCD provided by the delegators to the pool:',
        bakerPool.delegatedCapital / 1000000n
    );
    console.log(
        'Total capital in CCD of ALL pools:',
        bakerPool.allPoolTotalCapital / 1000000n
    );
    console.log('Pool commision rates:', bakerPool.poolInfo.commissionRates);
})();