import { createConcordiumClient, ModuleReference } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';
import fs from 'fs'

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --module,   -m  The module reference of the module from which we wish to get the schema
    --out-path, -o  The path to write the module schema to

  Options
    --help,         Displays this message
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
 * Gets an embedded schema from a provided module.
 */

(async () => {
    // #region documentation-snippet
    const moduleRef = new ModuleReference(cli.flags.module);
    const schema = await client.getEmbeddedSchema(moduleRef);

    fs.writeFileSync(cli.flags.outPath, schema);

    console.log('Wrote schema to file: ', cli.flags.outPath);
    // #endregion documentation-snippet
})();
