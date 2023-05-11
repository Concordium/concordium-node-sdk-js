import { createConcordiumClient, IpInfo } from '@concordium/node-sdk';
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
 * Get the identity providers registered as of the end of a given block as a
 * stream. If a blockhash is not supplied it will pick the latest finalized block.
 * An optional abortSignal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    const ips: AsyncIterable<IpInfo> = client.getIdentityProviders(
        cli.flags.block
    );

    for await (const ip of ips) {
        console.log('Identity Provider ID:', ip.ipIdentity);
        console.log('Identity Provider Description:', ip.ipDescription, '\n');
    }
})();
