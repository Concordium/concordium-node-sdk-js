import { BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { TokenId } from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --token, -t  The token to query information about
    --block, -b  A block to query from

  Options
    --help,         Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
    --secure,   -s  Whether to use tls or not. Defaults to false.
`,
    {
        importMeta: import.meta,
        flags: {
            token: {
                type: 'string',
                alias: 't',
                isRequired: true,
            },
            block: {
                type: 'string',
                alias: 'b',
                isRequired: true,
            },
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            secure: {
                type: 'boolean',
                alias: 's',
                default: false,
            },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    cli.flags.secure ? credentials.createSsl() : credentials.createInsecure()
);

/**
 * Retrieves information about token authorizations. The function must be provided a
 * token authorization request object with a token id and a block hash.
 */
(async () => {
    // #region documentation-snippet
    const tokenId = TokenId.fromString(cli.flags.token);
    const blockHash = BlockHash.fromHexString(cli.flags.block);

    const tokenAuthorizationsRequest = {
        tokenId: tokenId,
        blockHash: blockHash,
    };

    const tokenAuthorizations = await client.getTokenAuthorizations(tokenAuthorizationsRequest);

    console.log('Token authorizations:', tokenAuthorizations);
    // #endregion documentation-snippet
})();
