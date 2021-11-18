import { AccountAddress, ContractAddress, GtuAmount } from '../src';
import { ModuleReference } from '../src/types/moduleReference';
import { getNodeClient } from './testHelpers';
const client = getNodeClient();

// test getInstanceInfo
test('retrieve information about a given smart contract instance', async () => {
    const blockHash =
        '1729985f62c4070a8aed010fd0e5a76f6850bcc394eaf70bad517d93434f8822';
    const contractAddress: ContractAddress = {
        subindex: BigInt(0),
        index: BigInt(87),
    };
    const instanceInfo = await client.getInstanceInfo(
        blockHash,
        contractAddress
    );
    if (!instanceInfo) {
        throw new Error(
            'The instance info should exist for the provided block hash.'
        );
    }
    return Promise.all([
        expect(instanceInfo).not.toBe(null),
        expect(instanceInfo.amount).toStrictEqual(new GtuAmount(5000n)),
        expect(instanceInfo.methods).toStrictEqual([
            'INDBank.balanceOf',
            'INDBank.insertAmount',
            'INDBank.smashAmount',
        ]),
        expect(Buffer.from('00', 'hex').equals(instanceInfo.model)).toBe(true),
        expect(instanceInfo.name).toBe('init_INDBank'),
        expect(instanceInfo.owner).toStrictEqual(
            new AccountAddress(
                '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5'
            )
        ),
        expect(instanceInfo.sourceModule).toStrictEqual(
            new ModuleReference(
                'e51d9f9329f103faa18b1c99335281204df9e3eec23d7138f69ddd17fd63e9d0'
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
