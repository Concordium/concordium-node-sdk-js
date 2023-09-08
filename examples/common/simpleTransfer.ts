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
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet

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
    // #region documentation-snippet
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

    // Include memo if it is given otherwise don't
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

    // #region documentation-snippet-sign-transaction
    const accountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransfer,
        type: AccountTransactionType.Transfer,
    };

    // Sign transaction
    const signer = buildAccountSigner(walletExport);
    const signature: AccountTransactionSignature = await signTransaction(
        accountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        accountTransaction,
        signature
    );
    // #endregion documentation-snippet-sign-transaction

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();