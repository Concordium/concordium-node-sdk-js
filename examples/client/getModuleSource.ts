import { parseEndpoint } from '../shared/util';
import { createConcordiumClient, ModuleReference } from '@concordium/node-sdk';
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

const client = createConcordiumClient(
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
    const ref = new ModuleReference(cli.flags.module);
    const versionedSource = await client.getModuleSource(ref, cli.flags.block);
    // #endregion documentation-snippet

    fs.writeFileSync(cli.flags.outPath, versionedSource.source);

    console.log('Written module source to:', cli.flags.outPath);
})();
