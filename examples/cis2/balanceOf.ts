import { createConcordiumClient, CIS2Contract } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { parseAddress, parseEndpoint } from '../shared/util';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --address,   -a  An address to get balance for. Base58 string for account address, string in the format <index>,<subindex> (f.x. 123,0) for contract address.
    --index,     -i  The index of the smart contract

  Options
    --help,      -h  Displays this message
    --endpoint,  -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,      The subindex of the smart contract. Defaults to 0
    --tokenId,   -t  The token ID to query a balance for. Defaults to '', which represents the smallest token ID possible, commonly used for single token contract instances.
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
            address: {
                type: 'string',
                isRequired: true,
                alias: 'a',
            },
            tokenId: {
                type: 'string',
                alias: 't',
                default: '',
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
    const contract = await CIS2Contract.create(client, {
        index: BigInt(cli.flags.index),
        subindex: BigInt(cli.flags.subindex),
    });

    const accountBalance = await contract.balanceOf({
        address: parseAddress(cli.flags.address),
        tokenId: cli.flags.tokenId,
    });

    console.log(accountBalance);
})();
