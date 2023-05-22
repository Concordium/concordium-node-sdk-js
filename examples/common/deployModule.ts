import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    DeployModulePayload,
    signTransaction,
    TransactionExpiry,
    createConcordiumClient,
    parseWallet,
    buildAccountSigner,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import { readFileSync } from 'node:fs';
import { Buffer } from 'buffer/index.js';
import { parseEndpoint } from '../shared/util';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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
    const wallet = parseWallet(walletFile);
    const sender = new AccountAddress(wallet.value.address);

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
    const signer = buildAccountSigner(wallet);
    const signature: AccountTransactionSignature = await signTransaction(
        deployModuleTransaction,
        signer
    );

    const transactionHash = await client.sendAccountTransaction(
        deployModuleTransaction,
        signature
    );

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
})();
