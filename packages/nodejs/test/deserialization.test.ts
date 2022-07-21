import { getNodeClient } from './testHelpers';
import {
    deserializeContractState,
    isInstanceInfoV0,
} from '@concordium/common-sdk';
import { Buffer } from 'buffer/';
import * as fs from 'fs';

const client = getNodeClient();

test('Deserialize state with schema from file (two-step-transfer)', async () => {
    const blockHash =
        'fad0981b0424c6e1af746a39667628861481ac225f90decd233980311c2e19cb';
    const contractAddress = { index: BigInt(1646), subindex: BigInt(0) };

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

    const schema = Buffer.from(
        fs.readFileSync('./test/resources/two-step-transfer-schema.bin')
    );
    const state = deserializeContractState(
        'two-step-transfer',
        schema,
        instanceInfo.model
    );
    expect(state.init_params.transfer_agreement_threshold).toBe(2);
    expect(state.init_params.account_holders.length).toBe(2);
    expect(state.init_params.account_holders[0]).toBe(
        '3Y1RLgi5pW3x96xZ7CiDiKsTL9huU92qn6mfxpebwmtkeku8ry'
    );
    expect(state.init_params.account_holders[1]).toBe(
        '4EdBeGmpnQZWxaiig7FGEhWwmJurYmYsPWXo6owMDxA7ZtJMMH'
    );
    expect(state.init_params.transfer_request_ttl).toBe('0d 0h 0m 0s 0ms');
    expect(state.requests.length).toBe(0);
});
