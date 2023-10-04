import { parseEndpoint } from '../shared/util.js';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --time,     -t  The time to search for, specified as ms since UNIX epoch.

  Options
    --help,         Displays this message
    --from,         Block height to start searching from. Defaults to 0.
    --to,           Block height to end search at. Defaults to latest finalized.
    --endpoint, -e  Specify endpoint of the form "address:port". Defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            time: {
                type: 'number',
                alias: 't',
                isRequired: true,
            },
            from: {
                type: 'number',
            },
            to: {
                type: 'number',
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
const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Find the first block finalized after the time specified by "--time"
 */

(async () => {
    // #region documentation-snippet
    const from =
        cli.flags.from !== undefined ? BigInt(cli.flags.from) : undefined;
    const to =
        cli.flags.from !== undefined ? BigInt(cli.flags.from) : undefined;
    const time = new Date(cli.flags.time);
    const blockInfo = await client.findFirstFinalizedBlockNoLaterThan(
        time,
        from,
        to
    );
    // #endregion documentation-snippet

    console.log(blockInfo);
})();
