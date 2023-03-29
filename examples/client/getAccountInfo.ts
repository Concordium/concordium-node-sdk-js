import { AccountAddress, AccountInfo } from '@concordium/common-sdk';
import { createConcordiumClient } from '../../packages/nodejs/src/clientV2';
import { credentials } from '@grpc/grpc-js/';

const args = process.argv.slice(2);

const [address, port] = args[0]
    ? args[0].split(':')
    : ['node.testnet.concordium.com', '20000'];
const client = createConcordiumClient(
    address,
    Number(port),
    credentials.createInsecure(),
    { timeout: 15000 }
);

const account = args[1]
    ? args[1]
    : '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G';
const blockHash = args[2]
    ? args[2]
    : 'fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e';

/// Retrieves information about an account. The function must be provided an account address or a credential registration id.
/// If a credential registration id is provided, then the node returns the information of the account,
/// which the corresponding credential is (or was) deployed to.
/// If there is no account that matches the address or credential id at the provided
/// block, then undefined will be returned.

(async () => {
    const accountAddress = new AccountAddress(account);
    const accountInfo: AccountInfo = await client.getAccountInfo(
        accountAddress,
        blockHash
    );

    console.dir(accountInfo, { depth: null, colors: true });
})();
