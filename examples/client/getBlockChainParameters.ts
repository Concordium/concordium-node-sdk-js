import { ChainParameters } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --account, -a  The account to get transactions from

  Options
    --help,     -h  Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            account: {
                type: 'string',
                alias: 'a',
                isRequired: true,
            },
            blockhash: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure(),
    { timeout: 15000 }
);

if (cli.flags.h) {
    cli.showHelp();
}

/// Retrieves the values of the chain parameters in effect at a specific block.

(async () => {
    const chainParameters: ChainParameters =
        await client.getBlockChainParameters(cli.flags.blockhash);

    console.dir(chainParameters, { depth: null, colors: true });

    // The chainParameters contain information that can then be extracted:
    chainParameters.electionDifficulty;
})();
