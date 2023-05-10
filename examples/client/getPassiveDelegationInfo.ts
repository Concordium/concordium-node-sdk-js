import {
    createConcordiumClient,
    PassiveDelegationStatus,
} from '@concordium/node-sdk';
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
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
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
 * Retrieves information about the passive delegation, including the total
 * capital delegation and the current commission rates for passive delegation,
 * at the end of the specified block.
 */

(async () => {
    const passiveDelegationInfo: PassiveDelegationStatus =
        await client.getPassiveDelegationInfo(cli.flags.block);

    console.log(
        'CCD provided by the delegators to the pool:',
        passiveDelegationInfo.delegatedCapital / 1000000n
    );
    console.log(
        'Total capital in CCD of ALL pools:',
        passiveDelegationInfo.allPoolTotalCapital / 1000000n
    );
    console.log('Pool commision rates:', passiveDelegationInfo.commissionRates);
})();