import { getNodeClientV2 as getNodeClient } from './testHelpers.js';
import {
    ContractAddress,
    ContractName,
    isInstanceInfoV0,
    BlockHash,
    deserializeContractState,
} from '../../src/index.js';
import * as fs from 'fs';

const client = getNodeClient();

// TODO: find a new two-step-transfer instance / or another V0 contract with state
test.skip('Deserialize state with schema from file (two-step-transfer)', async () => {
    const blockHash =
        'fad0981b0424c6e1af746a39667628861481ac225f90decd233980311c2e19cb';
    const contractAddress = ContractAddress.create(1646);

    const instanceInfo = await client.getInstanceInfo(
        contractAddress,
        BlockHash.fromHexString(blockHash)
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
        fs.readFileSync('./test/client/resources/two-step-transfer-schema.bin')
    );
    const state = deserializeContractState(
        ContractName.fromStringUnchecked('two-step-transfer'),
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
