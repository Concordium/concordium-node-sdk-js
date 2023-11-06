import * as AccountAddress from '../../src/types/AccountAddress.js';
import * as TransactionExpiry from '../../src/types/TransactionExpiry.js';
import {
    OpenStatus,
    AccountTransaction,
    AccountTransactionType,
    CcdAmount,
    ConfigureBakerPayload,
    getAccountTransactionSignDigest,
    AccountTransactionHeader,
    SequenceNumber,
    InitContractPayload,
    ContractName,
    Energy,
    ModuleReference,
    Parameter,
    serializeAccountTransactionPayload,
} from '../../src/index.js';

const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const expiry = TransactionExpiry.fromDate(new Date(1675872215));

test('configureBaker is serialized correctly', async () => {
    const expectedDigest =
        'dcfb92b6e57b1d3e252c52cb8b838f44a33bf8d67301e89753101912f299dffb';

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
            electionVerifyKey:
                'adbf30d103c08cd4960b6e559ef9bd97427f5160d611eeba4507a116e0aa8cb3',
            proofAggregation:
                'c9c98d80869b56e51c57ea668aec00a62280268b595f113f801bcf205d996d22056b2779ce547874829f41dd81c267979ee5576aa8e5c0d090b3ad68752fb74b',
            proofElection:
                'd9102e9eb0e6d527df37a576fd09e218d3f2c5ff28a656f49fd02d81bec58a0dcfbb79be0ef9bad74cbc73522e769e912cc8541e058be0d8b654e1e7bed9780e',
            proofSig:
                'e033f3293c388b7388bcb7db01d6052c8ba869d6c8aa6ddba0d3b6dca288f30748ce47e87e368cd323e787fc5e2f48f34311d80bb39a9915551c09c81d97e80d',
            signatureVerifyKey:
                'e278cf4ae4f354833732c27aa2649559c450da1c73b2a29d50d258d9c3459727',
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
        moduleRef: ModuleReference.fromHexString(
            'aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'
        ),
        param: Parameter.empty(),
    };

    const transaction: AccountTransaction = {
        header,
        payload,
        type: AccountTransactionType.InitContract,
    };

    const serializedTransaction =
        serializeAccountTransactionPayload(transaction);

    // Slice out the init name part of the serialized transaction.
    const serializedInitName = serializedTransaction
        .slice(43, serializedTransaction.length - 2)
        .toString('utf8');

    expect(serializedInitName).toEqual('init_credential_registry');
});
