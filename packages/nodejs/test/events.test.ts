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
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'transferToPublic'
    ) {
        const transferToPublicEvent = [event.removed, event.added];
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
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'configureBaker'
    ) {
        expect(event.events).toEqual(expected.configureBaker);
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
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'configureBaker'
    ) {
        expect(event.events[0]).toEqual(expected.bakerRemoved);
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
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'configureDelegation'
    ) {
        expect(event.events).toEqual(expected.configureDelegation);
    } else {
        throw Error('Wrong event.');
    }
});

// Interrupted, Resumed, Transferred, Updated
test('contract update', async () => {
    const blockHash =
        'a74a3914143eb596132c74685fac1314f6d5e8bb393e3372e83726f0c4654de2';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'update'
    ) {
        expect(event.events).toEqual(expected.updateEvent);
    } else {
        throw Error('Wrong event.');
    }
});

// EncryptedSelfAmountAdded
test('transferToEncrypted', async () => {
    const blockHash =
        '0254312274ccd192288ca49923c6571ae64d7d0ef57923a68d4c1b055e2ca757';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'transferToEncrypted'
    ) {
        expect(event.added).toEqual(expected.encryptedSelfAmountAddedEvent);
    } else {
        throw Error('Wrong event.');
    }
});

// UpdateEnqueued
test('UpdateEnqueued', async () => {
    const blockHash =
        '39122a9c720cae643b999d93dd7bf09bcf50e99bb716767dd35c39690390db54';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);

    expect(events[0]).toEqual(expected.updateEnqueuedEvent);
});

// ContractInitialized
test('ContractInitialized', async () => {
    const blockHash =
        '70dbb294060878220505e928d616dde2d90cf5eeee0a92d3fdc1268334ace89e';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'initContract'
    ) {
        expect(event.contractInitialized).toEqual(
            expected.contractInitializedEvent
        );
    } else {
        throw Error('Wrong event.');
    }
});

// ModuleDeployed
test('ModuleDeployed', async () => {
    const blockHash =
        'c7fd8efa319942d54336ccdfe8460a0591a2a4b3a6bac65fe552198d530105d1';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'deployModule'
    ) {
        expect(event.moduleDeployed).toEqual(expected.moduleDeployedEvent);
    } else {
        throw Error('Wrong event.');
    }
});

// DelegationRemoved
test('DelegationRemoved', async () => {
    const blockHash =
        '65ad6b6a4c9eaccb99a01e2661fcc588a411beb0ed91d39ac692359d5a666631';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[1]

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'configureDelegation'
    ) {
        expect(event.events[0]).toEqual(expected.delegationRemovedEvent);
    } else {
        throw Error('Wrong event:');
    }
});

// TransferMemo
test('TransferMemo', async () => {
    const blockHash =
        'df96a12cc515bc863ed7021154494c8747e321565ff8b788066f0308c2963ece';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0]

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'transferWithMemo'
    ) {
        expect(event).toEqual(expected.transferWithMemoEvent);
    } else {
        throw Error('Wrong event:');
    }
});

// Upgraded
test('Upgraded', async () => {
    const blockHash =
        '77ffdf2e8e4144a9a39b20ea7211a4aee0a23847778dcc1963c7a85f32b4f27d';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0]

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'update'
    ) {
        expect(event.events[1]).toEqual(expected.upgradedEvent);
    } else {
        throw Error('Wrong event:');
    }
});

// DataRegistered
test('DataRegistered', async () => {
    const blockHash =
        'ac4e60f4a014d823e3bf03859abdb2f9d2317b988dedc9c9621e3b7f5dcffb06';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await asyncIterableToList(eventStream);
    const event = events[0]

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'registerData'
    ) {
        expect(event.dataRegistered).toEqual(expected.dataRegisteredEvent);
    } else {
        throw Error('Wrong event:');
    }
});