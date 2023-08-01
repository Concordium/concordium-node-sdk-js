import fs from 'fs';
import path from 'path';
import meow from 'meow';
import { credentials } from '@grpc/grpc-js';
import * as ed25519 from '@noble/ed25519';

import {
    buildAccountSigner,
    CIS4,
    CIS4Contract,
    createConcordiumClient,
    HexString,
    parseWallet,
} from '@concordium/node-sdk';
import { parseEndpoint } from '../shared/util';

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
    --holder-pub-key,   -k  Public key (hex encoded) identifying the holder. If omitted, a random keypair will be generated and printed to the console.
    --holder-revoke,        Whether holder can revoke credential or not. Defaults to false.
    --metadata-url,     -m  Url pointing to metadata of the credential. Should be specified in a real use-case, but can be omitted for testing purposes.
    --expires,              Sets credential to expire in 2 years.
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
            holderPubKey: {
                type: 'string',
            },
            holderRevoke: {
                type: 'boolean',
                default: false,
            },
            metadataUrl: {
                type: 'string',
                default: '',
            },
            expires: {
                type: 'boolean',
                default: false,
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

(async () => {
    const contract = await CIS4Contract.create(client, {
        index: BigInt(cli.flags.index),
        subindex: BigInt(cli.flags.subindex),
    });
    const signer = buildAccountSigner(wallet);

    let holderPubKey: HexString;
    if (!cli.flags.holderPubKey) {
        const prv = ed25519.utils.randomPrivateKey();
        const pub = Buffer.from(await ed25519.getPublicKey(prv)).toString(
            'hex'
        );

        console.log('Generated keypair:', {
            privateKey: Buffer.from(prv).toString('hex'),
            publicKey: pub,
        });
        holderPubKey = pub;
    } else {
        holderPubKey = cli.flags.holderPubKey;
    }

    const validFrom = new Date();
    const validUntil = cli.flags.expires
        ? new Date(new Date().setFullYear(validFrom.getFullYear() + 2)) // 2 years in the future
        : undefined;

    const credential: CIS4.CredentialInfo = {
        holderPubKey,
        holderRevocable: cli.flags.holderRevoke,
        validFrom,
        validUntil,
        metadataUrl: { url: cli.flags.metadataUrl },
    };

    const txHash = await contract.registerCredential(
        signer,
        {
            senderAddress: wallet.value.address,
            energy: 10000n,
        },
        credential,
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
