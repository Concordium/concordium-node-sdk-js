import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    signTransaction,
    TransactionExpiry,
    ConfigureDelegationPayload,
    CcdAmount,
    DelegationTargetType,
    parseWallet,
    buildAccountSigner,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';

import meow from 'meow';
import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --wallet-file, -w  A path to a wallet export file from a Concordium wallet
    --stake,       -s  The amount of stake to delegate in microccd

  Options
    --help,     -h  Displays this message
    --restake,  -r  Whether or not to restake earnings, defaults to true
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
            stake: {
                type: 'number',
                alias: 's',
                isRequired: true,
            },
            restake: {
                type: 'boolean',
                alias: 'r',
                default: true,
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
const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * The following example demonstrates how an account can be configured to
 * be a delegator.
 */

(async () => {
    // #region documentation-snippet
    // Read wallet-file
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(wallet.value.address);
    const signer = buildAccountSigner(wallet);

    const header: AccountTransactionHeader = {
        expiry: TransactionExpiry.futureMinutes(60),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender: sender,
    };

    const configureDelegationPayload: ConfigureDelegationPayload = {
        stake: CcdAmount.fromMicroCcd(cli.flags.stake),
        delegationTarget: {
            delegateType: DelegationTargetType.PassiveDelegation,
        },
        restakeEarnings: cli.flags.restake,
    };

    const configureDelegationTransaction: AccountTransaction = {
        header: header,
        payload: configureDelegationPayload,
        type: AccountTransactionType.ConfigureDelegation,
    };

    // Sign transaction
    const signature = await signTransaction(
        configureDelegationTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        configureDelegationTransaction,
        signature
    );

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
