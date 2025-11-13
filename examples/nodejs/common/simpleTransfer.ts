import {
    AccountAddress,
    AccountTransactionSignature,
    AccountTransactionType,
    CcdAmount,
    DataBlob,
    NextAccountNonce,
    TransactionExpiry,
    buildAccountSigner,
    parseWallet,
    signTransaction,
 getAccountTransactionHandler } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { readFileSync } from 'node:fs';

import { parseEndpoint } from '../shared/util.js';

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
const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    // #region documentation-snippet
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const walletExport = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(walletExport.value.address);

    const toAddress = AccountAddress.fromBase58(cli.flags.receiver);
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(sender);

    const header = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: nextNonce.nonce,
        sender,
    };

    // Include memo if it is given otherwise don't
    let simpleTransfer = undefined;
    let handler;
    let accountTransaction;
    if (cli.flags.memo) {
        simpleTransfer = {
            amount: CcdAmount.fromMicroCcd(cli.flags.amount),
            toAddress,
            memo: new DataBlob(Buffer.from(cli.flags.memo, 'hex')),
        };
        handler = getAccountTransactionHandler(AccountTransactionType.TransferWithMemo);
        accountTransaction = handler.create(header, simpleTransfer);
    } else {
        simpleTransfer = {
            amount: CcdAmount.fromMicroCcd(cli.flags.amount),
            toAddress,
        };
        handler = getAccountTransactionHandler(AccountTransactionType.Transfer);
        accountTransaction = handler.create(header, simpleTransfer);
    }

    // #region documentation-snippet-sign-transaction

    // Sign transaction
    const signer = buildAccountSigner(walletExport);
    const signature: AccountTransactionSignature = await signTransaction(accountTransaction, signer);

    const transactionHash = await client.sendAccountTransaction(accountTransaction, signature);
    // #endregion documentation-snippet-sign-transaction

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
