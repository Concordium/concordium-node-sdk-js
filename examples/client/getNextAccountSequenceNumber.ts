import { parseEndpoint } from '../shared/util.js';
import {
    AccountAddress,
    createConcordiumClient,
    NextAccountNonce,
} from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required:
    --account, -a  The account to get the next nonce for

  Options
    --help,     -h  Displays this message
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20000
`,
    {
        importMeta: import.meta,
        flags: {
            account: {
                type: 'string',
                alias: 'a',
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

const [address, port] = parseEndpoint(cli.flags.endpoint);

const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure()
);

/**
 * Retrieves the next account sequence number (nonce), i.e. the number that must
 * be set in the account transaction header for the next transaction submitted
 * by that account. Along with the sequence number there is a boolean that
 * indicates whether all transactions are finalized. If this is true, then the
 * sequence number is reliable, if not then the next sequence number might be off.
 */

(async () => {
    // #region documentation-snippet
    const account = AccountAddress.fromBase58(cli.flags.account);
    const nextNonce: NextAccountNonce = await client.getNextAccountNonce(
        account
    );

    console.log('Next Nonce:', nextNonce.nonce);
    console.log('Nonce is reliable:', nextNonce.allFinal);
    // #endregion documentation-snippet
})();
