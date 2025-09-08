import {
    AccountAddress,
    AccountTransactionType,
    RejectReasonTag,
    TransactionEventTag,
    TransactionKindString,
    TransactionSummaryType,
    isKnown,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import {
    Cbor,
    CborAccountAddress,
    Token,
    TokenId,
    TokenListUpdate,
    TokenOperation,
    TokenOperationType,
    createTokenUpdatePayload,
    parseTokenModuleEvent,
} from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';

import { parseEndpoint, parseKeysFile } from '../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> <list-name> <action> [options]

  Required
    --token-id,     -t  The unique id of the token to transfer
    --address,      -a  The account address to add to the allow list (in base58 format)

  Options
    --help,         -h  Displays this message
    --endpoint,     -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --secure,       -s  Whether to use tls or not. Defaults to false.
    --wallet-file,  -w  A path to a wallet export file from a Concordium wallet. This is required for governance operations.
`,
    {
        importMeta: import.meta,
        flags: {
            tokenId: {
                type: 'string',
                alias: 't',
                isRequired: true,
            },
            address: {
                type: 'string',
                alias: 'a',
                isRequired: true,
            },

            // optional
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
        },
    }
);

const { tokenId: id, address, walletFile, endpoint } = cli.flags;

const [addr, port] = parseEndpoint(endpoint);
const client = new ConcordiumGRPCNodeClient(
    addr,
    Number(port),
    cli.flags.secure ? credentials.createSsl() : credentials.createInsecure()
);

(async () => {
    // #region documentation-snippet

    // parse input
    const [list, action] = cli.input;

    if (!list || !action) {
        console.error('Missing required arguments: <list-name> <action>');
        return;
    }

    // Validate action
    if (action !== 'add' && action !== 'remove') {
        console.error('Invalid action. Use "add" or "remove".');
        return;
    }

    // Validate list name
    if (list !== 'allow' && list !== 'deny') {
        console.error('Invalid list name. Use "allow" or "deny".');
        return;
    }

    // parse the arguments
    const tokenId = TokenId.fromString(id);
    const targetAddress = CborAccountAddress.fromAccountAddress(AccountAddress.fromBase58(address));

    if (walletFile !== undefined) {
        // Read wallet-file
        const [sender, signer] = parseKeysFile(walletFile);

        try {
            // create the token instance
            const token = await Token.fromId(client, tokenId);

            // Only the token issuer can modify the allow list
            console.log(
                `Attempting to ${action} ${targetAddress.toString()} to the ${list} list for ${tokenId.toString()}...`
            );

            // Execute the list operation
            let modify: typeof Token.addDenyList;
            if (list === 'deny' && action === 'add') {
                modify = Token.addDenyList;
            } else if (list === 'deny' && action === 'remove') {
                modify = Token.removeDenyList;
            } else if (list === 'allow' && action === 'add') {
                modify = Token.addAllowList;
            } else {
                modify = Token.removeAllowList;
            }
            const transaction = await modify(token, sender, targetAddress, signer);
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
                    result.summary.events.forEach((e) => {
                        if (e.tag !== TransactionEventTag.TokenModuleEvent) {
                            throw new Error('Unexpected event type: ' + e.tag);
                        }
                        console.log('Token module event:', parseTokenModuleEvent(e));
                    });
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
            console.error('Error during list operation:', error);
        }
    } else {
        const operationType = `${action}-${list}-list` as TokenOperationType;
        // Or from a wallet perspective:
        // Create list payload. The payload is the same for both add and remove operations on all lists.
        const listPayload: TokenListUpdate = { target: targetAddress };
        const listOperation = {
            [operationType]: listPayload,
        } as TokenOperation; // Normally the cast is not necessary unless done in the same dynamic way as here.
        console.log('Specified list action:', JSON.stringify(listOperation, null, 2));

        const payload = createTokenUpdatePayload(tokenId, listOperation);
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
