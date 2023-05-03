import {
    AccountAddress,
    createConcordiumClient,
    HexString,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

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

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Get a list of non-finalized transaction hashes for a given account. This
 * endpoint is not expected to return a large amount of data in most cases,
 * but in bad network conditions it might. The stream will end when all the
 * non-finalized transaction hashes have been returned. An optional abort signal
 * can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const accountAddress = new AccountAddress(cli.flags.account);
    const transactions: AsyncIterable<HexString> =
        client.getAccountNonFinalizedTransactions(accountAddress);

    for await (const transaction of transactions) {
        console.dir(transaction, { depth: null, colors: true });
    }
})();
