import { BlockHash, ElectionInfo } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

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

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Get information related to the baker election for a particular block.
 * If a blockhash is not supplied it will pick the latest finalized block.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const electionInfo: ElectionInfo | null = await client.getElectionInfo(blockHash);

    if (electionInfo === null) {
        console.log('No election info available');
        return;
    }

    // Discard address, convert to tuple:
    const bakers: [bigint, number][] = electionInfo.bakerElectionInfo.map((info) => [info.baker, info.lotteryPower]);
    // Sort bakers by lottery power:
    const sortedBakers = bakers.sort((xs, ys) => ys[1] - xs[1]);

    console.log('Bakers sorted by lottery power:', sortedBakers);
    console.log('Election nonce:', electionInfo.electionNonce);

    if (electionInfo.version === 0) {
        console.log('Election difficulty:', electionInfo.electionDifficulty);
    }
    // #endregion documentation-snippet
})();
