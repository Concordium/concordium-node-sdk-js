import { AccountAddress, Payload } from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import {
    CborAccountAddress,
    CborEpoch,
    Lock,
    LockController,
    Token,
    TokenAmount,
    TokenId,
} from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint, parseKeysFile } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --recipient,   -r  Account(s) allowed to receive funds from the lock (repeat for multiple)
    --token,       -t  Token id the lock can hold and fund with
    --expiry,      -x  Lock expiry as seconds since Unix epoch
    --amount,      -a  Token amount to fund in decimal notation

  Options
    --help,              Displays this message
    --endpoint,      -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --secure,        -s  Whether to use tls or not. Defaults to false.
    --wallet-file,   -w  A path to a wallet export file from a Concordium wallet. If not supplied, --sender must be provided and only the payload is created and serialized.
    --sender,            Sender account address. Required when --wallet-file is omitted.
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: { type: 'string', alias: 'e', default: 'localhost:20000' },
            secure: { type: 'boolean', alias: 's', default: false },
            walletFile: { type: 'string', alias: 'w' },
            sender: { type: 'string' },
            recipient: { type: 'string', alias: 'r', isRequired: true, isMultiple: true },
            token: { type: 'string', alias: 't', isRequired: true },
            expiry: { type: 'number', alias: 'x', isRequired: true },
            amount: { type: 'number', alias: 'a', isRequired: true },
        },
    }
);

const [address, port] = parseEndpoint(cli.flags.endpoint);
const client = new ConcordiumGRPCNodeClient(
    address,
    Number(port),
    cli.flags.secure ? credentials.createSsl() : credentials.createInsecure()
);

(async () => {
    // #region documentation-snippet

    // Parse the lock configuration and fund operation arguments
    const recipients = cli.flags.recipient.map((r) =>
        CborAccountAddress.fromAccountAddress(AccountAddress.fromBase58(r))
    );
    const tokenId = TokenId.fromString(cli.flags.token);
    const expiry = CborEpoch.fromEpochSeconds(cli.flags.expiry);

    // Resolve token decimals from chain before parsing the fund amount
    const token = await Token.fromId(client, tokenId);
    const fundAmount = TokenAmount.fromDecimal(cli.flags.amount, token.info.state.decimals);

    if (cli.flags.walletFile !== undefined) {
        // Read the wallet file to get the sender account and signer
        const [sender, signer] = parseKeysFile(cli.flags.walletFile);

        // Build the lock configuration. Here the sender is granted all capabilities,
        // but this can be adjusted to fit the desired access control model.
        const config = {
            recipients,
            expiry,
            controller: LockController.simpleV0(
                [
                    {
                        account: CborAccountAddress.fromAccountAddress(sender),
                        roles: [
                            LockController.SimpleV0Capability.Fund,
                            LockController.SimpleV0Capability.Send,
                            LockController.SimpleV0Capability.Return,
                            LockController.SimpleV0Capability.Cancel,
                        ],
                    },
                ],
                [tokenId]
            ),
        };

        try {
            // Submit a transaction that creates the lock and immediately funds it
            const lockCreation = await Lock.create(client, sender, config)
                .fund({ token: tokenId, amount: fundAmount })
                .submit(signer);
            console.log(`Transaction submitted with hash: ${lockCreation.transactionHash}`);

            // Wait for the transaction to be finalized and inspect the created lock
            const lock = await lockCreation.waitUntilFinalized();
            console.log('Lock finalized:', lock.info.lock.toString());
            console.log('Lock funds:', JSON.stringify(lock.info.funds, null, 2));
        } catch (e) {
            console.error(e);
        }
    } else {
        if (cli.flags.sender === undefined) {
            throw new Error('When --wallet-file is omitted, --sender must be provided.');
        }

        // Or from a wallet perspective:
        // Build the lockCreate + lockFund payload without submitting.
        // The sender is still needed so the proposal can derive the predicted lock id from chain state.
        const sender = AccountAddress.fromBase58(cli.flags.sender);
        const config = {
            recipients,
            expiry,
            controller: LockController.simpleV0([], [tokenId]),
        };

        const payload = await Lock.create(client, sender, config)
            .fund({ token: tokenId, amount: fundAmount })
            .payload();
        console.log('Created payload:', payload);

        // Serialize the payload for signing and submission
        const serialized = Payload.serialize(payload);
        console.log('Serialized payload for sign & send:', Buffer.from(serialized).toString('hex'));
    }
    // #endregion documentation-snippet
})();
