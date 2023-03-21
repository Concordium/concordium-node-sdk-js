import {
    deserializeContractState,
    deserializeTransaction,
    deserializeReceiveReturnValue,
    deserializeReceiveError,
    deserializeInitError,
} from '../src/deserialization';
import { Buffer } from 'buffer/';
import { serializeAccountTransactionForSubmission } from '../src/serialization';
import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    BlockItemKind,
    DataBlob,
    CcdAmount,
    RegisterDataPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TransactionExpiry,
    deserializeTypeValue,
} from '../src';
import * as fs from 'fs';

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

function deserializeAccountTransactionBase(
    type: AccountTransactionType,
    payload: AccountTransactionPayload,
    expiry = new TransactionExpiry(new Date(Date.now() + 1200000))
) {
    const header: AccountTransactionHeader = {
        expiry,
        nonce: 0n,
        sender: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const transaction: AccountTransaction = {
        header,
        payload,
        type,
    };

    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
    };

    const deserialized = deserializeTransaction(
        serializeAccountTransactionForSubmission(transaction, signatures)
    );

    if (deserialized.kind !== BlockItemKind.AccountTransactionKind) {
        throw new Error('Incorrect BlockItemKind');
    }

    expect(deserialized.transaction).toEqual({
        accountTransaction: transaction,
        signatures,
    });
}

test('test deserialize simpleTransfer ', () => {
    const payload: SimpleTransferPayload = {
        amount: new CcdAmount(5100000n),
        toAddress: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };
    deserializeAccountTransactionBase(AccountTransactionType.Transfer, payload);
});

test('test deserialize simpleTransfer with memo ', () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: new CcdAmount(5100000n),
        toAddress: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
        memo: new DataBlob(Buffer.from('00', 'hex')),
    };
    deserializeAccountTransactionBase(
        AccountTransactionType.TransferWithMemo,
        payload
    );
});

test('test deserialize registerData ', () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('00AB5303926810EE', 'hex')),
    };
    deserializeAccountTransactionBase(
        AccountTransactionType.RegisterData,
        payload
    );
});

test('Expired transactions can be deserialized', () => {
    const payload: SimpleTransferPayload = {
        amount: new CcdAmount(5100000n),
        toAddress: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };
    deserializeAccountTransactionBase(
        AccountTransactionType.Transfer,
        payload,
        new TransactionExpiry(new Date(2000, 1), true)
    );
});

test('Receive return value can be deserialized', () => {
    const returnValue = deserializeReceiveReturnValue(
        Buffer.from('80f18c27', 'hex'),
        Buffer.from(
            '//8CAQAAAA8AAABDSVMyLXdDQ0QtU3RhdGUAAQAAAAoAAABnZXRCYWxhbmNlAhQAAQAAAAUAAABvd25lchUCAAAABwAAAEFjY291bnQBAQAAAAsIAAAAQ29udHJhY3QBAQAAAAwbJQAAAA==',
            'base64'
        ),
        'CIS2-wCCD-State',
        'getBalance'
    );

    expect(returnValue).toEqual('82000000');
});

test('Receive return value can be deserialized using deserializeTypeValue', () => {
    const returnValue = deserializeTypeValue(
        Buffer.from('80f18c27', 'hex'),
        Buffer.from('GyUAAAA', 'base64')
    );
    expect(returnValue).toEqual('82000000');
});

test('Return value can be deserialized - auction', () => {
    const returnValue = deserializeReceiveReturnValue(
        Buffer.from(
            '00000b0000004120676f6f64206974656d00a4fbca84010000',
            'hex'
        ),
        Buffer.from(
            fs.readFileSync('./test/resources/auction-with-errors-schema.bin')
        ),
        'auction',
        'view'
    );

    expect(returnValue.item).toEqual('A good item');
    expect(returnValue.end).toEqual('2022-12-01T00:00:00+00:00');
    expect(returnValue.auction_state).toHaveProperty('NotSoldYet');
    expect(returnValue.highest_bidder).toHaveProperty('None');
});

test('Receive error can be deserialized', () => {
    const error = deserializeReceiveError(
        Buffer.from('ffff', 'hex'),
        Buffer.from(
            '//8CAQAAAAwAAABUZXN0Q29udHJhY3QBBAIDAQAAABAAAAByZWNlaXZlX2Z1bmN0aW9uBgYIBw==',
            'base64'
        ),
        'TestContract',
        'receive_function'
    );

    expect(error).toEqual(-1);
});

test('Receive error can be deserialized using deserializeTypeValue', () => {
    const error = deserializeTypeValue(
        Buffer.from('ffff', 'hex'),
        Buffer.from('Bw', 'base64')
    );
    expect(error).toEqual(-1);
});

test('Init error can be deserialized', () => {
    const error = deserializeInitError(
        Buffer.from('0100', 'hex'),
        Buffer.from(
            '//8CAQAAAAwAAABUZXN0Q29udHJhY3QBBAIDAQAAABAAAAByZWNlaXZlX2Z1bmN0aW9uBgYIBw==',
            'base64'
        ),
        'TestContract'
    );

    expect(error).toEqual(1);
});

test('Init error can be deserialized using deserializeTypeValue', () => {
    const error = deserializeTypeValue(
        Buffer.from('0100', 'hex'),
        Buffer.from('Aw', 'base64')
    );
    expect(error).toEqual(1);
});
