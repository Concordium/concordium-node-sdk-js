import {
    AccountAddress,
    ContractAddress,
    CcdAmount,
    isInstanceInfoV0,
    ModuleReference,
} from '@concordium/common-sdk';
import { getNodeClient } from './testHelpers';
const client = getNodeClient();

// test getInstanceInfo
test('retrieve information about a given smart contract instance', async () => {
    const blockHash =
        '31b7a1fe3f8a03acb52b50d95e129ece0ad41151248be801bf6aa5054a68e63b';
    const contractAddress: ContractAddress = {
        subindex: BigInt(0),
        index: BigInt(104),
    };
    const instanceInfo = await client.getInstanceInfo(
        contractAddress,
        blockHash
    );
    if (!instanceInfo) {
        throw new Error(
            'The instance info should exist for the provided block hash.'
        );
    }

    if (!isInstanceInfoV0(instanceInfo)) {
        throw new Error('The contract should be version 0, but was not.');
    }

    return Promise.all([
        expect(instanceInfo).not.toBe(null),
        expect(instanceInfo.amount).toStrictEqual(new CcdAmount(0n)),
        expect(instanceInfo.methods).toStrictEqual([
            'INDBankU81.insertAmount',
            'INDBankU81.smashAmount',
        ]),
        expect(Buffer.from('00', 'hex').equals(instanceInfo.model)).toBe(false),
        expect(instanceInfo.name).toBe('init_INDBankU81'),
        expect(instanceInfo.owner).toStrictEqual(
            new AccountAddress(
                '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5'
            )
        ),
        expect(instanceInfo.sourceModule).toStrictEqual(
            new ModuleReference(
                'fdea1e0404bc2f41cbe8d537abf6597e1a2872ef3d9f829729379cf89641ac76'
            )
        ),
    ]);
});

// test getInstances
test('retrieve all the smart contract instances at given block hash', async () => {
    const blockHash =
        '1729985f62c4070a8aed010fd0e5a76f6850bcc394eaf70bad517d93434f8822';

    const instances = await client.getInstances(blockHash);
    if (!instances) {
        throw new Error(
            'The instance info should exist for the provided block hash.'
        );
    }
    return Promise.all([
        expect(instances).not.toBe(null),
        expect(instances[0].index).toBe(0n),
        expect(instances[0].subindex).toBe(0n),
        expect(instances[1].index).toBe(1n),
        expect(instances[0].subindex).toBe(0n),
    ]);
});
