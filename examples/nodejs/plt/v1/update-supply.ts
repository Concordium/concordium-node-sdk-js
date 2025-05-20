import {
    AccountTransactionType,
    TransactionSummaryType,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { Cbor, TokenAmount, TokenId, V1 } from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint, parseKeysFile } from '../../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> <action> [options]

  Required
    --token-symbol, -t  The symbol of the token to mint/burn
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
            tokenSymbol: {
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

const { tokenSymbol, walletFile, endpoint, amount } = cli.flags;

const [addr, port] = parseEndpoint(endpoint);
const client = new ConcordiumGRPCNodeClient(addr, Number(port), credentials.createInsecure());

(async () => {
    // #region documentation-snippet
    // parse input
    const action = cli.input[0] as V1.TokenOperationType;
    if (!action) {
        console.error('Missing required arguments: <action>');
        return;
    }

    // Validate action
    if (action !== V1.TokenOperationType.Mint && action !== V1.TokenOperationType.Burn) {
        console.error('Invalid action. Use "mint" or "burn".');
        return;
    }

    // parse the arguments
    const tokenId = TokenId.fromString(tokenSymbol);
    const tokenAmount = TokenAmount.fromDecimal(amount);

    if (walletFile !== undefined) {
        // Read wallet-file
        const [sender, signer] = parseKeysFile(walletFile);

        try {
            // create the token instance
            const token = await V1.Token.fromId(client, tokenId);

            console.log(`Attempting to ${action} ${tokenAmount.toString()} ${tokenId.toString()} tokens...`);

            // Execute the mint/burn operation
            const operation = action === V1.TokenOperationType.Mint ? V1.Governance.mint : V1.Governance.burn;
            const transaction = await operation(token, sender, tokenAmount, signer);
            console.log(`Transaction submitted with hash: ${transaction}`);

            const result = await client.waitForTransactionFinalization(transaction);
            console.log('Transaction finalized:', result);

            if (
                result.summary.type === TransactionSummaryType.AccountTransaction &&
                result.summary.transactionType === 'failed' &&
                result.summary.rejectReason.tag === 'TokenGovernanceTransactionFailed'
            ) {
                const details = Cbor.decode(result.summary.rejectReason.contents.details);
                console.log(result.summary.rejectReason.contents, details);
            }
        } catch (error) {
            console.error('Error during token supply update operation:', error);
        }
    } else {
        // Or from a wallet perspective:
        const update: V1.TokenSupplyUpdate = { amount: tokenAmount };
        const operation = {
            [action]: update,
        } as V1.TokenGovernanceOperation;
        console.log(`Specified ${action} action:`, JSON.stringify(operation, null, 2));

        const payload = V1.createTokenGovernancePayload(tokenId, operation);
        console.log('Created payload:', payload);

        // Serialize payload for signing/submission
        const serialized = serializeAccountTransactionPayload({
            payload,
            type: AccountTransactionType.TokenGovernance,
        });
        console.log('Serialized payload for sign & send:', serialized.toString('hex'));
    }
    // #endregion documentation-snippet
})();
