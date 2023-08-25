import { credentials } from '@grpc/grpc-js';
import * as SDK from '@concordium/node-sdk';
import meow from 'meow';
import { parseEndpoint } from '../shared/util';

// Importing the generated smart contract module client.
// eslint-disable-next-line import/no-unresolved
import * as Module from './lib/module';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,     -i  The index of the smart contract

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

const contract = new Module.SmartContractTestBench(grpcClient, contractAddress);

contract.dryRun.getAccountAddress('');
