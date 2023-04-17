import { AccountAddress, AccountInfo } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn ts-node <path-to-this-file> [options]

  Required
    --account, -a  An account address to get info from

  Options
    --help,     -h  Displays this message
    --block,    -b  A block to query from, defaults to last final block
    --endpoint, -e  Specify endpoint of the form "address:port", defaults to localhost:20001
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                alias: 'e',
                default: 'localhost:20000',
            },
            account: {
                type: 'string',
                alias: 'a',
                isRequired: true,
            },
            block: {
                type: 'string',
                alias: 'b',
                default: '', // This defaults to LastFinal
            },
        },
    }
);

const [address, port] = cli.flags.endpoint.split(':');
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure(),
    { timeout: 15000 }
);

if (cli.flags.h) {
    cli.showHelp();
}

/// Retrieves information about an account. The function must be provided an
/// account address or a credential registration id.  If a credential registration
/// id is provided, then the node returns the information of the account, which
/// the corresponding credential is (or was) deployed to. An account index as a
/// bigint can also be provided.

/// If there is no account that matches the address or credential id at the
/// provided block, then undefined will be returned.

(async () => {
    const accountAddress = new AccountAddress(cli.flags.account);
    const accountInfo: AccountInfo = await client.getAccountInfo(
        accountAddress,
        cli.flags.block
    );

    console.dir(accountInfo, { depth: null, colors: true });
})();
