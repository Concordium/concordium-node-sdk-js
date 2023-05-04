import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --filepath, -f  Specifies which file to dump the packages into

  Options
    --help,         Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
    --dump-raw, -d  Specifies whether the node should dump raw packages
`,
    {
        importMeta: import.meta,
        flags: {
            filepath: {
                type: 'string',
                alias: 'f',
                isRequired: true,
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            dumpRaw: {
                type: 'boolean',
                alias: 'd',
                default: false,
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
 * Start dumping packages into the specified file. Only enabled if the node was
 * built with the `network_dump` feature. Rejects if the network dump failed
 * to start.

 * The first argument specifies which file to dump the packages into.
 * The second parameter specifies whether the node should dump raw packages.
 */

(async () => {
    await client.dumpStart(cli.flags.filepath, cli.flags.dumpRaw);
    console.log('Dump successfully started');
})();
