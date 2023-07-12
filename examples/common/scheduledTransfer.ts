import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    parseWallet,
    buildAccountSigner,
    SchedulePoint,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';
import { Buffer } from 'buffer/index.js';
import { parseEndpoint } from '../shared/util';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --schedule,   -s  The schedule to use for the transfer, should adhere to the format: AMOUNT:TIMESTAMP where the timestamp is ISO8601 string e.g. "100,2024-01-01T00:00:00Z", to send multiple points, use the flags multiple times.
    --receiver,    -r  The receiving account address
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet

  Options
    --help,         Displays this message
    --memo,     -m  A hex-encoded memo to be included in the transaction, by default there is no memo
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            schedule: {
                type: 'string',
                alias: 's',
                isMultiple: true,
                isRequired: true,
            },
            receiver: {
                type: 'string',
                alias: 'r',
                isRequired: true,
            },
            walletFile: {
                type: 'string',
                alias: 'w',
                isRequired: true,
            },
            memo: {
                type: 'string',
                alias: 'm',
                default: '',
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

function convertSchedulePoint(point: string): SchedulePoint {
    const [amount, timestamp] = point.split(',');
    return {
        timestamp: new Date(timestamp),
        amount: new CcdAmount(BigInt(amount)),
    };
}

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * The following example demonstrates how a scheduled transfer can be created.
 */
(async () => {
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = new AccountAddress(walletExport.value.address);

    const toAddress = new AccountAddress(cli.flags.receiver);
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        sender
    );

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender,
    };

    const schedule = cli.flags.schedule.map(convertSchedulePoint);

    // Include memo if it is given otherwise don't
    let payload = undefined;
    let type;
    if (cli.flags.memo) {
        payload = {
            schedule,
            toAddress,
            memo: new DataBlob(Buffer.from(cli.flags.memo, 'hex')),
        };
        type = AccountTransactionType.TransferWithScheduleAndMemo;
    } else {
        payload = {
            schedule,
            toAddress,
        };
        type = AccountTransactionType.TransferWithSchedule;
    }

    const accountTransaction: AccountTransaction = {
        header: header,
        payload: payload,
        type,
    };

    const signer = buildAccountSigner(walletExport);
    const signature: AccountTransactionSignature = await signTransaction(
        accountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        accountTransaction,
        signature
    );

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();
