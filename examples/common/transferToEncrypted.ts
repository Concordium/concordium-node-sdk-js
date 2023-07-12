import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    CcdAmount,
    NextAccountNonce,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    parseWallet,
    buildAccountSigner,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';
import { parseEndpoint } from '../shared/util';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --amount,      -a  The amount to send
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet

  Options
    --help,         Displays this message
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
    const walletExport = parseWallet(walletFile);
    const sender = new AccountAddress(walletExport.value.address);

    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        sender
    );

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextNonce.nonce,
        sender,
    };

    const transferToEncryptedPayload = {
        amount: new CcdAmount(BigInt(cli.flags.amount)),
    };

    const accountTransaction: AccountTransaction = {
        header: header,
        payload: transferToEncryptedPayload,
        type: AccountTransactionType.TransferToEncrypted,
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
