import {
    AccountTransactionType,
    RejectReasonTag,
    TransactionKindString,
    TransactionSummaryType,
    isKnown,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import {
    Cbor,
    Token,
    TokenAmount,
    TokenId,
    TokenOperation,
    TokenOperationType,
    TokenSupplyUpdate,
    createTokenUpdatePayload,
} from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint, parseKeysFile } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> <action> [options]

  Required
    --token-id,     -t  The unique id of the token to transfer
    --amount,       -a  The amount of tokens to mint/burn

  Options
    --help,         -h  Displays this message
    --endpoint,     -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --secure,       -s  Whether to use tls or not. Defaults to false.
    --wallet-file,  -w  A path to a wallet export file from a Concordium wallet. This is required for actually minting/burning. Otherwise only the payload is created and serialized.
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
        },
    }
);

const { tokenId: id, walletFile, endpoint, amount } = cli.flags;

const [addr, port] = parseEndpoint(endpoint);
const client = new ConcordiumGRPCNodeClient(addr, Number(port), credentials.createInsecure());

(async () => {
    // #region documentation-snippet
    // parse input
    const action = cli.input[0] as TokenOperationType;
    if (!action) {
        console.error('Missing required arguments: <action>');
        return;
    }

    // Validate action
    if (action !== TokenOperationType.Mint && action !== TokenOperationType.Burn) {
        console.error('Invalid action. Use "mint" or "burn".');
        return;
    }

    // parse the arguments
    const tokenId = TokenId.fromString(id);
    const token = await Token.fromId(client, tokenId);
    const tokenAmount = TokenAmount.fromDecimal(amount, token.info.state.decimals);

    if (walletFile !== undefined) {
        // Read wallet-file
        const [sender, signer] = parseKeysFile(walletFile);

        try {
            // create the token instance
            const token = await Token.fromId(client, tokenId);

            console.log(`Attempting to ${action} ${tokenAmount.toString()} ${tokenId.toString()} tokens...`);

            // Execute the mint/burn operation
            const operation = action === TokenOperationType.Mint ? Token.mint : Token.burn;
            const transaction = await operation(token, sender, tokenAmount, signer);
            console.log(`Transaction submitted with hash: ${transaction}`);

            const result = await client.waitForTransactionFinalization(transaction);
            console.log('Transaction finalized:', result);

            if (!isKnown(result.summary)) {
                throw new Error('Unexpected transaction outcome');
            }
            if (result.summary.type !== TransactionSummaryType.AccountTransaction) {
                throw new Error('Unexpected transaction type: ' + result.summary.type);
            }

            switch (result.summary.transactionType) {
                case TransactionKindString.TokenUpdate:
                    result.summary.events.forEach((e) => console.log(e));
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
        } catch (error) {
            console.error('Error during token supply update operation:', error);
        }
    } else {
        // Or from a wallet perspective:
        const update: TokenSupplyUpdate = { amount: tokenAmount };
        const operation = {
            [action]: update,
        } as TokenOperation;
        console.log(`Specified ${action} action:`, JSON.stringify(operation, null, 2));

        const payload = createTokenUpdatePayload(tokenId, operation);
        console.log('Created payload:', payload);

        // Serialize payload for signing/submission
        const serialized = serializeAccountTransactionPayload({
            payload,
            type: AccountTransactionType.TokenUpdate,
        });
        console.log('Serialized payload for sign & send:', serialized.toString('hex'));
    }
    // #endregion documentation-snippet
})();
