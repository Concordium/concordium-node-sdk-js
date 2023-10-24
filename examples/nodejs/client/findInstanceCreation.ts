import { parseEndpoint } from '../shared/util.js';
import { ContractAddress } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,    -i  The index of the contract to search for.

  Options
    --help,         Displays this message
    --subindex,     Subindex of the contract to search for. Defaults to 0.
    --from,         Block height to start searching from. Defaults to 0.
    --to,           Block height to end search at. Defaults to latest finalized.
    --endpoint, -e  Specify endpoint of the form "address:port". Defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            from: {
                type: 'number',
            },
            to: {
                type: 'number',
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
 * Find the block the contract specified by "--index" was created in.
 */

(async () => {
    // #region documentation-snippet
    const from =
        cli.flags.from !== undefined ? BigInt(cli.flags.from) : undefined;
    const to =
        cli.flags.from !== undefined ? BigInt(cli.flags.from) : undefined;
    const address = ContractAddress.create(cli.flags.index, cli.flags.subindex);
    const instanceCreation = await client.findInstanceCreation(
        address,
        from,
        to
    );
    // #endregion documentation-snippet

    console.log(instanceCreation);
})();
