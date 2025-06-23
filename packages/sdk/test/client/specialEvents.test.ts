import { BlockHash, streamToList } from '../../src/index.js';
import { testEnvironment } from '../globals.ts';
import * as expected from './resources/expectedJsons.js';
import { getNodeClientV2, getNodeClientWeb } from './testHelpers.js';

const client = testEnvironment === 'node' ? getNodeClientV2() : getNodeClientWeb();

test('mint', async () => {
    const blockHash = BlockHash.fromHexString('4031d210b35a3fb9f13d1ce6e5c621abd9a26a2de54b71fc19bfb55fe17cce6a');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[0]).toEqual(expected.mintSpecialEvent);
});

test('paydayFoundationReward', async () => {
    const blockHash = BlockHash.fromHexString('4031d210b35a3fb9f13d1ce6e5c621abd9a26a2de54b71fc19bfb55fe17cce6a');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[1]).toEqual(expected.paydayFoundationRewardSpecialEvent);
});

test('paydayPoolReward', async () => {
    const blockHash = BlockHash.fromHexString('4031d210b35a3fb9f13d1ce6e5c621abd9a26a2de54b71fc19bfb55fe17cce6a');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[2]).toEqual(expected.paydayPoolRewardSpecialEvent);
});

test('paydayAccountReward', async () => {
    const blockHash = BlockHash.fromHexString('4031d210b35a3fb9f13d1ce6e5c621abd9a26a2de54b71fc19bfb55fe17cce6a');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[4]).toEqual(expected.paydayAccountRewardSpecialEvent);
});

test('blockAccrueReward', async () => {
    const blockHash = BlockHash.fromHexString('4031d210b35a3fb9f13d1ce6e5c621abd9a26a2de54b71fc19bfb55fe17cce6a');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[25]).toEqual(expected.blockAccrueRewardSpecialEvent);
});

test('bakingRewards', async () => {
    const blockHash = BlockHash.fromHexString('da7a5401049c8ee0de0b6c66ab4f6167ef770b332df9dd9979ec2c553d1a18dd');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[0]).toEqual(expected.bakingRewardsSpecialEvent);
});

test('finalizationRewards', async () => {
    const blockHash = BlockHash.fromHexString('da7a5401049c8ee0de0b6c66ab4f6167ef770b332df9dd9979ec2c553d1a18dd');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[2]).toEqual(expected.finalizationRewardsSpecialEvent);
});

test('blockReward', async () => {
    const blockHash = BlockHash.fromHexString('da7a5401049c8ee0de0b6c66ab4f6167ef770b332df9dd9979ec2c553d1a18dd');
    const eventStream = client.getBlockSpecialEvents(blockHash);
    const events = await streamToList(eventStream);

    expect(events[3]).toEqual(expected.blockRewardSpecialEvent);
});
