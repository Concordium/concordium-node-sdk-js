import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    buildBasicAccountSigner,
    DeployModulePayload,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    unwrap,
    HexString,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';
import { Buffer } from 'buffer/index.js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --wallet-file, -w  The filepath to the sender's private key
    --module-file, -m  The filepath to the smart contract module

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
            moduleFile: {
                type: 'string',
                alias: 'm',
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
 * The following example demonstrates how a simple transfer can be created.
 */

(async () => {
    const walletFile = JSON.parse(readFileSync(cli.flags.walletFile, 'utf8'));
    const sender = new AccountAddress(unwrap(walletFile.value.address));
    const senderPrivateKey: HexString = unwrap(
        walletFile.value.accountKeys.keys[0].keys[0].signKey
    );

    // Get the wasm file as a buffer.
    const wasmModule = Buffer.from(readFileSync(cli.flags.moduleFile));

    // Note that if built using cargo-concordium `1.0.0`, the version should be added
    // to the payload. In `2.0.0` and newer, the version is prepended into the module
    // itself. To deploy a V0 module, which has been built with cargo-concordium
    // version below 2, you should add the version field to the payload.
    const deployModule: DeployModulePayload = {
        source: wasmModule,
    };

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const deployModuleTransaction: AccountTransaction = {
        header,
        payload: deployModule,
        type: AccountTransactionType.DeployModule,
    };

    // Sign transaction
    const signer = buildBasicAccountSigner(senderPrivateKey);
    const signature: AccountTransactionSignature = await signTransaction(
        deployModuleTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        deployModuleTransaction,
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
