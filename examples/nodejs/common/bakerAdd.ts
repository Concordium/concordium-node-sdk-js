import {
    AccountAddress,
    CcdAmount,
    ConfigureBakerPayload,
    OpenStatus,
    Transaction,
    buildAccountSigner,
    generateBakerKeys,
    parseWallet,
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
    --stake,    -s  The amount of stake to delegate in microccd, defaults to the minimum 14,000,000,000
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
                default: 14000000000,
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
 * be a baker.
 */

(async () => {
    // #region documentation-snippet
    // Read wallet-file
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(wallet.value.address);
    const signer = buildAccountSigner(wallet);

    const header: Transaction.Metadata = {
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const bakerKeys = generateBakerKeys(sender);

    const configureBakerPayload: ConfigureBakerPayload = {
        stake: CcdAmount.fromMicroCcd(cli.flags.stake),
        restakeEarnings: true,
        openForDelegation: OpenStatus.OpenForAll,
        keys: bakerKeys,
        metadataUrl: 'www.url.for.metadata',
        transactionFeeCommission: 10000,
        bakingRewardCommission: 10000,
        finalizationRewardCommission: 100000,
    };

    const transaction = Transaction.configureValidator(configureBakerPayload).addMetadata(header).build();
    const signed = await Transaction.signAndFinalize(transaction, signer);
    const transactionHash = await client.sendTransaction(signed);

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
