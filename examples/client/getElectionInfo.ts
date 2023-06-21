import { parseEndpoint } from '../shared/util';
import {
    createConcordiumClient,
    ElectionInfo,
    isElectionInfoV0,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

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
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
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
 * Get information related to the baker election for a particular block.
 * If a blockhash is not supplied it will pick the latest finalized block.
 */

(async () => {
    const electionInfo: ElectionInfo = await client.getElectionInfo(
        cli.flags.block
    );

    // Discard address, convert to tuple:
    const bakers: [bigint, number][] = electionInfo.bakerElectionInfo.map(
        (info) => [info.baker, info.lotteryPower]
    );
    // Sort bakers by lottery power:
    const sortedBakers = bakers.sort((xs, ys) => ys[1] - xs[1]);

    console.log('Bakers sorted by lottery power:', sortedBakers);
    console.log('Election nonce:', electionInfo.electionNonce);

    if (isElectionInfoV0(electionInfo)) {
        console.log('Election difficulty:', electionInfo.electionDifficulty);
    }
})();
