import fs from 'fs';
import path from 'path';
import meow from 'meow';
import * as ed25519 from '@noble/ed25519';
import { credentials } from '@grpc/grpc-js';

import {
    buildAccountSigner,
    CIS4Contract,
    createConcordiumClient,
    HexString,
    parseWallet,
} from '@concordium/node-sdk';
import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,            -i  The index of the smart contract
    --wallet-file,      -w  A path to a wallet export file from a Concordium wallet

  Options
    --help,             -h  Displays this message
    --endpoint,         -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,             The subindex of the smart contract. Defaults to 0
    --data,                 Additional data to include (hex encoded)
    --keys,                 Public keys to register (supports both single and multiple entries). If omitted, a generated keypair will be used (and printed to console)
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            index: {
                type: 'number',
                alias: 'i',
                isRequired: true,
            },
            subindex: {
                type: 'number',
                default: 0,
            },
            walletFile: {
                type: 'string',
                alias: 'w',
                isRequired: true,
            },
            data: {
                type: 'string',
            },
            keys: {
                isMultiple: true,
                type: 'string',
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

const walletFile = fs.readFileSync(
    path.resolve(process.cwd(), cli.flags.walletFile),
    'utf8'
);
const wallet = parseWallet(walletFile);
const signer = buildAccountSigner(wallet);

(async () => {
    const contract = await CIS4Contract.create(client, {
        index: BigInt(cli.flags.index),
        subindex: BigInt(cli.flags.subindex),
    });

    let keys: HexString[] = cli.flags.keys ?? [];
    if (!cli.flags.keys?.length) {
        const prv = ed25519.utils.randomPrivateKey();
        const pub = Buffer.from(await ed25519.getPublicKey(prv)).toString(
            'hex'
        );

        console.log('Generated keypair:', {
            privateKey: Buffer.from(prv).toString('hex'),
            publicKey: pub,
        });
        keys = [pub];
    }

    const txHash = await contract.registerRevocationKeys(
        signer,
        {
            senderAddress: wallet.value.address,
            energy: 10000n,
        },
        keys,
        cli.flags.data
    );

    console.log('Submitted transaction with hash:', txHash);
    process.stdout.write('Waiting for transaction finalization');

    const interval = setInterval(() => {
        process.stdout.write('.');
    }, 1000);

    const blockHash = await client.waitForTransactionFinalization(
        txHash,
        60000
    );
    process.stdout.write('\n');

    clearInterval(interval);
    console.log('Transaction finalized in block with hash:', blockHash);
})();
