import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    CcdAmount,
    ConfigureBakerPayload,
    TransactionExpiry,
    buildAccountSigner,
    parseWallet,
    signTransaction,
} from '@concordium/web-sdk';
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
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet

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

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * The following example demonstrates how an account can be configured to
 * not be a baker anymore.
 */

(async () => {
    // Read wallet-file
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(wallet.value.address);
    const signer = buildAccountSigner(wallet);

    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const configureBakerPayload: ConfigureBakerPayload = {
        stake: CcdAmount.zero(),
    };

    const configureBakerAccountTransaction: AccountTransaction = {
        header: header,
        payload: configureBakerPayload,
        type: AccountTransactionType.ConfigureBaker,
    };

    // Sign transaction
    const signature = await signTransaction(configureBakerAccountTransaction, signer);

    const transactionHash = await client.sendAccountTransaction(configureBakerAccountTransaction, signature);

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();
