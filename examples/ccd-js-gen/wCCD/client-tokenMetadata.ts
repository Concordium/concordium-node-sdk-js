import { credentials } from '@grpc/grpc-js';
import * as SDK from '@concordium/node-sdk';
import meow from 'meow';
import { parseEndpoint } from '../../shared/util';

// The generated module could be imported directly like below,
// but for this example it is imported dynamicly to improve
// the error message when not generated.
// import * as wCCDModule from './lib/wCCD';

const cli = meow(
    `
  This example uses a generated smart contract client for the wCCD smart contract.

  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,     -i  The index of the smart contract. Defaults to 2059, which is wCCD on testnet.

  Options
    --help,      -h  Displays this message
    --endpoint,  -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "<scheme>://<address>:<port>". Defaults to 'http://localhost:20000'
    --subindex,      The subindex of the smart contract. Defaults to 0
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'http://localhost:20000',
            },
            index: {
                type: 'number',
                alias: 'i',
                default: 2059,
            },
            subindex: {
                type: 'number',
                default: 0,
            },
        },
    }
);

const [address, port, scheme] = parseEndpoint(cli.flags.endpoint);
const grpcClient = SDK.createConcordiumClient(
    address,
    Number(port),
    scheme === 'https' ? credentials.createSsl() : credentials.createInsecure()
);

const contractAddress: SDK.ContractAddress = {
    index: BigInt(cli.flags.index),
    subindex: BigInt(cli.flags.subindex),
};

(async () => {
    // Importing the generated smart contract module client.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // prettier-ignore
    const wCCDModule = await import('./lib/wCCD').catch((e) => {// eslint-disable-line import/no-unresolved
        console.error(
            '\nFailed to load the generated wCCD module, did you run the `generate` script?\n'
        );
        throw e;
    });

    const parameter = '010000'; // First 2 bytes for number of tokens to query, 1 byte for the token ID.
    const contract = new wCCDModule.Cis2WCCD(grpcClient, contractAddress);

    const responseHex = await contract.dryRun.tokenMetadata(parameter);
    console.log({ responseHex });
})();
