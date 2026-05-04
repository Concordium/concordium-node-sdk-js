import {
    AccountAddress,
    AccountTransactionType,
    TransactionKindString,
    TransactionSummaryType,
    isKnown,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import {
    CborAccountAddress,
    CborEpoch,
    Lock,
    LockController,
    MetaUpdateOperationType,
    TokenId,
    createMetaUpdatePayload,
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
    --token,       -t  Token id(s) the lock can hold (repeat for multiple)
    --expiry,      -x  Lock expiry as seconds since Unix epoch

  Options
    --help,              Displays this message
    --endpoint,      -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --secure,        -s  Whether to use tls or not. Defaults to false.
    --wallet-file,   -w  A path to a wallet export file from a Concordium wallet. If not supplied, only transaction payload is created and serialized.
`,
    {
        importMeta: import.meta,
        flags: {
            endpoint: { type: 'string', alias: 'e', default: 'localhost:20000' },
            secure: { type: 'boolean', alias: 's', default: false },
            walletFile: { type: 'string', alias: 'w' },
            recipient: { type: 'string', alias: 'r', isRequired: true, isMultiple: true },
            token: { type: 'string', alias: 't', isRequired: true, isMultiple: true },
            expiry: { type: 'number', alias: 'x', isRequired: true },
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

    // Parse the lock configuration arguments
    const recipients = cli.flags.recipient.map((r) =>
        CborAccountAddress.fromAccountAddress(AccountAddress.fromBase58(r))
    );
    const tokenIds = cli.flags.token.map(TokenId.fromString);
    const expiry = CborEpoch.fromEpochSeconds(cli.flags.expiry);

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
                tokenIds
            ),
        };

        try {
            // Submit the lock creation transaction
            const txHash = await Lock.createRaw(client, sender, config, signer);
            console.log(`Transaction submitted with hash: ${txHash}`);

            // Wait for the transaction to be finalized and inspect the outcome
            const result = await client.waitForTransactionFinalization(txHash);
            console.log('Transaction finalized:', result);

            if (!isKnown(result.summary)) throw new Error('Unexpected transaction outcome');
            if (result.summary.type !== TransactionSummaryType.AccountTransaction)
                throw new Error('Unexpected transaction type: ' + result.summary.type);

            switch (result.summary.transactionType) {
                case TransactionKindString.MetaUpdate:
                    // Print each event — a LockCreated event should be present on success
                    result.summary.events.filter(isKnown).forEach((e) => console.log('Event:', e));
                    break;
                case TransactionKindString.Failed:
                    console.error('Transaction rejected:', result.summary.rejectReason);
                    break;
                default:
                    throw new Error('Unexpected transaction kind: ' + result.summary.transactionType);
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        // Or from a wallet perspective:
        // Build the lockCreate operation payload without submitting.
        // The controller grants and token list should be configured to match the intended access model.
        const config = {
            recipients,
            expiry,
            controller: LockController.simpleV0([], tokenIds),
        };

        const payload = createMetaUpdatePayload({ [MetaUpdateOperationType.LockCreate]: config });
        console.log('Created payload:', payload);

        // Serialize the payload for signing and submission
        const serialized = serializeAccountTransactionPayload({
            payload,
            type: AccountTransactionType.MetaUpdate,
        });
        console.log('Serialized payload for sign & send:', serialized.toString('hex'));
    }
    // #endregion documentation-snippet
})();
