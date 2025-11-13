import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    BlockItemKind,
    CIS2,
    Cbor,
    CcdAmount,
    ContractAddress,
    ContractName,
    DataBlob,
    DeployModulePayload,
    Energy,
    InitContractPayload,
    InitUpdatePayload,
    InitUpdateType,
    ModuleReference,
    OtherPayload,
    OtherType,
    Parameter,
    ReceiveName,
    RegisterDataPayload,
    SequenceNumber,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TokenId,
    TokenOperation,
    TokenUpdatePayload,
    TransactionExpiry,
    UpdateContractPayload,
    getAccountTransactionHandler,
    tokenAddressFromBase58,
    tokenAddressToBase58,
} from '../../src/index.js';
import { serializeAccountTransactionForSubmission } from '../../src/serialization.js';
import { deserializeTransaction } from '../../src/wasm/deserialization.js';

function deserializeAccountTransactionBase(transaction: AccountTransaction) {
    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
    };

    let deserialized;
    if (
        transaction.type === AccountTransactionType.InitContract ||
        transaction.type === AccountTransactionType.Update
    ) {
        //Hardcoding the energy here and will assume the given energy here is actually passed in by some calculation before submitting here
        deserialized = deserializeTransaction(
            serializeAccountTransactionForSubmission(
                transaction as AccountTransaction<InitUpdateType, InitUpdatePayload>,
                signatures,
                Energy.create(30000n)
            )
        );
    } else {
        deserialized = deserializeTransaction(
            serializeAccountTransactionForSubmission(
                transaction as AccountTransaction<OtherType, OtherPayload>,
                signatures
            )
        );
    }

    if (deserialized.kind !== BlockItemKind.AccountTransactionKind) {
        throw new Error('Incorrect BlockItemKind');
    }

    expect(deserialized.transaction.accountTransaction.payload).toEqual(transaction.payload);
}

test('test deserialize simpleTransfer ', () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };

    const transaction = prepareTransaction(AccountTransactionType.Transfer, payload);

    deserializeAccountTransactionBase(transaction);
});

test('test deserialize simpleTransfer with memo ', () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
        memo: new DataBlob(Buffer.from('00', 'hex')),
    };

    const transaction = prepareTransaction(AccountTransactionType.TransferWithMemo, payload);

    deserializeAccountTransactionBase(transaction);
});

test('test deserialize registerData ', () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('00AB5303926810EE', 'hex')),
    };

    const transaction = prepareTransaction(AccountTransactionType.RegisterData, payload);

    deserializeAccountTransactionBase(transaction);
});

test('test deserialize DeployModule ', () => {
    const payload: DeployModulePayload = {
        version: 1,
        source: new Uint8Array([0x00, 0xab, 0x53, 0x03, 0x92, 0x68, 0x10, 0xee]),
    };

    const transaction = prepareTransaction(AccountTransactionType.DeployModule, payload);

    deserializeAccountTransactionBase(transaction);
});

test('test deserialize InitContract ', () => {
    const moduleRef = ModuleReference.fromHexString('44434352ddba724930d6b1b09cd58bd1fba6ad9714cf519566d5fe72d80da0d1');
    const contractName = ContractName.fromStringUnchecked('weather');

    const deserializePayload: InitContractPayload = {
        amount: CcdAmount.zero(),
        moduleRef: moduleRef,
        initName: contractName,
        param: Parameter.fromHexString('0a'),
    };

    const givenEnergy = Energy.create(30000);
    const transaction = prepareTransaction(
        AccountTransactionType.InitContract,
        deserializePayload,
        undefined,
        givenEnergy
    );

    deserializeAccountTransactionBase(transaction);
});

test('test deserialize UpdateContract ', () => {
    const deserializePayload: UpdateContractPayload = {
        amount: CcdAmount.zero(),
        address: ContractAddress.create(0, 1),
        receiveName: ReceiveName.fromString('method.abc'),
        message: Parameter.fromHexString('0a'),
    };

    const givenEnergy = Energy.create(3000);
    const transaction = prepareTransaction(AccountTransactionType.Update, deserializePayload, undefined, givenEnergy);

    deserializeAccountTransactionBase(transaction);
});

test('test deserialize TokenUpdate ', () => {
    const pause = {};
    const pauseOperation = { pause } as TokenOperation;

    const deserializePayload: TokenUpdatePayload = {
        tokenId: TokenId.fromString('123ABCToken'),
        operations: Cbor.encode([pauseOperation]),
    };

    const transaction = prepareTransaction(AccountTransactionType.TokenUpdate, deserializePayload);

    deserializeAccountTransactionBase(transaction);
});

test('Expired transactions can be deserialized', () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };

    const transaction = prepareTransaction(
        AccountTransactionType.Transfer,
        payload,
        TransactionExpiry.fromDate(new Date(2000, 1))
    );

    deserializeAccountTransactionBase(transaction);
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

function prepareTransaction<T extends AccountTransactionType, P extends AccountTransactionPayload>(
    transactionType: T,
    payload: P,
    inputExpiry?: TransactionExpiry.Type,
    givenEnergy?: Energy.Type
) {
    const handler = getAccountTransactionHandler(transactionType);

    const nonce = SequenceNumber.create(1);
    const sender = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const defaultExpiry = TransactionExpiry.futureMinutes(20);
    const finalExpiry = inputExpiry ?? defaultExpiry;

    const transaction = handler.create({ sender, nonce, expiry: finalExpiry }, payload, givenEnergy);
    return transaction;
}
