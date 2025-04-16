import {
    AccountAddress,
    AccountTransactionType,
    buildAccountSigner,
    parseWallet,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { CborMemo, TokenAmount, TokenId, V1 } from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { readFileSync } from 'node:fs';

import { parseEndpoint } from '../../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --token-symbol, -t  The symbol of the token to transfer
    --amount,       -a  The amount of tokens to transfer
    --recipient,    -r  The recipient address in base58 format

  Options
    --help,         -h  Displays this message
    --endpoint,     -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
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
            walletFile: {
                type: 'string',
                alias: 'w',
            },
            tokenSymbol: {
                type: 'string',
                alias: 't',
                default: '',
            },
            amount: {
                type: 'number',
                alias: 't',
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
const client = new ConcordiumGRPCNodeClient(address, Number(port), credentials.createInsecure());

(async () => {
    // #region documentation-snippet

    // parse the other arguments
    const tokenSymbol = TokenId.fromString(cli.flags.tokenSymbol);
    const amount = TokenAmount.fromDecimal(cli.flags.amount);
    const recipient = AccountAddress.fromBase58(cli.flags.recipient);
    const memo = cli.flags.memo ? CborMemo.fromString(cli.flags.memo) : undefined;

    const transfer: V1.TokenTransfer = {
        recipient,
        amount,
        memo,
    };
    console.log('Specified transfer:', JSON.stringify(transfer, null, 2));

    if (cli.flags.walletFile !== undefined) {
        // Read wallet-file
        const walletFile = readFileSync(cli.flags.walletFile, 'utf8');
        const wallet = parseWallet(walletFile);
        const sender = AccountAddress.fromBase58(wallet.value.address);
        const signer = buildAccountSigner(wallet);

        // From a service perspective:
        // create the token instance
        const token = await V1.Token.fromId(client, tokenSymbol);
        const transaction = await V1.Token.transfer(token, sender, transfer, signer);
        console.log(transaction);
    } else {
        // Or from a wallet perspective:
        // Create transfer payload
        const transferOperation: V1.TokenTransferOperation = {
            transfer,
        };
        const payload = V1.createTokenHolderPayload(tokenSymbol, transferOperation);
        console.log('Created payload:', payload);

        // Serialize payload for signing/submission
        const serialized = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenHolder });
        console.log('Serialized payload for sign & send:', serialized.toString('hex'));
    }
    // #endregion documentation-snippet
})();
