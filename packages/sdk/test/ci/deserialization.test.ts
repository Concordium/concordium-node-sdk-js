import { deserializeTransaction } from '../../src/wasm/deserialization.js';
import { serializeAccountTransactionForSubmission } from '../../src/serialization.js';
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
    tokenAddressFromBase58,
    tokenAddressToBase58,
    SequenceNumber,
    CIS2,
    ContractAddress,
} from '../../src/index.js';

function deserializeAccountTransactionBase(
    type: AccountTransactionType,
    payload: AccountTransactionPayload,
    expiry = new TransactionExpiry(new Date(Date.now() + 1200000))
) {
    const header: AccountTransactionHeader = {
        expiry,
        nonce: SequenceNumber.create(1),
        sender: AccountAddress.fromBase58(
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
        toAddress: AccountAddress.fromBase58(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };
    deserializeAccountTransactionBase(AccountTransactionType.Transfer, payload);
});

test('test deserialize simpleTransfer with memo ', () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: new CcdAmount(5100000n),
        toAddress: AccountAddress.fromBase58(
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
        toAddress: AccountAddress.fromBase58(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };
    deserializeAccountTransactionBase(
        AccountTransactionType.Transfer,
        payload,
        new TransactionExpiry(new Date(2000, 1), true)
    );
});

test('Test parsing of Token Addresses', () => {
    let base58 = '5Pxr5EUtU';
    let address = tokenAddressFromBase58(base58);
    let rebase58 = tokenAddressToBase58(address);
    let expectedAddress: CIS2.TokenAddress = {
        contract: ContractAddress.create(0),
        id: '',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);

    base58 = 'LQMMu3bAg7';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    expectedAddress = {
        contract: ContractAddress.create(0),
        id: 'aa',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);

    base58 = '5QTdu98KF';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    const expectedAddress2 = {
        contract: ContractAddress.create(1),
        id: '',
    };
    expect(address).toEqual(expectedAddress2);
    expect(rebase58).toEqual(base58);

    base58 = 'LSYqgoQcb6';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    expectedAddress = {
        contract: ContractAddress.create(1),
        id: 'aa',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);

    base58 = 'LSYXivPSWP';
    address = tokenAddressFromBase58(base58);
    rebase58 = tokenAddressToBase58(address);
    expectedAddress = {
        contract: ContractAddress.create(1),
        id: '0a',
    };
    expect(address).toEqual(expectedAddress);
    expect(rebase58).toEqual(base58);
});
