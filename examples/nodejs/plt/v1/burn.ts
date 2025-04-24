import {
    AccountAddress,
    AccountTransactionType,
    buildAccountSigner,
    parseWallet,
    serializeAccountTransactionPayload,
} from '@concordium/web-sdk';
import { ConcordiumGRPCNodeClient } from '@concordium/web-sdk/nodejs';
import { TokenAmount, TokenId, V1 } from '@concordium/web-sdk/plt';
import { credentials } from '@grpc/grpc-js';
import meow from 'meow';
import { readFileSync } from 'node:fs';

import { parseEndpoint } from '../../shared/util.js';

const cli = meow(
    `
  Usage
    $ yarn run-example <path-to-this-file> [options]

  Required
    --token-symbol, -t  The symbol of the token to burn
    --amount,       -a  The amount of tokens to burn

  Options
    --help,         -h  Displays this message
    --endpoint,     -e  Specify endpoint of a grpc2 interface of a Concordium node in the format "address:port". Defaults to 'localhost:20000'
    --wallet-file,  -w  A path to a wallet export file from a Concordium wallet. This is required for actually burning. Otherwise only the payload is created and serialized.
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

    // parse the arguments
    const tokenId = TokenId.fromString(tokenSymbol);
    const tokenAmount = TokenAmount.fromDecimal(amount);

    if (walletFile !== undefined) {
        // Read wallet-file
        const wallet = parseWallet(readFileSync(walletFile, 'utf8'));
        const sender = AccountAddress.fromBase58(wallet.value.address);
        const signer = buildAccountSigner(wallet);

        try {
            // create the token instance
            const token = await V1.Token.fromId(client, tokenId);

            // Only the token issuer can burn tokens
            console.log(`Attempting to burn ${tokenAmount.toString()} ${tokenId.toString()} tokens...`);

            // Execute the burn operation
            const transaction = await V1.Governance.burn(token, sender, tokenAmount, signer);
            console.log(`Burn transaction submitted with hash: ${transaction}`);
        } catch (error) {
            console.error('Error during burning operation:', error);
        }
    } else {
        // Or from a wallet perspective:
        const burn: V1.TokenBurn = { amount: tokenAmount };
        const operation: V1.TokenBurnOperation = {
            burn,
        };
        console.log('Specified burn action:', JSON.stringify(operation, null, 2));

        const payload = V1.createTokenGovernancePayload(tokenId, operation);
        console.log('Created payload:', payload);

        // Serialize payload for signing/submission
        const serialized = serializeAccountTransactionPayload({ payload, type: AccountTransactionType.TokenGovernance });
        console.log('Serialized payload for sign & send:', serialized.toString('hex'));
    }
    // #endregion documentation-snippet
})();
