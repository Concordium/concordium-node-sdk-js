import { Buffer } from 'buffer/index.js';
import fs from 'fs';
import JSONBig from 'json-bigint';

import {
    ConfigureBakerHandler,
    DeployModuleHandler,
    InitContractHandler,
    RegisterDataHandler,
    SimpleTransferHandler,
    SimpleTransferWithMemoHandler,
    UpdateContractHandler,
    UpdateCredentialsHandler,
} from '../../src/accountTransactions.ts';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionType,
    CcdAmount,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    ContractAddress,
    ContractName,
    DataBlob,
    DelegationTargetType,
    DeployModulePayload,
    Energy,
    IndexedCredentialDeploymentInfo,
    InitContractPayload,
    ModuleReference,
    OpenStatus,
    Parameter,
    ReceiveName,
    RegisterDataPayload,
    SequenceNumber,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    UpdateContractPayload,
    UpdateCredentialsPayload,
    getAccountTransactionSignDigest,
    serializeAccountTransactionPayload,
} from '../../src/index.js';
import * as AccountAddress from '../../src/types/AccountAddress.js';
import * as TransactionExpiry from '../../src/types/TransactionExpiry.js';

const senderAccountAddress = '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const expiry = TransactionExpiry.fromDate(new Date(1675872215));

test('configureBaker is serialized correctly', async () => {
    const expectedDigest = 'dcfb92b6e57b1d3e252c52cb8b838f44a33bf8d67301e89753101912f299dffb';

    const header: AccountTransactionHeader = {
        expiry,
        nonce: SequenceNumber.create(1),
        sender: AccountAddress.fromBase58(senderAccountAddress),
    };

    const payload: Required<ConfigureBakerPayload> = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        openForDelegation: OpenStatus.ClosedForAll,
        keys: {
            aggregationVerifyKey:
                'ad8e519b6a7f869780a547b6aade0aeb112a7364160b391fc179d68792388cd99d3b60c2037964abbadaf22bfded67b913eed9ac246f2fc39c3eff7c7060838e320fea1419c9282159e56ae5aef1291d31ba34ad389c9571e4d83cf65509bb57',
            electionVerifyKey: 'adbf30d103c08cd4960b6e559ef9bd97427f5160d611eeba4507a116e0aa8cb3',
            proofAggregation:
                'c9c98d80869b56e51c57ea668aec00a62280268b595f113f801bcf205d996d22056b2779ce547874829f41dd81c267979ee5576aa8e5c0d090b3ad68752fb74b',
            proofElection:
                'd9102e9eb0e6d527df37a576fd09e218d3f2c5ff28a656f49fd02d81bec58a0dcfbb79be0ef9bad74cbc73522e769e912cc8541e058be0d8b654e1e7bed9780e',
            proofSig:
                'e033f3293c388b7388bcb7db01d6052c8ba869d6c8aa6ddba0d3b6dca288f30748ce47e87e368cd323e787fc5e2f48f34311d80bb39a9915551c09c81d97e80d',
            signatureVerifyKey: 'e278cf4ae4f354833732c27aa2649559c450da1c73b2a29d50d258d9c3459727',
        },
        metadataUrl: 'test.com',
        transactionFeeCommission: 1,
        bakingRewardCommission: 1,
        finalizationRewardCommission: 1,
    };

    const transaction: AccountTransaction = {
        header,
        payload,
        type: AccountTransactionType.ConfigureBaker,
    };

    const signDigest = getAccountTransactionSignDigest(transaction);

    expect(signDigest.toString('hex')).toBe(expectedDigest);
});

test('Init contract serializes init name correctly', async () => {
    const header: AccountTransactionHeader = {
        expiry,
        nonce: SequenceNumber.create(1),
        sender: AccountAddress.fromBase58(senderAccountAddress),
    };

    const initNameBase = 'credential_registry';

    const payload: InitContractPayload = {
        amount: CcdAmount.fromMicroCcd(0),
        initName: ContractName.fromString(initNameBase),
        maxContractExecutionEnergy: Energy.create(30000),
        moduleRef: ModuleReference.fromHexString('aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'),
        param: Parameter.empty(),
    };

    const transaction: AccountTransaction = {
        header,
        payload,
        type: AccountTransactionType.InitContract,
    };

    const serializedTransaction = serializeAccountTransactionPayload(transaction);

    // Slice out the init name part of the serialized transaction.
    const serializedInitName = serializedTransaction.slice(43, serializedTransaction.length - 2).toString('utf8');

    expect(serializedInitName).toEqual('init_credential_registry');
});

test('SimpleTransferPayload serializes to JSON correctly', async () => {
    const payload: SimpleTransferPayload = {
        amount: CcdAmount.fromMicroCcd(1000000000n),
        toAddress: AccountAddress.fromBase58(senderAccountAddress),
    };
    const handler = new SimpleTransferHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);
});

test('SimpleTransferWithMemoPayload serializes to JSON correctly', async () => {
    const payload: SimpleTransferWithMemoPayload = {
        amount: CcdAmount.fromMicroCcd(1000000000n),
        memo: new DataBlob(Buffer.from('test', 'utf8')),
        toAddress: AccountAddress.fromBase58(senderAccountAddress),
    };
    const handler = new SimpleTransferWithMemoHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);
});

test('DeployModulePayload serializes to JSON correctly', async () => {
    const payload: DeployModulePayload = {
        version: 1,
        source: Buffer.from('test', 'utf8'),
    };
    const handler = new DeployModuleHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);

    const payloadNoVersion: DeployModulePayload = {
        source: Buffer.from('test2', 'utf8'),
    };
    const jsonNoVersion = handler.toJSON(payloadNoVersion);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(jsonNoVersion)))).toEqual(payloadNoVersion);
});

test('InitContractPayload serializes to JSON correctly', async () => {
    const payload: InitContractPayload = {
        amount: CcdAmount.fromMicroCcd(1000),
        initName: ContractName.fromString('test'),
        maxContractExecutionEnergy: Energy.create(30000),
        moduleRef: ModuleReference.fromHexString('aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'),
        param: Parameter.fromBuffer(Buffer.from('test', 'utf8')),
    };
    const handler = new InitContractHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);
});

test('UpdateContractPayload serializes to JSON correctly', async () => {
    const payload: UpdateContractPayload = {
        amount: CcdAmount.fromMicroCcd(5),
        address: ContractAddress.fromSchemaValue({ index: 1n, subindex: 2n }),
        receiveName: ReceiveName.fromString('test.abc'),
        message: Parameter.fromBuffer(Buffer.from('test', 'utf8')),
        maxContractExecutionEnergy: Energy.create(30000),
    };
    const handler = new UpdateContractHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);
});

test('UpdateCredentialsPayload serializes to JSON correctly', async () => {
    const credentialDeploymentInfo: IndexedCredentialDeploymentInfo = {
        index: 0,
        cdi: JSON.parse(fs.readFileSync('./test/ci/resources/cdi.json').toString()).value,
    };

    const payload: UpdateCredentialsPayload = {
        newCredentials: [credentialDeploymentInfo],
        removeCredentialIds: ['123', '456'],
        threshold: 5,
        currentNumberOfCredentials: 2n,
    };
    const handler = new UpdateCredentialsHandler();
    const json = handler.toJSON(payload);
    // We cannot JSONBig.stringify and JSONBig.parse the json because small BigInts are converted to numbers
    expect(handler.fromJSON(json)).toEqual(payload);
    expect(() => JSONBig.stringify(json)).not.toThrow();
});

test('RegisterDataPayload serializes to JSON correctly', async () => {
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('test', 'utf8')),
    };
    const handler = new RegisterDataHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);
});

test('ConfigureBakerPayload serializes to JSON correctly', async () => {
    const payload: ConfigureBakerPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        openForDelegation: OpenStatus.ClosedForAll,
        keys: {
            signatureVerifyKey: 'abcdef',
            electionVerifyKey: 'abcdef',
            aggregationVerifyKey: 'abcdef',
            proofAggregation: 'abcdef',
            proofSig: 'abcdef',
            proofElection: 'abcdef',
        },
        metadataUrl: 'http://example.com',
        transactionFeeCommission: 1,
        bakingRewardCommission: 1,
        finalizationRewardCommission: 1,
    };
    const handler = new ConfigureBakerHandler();
    const json = handler.toJSON(payload);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(json)))).toEqual(payload);

    const payloadPartial: ConfigureBakerPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        openForDelegation: OpenStatus.ClosedForAll,
    };
    const jsonPartial = handler.toJSON(payloadPartial);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(jsonPartial)))).toEqual(payloadPartial);
});

test('ConfigureDelegationPayload serializes to JSON correctly', async () => {
    const payloadBakerDelegation: ConfigureDelegationPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        delegationTarget: {
            delegateType: DelegationTargetType.Baker,
            bakerId: 5n,
        },
    };
    const handler = new ConfigureBakerHandler();
    const json = handler.toJSON(payloadBakerDelegation);
    // We cannot JSONBig.stringify and JSONBig.parse the json because small BigInts are converted to numbers
    expect(handler.fromJSON(json)).toEqual(payloadBakerDelegation);
    expect(() => JSONBig.stringify(json)).not.toThrow();

    const payloadPassiveDelegation: ConfigureDelegationPayload = {
        stake: CcdAmount.fromMicroCcd(1000000000n),
        restakeEarnings: true,
        delegationTarget: {
            delegateType: DelegationTargetType.PassiveDelegation,
        },
    };
    const jsonPassive = handler.toJSON(payloadPassiveDelegation);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(jsonPassive)))).toEqual(payloadPassiveDelegation);

    const payloadPartial: ConfigureDelegationPayload = {
        restakeEarnings: true,
    };
    const jsonPartial = handler.toJSON(payloadPartial);
    expect(handler.fromJSON(JSONBig.parse(JSONBig.stringify(jsonPartial)))).toEqual(payloadPartial);
});
