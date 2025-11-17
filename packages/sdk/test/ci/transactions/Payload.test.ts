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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(transferPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe(
                '0349176df18432686c93c61ca89dafbe1cb383bfe6eb3a301ef8907f852643d98d00000000000f4240'
            );
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(transferPayload);
            expect(json).toEqual({
                type: 3,
                amount: '1000000',
                toAddress: '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt',
            });
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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(transferWithMemoPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe(
                '16d46bbc5fbbbbabb07752d4acb86892d7a2479856d414182f703e21065dad046d0003abcdef00000000001e8480'
            );
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(transferWithMemoPayload);
            expect(json).toEqual({
                type: 22,
                amount: '2000000',
                toAddress: '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M',
                memo: '0003abcdef',
            });
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
            expect(deserialized).toEqual(deployModulePayload);
        });

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(deployModulePayload);
            expect(Buffer.from(serialized).toString('hex')).toBe('0000000001000000080061736d01000000');
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(deployModulePayload);
            expect(json).toEqual({
                type: 0,
                version: 1,
                source: '0061736d01000000',
            });
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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(initContractPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe(
                '010000000000000000aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd0010696e69745f6d795f636f6e74726163740000'
            );
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(initContractPayload);
            expect(json).toEqual({
                type: 1,
                amount: '0',
                initName: 'my_contract',
                moduleRef: '00000020aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd',
                param: '',
            });
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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(updateContractPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe(
                '0200000000000000640000000000000000000000000000000000136d795f636f6e74726163742e726563656976650000'
            );
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(updateContractPayload);
            expect(json).toEqual({
                type: 2,
                amount: '100',
                address: { index: 0n, subindex: 0n },
                receiveName: 'my_contract.receive',
                message: '',
            });
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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(registerDataPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe('150004deadbeef');
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(registerDataPayload);
            expect(json).toEqual({
                type: 21,
                data: '0004deadbeef',
            });
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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(configureDelegationPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe('1a0007000000012a05f2000100');
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(configureDelegationPayload);
            expect(json).toEqual({
                type: 26,
                stake: '5000000000',
                restakeEarnings: true,
                delegationTarget: { delegateType: 'Passive' },
            });
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

        test('serialize produces fixed hex output', () => {
            const serialized = Payload.serialize(configureValidatorPayload);
            expect(Buffer.from(serialized).toString('hex')).toBe(
                '1900ff00000002540be4000002adbf30d103c08cd4960b6e559ef9bd97427f5160d611eeba4507a116e0aa8cb3d9102e9eb0e6d527df37a576fd09e218d3f2c5ff28a656f49fd02d81bec58a0dcfbb79be0ef9bad74cbc73522e769e912cc8541e058be0d8b654e1e7bed9780ee278cf4ae4f354833732c27aa2649559c450da1c73b2a29d50d258d9c3459727e033f3293c388b7388bcb7db01d6052c8ba869d6c8aa6ddba0d3b6dca288f30748ce47e87e368cd323e787fc5e2f48f34311d80bb39a9915551c09c81d97e80dad8e519b6a7f869780a547b6aade0aeb112a7364160b391fc179d68792388cd99d3b60c2037964abbadaf22bfded67b913eed9ac246f2fc39c3eff7c7060838e320fea1419c9282159e56ae5aef1291d31ba34ad389c9571e4d83cf65509bb57c9c98d80869b56e51c57ea668aec00a62280268b595f113f801bcf205d996d22056b2779ce547874829f41dd81c267979ee5576aa8e5c0d090b3ad68752fb74b001d68747470733a2f2f76616c696461746f722e6578616d706c652e636f6d0000000a0000000500000005'
            );
        });

        test('toJSON produces fixed JSON output', () => {
            const json = Payload.toJSON(configureValidatorPayload);
            expect(json).toEqual({
                type: 25,
                stake: '10000000000',
                restakeEarnings: false,
                openForDelegation: 2,
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
        });
    });
});
