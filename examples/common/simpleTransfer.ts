import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    BlockItemStatus,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    parseWallet,
    buildAccountSigner,
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
    --amount,      -a  The amount to send
    --receiver,    -r  The receivnig account address
    --wallet-file, -w  The filepath to the sender's private key

  Options
    --help,         Displays this message
    --memo,     -m  A hex-encoded memo to be included in the transaction, by default there is no memo
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            amount: {
                type: 'number',
                alias: 'a',
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

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = new AccountAddress(wallet.value.address);

    const toAddress = new AccountAddress(cli.flags.receiver);
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        sender
    );

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender,
    };

    let simpleTransfer = undefined;
    if (cli.flags.memo) {
        simpleTransfer = {
            amount: new CcdAmount(BigInt(cli.flags.amount)),
            toAddress,
            memo: new DataBlob(Buffer.from(cli.flags.memo, 'hex')),
        };
    } else {
        simpleTransfer = {
            amount: new CcdAmount(BigInt(cli.flags.amount)),
            toAddress,
        };
    }

    const accountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: AccountTransactionType.Transfer,
    };

    // Sign transaction
    const signer = buildAccountSigner(wallet);
    const signature: AccountTransactionSignature = await signTransaction(
        accountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        accountTransaction,
        signature
    );

    await client.waitForTransactionFinalization(transactionHash);

    console.log('Transaction finalized, getting outcome...\n');

    const transactionStatus: BlockItemStatus = await client.getBlockItemStatus(
        transactionHash
    );

    if (transactionStatus.status === 'finalized') {
        console.dir(transactionStatus.outcome, { depth: null, colors: true });
    }
})();
