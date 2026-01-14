import { AccountAddress, CcdAmount, DataBlob, Transaction, cborEncode } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../../shared/util.js';
import * as sponsor from './sponsor.js';
import * as wallet from './wallet.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --sender-wallet-file,       A path to a wallet export file from a Concordium wallet which acts like the transaction subject/sender.
    --sponsor-wallet-file,      A path to a wallet export file from a Concordium wallet which acts like the transaction sponsor.

    --token-id,             -t  The unique id of the token to transfer
    --amount,               -a  The amount of tokens to transfer
    --recipient,            -r  The recipient address in base58 format

  Options
    --endpoint,             -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --tls,                      Whether to use tls or not. Defaults to false.

    --memo,                 -m  A memo for the transfer

    --help,                 -h  Displays this message
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            tls: {
                type: 'boolean',
                default: false,
            },

            sponsorWalletFile: {
                type: 'string',
            },
            senderWalletFile: {
                type: 'string',
            },

            amount: {
                type: 'number',
                alias: 'a',
                isRequired: true,
            },
            recipient: {
                type: 'string',
                alias: 'r',
                isRequired: true,
            },
            memo: {
                type: 'string',
                alias: 'm',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const grpcClient = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    cli.flags.secure ? credentials.createSsl() : credentials.createInsecure()
);

// We simulate the different components part of the transaction sponsoring process, i.e.
// - a sponsor service which signs on behalf of the sponsor
sponsor.configure(cli.flags.sponsorWalletFile!, grpcClient);
// - a wallet which signs on behalf of the sender
wallet.configure(cli.flags.senderWalletFile!, grpcClient);

// Parse the cli arguments into values used for the transaction payload.
const amount = CcdAmount.fromCcd(cli.flags.amount);
const recipient = AccountAddress.fromBase58(cli.flags.recipient);
const memo = cli.flags.memo ? new DataBlob(cborEncode(cli.flags.memo)) : undefined;

// #region documentation-snippet
// 1.
// Connect to the application that submits the transaction to get the sender account. The sponsor needs to know this, at
// it goes into the transaction header along with the sequence number of that account.
const sender = wallet.getAccount();

// 2.
// Create PLT transfer transaction
const transaction = memo
    ? Transaction.transfer({ amount, toAddress: recipient }, memo)
    : Transaction.transfer({ amount, toAddress: recipient });

// 3.
// Submit the transaction to the sponsor service, which validates the transaction details and adds a sponsor signature
// on the transaction.
const response = await sponsor.sponsorTransaction(sender, Transaction.toJSON(transaction));
const sponsoredTransaction = Transaction.signableFromJSON(response);

// 4.
// Submit the sponsored transaction through the application signing on behalf of the sender.
const transactionHash = await wallet.submitSponsoredTransaction(sponsoredTransaction);
console.log(`Transaction submitted with hash: ${transactionHash.toString()}`);

const result = await grpcClient.waitForTransactionFinalization(transactionHash);
console.log('Transaction finalized:', result);
// #endregion documentation-snippet
