import { AccountAddress, AccountInfo, AccountInfoType, BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --account, -a  An account address to get info from

  Options
    --help,         Displays this message
    --block,    -b  A block to query from, defaults to last final block
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
 * Retrieves information about an account. The function must be provided an
 * account address or a credential registration id. If a credential registration
 * id is provided, then the node returns the information of the account, which
 * the corresponding credential is (or was) deployed to. An account index as a
 * bigint can also be provided.
 */

(async () => {
    // #region documentation-snippet
    const accountAddress = AccountAddress.fromBase58(cli.flags.account);
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);
    const accountInfo: AccountInfo = await client.getAccountInfo(accountAddress, blockHash);

    console.log('Account balance:', accountInfo.accountAmount);
    console.log('Account address:', accountInfo.accountAddress);

    // If the account is a delegator print delegator information
    if (accountInfo.type === AccountInfoType.Delegator) {
        console.log('Delegated stake amount:', accountInfo.accountDelegation.stakedAmount);
    }

    if (accountInfo.type === AccountInfoType.Baker) {
        console.log('Validator pool info:', accountInfo.accountBaker);
    }
    // #endregion documentation-snippet
})();
