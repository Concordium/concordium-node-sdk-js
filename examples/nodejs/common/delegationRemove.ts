import {
    AccountAddress,
    AccountTransactionType,
    CcdAmount,
    ConfigureDelegationPayload,
    TransactionExpiry,
    buildAccountSigner,
    parseWallet,
    signTransaction,
} from '@concordium/web-sdk';
import { getAccountTransactionHandler } from '@concordium/web-sdk';
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
 * not be a delegator anymore.
 */

(async () => {
    // Read wallet-file
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(wallet.value.address);

    const header = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender: sender,
    };

    const configureDelegationPayload: ConfigureDelegationPayload = {
        stake: CcdAmount.zero(),
    };

    const handler = getAccountTransactionHandler(AccountTransactionType.ConfigureDelegation);
    const configureDelegationTransaction = handler.create(header, configureDelegationPayload);

    // Sign transaction
    const signer = buildAccountSigner(wallet);
    const signature = await signTransaction(configureDelegationTransaction, signer);

    const transactionHash = await client.sendAccountTransaction(configureDelegationTransaction, signature);

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();
