import {
    AccountAddress,
    AccountTransactionType,
    RejectReasonTag,
    TransactionKindString,
    TransactionSummaryType,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import {
    Cbor,
    CborMemo,
    Token,
    TokenAmount,
    TokenHolder,
    TokenId,
    TokenTransfer,
    TokenTransferOperation,
    createTokenUpdatePayload,
} from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint, parseKeysFile } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --token-id,     -t  The unique id of the token to transfer
    --amount,       -a  The amount of tokens to transfer
    --recipient,    -r  The recipient address in base58 format

  Options
    --help,         -h  Displays this message
    --endpoint,     -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --secure,       -s  Whether to use tls or not. Defaults to false.
    --wallet-file,  -w  A path to a wallet export file from a Concordium wallet. If not supplied, only transaction payload is created and serialized.
    --memo,         -m  A memo for the transfer
`,
    {
        importMeta: import.meta,
        flags: {
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
            walletFile: {
                type: 'string',
                alias: 'w',
            },
            tokenId: {
                type: 'string',
                alias: 't',
                isRequired: true,
            },
            amount: {
                type: 'number',
                alias: 'a',
                isRequired: true,
            },
            recipient: {
                type: 'string',
                alias: 'r',
                isRequired: true,
            },
            memo: {
                type: 'string',
                alias: 'm',
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

(async () => {
    // #region documentation-snippet

    // parse the other arguments
    const tokenId = TokenId.fromString(cli.flags.tokenId);
    const token = await Token.fromId(client, tokenId);
    const amount = TokenAmount.fromDecimal(cli.flags.amount, token.info.state.decimals);
    const recipient = TokenHolder.fromAccountAddress(AccountAddress.fromBase58(cli.flags.recipient));
    const memo = cli.flags.memo ? CborMemo.fromString(cli.flags.memo) : undefined;

    const transfer: TokenTransfer = {
        recipient,
        amount,
        memo,
    };
    console.log('Specified transfer:', JSON.stringify(transfer, null, 2));

    if (cli.flags.walletFile !== undefined) {
        const [sender, signer] = parseKeysFile(cli.flags.walletFile);

        // From a service perspective:
        // create the token instance
        try {
            const transaction = await Token.transfer(token, sender, transfer, signer);
            console.log(`Transaction submitted with hash: ${transaction}`);

            const result = await client.waitForTransactionFinalization(transaction);
            console.log('Transaction finalized:', result);

            if (result.summary.type !== TransactionSummaryType.AccountTransaction) {
                throw new Error('Unexpected transaction type: ' + result.summary.type);
            }

            switch (result.summary.transactionType) {
                case TransactionKindString.TokenUpdate:
                    result.summary.events.forEach((e) => console.log(e.event));
                    break;
                case TransactionKindString.Failed:
                    if (result.summary.rejectReason.tag !== RejectReasonTag.TokenUpdateTransactionFailed) {
                        throw new Error('Unexpected reject reason tag: ' + result.summary.rejectReason.tag);
                    }
                    const details = Cbor.decode(result.summary.rejectReason.contents.details);
                    console.error(result.summary.rejectReason.contents, details);
                    break;
                default:
                    throw new Error('Unexpected transaction kind: ' + result.summary.transactionType);
            }
        } catch (e) {
            console.error(e);
        }
    } else {
        // Or from a wallet perspective:
        // Create transfer payload
        const transferOperation: TokenTransferOperation = {
            transfer,
        };
        const payload = createTokenUpdatePayload(tokenId, transferOperation);
        console.log('Created payload:', payload);

        // Serialize payload for signing/submission
        const serialized = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenUpdate });
        console.log('Serialized payload for sign & send:', serialized.toString('hex'));
    }
    // #endregion documentation-snippet
})();
