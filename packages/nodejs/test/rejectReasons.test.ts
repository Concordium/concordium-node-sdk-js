import { streamToList } from '@concordium/common-sdk';
import * as expected from './resources/expectedJsons.js';
import { getNodeClientV2 as getNodeClient } from './testHelpers.js';

const client = getNodeClient();

// EncryptedAmountSelfTransfer
test('EncryptedAmountSelfTransfer', async () => {
    const blockHash =
        'a68ef25ac9b38dfb76884dc797f0b1f924695218107caed3b3e370479d552c3a';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.encryptedAmountSelfTransferRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// FinalizationRewardCommissionNotInRange
test('FinalizationRewardCommissionNotInRange', async () => {
    const blockHash =
        'bb58a5dbcb77ec5d94d1039724e347a5a06b60bd098bb404c9967531e58ec870';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[1];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.finalizationRewardCommissionNotInRangeRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// DelegationTargetNotABaker
test('DelegationTargetNotABaker', async () => {
    const blockHash =
        'f885db7e2b27953f3f6f10b3c69bf7d9e77bc529768234e4191ecbc6fd4cc47d';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.delegationTargetNotABakerRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// AlreadyABaker
test('AlreadyABaker', async () => {
    const blockHash =
        '20324be7fdb1dd2556e5492ac0b73df408bda7f237066cee3c3d71a4804327a4';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.alreadyABakerRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// NonExistentCredentialID
test('NonExistentCredentialID', async () => {
    const blockHash =
        'be5bd3b147eeababdbf19a0d60b29e2aeddc7eb65e3ab901cbd4f071d5af211c';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.nonExistentCredentialIDRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// ModuleNotWF
test('ModuleNotWF', async () => {
    const blockHash =
        'b100e5568b2db7cce2da671ac17d45911447d86340b40a469717c15fd4098dda';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.moduleNotWFRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// AmountTooLarge
test('AmountTooLarge', async () => {
    const blockHash =
        '25658e0353cae71a48f25f9ed92682cc096d1463b801676b449cb89c7fa13a1f';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.amountTooLargeRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// ModuleHashAlreadyExists
test('ModuleHashAlreadyExists', async () => {
    const blockHash =
        'ec85ac5f3b7a39ac277aee9e96837c53be3bd3442068a0970ab3badd80fd88e5';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.moduleHashAlreadyExistsRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// TransactionFeeCommissionNotInRange
test('TransactionFeeCommissionNotInRange', async () => {
    const blockHash =
        '102ef7df5a6d1502c6e2b864e182cbb10824d017e88bb90a4cb82e3c054e0bba';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.transactionFeeCommissionNotInRangeRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// StakeOverMaximumThresholdForPool
test('StakeOverMaximumThresholdForPool', async () => {
    const blockHash =
        '5284633bd71b4f8840e9f2e86ced6a4615961248347669d7b5a5a7088422a9f0';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[1];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.stakeOverMaximumThresholdForPoolRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// BakerInCooldown
test('BakerInCooldown', async () => {
    const blockHash =
        'dd47761affcc6446306158cd51b8ab117b81ae5d33413af2b3c4c5f20275fb5f';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.bakerInCooldownRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InvalidInitMethod
test('InvalidInitMethod', async () => {
    const blockHash =
        '2830618959b146313cfc596826e59390f6b8907d33a964ec0663c1d7e975fcfa';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidInitMethodRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InsufficientBalanceForDelegationStake
test('InsufficientBalanceForDelegationStake', async () => {
    const blockHash =
        'dce2ce0d5e893e273eb53726e35fb249e3151db2347c624e5d0c5ffce20c4950';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.insufficientBalanceForDelegationStakeRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InvalidAccountReference
test('InvalidAccountReference', async () => {
    const blockHash =
        'a37e065c239787a4fca3241580dd37ce354ef97224adf1f34afbf92fdd310b69';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidAccountReferenceRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// MissingBakerAddParameters
test('MissingBakerAddParameters', async () => {
    const blockHash =
        '269d3730dd3813dbe5c8104be20bcfe02ee3fbd4a7a3da4fcca1271c38a6e405';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.missingBakerAddParametersRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// PoolClosed
test('PoolClosed', async () => {
    const blockHash =
        '72c2d0d9634b82ade18616711eb1cb351456b913d1758c4d840759a408b75775';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.poolClosedRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// ScheduledSelfTransfer
test('ScheduledSelfTransfer', async () => {
    const blockHash =
        '917ca9e15667a667cad97c7806ea27b78633d6821cc6f1fa29f8aecd238223c5';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.scheduledSelfTransferRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InvalidModuleReference
test('InvalidModuleReference', async () => {
    const blockHash =
        'c6ebed14d387e8d0c3f8120f83d69948b39478d7205e468f4db9b089459ff8c4';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidModuleReferenceRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// FirstScheduledReleaseExpired
test('FirstScheduledReleaseExpired', async () => {
    const blockHash =
        '8692bbfd18983543aace1a04596e27ec8f332243b01ed2b6fed28397bf66ff89';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.firstScheduledReleaseExpiredRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InvalidReceiveMethod
test('InvalidReceiveMethod', async () => {
    const blockHash =
        '0b667b6886760c37a176097b390fd1d655e714f2bf19a507b3242d8ee919ed1a';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidReceiveMethodRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InsufficientBalanceForBakerStake
test('InsufficientBalanceForBakerStake', async () => {
    const blockHash =
        '1803d84dfaa081e5da1c1dc96bbb65888a65904cba5abcbfc2aad963d2d39097';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.insufficientBalanceForBakerStakeRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// RuntimeFailure
test('RuntimeFailure', async () => {
    const blockHash =
        '5072f24f681fc5ff9ae09f0b698f8aed20c02bd6990fc59bcb618252ad257355';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.runtimeFailureRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// InvalidContractAddress
test('InvalidContractAddress', async () => {
    const blockHash =
        '30247d68bcca12a0a611bfc412a9a8b28152f501ea957970f1351c528bd58edf';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidContractAddressRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// OutOfEnergy
test('OutOfEnergy', async () => {
    const blockHash =
        '57c632333f9373fbc7ea4ce3306269981560fd87c5a6de23b4a7584604e2c6bc';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.outOfEnergyRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// InvalidEncryptedAmountTransferProof
test('InvalidEncryptedAmountTransferProof', async () => {
    const blockHash =
        '6a63a548e2d983cafe65f47a785e1e1dde1ba35f6fe16234602936f4fbecb4dd';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidEncryptedAmountTransferProofRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// RejectedInit
test('RejectedInit', async () => {
    const blockHash =
        'b95031d150ae90175c203a63b23f8dafd5a8c57defaf5d287a6c534d4a4ad2d5';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(expected.rejectedInitRejectReason);
    } else {
        throw Error('Wrong event');
    }
});

// RejectedReceive
test('RejectedReceive', async () => {
    const blockHash =
        '2141282b7a2ec57f3bcce59dc3b0649c80b872ae21a56c2ad300c4002145f988';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.rejectedReceiveRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// StakeUnderMinimumThresholdForBaking
test('StakeUnderMinimumThresholdForBaking', async () => {
    const blockHash =
        '4d8a001488e2295911b55822c9fb48fae7deff1bb1e2a36aba54c5f61b8e3159';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.stakeUnderMinimumThresholdForBakingRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// InvalidTransferToPublicProof
test('InvalidTransferToPublicProof', async () => {
    const blockHash =
        '10f02dba8e75ef25d2eefde19d39624c62600f13a5d91b857283b718017a4471';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.invalidTransferToPublicProofRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// SerializationFailure
test('SerializationFailure', async () => {
    const blockHash =
        'd3e2e0a0a6674a56f9e057894fcba2244c21242705f9a95ba1052e6ab156eeb1';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.serializationFailureRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});

// PoolWouldBecomeOverDelegated
test('PoolWouldBecomeOverDelegated', async () => {
    const blockHash =
        'c4ae2d1e29ed2dfed7e4a0e08fb419ae6b5cef65cba9ff0c6553ef6377b3e95c';
    const eventStream = client.getBlockTransactionEvents(blockHash);
    const events = await streamToList(eventStream);
    const event = events[0];

    if (
        event.type === 'accountTransaction' &&
        event.transactionType === 'failed'
    ) {
        expect(event.rejectReason).toEqual(
            expected.poolWouldBecomeOverDelegatedRejectReason
        );
    } else {
        throw Error('Wrong event');
    }
});
