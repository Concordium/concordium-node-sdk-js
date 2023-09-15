import { credentials } from '@grpc/grpc-js';
import * as SDK from '@concordium/node-sdk';
import * as Gen from '@concordium/ccd-js-gen';
import * as Path from 'node:path';
import * as Url from 'node:url';
import meow from 'meow';
import { parseEndpoint } from '../../shared/util.js';

const cli = meow(
    `
  This example fetches the wCCD smart contract module source from the chain and generates a typescript client for interacting with such a smart contract.

  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,     -i  The index of the smart contract. Defaults to 2059, which is wCCD on Testnet.

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
    console.info(`Fetching instance information for ${contractAddress.index}.`);
    const info = await grpcClient.getInstanceInfo(contractAddress);
    console.info(
        `Fetching smart contract module source with reference '${info.sourceModule.moduleRef}'.`
    );
    const moduleSource = await grpcClient.getModuleSource(info.sourceModule);
    const filePath = Url.fileURLToPath(import.meta.url);
    const outDir = Path.join(Path.dirname(filePath), 'lib');
    console.info(`Generating smart contract module client at '${outDir}'.`);
    await Gen.generateContractClients(moduleSource, 'wCCD', outDir, {
        output: 'TypeScript',
    });
    console.info('Code generation was successful.');
})();
