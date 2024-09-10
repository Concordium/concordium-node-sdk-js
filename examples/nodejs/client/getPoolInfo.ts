import { BakerPoolStatus, BlockHash, CcdAmount } from '@concordium/web-sdk';
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

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Retrives various information on the specified baker pool, at the end of the
 * specified block.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const bakerPool: BakerPoolStatus = await client.getPoolInfo(BigInt(cli.flags.poolOwner), blockHash);

    console.log('Open status:', bakerPool.poolInfo?.openStatus);
    console.log('Baker address:', bakerPool.bakerAddress);
    console.log(
        'CCD provided by the baker to the pool:',
        bakerPool.bakerEquityCapital !== undefined ? CcdAmount.toCcd(bakerPool.bakerEquityCapital) : undefined
    );
    console.log(
        'CCD provided by the delegators to the pool:',
        bakerPool.delegatedCapital !== undefined ? CcdAmount.toCcd(bakerPool.delegatedCapital) : undefined
    );
    console.log('Total capital in CCD of ALL pools:', CcdAmount.toCcd(bakerPool.allPoolTotalCapital));
    console.log('Pool commision rates:', bakerPool.poolInfo?.commissionRates);
    // #endregion documentation-snippet
})();
