import { AccountAddress, TransactionHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --account, -a  The account to get transactions from

  Options
    --help,         Displays this message
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
 * Get a list of non-finalized transaction hashes for a given account. This
 * endpoint is not expected to return a large amount of data in most cases,
 * but in bad network conditions it might. The stream will end when all the
 * non-finalized transaction hashes have been returned. An optional abort signal
 * can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    // #region documentation-snippet
    const accountAddress = AccountAddress.fromBase58(cli.flags.account);
    const transactions: AsyncIterable<TransactionHash.Type> = client.getAccountNonFinalizedTransactions(accountAddress);
    // #endregion documentation-snippet

    for await (const transaction of transactions) {
        console.log(transaction);
    }
})();
