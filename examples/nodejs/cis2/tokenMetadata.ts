import { CIS2Contract, ContractAddress } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import fetch from 'node-fetch';

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
            tokenId: {
                type: 'string',
                alias: 't',
                default: '',
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

if (cli.flags.h) {
    cli.showHelp();
}

(async () => {
    const contract = await CIS2Contract.create(client, ContractAddress.create(cli.flags.index, cli.flags.subindex));

    const url = await contract.tokenMetadata(cli.flags.tokenId);
    console.log('url object:', url);

    const res = await fetch(url.url);
    const metadata = await res.json();
    console.log('metadata:', metadata);
})();
