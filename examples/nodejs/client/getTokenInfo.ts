import { BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { TokenId, TokenInfo } from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --token, -t  The token to query information about

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
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

const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

/**
 * Retrieves information about an protocol level token (PLT). The function must be provided a
 * token id.
 */
(async () => {
    // #region documentation-snippet
    const tokenId = TokenId.fromString(cli.flags.token);
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const tokenInfo: TokenInfo = await client.getTokenInfo(tokenId, blockHash);

    console.log('Total token supply:', tokenInfo.state.totalSupply);
    console.log('Token issuer:', tokenInfo.state.issuer);
    // #endregion documentation-snippet
})();
