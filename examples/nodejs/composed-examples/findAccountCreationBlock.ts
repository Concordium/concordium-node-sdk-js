import { AccountAddress, isRpcError } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --account, -a  An account address to get info from

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            account: {
                type: 'string',
                alias: 'a',
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
 * Find account creation time, block and transaction.
 */

(async () => {
    const account = AccountAddress.fromBase58(cli.flags.account);

    const accBlock = await client.findEarliestFinalized(async (bi) => {
        try {
            console.log('Processing block at:', bi.height);
            await client.getAccountInfo(account, bi.hash);
            return bi.hash;
        } catch (e) {
            if (isRpcError(e) && e.code == 'NOT_FOUND') {
                //return undefined
            } else {
                throw e;
            }
        }
    });

    if (accBlock === undefined) {
        throw Error('Account not found!');
    }

    const blockInfo = await client.getBlockInfo(accBlock);
    const summaries = client.getBlockTransactionEvents(accBlock);

    console.log('\nAccount created in block:', accBlock);
    console.log('Timestamp of block:', blockInfo.blockSlotTime);

    // If account is not a genesis account print account creation transaction hash
    for await (const summary of summaries) {
        if (summary.type === 'accountCreation' && AccountAddress.equals(summary.address, account)) {
            console.log('Hash of transaction that created the account:', summary.hash);
        }
    }
})();
