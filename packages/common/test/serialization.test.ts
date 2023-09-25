import { AccountAddress } from '../src/types/accountAddress.js';
import { CcdAmount } from '../src/types/ccdAmount.js';
import {
    serializeAccountTransactionForSubmission,
    serializeAccountTransactionSignature,
} from '../src/serialization.js';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    SimpleTransferPayload,
} from '../src/types.js';
import { TransactionExpiry } from '../src/types/transactionExpiry.js';

test('fail account transaction serialization if no signatures', () => {
    const simpleTransferPayload: SimpleTransferPayload = {
        amount: new CcdAmount(5100000n),
        toAddress: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 1200000)),
        nonce: 0n,
        sender: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransferPayload,
        type: AccountTransactionType.Transfer,
    };

    expect(() =>
        serializeAccountTransactionForSubmission(
            simpleTransferAccountTransaction,
            {}
        )
    ).toThrow();
});

test('serialization of an account signature with two credentials', () => {
    const signature: AccountTransactionSignature = {
        0: {
            0: '893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f',
        },
        1: {
            0: '620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603',
        },
    };

    const serializedSignature = serializeAccountTransactionSignature(signature);
    expect(serializedSignature.toString('hex')).toBe(
        '020001000040893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f0101000040620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603'
    );
});
