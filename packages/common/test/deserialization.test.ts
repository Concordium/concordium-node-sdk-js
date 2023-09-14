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
    tokenAddressFromBase58,
    tokenAddressToBase58,
} from '../src';
import * as fs from 'fs';
import {
    CIS2_WCCD_STATE_SCHEMA,
    V0_PIGGYBANK_SCHEMA,
    CIS2_WCCD_STATE_GET_BALANCE_RETURN_VALUE_SCHEMA,
    TEST_CONTRACT_INIT_ERROR_SCHEMA,
    TEST_CONTRACT_SCHEMA,
    TEST_CONTRACT_RECEIVE_ERROR_SCHEMA,
    AUCTION_WITH_ERRORS_VIEW_RETURN_VALUE_SCHEMA,
    TEST_CONTRACT_U64,
} from './resources/schema';

const U64_MAX = 18446744073709551615n;

test('test that deserializeContractState works', () => {
    const state = deserializeContractState(
        'PiggyBank',
        Buffer.from(V0_PIGGYBANK_SCHEMA, 'base64'),
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
        Buffer.from(CIS2_WCCD_STATE_SCHEMA, 'base64'),
        'CIS2-wCCD-State',
        'getBalance'
    );

    expect(returnValue).toEqual('82000000');
});

/**
 *  Repeats the "Receive return value can be deserialized" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Receive return value can be deserialized using deserializeTypeValue', () => {
    const returnValue = deserializeTypeValue(
        Buffer.from('80f18c27', 'hex'),
        Buffer.from(CIS2_WCCD_STATE_GET_BALANCE_RETURN_VALUE_SCHEMA, 'base64')
    );
    expect(returnValue).toEqual('82000000');
});

const auctionRawReturnValue = Buffer.from(
    '00000b0000004120676f6f64206974656d00a4fbca84010000',
    'hex'
);

/**
 * Small helper for expected deserialized value of rawAuctionReturnValue
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectAuctionReturnValue = (returnValue: any) => {
    expect(returnValue.item).toEqual('A good item');
    expect(returnValue.end).toEqual('2022-12-01T00:00:00+00:00');
    expect(returnValue.auction_state).toHaveProperty('NotSoldYet');
    expect(returnValue.highest_bidder).toHaveProperty('None');
};

test('Return value can be deserialized - auction', () => {
    const returnValue = deserializeReceiveReturnValue(
        auctionRawReturnValue,
        Buffer.from(
            fs.readFileSync('./test/resources/auction-with-errors-schema.bin')
        ),
        'auction',
        'view'
    );

    expectAuctionReturnValue(returnValue);
});

/**
 *  Repeats the "Return value can be deserialized - auction" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Return value can be deserialized - auction  using deserializeTypeValue', () => {
    const returnValue = deserializeTypeValue(
        auctionRawReturnValue,
        Buffer.from(AUCTION_WITH_ERRORS_VIEW_RETURN_VALUE_SCHEMA, 'base64')
    );

    expectAuctionReturnValue(returnValue);
});

test('U64_MAX can be deserialized', () => {
    const returnVal = deserializeReceiveReturnValue(
        Buffer.from('ffffffffffffffff', 'hex'),
        Buffer.from(TEST_CONTRACT_U64, 'base64'),
        'test',
        'receive'
    );

    expect(returnVal).toEqual(U64_MAX);
});

test('Receive error can be deserialized', () => {
    const error = deserializeReceiveError(
        Buffer.from('ffff', 'hex'),
        Buffer.from(TEST_CONTRACT_SCHEMA, 'base64'),
        'TestContract',
        'receive_function'
    );

    expect(error).toEqual(-1n);
});

/**
 *  Repeats the "Receive error can be deserialized" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Receive error can be deserialized using deserializeTypeValue', () => {
    const error = deserializeTypeValue(
        Buffer.from('ffff', 'hex'),
        Buffer.from(TEST_CONTRACT_RECEIVE_ERROR_SCHEMA, 'base64')
    );
    expect(error).toEqual(-1n);
});

test('Init error can be deserialized', () => {
    const error = deserializeInitError(
        Buffer.from('0100', 'hex'),
        Buffer.from(TEST_CONTRACT_SCHEMA, 'base64'),
        'TestContract'
    );

    expect(error).toEqual(1n);
});

/**
 *  Repeats the "Init error can be deserialized" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Init error can be deserialized using deserializeTypeValue', () => {
    const error = deserializeTypeValue(
        Buffer.from('0100', 'hex'),
        Buffer.from(TEST_CONTRACT_INIT_ERROR_SCHEMA, 'base64')
    );
    expect(error).toEqual(1n);
});

test('Test parsing of Token Addresses', () => {
    let base58 = '5Pxr5EUtU';
    let address = tokenAddressFromBase58(base58);
    let rebase58 = tokenAddressToBase58(address);
    let expectedAddress = {
        contract: {
            index: 0n,
            subindex: 0n,
        },
        id: '',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);

    base58 = 'LQMMu3bAg7';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    expectedAddress = {
        contract: {
            index: 0n,
            subindex: 0n,
        },
        id: 'aa',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);

    base58 = '5QTdu98KF';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    const expectedAddress2 = {
        contract: {
            index: 1n,
            subindex: 0n,
        },
        id: '',
    };
    expect(address).toEqual(expectedAddress2);
    expect(rebase58).toEqual(base58);

    base58 = 'LSYqgoQcb6';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    expectedAddress = {
        contract: {
            index: 1n,
            subindex: 0n,
        },
        id: 'aa',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);

    base58 = 'LSYXivPSWP';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    expectedAddress = {
        contract: {
            index: 1n,
            subindex: 0n,
        },
        id: '0a',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);
});
