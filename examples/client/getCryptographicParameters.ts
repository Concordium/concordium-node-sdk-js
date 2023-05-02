import {
    createConcordiumClient,
    CryptographicParameters,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves the global cryptographic parameters for the blockchain at a specific
 * block. These are a required input for e.g. creating credentials.
 */

(async () => {
    const parameters: CryptographicParameters =
        await client.getCryptographicParameters(cli.flags.block);

    console.log('Genesis string:', parameters.genesisString);
    console.log('On-chain commitment key:', parameters.onChainCommitmentKey);
})();
