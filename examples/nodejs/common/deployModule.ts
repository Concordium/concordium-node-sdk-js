import { AccountAddress, DeployModulePayload, Transaction, buildAccountSigner, parseWallet } from '@concordium/web-sdk';
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
const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * The following example demonstrates how a module can be deployed.
 */

(async () => {
    // #region documentation-snippet
    const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
    const wallet = parseWallet(walletFile);
    const sender = AccountAddress.fromBase58(wallet.value.address);

    // Get the wasm file as a buffer.
    const wasmModule = Buffer.from(readFileSync(cli.flags.moduleFile));

    // Note that if built using cargo-concordium `1.0.0`, the version should be added
    // to the payload. In `2.0.0` and newer, the version is prepended into the module
    // itself. To deploy a V0 module, which has been built with cargo-concordium
    // version below 2, you should add the version field to the payload.
    const deployModule: DeployModulePayload = {
        source: wasmModule,
    };

    const header: Transaction.Metadata = {
        nonce: (await client.getNextAccountNonce(sender)).nonce,
        sender,
    };

    const deployModuleTransaction = Transaction.deployModule(deployModule).addMetadata(header);

    // Sign transaction
    const signer = buildAccountSigner(wallet);
    const signedTransaction = await Transaction.signAndFinalize(deployModuleTransaction, signer);
    const transactionHash = await client.sendSignedTransaction(signedTransaction);

    console.log('Transaction submitted, waiting for finalization...');

    const status = await client.waitForTransactionFinalization(transactionHash);
    console.dir(status, { depth: null, colors: true });
    // #endregion documentation-snippet
})();
