import {
    CIS2,
    CIS2Contract,
    ContractAddress,
    AccountAddress,
    EntrypointName,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { parseAddress, parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,            -i  The index of the smart contract
    --from,                 Account address to transfer tokens from.
    --to,                   Address to transfer tokens to. Base58 string for account address, string in the format <index>,<subindex> (f.x. 123,0) for contract address.
    --amount,               Amount of tokens to transfer. Should be specified in non-fractional units, i.e. 1 token of a token with 6 decimals would be 1000000.

  Options
    --help,             -h  Displays this message
    --endpoint,         -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --subindex,             The subindex of the smart contract. Defaults to 0
    --tokenId,          -t  The token ID to query a balance for. Defaults to '', which represents the smallest token ID possible, commonly used for single token contract instances.
    --receiveHookName,      The name of the receive hook on a receiving contract. This is only necessary (and required), if 'to' argument is a contract address.
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
            from: {
                type: 'string',
                isRequired: true,
            },
            to: {
                type: 'string',
                isRequired: true,
            },
            amount: {
                type: 'string',
                isRequired: true,
            },
            tokenId: {
                type: 'string',
                alias: 't',
                default: '',
            },
            receiveHookName: {
                type: 'string',
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

    const tokenId = cli.flags.tokenId;
    const from = AccountAddress.fromBase58(cli.flags.from);
    const toAddress = parseAddress(cli.flags.to);
    const to: CIS2.Receiver = AccountAddress.instanceOf(toAddress)
        ? toAddress
        : {
              address: toAddress,
              hookName: EntrypointName.fromString(
                  cli.flags.receiveHookName ?? ''
              ),
          };

    const result = await contract.dryRun.transfer(from, {
        from,
        to,
        tokenAmount: BigInt(cli.flags.amount),
        tokenId,
    });

    console.log(result);
})();
