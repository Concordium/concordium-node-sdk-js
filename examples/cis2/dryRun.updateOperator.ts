import { CIS2Contract, ContractAddress } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { parseAddress, parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,     -i  The index of the smart contract
    --owner,     -o  Owner address. Base58 string for account address, string in the format <index>,<subindex> (f.x. 123,0) for contract address.
    --address,   -a  Address to add as operator of owner. Base58 string for account address, string in the format <index>,<subindex> (f.x. 123,0) for contract address.

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
            owner: {
                type: 'string',
                isRequired: true,
                alias: 'o',
            },
            address: {
                type: 'string',
                isRequired: true,
                alias: 'a',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

(async () => {
    const contract = await CIS2Contract.create(
        client,
        ContractAddress.create(cli.flags.index, cli.flags.subindex)
    );

    const owner = parseAddress(cli.flags.owner);
    const address = parseAddress(cli.flags.address);

    const result = await contract.dryRun.updateOperator(owner, {
        type: 'add',
        address,
    });

    console.log(result);
})();
