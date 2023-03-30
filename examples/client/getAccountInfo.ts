import { AccountAddress, AccountInfo } from '@concordium/common-sdk';
import { createConcordiumClient } from '@concordium/node-sdk';
import { credentials } from '@grpc/grpc-js';

import meow from 'meow';

const cli = meow(
    `
  Usage
    $ yarn example getAccountInfo

  Options
    --help,      -h  Displays this message
    --endpoint,  -e  Specify endpoint of the form "address:port"
    --account,   -a  An account address to get info from
    --blockhash, -b  A blockhash to query the info from
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: {
                type: 'string',
                shortFlag: 'e',
                default: 'node.testnet.concordium.com:20000',
            },
            account: {
                type: 'string',
                short: 'a',
                default: '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G',
            },
            blockhash: {
                type: 'string',
                short: 'b',
                default:
                    'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e',
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

/// Retrieves information about an account. The function must be provided an account address or a credential registration id.
/// If a credential registration id is provided, then the node returns the information of the account,
/// which the corresponding credential is (or was) deployed to.
/// If there is no account that matches the address or credential id at the provided
/// block, then undefined will be returned.

(async () => {
    const accountAddress = new AccountAddress(cli.flags.account);
    const accountInfo: AccountInfo = await client.getAccountInfo(
        accountAddress,
        cli.flags.blockhash
    );

    console.dir(accountInfo, { depth: null, colors: true });
})();
