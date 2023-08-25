import { credentials } from '@grpc/grpc-js';
import * as SDK from '@concordium/node-sdk';
import meow from 'meow';
import { parseEndpoint } from '../shared/util';

//import * as wCCDModule from './lib/wCCD';

const cli = meow(
    `
  This example uses a generated smart contract client for the wCCD smart contract.

  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,     -i  The index of the smart contract. Defaults to 2059, which is wCCD on testnet.

  Options
    --help,      -h  Displays this message
    --endpoint,  -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,      The subindex of the smart contract. Defaults to 0
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
                default: 2059,
            },
            subindex: {
                type: 'number',
                default: 0,
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const grpcClient = SDK.createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

const contractAddress: SDK.ContractAddress = {
    index: BigInt(cli.flags.index),
    subindex: BigInt(cli.flags.subindex),
};

(async () => {
    // Importing the generated smart contract module client.
    // eslint-disable-next-line import/no-unresolved, @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const wCCDModule = await import('./lib/wCCD').catch((e) => {
        console.error(
            '\nFailed to load the generated wCCD module, did you run the `generate` script?\n'
        );
        throw e;
    });

    const parameter = '010000'; // First 2 bytes for number of tokens to query, 1 byte for the token ID.
    const contract = new wCCDModule.Cis2WCCD(grpcClient, contractAddress);

    contract.dryRun.tokenMetadata(parameter).then((responseHex: string) => {
        console.log({ responseHex });
    });
})();
