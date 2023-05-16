import {
    ChainParameters,
    createConcordiumClient,
    isChainParametersV1,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            block: {
                type: 'string',
                alias: 'b',
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

// Split endpoint on last colon
const lastColonIndex = cli.flags.endpoint.lastIndexOf(':');
const address = cli.flags.endpoint.substring(0, lastColonIndex);
const port = cli.flags.endpoint.substring(lastColonIndex + 1);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves the values of the chain parameters in effect at a specific block.
 */

(async () => {
    const cp: ChainParameters = await client.getBlockChainParameters(
        cli.flags.block
    );

    const euroPerEnergy =
        cp.euroPerEnergy.numerator + '/' + cp.euroPerEnergy.denominator;
    console.log('Election difficulty:', cp.electionDifficulty);
    console.log('Account creation limit:', cp.accountCreationLimit);
    console.log('Euro per Energy:', euroPerEnergy);

    // Check if the ChainParameters is V1, which it will be for all newer blocks
    if (isChainParametersV1(cp)) {
        console.log('Minimum equity capital:', cp.minimumEquityCapital);
    } else {
        console.log(
            'Chain parameters is V0 and does not contain information on minimum equity capital'
        );
    }
})();
