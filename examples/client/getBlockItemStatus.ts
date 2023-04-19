import { BlockItemStatus } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --transaction, -t  A transaction to get status from

  Options
    --help,     -h  Displays this message
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
            transaction: {
                type: 'string',
                alias: 't',
                isRequired: true,
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

/// Retrieves status information about a block item (transaction).

(async () => {
    const blockItemStatus: BlockItemStatus = await client.getBlockItemStatus(
        cli.flags.transaction
    );

    console.log('Status of the transaction');
    // Note that there will be no outcomes for a transaction that has only been received:
    if (blockItemStatus.status === 'received') {
        // blockItemStatus will have no "status" field
        console.dir(blockItemStatus, { depth: null, colors: true });
    }
    // If the transaction has only been committed, then there is a list of outcomes:
    if (blockItemStatus.status === 'committed') {
        // Potentially multiple outcomes
        console.dir(blockItemStatus.outcomes, { depth: null, colors: true });
    }
    // If the transaction has been finalized, then there is exactly one outcome:
    if (blockItemStatus.status === 'finalized') {
        // Only one outcome

        /// The outcome is contains the blockHash and the summary of
        /// the block item. The summary can be of three different types,
        /// `accountTransaction`, `accountCreation` or `UpdateTransaction`,
        /// which is denoted by the type field.
        const { summary } = blockItemStatus.outcome;

        if (summary.type === 'accountTransaction') {
            // The block item is an account transaction
            switch (summary.transactionType) {
                case 'transfer':
                    // The transaction is a simple transfer
                    const { amount, to } = summary.transfer;
                    break;
                case 'failed':
                    // The transaction was rejected, in which case the transaction
                    // type is still available under the failedTransactionType field
                    const { failedTransactionType, rejectReason } = summary;
                    break;
                default:
                    // Another transaction kind encountered
                    const otherType = summary.transactionType;
            }
        } else if (summary.type === 'updateTransaction') {
            // The block item is a chain update
            const { effectiveTime, payload } = summary;
        } else if (summary.type === 'accountCreation') {
            // The block item is an account creation.
            const { type, regId, address } = summary;
        }

        console.dir(blockItemStatus.outcome, { depth: null, colors: true });
    }
})();
