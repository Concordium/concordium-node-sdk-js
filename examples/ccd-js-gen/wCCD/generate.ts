import { credentials } from '@grpc/grpc-js';
import * as SDK from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
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

  Options
    --help,      -h  Displays this message
    --endpoint,  -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const grpcClient = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

const wCCDModuleRef = SDK.ModuleReference.fromHexString(
    'cc285180b45d7695db75c29dee004d2e81a1383880c9b122399bea809196c98f'
);

(async () => {
    console.info(
        `Fetching smart contract module source with reference '${wCCDModuleRef.moduleRef}'.`
    );
    const moduleSource = await grpcClient.getModuleSource(wCCDModuleRef);
    const filePath = Url.fileURLToPath(import.meta.url);
    const outDir = Path.join(Path.dirname(filePath), 'lib');
    console.info(`Generating smart contract module client at '${outDir}'.`);
    await Gen.generateContractClients(moduleSource, 'wCCD', outDir, {
        output: 'TypeScript',
    });
    console.info('Code generation was successful.');
})();
