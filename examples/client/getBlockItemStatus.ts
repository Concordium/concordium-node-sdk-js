import { parseEndpoint } from '../shared/util';
import { BlockItemStatus, createConcordiumClient } from '@concordium/node-sdk';
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

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves status information about a block item (transaction).

 * The outcome contains the blockHash and the summary of
 * the block item. The summary can be of three different types,
 * `accountTransaction`, `accountCreation` or `UpdateTransaction`,
 * which is denoted by the type field.
 */

(async () => {
    const blockItemStatus: BlockItemStatus = await client.getBlockItemStatus(
        cli.flags.transaction
    );

    console.log('Status of the transaction:', cli.flags.transaction, '\n');
    // Note that there will be no outcomes for a transaction that has only been received:
    if (blockItemStatus.status === 'received') {
        console.log(
            'blockItemStatus is "received" and therefore has no "status" field'
        );
    }
    // If the transaction has only been committed, then there is a list of outcomes:
    if (blockItemStatus.status === 'committed') {
        console.log(
            'blockItemStatus is "committed" and therefore there are potentially multiple outcomes'
        );
    }
    // If the transaction has been finalized, then there is exactly one outcome:
    if (blockItemStatus.status === 'finalized') {
        console.log(
            'blockItemStatus is "finalized" and therefore there is exactly one outcome \n'
        );

        const { summary } = blockItemStatus.outcome;

        if (summary.type === 'accountTransaction') {
            console.log('The block item is an account transaction');

            switch (summary.transactionType) {
                case 'transfer':
                    // The transaction is a simple transfer
                    const { amount, to } = summary.transfer;
                    const ccdAmount = Number(amount / 1000000n);
                    console.log(ccdAmount, 'CCD sent to', to);
                    break;
                case 'failed':
                    // The transaction was rejected, in which case the transaction
                    // type is still available under the failedTransactionType field
                    const { failedTransactionType, rejectReason } = summary;
                    console.log(
                        'Transaction of type "' +
                            failedTransactionType +
                            '" failed because:',
                        rejectReason.tag
                    );
                    break;
                default:
                    // Another transaction kind encountered
                    const otherType = summary.transactionType;
                    console.log('The transaction is of type:', otherType);
            }
        } else if (summary.type === 'updateTransaction') {
            console.log('The block item is a chain update');

            const { effectiveTime, payload } = summary;
            console.log('EffectiveTime:', effectiveTime);
            console.log('Payload:', payload);
            console;
        } else if (summary.type === 'accountCreation') {
            console.log('The block item is an account creation');
            console.log('Account created with address:', summary.address);
        }
    }
})();
