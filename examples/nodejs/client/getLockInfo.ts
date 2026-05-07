import { BlockHash } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { Cbor, LockId } from '@concordium/web-sdk/plt';
import type { LockInfo, LockInfoResponse } from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --lock-id, -l  The lock ID as a Base58Check string

  Options
    --help,              Displays this message
    --block,         -b  A block to query from, defaults to last final block
    --endpoint,      -e  Specify endpoint of the form "address:port", defaults to localhost:20000
    --secure,        -s  Whether to use tls or not. Defaults to false.
`,
    {
        importMeta: import.meta,
        flags: {
            lockId: {
                type: 'string',
                alias: 'l',
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
 * Retrieves information about a protocol level token lock. The function must be provided a lock id.
 */
(async () => {
    // #region documentation-snippet
    const lockId = LockId.fromString(cli.flags.lockId);
    const blockHash = cli.flags.block === undefined ? undefined : BlockHash.fromHexString(cli.flags.block);

    const lockInfoResponse: LockInfoResponse = await client.getLockInfo(lockId, blockHash);
    const lockInfo: LockInfo = Cbor.decode(lockInfoResponse.lockInfo, 'LockInfo');

    console.log('Lock ID:', lockInfo.lock.toJSON());
    console.log(
        'Recipients:',
        lockInfo.recipients.map((recipient) => recipient.toString())
    );
    console.log('Expiry:', lockInfo.expiry.expiry.toString());
    console.log('Funds:', JSON.stringify(lockInfo.funds, null, 2));
    // #endregion documentation-snippet
})();
