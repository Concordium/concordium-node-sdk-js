import * as expected from './resources/expectedJsons';
import { asyncIterableToList } from '@concordium/common-sdk/src/util';
import { getNodeClientV2 } from './testHelpers';

const client = getNodeClientV2();

// AccountCreated
test('accountCreated', async () => {
    const blockHash =
        '67fd6360f39ea6d815133878e64070c578a66012b3eaa757cd1dba8a993079ea';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);

    expect(events[0]).toEqual(expected.accountCreationEvent);
});

// EncryptedAmountsRemoved, AmountAddedByDecryption
test('transferToPublic', async () => {
    const blockHash =
        'e59ba7559e2de14e1bd4c05ddbfca808dd5b870cd89eec3942ae29f842906262';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    if (
        events[0].type === 'accountTransaction' &&
        events[0].transactionType === 'transferToPublic'
    ) {
        const transferToPublicEvent = [events[0].removed, events[0].added];
        expect(transferToPublicEvent).toEqual(expected.transferToPublicEvent);
    } else {
        throw Error('Wrong event.');
    }
});

// BakerAdded, BakerSetBakingRewardCommission, BakerSetFinalizationRewardCommission,
// BakerSetMetadataURL, BakerSetOpenStatus, BakerSetRestakeEarnings
// BakerSetTransactionFeeCommission
test('configureBaker: Add baker', async () => {
    const blockHash =
        '04d24b3d44e4ec4681c279424bd276215809a6af64e57fd20cd907a08d998f09';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    if (
        events[0].type === 'accountTransaction' &&
        events[0].transactionType === 'configureBaker'
    ) {
        expect(expected.configureBaker).toEqual(expected.configureBaker);
    } else {
        throw Error('Wrong event.');
    }
});

// BakerRemoved
test('configureBaker: Remove baker', async () => {
    const blockHash =
        '2aa7c4a54ad403a9f9b48de2469e5f13a64c95f2cf7a8e72c0f9f7ae0718f642';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    if (
        events[0].type === 'accountTransaction' &&
        events[0].transactionType === 'configureBaker'
    ) {
        expect(events[0].events[0]).toEqual(expected.bakerRemoved);
    } else {
        throw Error('Wrong event.');
    }
});

// DelegationAdded, DelegationSetDelegationTarget, DelegationSetRestakeEarnings
// DelegationStakeIncreased,
test('configureDelegation', async () => {
    const blockHash =
        '9cf7f3ba97e027f08bc3dc779e6eb4aadaecee0899a532224846196f646921f3';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    if (
        events[0].type === 'accountTransaction' &&
        events[0].transactionType === 'configureDelegation'
    ) {
        expect(events[0].events).toEqual(expected.configureDelegation);
    } else {
        throw Error('Wrong event.');
    }
});

// Interrupted, Resumed, Transferred, Updated
test('update', async () => {
    const blockHash =
        'a74a3914143eb596132c74685fac1314f6d5e8bb393e3372e83726f0c4654de2';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    if (
        events[0].type === 'accountTransaction' &&
        events[0].transactionType === 'update'
    ) {
        expect(events[0].events).toEqual(expected.updatedEvent);
    } else {
        throw Error('Wrong event.');
    }
});
