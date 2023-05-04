import {
    AccountAddress,
    createConcordiumClient,
    isRpcError,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

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
 * Find account creation time, block and transaction.
 */

(async () => {
    const account = new AccountAddress(cli.flags.account);

    let start = 0n;
    let end = (await client.getBlockInfo()).blockHeight;

    // Binary search for account creation block
    while (start < end) {
        const mid = (start + end) / 2n;
        const block = (await client.getBlocksAtHeight(mid))[0];

        console.log('processing block at height:', mid);

        try {
            await client.getAccountInfo(account, block);
            end = mid;
        } catch (e) {
            if (isRpcError(e) && e.code == 'NOT_FOUND') {
                start = mid + 1n;
            } else {
                throw e;
            }
        }
    }

    const accBlock = (await client.getBlocksAtHeight(start))[0];

    // Is the account actually in the block? Will throw otherwise
    try {
        await client.getAccountInfo(account, accBlock);
    } catch (e) {
        if (isRpcError(e) && e.code === 'NOT_FOUND') {
            console.log('Account does not exist on chain');
        }
    }

    const blockInfo = await client.getBlockInfo(accBlock);
    const summaries = client.getBlockTransactionEvents(accBlock);
    for await (const summary of summaries) {
        if (
            summary.type === 'accountCreation' &&
            summary.address === account.address
        ) {
            console.log('\nAccount created in block:', accBlock);
            console.log('Timestamp of block:', blockInfo.blockSlotTime);
            console.log(
                'Account created at transaction with hash:',
                summary.hash
            );
        }
    }
})();
