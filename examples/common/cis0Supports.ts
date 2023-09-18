import {
    createConcordiumClient,
    cis0Supports,
    ContractAddress,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,                -i  The index of the smart contract
    --supportsQuery,        -q  The support queries to test for. Setting multiple values is supported to test for a list of standards.

  Options
    --help,                 -h  Displays this message
    --endpoint,             -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,             -s  The subindex of the smart contract. Defaults to 0
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
                alias: 's',
                default: 0,
            },
            supportsQuery: {
                type: 'string',
                alias: 'q',
                isRequired: true,
                isMultiple: true,
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

(async () => {
    const contractAddress = ContractAddress.create(
        cli.flags.index,
        cli.flags.subindex
    );
    const response = await cis0Supports(
        client,
        contractAddress,
        cli.flags.supportsQuery
    );

    console.log(response);
})();
