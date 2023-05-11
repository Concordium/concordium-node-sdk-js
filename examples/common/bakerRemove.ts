import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    buildBasicAccountSigner,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    CcdAmount,
    unwrap,
    HexString,
    ConfigureBakerPayload,
    parseWallet,
    buildAccountSigner,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --wallet-file, -w  The filepath to the sender's private key

  Options
    --help,     -h  Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            walletFile: {
                type: 'string',
                alias: 'w',
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
 * The following example demonstrates how a configure delegation transaction can be created.
 * Note that although all the fields are optional, they are all required, when becoming a delegator.
 */

(async () => {
    // Read wallet-file
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = new AccountAddress(wallet.value.address);
    const signer = buildAccountSigner(wallet);

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const configureBakerPayload: ConfigureBakerPayload = {
        stake: new CcdAmount(0n),
    };

    const configureBakerAccountTransaction: AccountTransaction = {
        header: header,
        payload: configureBakerPayload,
        type: AccountTransactionType.ConfigureBaker,
    };

    // Sign transaction
    const signature = await signTransaction(
        configureBakerAccountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        configureBakerAccountTransaction,
        signature
    );

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();
