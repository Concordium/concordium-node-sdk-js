import { ArInfo, BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            block: {
                type: 'string',
                alias: 'b',
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Get the anonymity revokers registered as of the end of a given block as
 * a stream.  If a blockhash is not supplied it will pick the latest finalized
 * block. An optional abortSignal can also be provided that closes the stream.

 * Note: A stream can be collected to a list with the streamToList function.
 */

(async () => {
    // #region documentation-snippet
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const ars: AsyncIterable<ArInfo> = client.getAnonymityRevokers(blockHash);

    for await (const ar of ars) {
        console.log('Anonymity Revoker ID:', ar.arIdentity);
        console.log('Anonymity Revoker name:', ar.arDescription.name);
        console.log('Anonymity Revoker description:', ar.arDescription.description, '\n');
    }
    // #endregion documentation-snippet
})();
