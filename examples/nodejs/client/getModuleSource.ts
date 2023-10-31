import { parseEndpoint } from '../shared/util.js';
import { BlockHash, ModuleReference } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import fs from 'fs';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required:
    --module,   -m  The module reference of the module that you want the source for
    --out-path, -o  The path to write the module source to

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            module: {
                type: 'string',
                alias: 'm',
                isRequired: true,
            },
            outPath: {
                type: 'string',
                alias: 'o',
                isRequired: true,
            },
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

const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Gets the source of a module on the chain.
 * Note that this returns the raw bytes of the source, as a HexString.
 */

(async () => {
    // #region documentation-snippet
    const ref = ModuleReference.fromHexString(cli.flags.module);
    const blockHash =
        cli.flags.block === undefined
            ? undefined
            : BlockHash.fromHexString(cli.flags.block);
    const versionedSource = await client.getModuleSource(ref, blockHash);
    // #endregion documentation-snippet

    fs.writeFileSync(cli.flags.outPath, versionedSource.source);

    console.log('Written module source to:', cli.flags.outPath);
})();
