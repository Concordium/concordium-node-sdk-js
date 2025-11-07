import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    BlockItem,
    BlockItemKind,
    CIS2,
    CcdAmount,
    ContractAddress,
    ContractName,
    DataBlob,
    DeployModulePayload,
    Energy,
    InitContractPayload,
    ModuleReference,
    Parameter,
    ReceiveName,
    RegisterDataPayload,
    SequenceNumber,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TransactionExpiry,
    UpdateContractPayload,
    tokenAddressFromBase58,
    tokenAddressToBase58,
} from '../../src/index.js';
import { serializeAccountTransactionForSubmission } from '../../src/serialization.js';
import { deserializeTransaction } from '../../src/wasm/deserialization.js';

function deserializeAccountTransactionBase(
    type: AccountTransactionType,
    payload: AccountTransactionPayload,
    energyAmount?: Energy.Type,
    payloadSize?: number,
    expiry = TransactionExpiry.futureMinutes(20)
): BlockItem {
    const baseHeader = {
        expiry,
        nonce: SequenceNumber.create(1),
        sender: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };

    const energyProperty = energyAmount !== undefined ? { energyAmount: energyAmount } : {};

    const payloadSizeProperty = payloadSize !== undefined ? { payloadSize: payloadSize } : {};

    const header: AccountTransactionHeader = {
        ...baseHeader,
        ...energyProperty,
        ...payloadSizeProperty,
    };

    console.log('header is created as ', header);

    const transaction: AccountTransaction = {
        header,
        payload,
        type,
    };

    console.log('transaction is created as ', transaction);

    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
    };

    const deserialized = deserializeTransaction(serializeAccountTransactionForSubmission(transaction, signatures));

    if (deserialized.kind !== BlockItemKind.AccountTransactionKind) {
        throw new Error('Incorrect BlockItemKind');
    }

    expect(deserialized.transaction.accountTransaction.type).toEqual(transaction.type);
    expect(deserialized.transaction.signatures).toEqual(signatures);

    // we no longer can just compare deserialized.transaction with {accountTransaction: transaction, signatures,} without
    // being specific to fields that may not be common between types.
    // Will need to exclude InitContract from comparing the payload,
    // as the payload placeholder structure initially being passed into this parent function will not have the right energy
    if (deserialized.kind == BlockItemKind.AccountTransactionKind) {
        const transactionType = deserialized.transaction.accountTransaction.type;
        if (transactionType !== AccountTransactionType.InitContract) {
            expect(deserialized.transaction.accountTransaction.payload).toEqual(payload);
        }
    }

    //we may want to do some specific tests, if required, so returning this to the calling function
    return deserialized;
}

test('test deserialize simpleTransfer ', () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };
    const result = deserializeAccountTransactionBase(AccountTransactionType.Transfer, payload);

    if (result.kind == BlockItemKind.AccountTransactionKind) {
        const transactionType = result.transaction.accountTransaction.type;
        if (transactionType === AccountTransactionType.Transfer) {
            console.log('result payload: ', result.transaction.accountTransaction.payload);
            console.log('setup payload: ', payload);
            expect(result.transaction.accountTransaction.payload).toEqual(payload);
        }
    }
});

test('test deserialize simpleTransfer with memo ', () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
        memo: new DataBlob(Buffer.from('00', 'hex')),
    };
    deserializeAccountTransactionBase(AccountTransactionType.TransferWithMemo, payload);
});

test('test deserialize registerData ', () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('00AB5303926810EE', 'hex')),
    };
    deserializeAccountTransactionBase(AccountTransactionType.RegisterData, payload);
});

test('test deserialize DeployModule ', () => {
    const payload: DeployModulePayload = {
        version: 1,
        source: new Uint8Array([0x00, 0xab, 0x53, 0x03, 0x92, 0x68, 0x10, 0xee]),
    };
    deserializeAccountTransactionBase(AccountTransactionType.DeployModule, payload);
});

test('test deserialize InitContract ', () => {
    const moduleRef = ModuleReference.fromHexString('44434352ddba724930d6b1b09cd58bd1fba6ad9714cf519566d5fe72d80da0d1');
    const contractName = ContractName.fromStringUnchecked('weather');

    const deserializePayload: InitContractPayload = {
        amount: CcdAmount.zero(),
        moduleRef: moduleRef,
        initName: contractName,
        param: Parameter.fromHexString('0a'),
        maxContractExecutionEnergy: Energy.create(0),
    };

    const result = deserializeAccountTransactionBase(
        AccountTransactionType.InitContract,
        deserializePayload,
        Energy.create(0)
    );

    if (result.kind == BlockItemKind.AccountTransactionKind) {
        const transactionType = result.transaction.accountTransaction.type;
        if (transactionType === AccountTransactionType.InitContract) {
            const initPayload = result.transaction.accountTransaction.payload as InitContractPayload;
            expect(initPayload.maxContractExecutionEnergy).toBeDefined();
            expect(initPayload.maxContractExecutionEnergy).not.toEqual(0);
        }
    }
});

test('test deserialize UpdateContract ', () => {
    const deserializePayload: UpdateContractPayload = {
        amount: CcdAmount.zero(),
        address: ContractAddress.create(0, 1),
        receiveName: ReceiveName.fromString('method.abc'),
        message: Parameter.fromHexString('0a'),
        maxContractExecutionEnergy: Energy.create(0),
    };

    const result = deserializeAccountTransactionBase(AccountTransactionType.Update, deserializePayload);

    if (result.kind == BlockItemKind.AccountTransactionKind) {
        const transactionType = result.transaction.accountTransaction.type;
        if (transactionType === AccountTransactionType.Update) {
            const initPayload = result.transaction.accountTransaction.payload as UpdateContractPayload;
            expect(initPayload.maxContractExecutionEnergy).toBeDefined();
            expect(initPayload.maxContractExecutionEnergy).not.toEqual(0);
        }
    }
});

test('Expired transactions can be deserialized', () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };
    deserializeAccountTransactionBase(
        AccountTransactionType.Transfer,
        payload,
        undefined,
        undefined,
        TransactionExpiry.fromDate(new Date(2000, 1))
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
