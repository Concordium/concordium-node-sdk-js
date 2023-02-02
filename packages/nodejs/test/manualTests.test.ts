import * as v1 from '@concordium/common-sdk';
import {
    buildBasicAccountSigner,
    signTransaction,
} from '@concordium/common-sdk';
import { getNodeClientV2 } from '../src/util';

const clientV2 = getNodeClientV2();

const testAccount = new v1.AccountAddress(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const senderAccount = new v1.AccountAddress(
    '39zbDo5ycLdugboskzUqjme8uNnDFfAYdyAYB9csegQJ2BqLoe'
);

const senderAccountPrivateKey =
    'dcf347bda4fc45a4318c98e80b0939c83cb6a368e84e791f88f618cace4c3c41';

describe.skip('Manual test suite', () => {
    test('waitForTransactionFinalization', async () => {
        const nonce = (await clientV2.getNextAccountNonce(senderAccount)).nonce;

        // Create local transaction
        const header: v1.AccountTransactionHeader = {
            expiry: new v1.TransactionExpiry(new Date(Date.now() + 3600000)),
            nonce: nonce,
            sender: senderAccount,
        };
        const simpleTransfer: v1.SimpleTransferPayload = {
            amount: new v1.CcdAmount(100n),
            toAddress: testAccount,
        };
        const accountTransaction: v1.AccountTransaction = {
            header: header,
            payload: simpleTransfer,
            type: v1.AccountTransactionType.Transfer,
        };

        // Sign transaction
        const signer = buildBasicAccountSigner(senderAccountPrivateKey);
        const signature: v1.AccountTransactionSignature = await signTransaction(
            accountTransaction,
            signer
        );

        const transactionHash = await clientV2.sendAccountTransaction(
            accountTransaction,
            signature
        );

        const blockHash = await clientV2.waitForTransactionFinalization(
            transactionHash,
            undefined
        );

        console.log('Blockhash:', blockHash);
        console.log('TransactionHash:', transactionHash);
    }, 750000);
});
