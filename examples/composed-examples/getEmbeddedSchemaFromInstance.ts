import { ContractAddress, createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';
import fs from 'fs';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --index,    -i  The index of the smart contract
    --out-path, -o  The path to write the module schema to

  Options
    --help,         Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
    --subindex,     The subindex of the smart contract. Defaults to 0
`,
    {
        importMeta: import.meta,
        flags: {
            index: {
                type: 'number',
                alias: 'i',
                isRequired: true,
            },
            subindex: {
                type: 'number',
                default: 0,
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
    const contractAddress = ContractAddress.create(
        cli.flags.index,
        cli.flags.subindex
    );
    const info = await client.getInstanceInfo(contractAddress);
    const moduleRef = info.sourceModule;
    const schema = await client.getEmbeddedSchema(moduleRef);
    // #endregion documentation-snippet

    fs.writeFileSync(cli.flags.outPath, schema);

    console.log('Wrote schema to file: ', cli.flags.outPath);
})();
