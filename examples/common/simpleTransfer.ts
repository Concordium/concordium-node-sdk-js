import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    BlockItemStatus,
    buildBasicAccountSigner,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    unwrap,
    HexString,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';
import { Buffer } from 'buffer/index.js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --amount,      -a  The amount to send
    --receiver,    -r  The receivnig account address
    --wallet-file, -w  The filepath to the sender's private key

  Options
    --help,         Displays this message
    --memo      -m  A hex-encoded memo to be included in the transaction, by default there is no memo
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

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    const walletFile = JSON.parse(readFileSync(cli.flags.walletFile, 'utf8'));
    const sender = new AccountAddress(unwrap(walletFile.value.address));
    const senderPrivateKey: HexString = unwrap(
        walletFile.value.accountKeys.keys[0].keys[0].signKey
    );

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
    const signer = buildBasicAccountSigner(senderPrivateKey);
    const signature: AccountTransactionSignature = await signTransaction(
        accountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        accountTransaction,
        signature
    );

    console.log('Transaction submitted, waiting for finalization...');

    await client.waitForTransactionFinalization(transactionHash);

    console.log('Transaction finalized, getting outcome...\n');

    const transactionStatus: BlockItemStatus = await client.getBlockItemStatus(
        transactionHash
    );

    if (transactionStatus.status === 'finalized') {
        console.dir(transactionStatus.outcome, { depth: null, colors: true });
    }
})();
