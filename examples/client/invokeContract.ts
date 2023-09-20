import { parseEndpoint } from '../shared/util.js';
import {
    AccountAddress,
    BlockHash,
    CcdAmount,
    ContractAddress,
    ContractContext,
    ContractTraceEvent,
    Parameter,
    createConcordiumClient,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required:
    --receive,  -r  The entrypoint (receive function) that shall be invoked
    --contract, -c  The index of the contract to query info about

  Options
    --help,      -h  Displays this message
    --block,     -b  A block to query from, defaults to last final block
    --amount,    -a  The amount of microCCD to invoke the contract with, defaults to 0
    --energy,    -n  The maximum amount of energy to allow for execution, defaults to 1000000
    --invoker,   -i  The address of the invoker, defaults to the zero account address
    --endpoint,  -e  Specify endpoint of the form "address:port", defaults to localhost:20000
    --parameter, -p  The serialized parameters that the contract will be invoked with, as a 
                     hex string. Will default to an empty hex string meaning no parameters
`,
    {
        importMeta: import.meta,
        flags: {
            receive: {
                type: 'string',
                alias: 'r',
                isRequired: true,
            },
            contract: {
                type: 'number',
                alias: 'c',
                isRequired: true,
            },
            block: {
                type: 'string',
                alias: 'b',
            },
            amount: {
                type: 'number',
                alias: 'a',
            },
            energy: {
                type: 'number',
                alias: 'n',
            },
            invoker: {
                type: 'string',
                alias: 'i',
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            parameter: {
                type: 'string',
                alias: 'p',
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

/**
 * Used to simulate a contract update, and to trigger view functions.

 * Note that some of the parts of the context are optional:
 *  - blockHash: defaults to last finalized block
 *  - energy: defaults to 1,000,000 NRG.
 */

(async () => {
    // #region documentation-snippet
    // Handle the optional arguments
    const invoker = cli.flags.invoker
        ? AccountAddress.fromBase58(cli.flags.invoker)
        : undefined;
    const amount = cli.flags.amount
        ? new CcdAmount(BigInt(cli.flags.amount))
        : undefined;
    const parameter = cli.flags.parameter
        ? Parameter.fromHexString(cli.flags.parameter)
        : undefined;
    const energy = cli.flags.energy ? BigInt(cli.flags.energy) : undefined;

    const contract = ContractAddress.create(cli.flags.contract);
    const context: ContractContext = {
        // Required
        method: cli.flags.receive,
        contract,
        // Optional
        invoker,
        amount,
        parameter,
        energy,
    };
    const blockHash =
        cli.flags.block === undefined
            ? undefined
            : BlockHash.fromHexString(cli.flags.block);

    const result = await client.invokeContract(context, blockHash);

    // We can inspect the result
    if (result.tag === 'failure') {
        console.log('Invoke was unsuccesful');
        console.log('The reason the update failed:', result.reason);
    } else if (result.tag === 'success') {
        console.log('Invoke was succesful');

        const returnValue: string | undefined = result.returnValue; // If the invoked method has return value
        if (returnValue) {
            console.log('The return value of the invoked method:', returnValue);
        }

        const events: ContractTraceEvent[] = result.events;
        console.log('A list of effects that the update would have:');
        console.dir(events, { depth: null, colors: true });
    }
    // #endregion documentation-snippet
})();
