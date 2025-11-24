import assert from 'assert';
import fs from 'fs';
import path from 'path';

import {
    AccountAddress,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    AccountTransactionV0,
    BlockItemKind,
    CIS2,
    Cbor,
    CcdAmount,
    ContractAddress,
    ContractName,
    DataBlob,
    DeployModulePayload,
    Energy,
    IndexedCredentialDeploymentInfo,
    InitContractInput,
    ModuleReference,
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
    UpdateContractInput,
    UpdateCredentialsInput,
    calculateEnergyCost,
    deserializeTransaction,
    getAccountTransactionHandler,
    tokenAddressFromBase58,
    tokenAddressToBase58,
} from '../../src/index.js';
import {
    serializeAccountTransactionForSubmission,
    serializeAccountTransactionPayload,
} from '../../src/serialization.js';

function deserializeAccountTransactionBase(transaction: AccountTransaction) {
    const signatures: AccountTransactionSignature = {
        0: {
            0: '780e4f5e00554fb4e235c67795fbd6d4ad638f3778199713f03634c846e4dbec496f0b13c4454e1a760c3efffec7cc8c11c6053a632dd32c9714cd26952cda08',
        },
    };

    const deserialized = deserializeTransaction(serializeAccountTransactionForSubmission(transaction, signatures));
    assert(deserialized.kind === BlockItemKind.AccountTransactionKind, 'Expected account transaction');
    const payloadSize = serializeAccountTransactionPayload(transaction).length;
    const baseEnergy = getAccountTransactionHandler(transaction.type).getBaseEnergyCost(transaction.payload);
    const energyAmount = calculateEnergyCost(1n, BigInt(payloadSize), baseEnergy);

    const expectedHeader: AccountTransactionV0.Header = {
        sender: transaction.header.sender,
        nonce: transaction.header.nonce,
        expiry: transaction.header.expiry,
        payloadSize,
        energyAmount,
    };
    // Filter out input values, as they will not be included in deserialized values
    const { maxContractExecutionEnergy, currentNumberOfCredentials, ...expectedPayload } = transaction.payload as any;
    const { type, ...payload } = deserialized.transaction.payload;

    expect(deserialized.transaction.signature).toEqual(signatures);
    expect(deserialized.transaction.header).toEqual(expectedHeader);
    expect(deserialized.transaction.payload.type).toEqual(transaction.type);

    expect(payload).toEqual(expectedPayload);
}

const header: AccountTransactionHeader = {
    nonce: SequenceNumber.create(1),
    sender: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    expiry: TransactionExpiry.futureMinutes(5),
};

test('test deserialize simpleTransfer ', () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.Transfer,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('test deserialize simpleTransfer with memo ', () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
        memo: new DataBlob(Buffer.from('00', 'hex')),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.TransferWithMemo,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('test deserialize registerData ', () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('00AB5303926810EE', 'hex')),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.RegisterData,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('test deserialize DeployModule ', () => {
    const payload: DeployModulePayload = {
        version: 1,
        source: new Uint8Array([0x00, 0xab, 0x53, 0x03, 0x92, 0x68, 0x10, 0xee]),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.DeployModule,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('test deserialize InitContract ', () => {
    const moduleRef = ModuleReference.fromHexString('44434352ddba724930d6b1b09cd58bd1fba6ad9714cf519566d5fe72d80da0d1');
    const contractName = ContractName.fromStringUnchecked('weather');

    const payload: InitContractInput = {
        amount: CcdAmount.zero(),
        moduleRef: moduleRef,
        initName: contractName,
        param: Parameter.fromHexString('0a'),
        maxContractExecutionEnergy: Energy.create(30000),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.InitContract,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('test deserialize UpdateContract ', () => {
    const payload: UpdateContractInput = {
        amount: CcdAmount.zero(),
        address: ContractAddress.create(0, 1),
        receiveName: ReceiveName.fromString('method.abc'),
        message: Parameter.fromHexString('0a'),
        maxContractExecutionEnergy: Energy.create(3000),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.Update,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('test deserialize TokenUpdate ', () => {
    const pause = {};
    const pauseOperation = { pause } as TokenOperation;

    const payload: TokenUpdatePayload = {
        tokenId: TokenId.fromString('123ABCToken'),
        operations: Cbor.encode([pauseOperation]),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.TokenUpdate,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});

test('Expired transactions can be deserialized', () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(5100000),
        toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.Transfer,
        payload,
    };
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


test('test deserialize UpdateCredential', () => {

    const cdi = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'resources/cdi.json')).toString());

    const credentialDeploymentInfo: IndexedCredentialDeploymentInfo = {
           index: 0,
           cdi,
    };

    const payload: UpdateCredentialsInput = {
        newCredentials: [credentialDeploymentInfo],
        removeCredentialIds: 
        ['123000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', 
            '456000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'], ///make these 48 bytes
        threshold: 5,
        currentNumberOfCredentials: 2n,
    };

    const transaction: AccountTransaction = {
        header,
        type: AccountTransactionType.UpdateCredentials,
        payload,
    };
    deserializeAccountTransactionBase(transaction);
});
