import {
    deserializeAccountTransaction,
    deserializeContractState,
} from '../src/deserialization';
import { Buffer } from 'buffer/';
import { serializeAccountTransactionForSubmission } from '../src/serialization';
import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    DataBlob,
    GtuAmount,
    RegisterDataPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TransactionExpiry,
} from '../src';

test('test that deserializeContractState works', () => {
    const state = deserializeContractState(
        'PiggyBank',
        Buffer.from(
            'AQAAAAkAAABQaWdneUJhbmsBFQIAAAAGAAAASW50YWN0AgcAAABTbWFzaGVkAgAAAAAA',
            'base64'
        ),
        Buffer.from('00', 'hex')
    );

    expect(state.Intact).toBeDefined();
});

test('test deserialize simpleTransfer ', () => {
    const payload: SimpleTransferPayload = {
        amount: new GtuAmount(5100000n),
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
        header,
        payload,
        type: AccountTransactionType.SimpleTransfer,
    };

    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
    };

    expect(
        deserializeAccountTransaction(
            serializeAccountTransactionForSubmission(
                simpleTransferAccountTransaction,
                signatures
            )
        )
    ).toEqual({
        accountTransaction: simpleTransferAccountTransaction,
        signatures,
    });
});

test('test deserialize simpleTransfer with memo ', () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: new GtuAmount(5100000n),
        toAddress: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
        memo: new DataBlob(Buffer.from('00', 'hex')),
    };

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(6000)),
        nonce: 17n,
        sender: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const transaction: AccountTransaction = {
        header,
        payload,
        type: AccountTransactionType.SimpleTransferWithMemo,
    };

    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
        1: {
            1: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a63',
        },
    };
    expect(
        deserializeAccountTransaction(
            serializeAccountTransactionForSubmission(transaction, signatures)
        )
    ).toEqual({ accountTransaction: transaction, signatures });
});

test('test deserialize registerData ', () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('00AB5303926810EE', 'hex')),
    };

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() - 1200000)),
        nonce: 20n,
        sender: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const transaction: AccountTransaction = {
        header,
        payload,
        type: AccountTransactionType.RegisterData,
    };

    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
        1: {
            1: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a63',
        },
    };
    expect(
        deserializeAccountTransaction(
            serializeAccountTransactionForSubmission(transaction, signatures)
        )
    ).toEqual({ accountTransaction: transaction, signatures });
});
