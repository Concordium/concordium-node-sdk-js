import { Buffer } from 'buffer/index.js';
import JSONBig from 'json-bigint';

import {
    CcdAmount,
    ContractAddress,
    ContractName,
    DataBlob,
    DelegationTargetType,
    ModuleReference,
    OpenStatus,
    Parameter,
    ReceiveName,
} from '../../../src/index.js';
import { AccountAddress } from '../../../src/pub/types.js';
import { Payload } from '../../../src/transactions/index.js';

const jsonBig = JSONBig({ useNativeBigInt: true });

describe('Payload', () => {
    describe('Transfer', () => {
        const transferPayload = Payload.transfer({
            amount: CcdAmount.fromMicroCcd(1000000n),
            toAddress: AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'),
        });

        test('serialize/deserialize roundtrip', () => {
            const serialized = Payload.serialize(transferPayload);
            const deserialized = Payload.deserialize(serialized);
            expect(deserialized).toEqual(transferPayload);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(transferPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(transferPayload);
        });
    });

    describe('TransferWithMemo', () => {
        const transferWithMemoPayload = Payload.transfer(
            {
                amount: CcdAmount.fromMicroCcd(2000000n),
                toAddress: AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M'),
            },
            new DataBlob(Buffer.from('abcdef', 'hex'))
        );

        test('serialize/deserialize roundtrip', () => {
            const serialized = Payload.serialize(transferWithMemoPayload);
            const deserialized = Payload.deserialize(serialized);
            expect(deserialized).toEqual(transferWithMemoPayload);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(transferWithMemoPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(transferWithMemoPayload);
        });
    });

    describe('DeployModule', () => {
        const deployModulePayload = Payload.deployModule({
            source: new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
            version: 1,
        });

        test('serialize/deserialize roundtrip', () => {
            const serialized = Payload.serialize(deployModulePayload);
            const deserialized = Payload.deserialize(serialized);
            expect(deserialized).toEqual(deployModulePayload);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(deployModulePayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized.type).toEqual(deployModulePayload.type);
            if ('version' in deserialized && 'version' in deployModulePayload) {
                expect(deserialized.version).toEqual(deployModulePayload.version);
            }
            if ('source' in deserialized && 'source' in deployModulePayload) {
                expect(Buffer.from(deserialized.source).equals(Buffer.from(deployModulePayload.source))).toBe(true);
            }
        });
    });

    describe('InitContract', () => {
        const initContractPayload = Payload.initContract({
            amount: CcdAmount.fromMicroCcd(0n),
            initName: ContractName.fromString('my_contract'),
            moduleRef: ModuleReference.fromHexString(
                'aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'
            ),
            param: Parameter.empty(),
        });

        test('serialize/deserialize roundtrip', () => {
            const serialized = Payload.serialize(initContractPayload);
            const deserialized = Payload.deserialize(serialized);
            expect(deserialized).toEqual(initContractPayload);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(initContractPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(initContractPayload);
        });
    });

    describe('UpdateContract', () => {
        const updateContractPayload = Payload.updateContract({
            amount: CcdAmount.fromMicroCcd(100n),
            address: ContractAddress.create(0, 0),
            receiveName: ReceiveName.fromString('my_contract.receive'),
            message: Parameter.empty(),
        });

        test('serialize/deserialize roundtrip', () => {
            const serialized = Payload.serialize(updateContractPayload);
            const deserialized = Payload.deserialize(serialized);
            expect(deserialized).toEqual(updateContractPayload);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(updateContractPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(updateContractPayload);
        });
    });

    describe('RegisterData', () => {
        const registerDataPayload = Payload.registerData({
            data: new DataBlob(Buffer.from('deadbeef', 'hex')),
        });

        test('serialize/deserialize roundtrip', () => {
            const serialized = Payload.serialize(registerDataPayload);
            const deserialized = Payload.deserialize(serialized);
            expect(deserialized).toEqual(registerDataPayload);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(registerDataPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(registerDataPayload);
        });
    });

    describe('ConfigureDelegation', () => {
        const configureDelegationPayload = Payload.configureDelegation({
            stake: CcdAmount.fromMicroCcd(5000000000n),
            restakeEarnings: true,
            delegationTarget: {
                delegateType: DelegationTargetType.PassiveDelegation,
            },
        });

        test('serialize roundtrip (deserialize not supported)', () => {
            const serialized = Payload.serialize(configureDelegationPayload);
            expect(serialized.length).toBeGreaterThan(0);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(configureDelegationPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(configureDelegationPayload);
        });
    });

    describe('ConfigureValidator', () => {
        const configureValidatorPayload = Payload.configureValidator({
            stake: CcdAmount.fromMicroCcd(10000000000n),
            restakeEarnings: false,
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
            metadataUrl: 'https://validator.example.com',
            transactionFeeCommission: 10,
            bakingRewardCommission: 5,
            finalizationRewardCommission: 5,
        });

        test('serialize roundtrip (deserialize not supported)', () => {
            const serialized = Payload.serialize(configureValidatorPayload);
            expect(serialized.length).toBeGreaterThan(0);
        });

        test('toJSON/fromJSON roundtrip', () => {
            const json = Payload.toJSON(configureValidatorPayload);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Payload.fromJSON(parsed);
            expect(deserialized).toEqual(configureValidatorPayload);
        });
    });
});
