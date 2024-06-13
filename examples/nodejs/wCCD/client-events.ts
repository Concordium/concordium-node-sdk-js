import * as SDK from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

// The generated module could be imported directly like below,
// but for this example it is imported dynamicly to improve
// the error message when not generated.
// import * as wCCDContractClient from './lib/cis2_wCCD.js';

const cli = meow(
    `
  This example uses a generated smart contract client for the wCCD smart contract to display events.

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
const grpcClient = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    scheme === 'https' ? credentials.createSsl() : credentials.createInsecure()
);

const contractAddress = SDK.ContractAddress.create(cli.flags.index, cli.flags.subindex);

(async () => {
    // Importing the generated smart contract module client.
    /* eslint-disable import/no-unresolved */
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const wCCDContractClient = await import('./lib/wCCD_cis2_wCCD.js').catch((e) => {
        /* eslint-enable import/no-unresolved */
        console.error('\nFailed to load the generated wCCD module, did you run the `generate` script?\n');
        throw e;
    });

    // The sender of the transaction, i.e the one updating an operator.
    const senderAccount = SDK.AccountAddress.fromBase58('357EYHqrmMiJBmUZTVG5FuaMq4soAhgtgz6XNEAJaXHW3NHaUf');
    // The parameter adding the wCCD contract as an operator of sender.
    const parameter = [
        {
            update: { type: 'Add' },
            operator: { type: 'Contract', content: contractAddress },
        } as const,
    ];

    // The client for the wCCD contract
    const contract = await wCCDContractClient.create(grpcClient, contractAddress);

    // Dry run the update of operator.
    const result = await wCCDContractClient.dryRunUpdateOperator(contract, parameter, { invoker: senderAccount });
    if (result.tag !== 'success') {
        throw new Error('Unexpected failure');
    }
    for (const traceEvent of result.events) {
        if (
            traceEvent.tag === SDK.TransactionEventTag.Updated ||
            traceEvent.tag === SDK.TransactionEventTag.Interrupted
        ) {
            for (const contractEvent of traceEvent.events) {
                const parsed = wCCDContractClient.parseEvent(contractEvent);
                console.log(parsed);
            }
        }
    }
})();
