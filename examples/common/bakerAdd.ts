import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    CcdAmount,
    generateBakerKeys,
    ConfigureBakerPayload,
    OpenStatus,
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

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const bakerKeys = generateBakerKeys(sender);

    const configureBakerPayload: ConfigureBakerPayload = {
        stake: new CcdAmount(BigInt(cli.flags.stake)),
        restakeEarnings: true,
        openForDelegation: OpenStatus.OpenForAll,
        keys: bakerKeys,
        metadataUrl: 'www.url.for.metadata',
        transactionFeeCommission: 10000,
        bakingRewardCommission: 10000,
        finalizationRewardCommission: 100000,
    };

    const configureBakerAccountTransaction: AccountTransaction = {
        header: header,
        payload: configureBakerPayload,
        type: AccountTransactionType.ConfigureBaker,
    };

    // Sign transaction
    const signer = buildAccountSigner(wallet);
    const signature = await signTransaction(
        configureBakerAccountTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        configureBakerAccountTransaction,
        signature
    );

    console.log('Transaction submitted, waiting for finalization...');

    await client.waitForTransactionFinalization(transactionHash);

    console.log('Transaction finalized, getting outcome...\n');

    const transactionStatus = await client.getBlockItemStatus(transactionHash);

    if (transactionStatus.status === 'finalized') {
        console.dir(transactionStatus.outcome, { depth: null, colors: true });
    }
})();
