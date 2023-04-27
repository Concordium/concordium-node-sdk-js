import {
    createConcordiumClient,
    CIS2Contract,
    buildBasicAccountSigner,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { parseAddress } from '../shared/util';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --index,            -i  The index of the smart contract
    --privateKey,       -k  The private key for the 'from' account
    --owner,                Account address of the owner account.
    --address,              Address to add as operator. Base58 string for account address, string in the format <index>,<subindex> (f.x. 123,0) for contract address.

  Options
    --help,             -h  Displays this message
    --endpoint,         -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,             The subindex of the smart contract. Defaults to 0
    --updateType,           The type of the update. Can be either 'add' or 'remove'. Defaults to 'add'
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
            privateKey: {
                type: 'string',
                alias: 'k',
                isRequired: true,
            },
            updateType: {
                type: 'string',
                choices: ['add', 'remove'],
                default: 'add',
            },
            owner: {
                type: 'string',
                isRequired: true,
            },
            address: {
                type: 'string',
                isRequired: true,
            },
        },
    }
);

const [nodeAddress, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    nodeAddress,
    Number(port),
    credentials.createInsecure()
);

if (cli.flags.h) {
    cli.showHelp();
}

(async () => {
    const contract = await CIS2Contract.create(client, {
        index: BigInt(cli.flags.index),
        subindex: BigInt(cli.flags.subindex),
    });

    const signer = buildBasicAccountSigner(cli.flags.privateKey);
    const owner = cli.flags.owner;
    const address = parseAddress(cli.flags.address);

    const txHash = await contract.updateOperator(
        {
            senderAddress: owner,
            energy: 10000n,
        },
        {
            type: cli.flags.updateType as 'add' | 'remove',
            address,
        },
        signer
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
