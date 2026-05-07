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
    Lock,
    LockId,
    MetaUpdateOperationType,
    TokenAmount,
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
    --lock-id,     -l  The lock ID as a Base58Check string
    --token,       -t  Token id to return
    --source,      -f  Account whose locked funds are returned
    --amount,      -a  Token amount in decimal notation
    --decimals,    -d  Token decimals

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
            lockId: { type: 'string', alias: 'l', isRequired: true },
            token: { type: 'string', alias: 't', isRequired: true },
            source: { type: 'string', alias: 'f', isRequired: true },
            amount: { type: 'string', alias: 'a', isRequired: true },
            decimals: { type: 'number', alias: 'd', isRequired: true },
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

    // Parse the lock, token, amount, and source account arguments
    const lockId = LockId.fromString(cli.flags.lockId);
    const tokenId = TokenId.fromString(cli.flags.token);
    const source = AccountAddress.fromBase58(cli.flags.source);
    const amount = TokenAmount.fromDecimal(cli.flags.amount, cli.flags.decimals);

    if (cli.flags.walletFile !== undefined) {
        // Read the wallet file to get the sender account and signer
        const [sender, signer] = parseKeysFile(cli.flags.walletFile);

        // Fetch the current lock state from the node
        const lock = await Lock.fromId(client, lockId);

        try {
            // Submit the return transaction — locked funds are returned to the source account
            const txHash = await Lock.returnFunds(lock, sender, { token: tokenId, source, amount }, signer);
            console.log(`Transaction submitted with hash: ${txHash}`);

            // Wait for the transaction to be finalized and inspect the outcome
            const result = await client.waitForTransactionFinalization(txHash);
            console.log('Transaction finalized:', result);

            if (!isKnown(result.summary)) throw new Error('Unexpected transaction outcome');
            if (result.summary.type !== TransactionSummaryType.AccountTransaction)
                throw new Error('Unexpected transaction type: ' + result.summary.type);

            switch (result.summary.transactionType) {
                case TransactionKindString.MetaUpdate:
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
        // Build the lockReturn operation payload without submitting.
        // The source account must be provided as a CborAccountAddress value.
        const payload = createMetaUpdatePayload({
            [MetaUpdateOperationType.LockReturn]: {
                token: tokenId,
                lock: lockId,
                source: CborAccountAddress.fromAccountAddress(source),
                amount,
            },
        });
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
