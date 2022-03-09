import {
    ReduceStakePendingChange,
    instanceOfTransferWithMemoTransactionSummary,
    NormalAccountCredential,
    TransferredWithScheduleEvent,
    PoolStatusType,
    BakerId,
    BakerPoolPendingChangeType,
    OpenStatusText,
    DelegationTargetType,
    DelegationTargetBaker,
} from '../src/types';
import { AccountAddress } from '../src/types/accountAddress';
import { isValidDate, getNodeClient } from './testHelpers';
import { bulletProofGenerators } from './resources/bulletproofgenerators';
import { ipVerifyKey1, ipVerifyKey2 } from './resources/ipVerifyKeys';
import { PeerElement } from '../grpc/concordium_p2p_rpc_pb';
import { CredentialRegistrationId } from '../src/types/CredentialRegistrationId';
import { isBlockSummaryV1 } from '../src/blockSummaryHelpers';
import {
    isBakerAccount,
    isBakerAccountV1,
    isDelegatorAccount,
} from '../src/accountHelpers';
import { isRewardStatusV1 } from '../src/rewardStatusHelpers';

const client = getNodeClient();

test('updated event is parsed correctly', async () => {
    const blockHash =
        '7838e431c1495a05a8c3d74f16cf31ae84ebfee3e0acc0fe2362cf597d9b0e91';
    const blockSummary = await client.getBlockSummary(blockHash);

    if (!blockSummary) {
        throw new Error(
            'The block summary should exist for the provided block.'
        );
    }

    if (blockSummary.transactionSummaries[0].result.outcome !== 'success') {
        throw new Error('Unexpected outcome');
    }

    if (
        blockSummary.transactionSummaries[0].result.events[0].tag === 'Updated'
    ) {
        expect(
            blockSummary.transactionSummaries[0].result.events[0].amount
        ).toBe(2000000n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].instigator
                .address
        ).toBe('4XXTkvZHRg8S62TQcoqZLbZbAEDKYrdH5zLERpsEbtrnJoM7TG');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].instigator
                .type
        ).toBe('AddressAccount');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].address.index
        ).toBe(8n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].address
                .subindex
        ).toBe(0n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].receiveName
        ).toBe('XO.join_player_one');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].events
        ).toEqual([]);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].message
        ).toBe('');
    } else {
        throw new Error('The summary should be for an Updated event');
    }
});

test('transferred event is parsed correctly', async () => {
    const blockHash =
        '4b39a13d326f422c76f12e20958a90a4af60a2b7e098b2a59d21d402fff44bfc';
    const blockSummary = await client.getBlockSummary(blockHash);

    if (!blockSummary) {
        throw new Error(
            'The block summary should exist for the provided block.'
        );
    }

    if (blockSummary.transactionSummaries[0].result.outcome !== 'success') {
        throw new Error('Unexpected outcome');
    }

    if (
        blockSummary.transactionSummaries[0].result.events[0].tag ===
        'Transferred'
    ) {
        expect(
            blockSummary.transactionSummaries[0].result.events[0].amount
        ).toBe(2000000000n);
        expect(
            blockSummary.transactionSummaries[0].result.events[0].to.address
        ).toBe('4KDqzVUMCP2oc7qmMqu4wVsqYCCyju1g3apqy2xakGaEGJKtyr');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].to.type
        ).toBe('AddressAccount');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].from.address
        ).toBe('4KDqzVUMCP2oc7qmMqu4wVsqYCCyju1g3apqy2xakGaEGJKtyr');
        expect(
            blockSummary.transactionSummaries[0].result.events[0].from.type
        ).toBe('AddressAccount');
    } else {
        throw new Error('The summary should be for a Transferred event');
    }
});

test('block summary for valid block hash retrieves block summary (v0)', async () => {
    const blockHash =
        '4b39a13d326f422c76f12e20958a90a4af60a2b7e098b2a59d21d402fff44bfc';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('The block could not be found by the test');
    }

    if (isBlockSummaryV1(blockSummary)) {
        throw new Error('Expected block to adhere to version 0 spec.');
    }

    return Promise.all([
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .mintDistribution.mintPerSlot
        ).toBe(7.555665e-10),
        expect(
            blockSummary.updates.chainParameters.minimumThresholdForBaking
        ).toBe(15000000000n),
        expect(blockSummary.updates.chainParameters.bakerCooldownEpochs).toBe(
            166n
        ),
        expect(blockSummary.finalizationData.finalizationIndex).toBe(15436n),
        expect(blockSummary.finalizationData.finalizationDelay).toBe(0n),
        expect(blockSummary.finalizationData.finalizationBlockPointer).toBe(
            'ccc4e8781fe07ec25e9fadb5e2e1d57fc7654327bc911783a17921a70f44ab42'
        ),
        expect(blockSummary.finalizationData.finalizers.length).toBe(10),
        expect(blockSummary.finalizationData.finalizers[0].bakerId).toBe(0n),
        expect(blockSummary.finalizationData.finalizers[0].signed).toBe(true),
        expect(blockSummary.finalizationData.finalizers[0].weight).toBe(
            700946588805952n
        ),

        expect(blockSummary.transactionSummaries[0].cost).toBe(6010n),
        expect(blockSummary.transactionSummaries[0].energyCost).toBe(601n),
        expect(blockSummary.transactionSummaries[0].hash).toBe(
            'e2df806768b6f6a52f8654a12be2e6c832fedabe1d1a27eb278dc4e5f9d8631f'
        ),
        expect(blockSummary.transactionSummaries[0].sender).toBe(
            '4KDqzVUMCP2oc7qmMqu4wVsqYCCyju1g3apqy2xakGaEGJKtyr'
        ),
        expect(blockSummary.transactionSummaries[0].index).toBe(0n),

        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .transactionFeeDistribution.baker
        ).toBe(0.45),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .transactionFeeDistribution.gasAccount
        ).toBe(0.45),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .mintDistribution.bakingReward
        ).toBe(0.6),
        expect(
            blockSummary.updates.chainParameters.rewardParameters
                .mintDistribution.finalizationReward
        ).toBe(0.3),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .chainUpdate
        ).toBe(0.005),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .accountCreation
        ).toBe(0.02),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .baker
        ).toBe(0.25),
        expect(
            blockSummary.updates.chainParameters.rewardParameters.gASRewards
                .finalizationProof
        ).toBe(0.005),
        expect(
            blockSummary.updates.chainParameters.microGTUPerEuro.numerator
        ).toBe(500000n),
        expect(
            blockSummary.updates.chainParameters.microGTUPerEuro.denominator
        ).toBe(1n),
        expect(
            blockSummary.updates.chainParameters.euroPerEnergy.numerator
        ).toBe(1n),
        expect(
            blockSummary.updates.chainParameters.euroPerEnergy.denominator
        ).toBe(50000n),

        expect(
            blockSummary.updates.chainParameters.foundationAccountIndex
        ).toBe(10n),
        expect(blockSummary.updates.chainParameters.accountCreationLimit).toBe(
            10
        ),
        expect(blockSummary.updates.chainParameters.electionDifficulty).toBe(
            0.025
        ),

        expect(
            blockSummary.updates.updateQueues.addAnonymityRevoker
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.addIdentityProvider
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.bakerStakeThreshold
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.electionDifficulty
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.euroPerEnergy.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.foundationAccount
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.gasRewards.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.level1Keys.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.level2Keys.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.microGTUPerEuro.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.mintDistribution
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.protocol.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.rootKeys.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.transactionFeeDistribution
                .nextSequenceNumber
        ).toBe(1n),

        expect(blockSummary.updates.keys.rootKeys.threshold).toBe(5),
        expect(blockSummary.updates.keys.rootKeys.keys[0].verifyKey).toBe(
            '2c3c756d25998fda4781bdc491896eb9be626955826f457248d5c1aacf4e8d72'
        ),
        expect(blockSummary.updates.keys.level1Keys.threshold).toBe(7),
        expect(blockSummary.updates.keys.level1Keys.keys[0].verifyKey).toBe(
            '221936c1197cd6ec5da314896af0bc384bd8ec54f543609ee5089fda5d9ee16b'
        ),
        expect(
            blockSummary.updates.keys.level2Keys.addAnonymityRevoker.threshold
        ).toBe(7),
        expect(
            blockSummary.updates.keys.level2Keys.addAnonymityRevoker
                .authorizedKeys[0]
        ).toBe(0),
    ]);
});

test('block summary for valid block hash retrieves block summary (v1)', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('The block could not be found by the test');
    }

    if (!isBlockSummaryV1(blockSummary)) {
        throw new Error('Expected block to adhere to version 1 spec.');
    }

    return Promise.all([
        // Chain parameters
        expect(blockSummary.updates.chainParameters.mintPerPayday).toBe(
            1.088e-5
        ),
        expect(blockSummary.updates.chainParameters.rewardPeriodLength).toBe(
            4n
        ),
        expect(blockSummary.updates.chainParameters.minimumEquityCapital).toBe(
            14000n
        ),
        expect(blockSummary.updates.chainParameters.capitalBound).toBe(0.25),
        expect(blockSummary.updates.chainParameters.poolOwnerCooldown).toBe(
            10800n
        ),
        expect(blockSummary.updates.chainParameters.delegatorCooldown).toBe(
            7200n
        ),
        expect(
            blockSummary.updates.chainParameters.transactionCommissionLPool
        ).toBe(0.1),
        expect(
            blockSummary.updates.chainParameters.finalizationCommissionLPool
        ).toBe(1.0),
        expect(blockSummary.updates.chainParameters.bakingCommissionLPool).toBe(
            0.1
        ),
        expect(
            blockSummary.updates.chainParameters.leverageBound.numerator
        ).toBe(3n),
        expect(
            blockSummary.updates.chainParameters.leverageBound.denominator
        ).toBe(1n),
        expect(
            blockSummary.updates.chainParameters.transactionCommissionRange.min
        ).toBe(0.05),
        expect(
            blockSummary.updates.chainParameters.transactionCommissionRange.max
        ).toBe(0.05),
        expect(
            blockSummary.updates.chainParameters.bakingCommissionRange.min
        ).toBe(0.05),
        expect(
            blockSummary.updates.chainParameters.bakingCommissionRange.max
        ).toBe(0.05),
        expect(
            blockSummary.updates.chainParameters.finalizationCommissionRange.min
        ).toBe(1),
        expect(
            blockSummary.updates.chainParameters.finalizationCommissionRange.max
        ).toBe(1),

        // Update queues
        expect(
            blockSummary.updates.updateQueues.protocol.nextSequenceNumber
        ).toBe(4n),
        expect(
            blockSummary.updates.updateQueues.cooldownParameters
                .nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.timeParameters.nextSequenceNumber
        ).toBe(1n),
        expect(
            blockSummary.updates.updateQueues.poolParameters.nextSequenceNumber
        ).toBe(1n),

        // keys
        expect(
            blockSummary.updates.keys.level2Keys.cooldownParameters.threshold
        ).toBe(1),
        expect(
            blockSummary.updates.keys.level2Keys.timeParameters.threshold
        ).toBe(1),
    ]);
});

test('block summary for invalid block hash throws error', async () => {
    const invalidBlockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e42a9a52d8673861e2ebdd2';
    await expect(client.getBlockSummary(invalidBlockHash)).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('block summary for unknown block is undefined', async () => {
    const unknownBlockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e4f2a9a52d8673861e2ebdd2';
    const blockSummary = await client.getBlockSummary(unknownBlockHash);
    return expect(blockSummary).toBeUndefined();
});

test('block summary with memo transactions', async () => {
    const blockHash =
        'b49bb1c06c697b7d6539c987082c5a0dc6d86d91208874517ab17da752472edf';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('Block not found');
    }
    const transactionSummaries = blockSummary.transactionSummaries;

    for (const transactionSummary of transactionSummaries) {
        if (instanceOfTransferWithMemoTransactionSummary(transactionSummary)) {
            const [transferredEvent, memoEvent] =
                transactionSummary.result.events;

            const toAddress = transferredEvent.to.address;
            const amount = transferredEvent.amount;
            const memo = memoEvent.memo;

            return Promise.all([
                expect(toAddress).toBe(
                    '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
                ),
                expect(amount).toEqual(100n),
                expect(memo).toBe('546869732069732061206d656d6f2e'),
            ]);
        }
    }

    throw new Error('A memo transaction was not found in the block');
});

test('block summary with a scheduled transfer', async () => {
    const blockHash =
        'd0d330b424095386b253c8ccd007b366f3d5ec4fa8630c77838d8982c73b4b70';
    const blockSummary = await client.getBlockSummary(blockHash);
    if (!blockSummary) {
        throw new Error('Block not found');
    }

    if (blockSummary.transactionSummaries[0].result.outcome !== 'success') {
        throw new Error('Unexpected outcome');
    }

    const event: TransferredWithScheduleEvent = blockSummary
        .transactionSummaries[0].result
        .events[0] as TransferredWithScheduleEvent;
    expect(event.amount[0].timestamp).toEqual(
        new Date('2021-08-04T12:00:00.000Z')
    );
    expect(event.amount[0].amount).toEqual(10000000n);
});

test('account info for invalid hash throws error', async () => {
    const accountAddress = new AccountAddress(
        '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
    );
    const invalidBlockHash = 'P{L}GDA';
    await expect(
        client.getAccountInfo(accountAddress, invalidBlockHash)
    ).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('account info for unknown block hash is undefined', async () => {
    const accountAddress = new AccountAddress(
        '33aAwqhbFU1teSpLtan34zTox7gYBmjUSRiZKEv4tKd2wkEbhw'
    );
    const blockHash =
        'fd4915edca67b4e8f6521641a638a3abdbdd7934e4f2a9a52d8673861e2ebdd2';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    return expect(accountInfo).toBeUndefined();
});

test('account info for unknown account address is undefined', async () => {
    const accountAddress = new AccountAddress(
        '33aAwqhbFU1teSpLtan34zTox7gYBmjUSRiZKEv4tKd2wkEbhw'
    );
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    return expect(accountInfo).toBeUndefined();
});

test('account info with a release schedule', async () => {
    const accountAddress = new AccountAddress(
        '3V1LSu3AZ6o45xcjqRr3PzviUQUfK2tXq2oFnaHgDbY8Ledu2Z'
    );
    const blockHash =
        'cc6081868b96aa6acffeb152ef8feb7d4ef145c56d8e80def934fab443559eff';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    for (const schedule of accountInfo.accountReleaseSchedule.schedule) {
        expect(schedule.transactions[0]).toEqual(
            '937a107c92ba702e3522618563457fa9f6a1b9c2ee7e037ede8cb9dc069518f0'
        );
        expect(schedule.amount).toEqual(200000n);
        expect(isValidDate(schedule.timestamp)).toBeTruthy();
    }
});

test('account info with baker details, and with no pending change', async () => {
    const accountAddress = new AccountAddress(
        '4KTnZ9WKrmoP546aQ6w7KC3DtbiykRbY4thixK3y7BSSC87zpN'
    );
    const blockHash =
        '2c3de8a501cd810e35980e2ba783e84ab59f1927ec4d75ad224d23f142ba1e4c';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    if (!isBakerAccount(accountInfo)) {
        throw new Error('Account info doesnt contain baker details');
    }

    const bakerDetails = accountInfo.accountBaker;

    expect(bakerDetails.bakerId).toEqual(743n);
    expect(bakerDetails.stakedAmount).toEqual(15000000000n);
    expect(bakerDetails.restakeEarnings).toEqual(true);
    expect(bakerDetails.bakerElectionVerifyKey).toEqual(
        'f5be66dfeb83d962a0c386f65a2811a4cea4ab90dbbced3a6f52ff5c1942beee'
    );
    expect(bakerDetails.bakerSignatureVerifyKey).toEqual(
        'b7c33d2693a297a16e177368ade84f5edbba9567361a46c92ad4cf0176783440'
    );
    expect(bakerDetails.bakerAggregationVerifyKey).toEqual(
        '8e0e236fdd71b2653e1c22c65ddaee7d867c31d69b0b173626b0caf291522c3e829c39b6d8d6cfcfd18ddaf90fa67ae9026114b7640842824eb495f9e51c2ee4ef5a93f84fa1c8fd2b3105333bbae31576f77137fd53e5d709ee5da00446e6a9'
    );

    expect(bakerDetails.pendingChange).toBeUndefined();
});

test('account info with baker details, and with a pending baker removal', async () => {
    const accountAddress = new AccountAddress(
        '4KTnZ9WKrmoP546aQ6w7KC3DtbiykRbY4thixK3y7BSSC87zpN'
    );
    const blockHash =
        '57d69d8d53f406ddbd6aa31fa1e33231eebf4afb600de3ce698987983811a1c2';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    const bakerDetails = isBakerAccount(accountInfo)
        ? accountInfo.accountBaker
        : undefined;

    if (!bakerDetails) {
        throw new Error('Account info doesnt contain baker details');
    }

    expect(bakerDetails.bakerId).toEqual(743n);
    expect(bakerDetails.stakedAmount).toEqual(15000000000n);
    expect(bakerDetails.restakeEarnings).toEqual(true);
    expect(bakerDetails.bakerElectionVerifyKey).toEqual(
        'f5be66dfeb83d962a0c386f65a2811a4cea4ab90dbbced3a6f52ff5c1942beee'
    );
    expect(bakerDetails.bakerSignatureVerifyKey).toEqual(
        'b7c33d2693a297a16e177368ade84f5edbba9567361a46c92ad4cf0176783440'
    );
    expect(bakerDetails.bakerAggregationVerifyKey).toEqual(
        '8e0e236fdd71b2653e1c22c65ddaee7d867c31d69b0b173626b0caf291522c3e829c39b6d8d6cfcfd18ddaf90fa67ae9026114b7640842824eb495f9e51c2ee4ef5a93f84fa1c8fd2b3105333bbae31576f77137fd53e5d709ee5da00446e6a9'
    );

    const pendingChange = bakerDetails.pendingChange;

    if (!pendingChange) {
        throw new Error('Baker details doesnt contain pending change');
    }

    expect(pendingChange.change).toEqual('RemoveBaker');
    expect(pendingChange.epoch).toEqual(334n);
});

test('account info with baker details, and with a pending stake reduction', async () => {
    const accountAddress = new AccountAddress(
        '3V1LSu3AZ6o45xcjqRr3PzviUQUfK2tXq2oFnaHgDbY8Ledu2Z'
    );
    const blockHash =
        'ea36dbed9348de67fc977ee9e637d208b6d1808490a6698327504f5d1ec7315c';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    const bakerDetails = isBakerAccount(accountInfo)
        ? accountInfo.accountBaker
        : undefined;

    if (!bakerDetails) {
        throw new Error('Account info doesnt contain baker details');
    }

    expect(bakerDetails.bakerId).toEqual(731n);
    expect(bakerDetails.stakedAmount).toEqual(14500000000n);
    expect(bakerDetails.restakeEarnings).toEqual(true);
    expect(bakerDetails.bakerElectionVerifyKey).toEqual(
        'f0b48a386b01784f95d0e82911932b8ffbea2ceec9654a58dcc226bfe813a668'
    );
    expect(bakerDetails.bakerSignatureVerifyKey).toEqual(
        'f31632d93b3e7085b9060216175ead4496a1e9f477325aa8817dc8c0d533cfd0'
    );
    expect(bakerDetails.bakerAggregationVerifyKey).toEqual(
        '803255d7c861d1a9ec8d810eeac40d11cae9e588e613de008786f3d143a6c573f99b5014bf9590064583a67d5b3283870163c7655f1dd61d0313d9283dc98513c221013f2f8109c392c7d2a9cd70950dd18ad477652d294f6ae2a499f3243793'
    );

    const pendingChange = bakerDetails.pendingChange;

    if (!pendingChange) {
        throw new Error('Baker details doesnt contain pending change');
    }

    expect(pendingChange.change).toEqual('ReduceStake');
    expect((pendingChange as ReduceStakePendingChange).newStake).toEqual(
        14000000000n
    );
    expect(pendingChange.epoch).toEqual(838n);
});

test('retrieves the account info', async () => {
    const accountAddress = new AccountAddress(
        '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
    );
    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);

    if (!accountInfo) {
        throw new Error('Test failed to find account info');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let normalAccountCredentialExpects: any[] = [];
    if (accountInfo.accountCredentials[0].value.type === 'normal') {
        const normalAccountCredential: NormalAccountCredential =
            accountInfo.accountCredentials[0].value;
        normalAccountCredentialExpects = [
            expect(normalAccountCredential.contents.credId).toEqual(
                'a8e810a15eeefcdd425126d6faed3a45fdf211392180d0fb3dc7e9e3382cb0dc6ce8e0d8bc46cfb6cfbb4ea5d8771966'
            ),
            expect(
                normalAccountCredential.contents.revocationThreshold
            ).toEqual(2),
            expect(
                normalAccountCredential.contents.arData['1'].encIdCredPubShare
            ).toEqual(
                '8dbed4968d346683084f76c369a05571fb31ba8627a39fac5114f175a958bc6afc870aeee41f3886a32a655c61b7a07491a6130545f9a6e11755242a384bc5e61d858405e471283212acd11609a319644dc89dd452785c3a96acee6064d2c580'
            ),
            expect(
                normalAccountCredential.contents.arData['2'].encIdCredPubShare
            ).toEqual(
                'a7e7a1dbc5e3d154ac1e21b7a4a1d40419a62a3e47d0d5c1503842077a946e38d398fc1c74825dbcbd3c90599c1ba647a292927a2a595dc4b7505f80a61277bc6e1bfc16243d2a79d29bfe3867b87bbdc4bd45fc39bd2eee74e07fa52f595a74'
            ),
            expect(
                normalAccountCredential.contents.arData['3'].encIdCredPubShare
            ).toEqual(
                '979ae3097837f43873f741b688bb11aabd5ceb5e38ed58f04928a5afdd419873ce17f2bffa576b613e0eac48af921444a4fd28a6bbdd1e6f500a27fb9f686f5199798a9984f85f0b7d413156d86bcefe0dfd460fa3a9b878b3a3aedd9057760d'
            ),

            expect(normalAccountCredential.contents.commitments.cmmPrf).toEqual(
                '83dc504ba2a0f06eb67f31d8a8366ae8200b09db831ca2debbf567b6d4d8d575868ba678aa492d01cf48c2e53028af05'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmCredCounter
            ).toEqual(
                'b8deddcbecd5fe65f520c4d2dfc3ff9570bcb1f84c87f45452928bc1398636eeca6f3f5b3676963ebcd4eadf33a427b6'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmMaxAccounts
            ).toEqual(
                'a67b05ac71c85abdf6d5021e0fd83878b2d50b4f308cad1fbe332074cabca5b8e59f06c4feb8866071b8966bef7f86ae'
            ),

            expect(
                normalAccountCredential.contents.commitments
                    .cmmIdCredSecSharingCoeff[0]
            ).toEqual(
                '90cec6faf659c95697313e3b21013bf87dde411ca228d2ddb9cae4fe29f2888713ceab6772b028d56e25cf0e836beb4a'
            ),
            expect(
                normalAccountCredential.contents.commitments
                    .cmmIdCredSecSharingCoeff[1]
            ).toEqual(
                '8c607b073bf7bee83ff388fef8e8b49e838a6f28c038d3017940dc837bd5dc29801848f28e2f2924c98c16f562c067e5'
            ),

            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'idDocNo'
                ]
            ).toEqual(
                'ad11f12ed8ce15fbcd27667cfdd0358c8e00b3a1bc89fa6dffa2933394c0eaae360125e35fa22bdfe678feeef5fa677b'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'nationalIdNo'
                ]
            ).toEqual(
                'ab03f0db066ff7f5baf5cf00871299c631e163e1af11ad5a1cac6d1caa8bc7cfaa48fd8181b2504f93dbd9290886af74'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'firstName'
                ]
            ).toEqual(
                'a513c5c5410cd7dfec0d2291986e56cdb8e29d7a1d8c4e4c395dc285966078200b650f2a4109a4e340560faec090a1fb'
            ),
            expect(
                normalAccountCredential.contents.commitments.cmmAttributes[
                    'lastName'
                ]
            ).toEqual(
                '90e266f4722b49aadc68892ccf47baef6630648bdf21166c35c7a68145fb100e5cf50a7f8b460db7fff8d166c549f7a7'
            ),
        ];
    }

    return Promise.all([
        expect(accountInfo.accountNonce).toEqual(8n),
        expect(accountInfo.accountIndex).toEqual(221n),
        expect(accountInfo.accountAmount).toEqual(458442050n),
        expect(accountInfo.accountEncryptionKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8e810a15eeefcdd425126d6faed3a45fdf211392180d0fb3dc7e9e3382cb0dc6ce8e0d8bc46cfb6cfbb4ea5d8771966'
        ),
        expect(accountInfo.accountThreshold).toEqual(2),
        expect(accountInfo.accountEncryptedAmount.startIndex).toEqual(0n),
        expect(accountInfo.accountEncryptedAmount.selfAmount).toEqual(
            'c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000c00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
        ),
        expect(
            accountInfo.accountEncryptedAmount.numAggregated
        ).toBeUndefined(),
        expect(accountInfo.accountReleaseSchedule.schedule.length).toEqual(0),
        expect(accountInfo.accountReleaseSchedule.total).toEqual(0n),
        expect(accountInfo.accountCredentials[0].value.type).toEqual('normal'),
        expect(
            accountInfo.accountCredentials[0].value.contents
                .credentialPublicKeys.keys[0].verifyKey
        ).toEqual(
            '4de8e0c6ca5b2d9361b29179075e01db49b5e58c11d6a9fcf1c0105f404bd812'
        ),
        expect(
            accountInfo.accountCredentials[0].value.contents
                .credentialPublicKeys.keys[0].schemeId
        ).toEqual('Ed25519'),
        expect(
            accountInfo.accountCredentials[0].value.contents
                .credentialPublicKeys.threshold
        ).toEqual(1),
        expect(
            accountInfo.accountCredentials[1].value.contents
                .credentialPublicKeys.keys[0].verifyKey
        ).toEqual(
            '77580ef5f484b69d22a8ede50f21503ec1d4bfff617856c8bc20bb8a9a901585'
        ),
        expect(
            accountInfo.accountCredentials[1].value.contents
                .credentialPublicKeys.keys[0].schemeId
        ).toEqual('Ed25519'),
        expect(
            accountInfo.accountCredentials[1].value.contents
                .credentialPublicKeys.threshold
        ).toEqual(1),
        expect(
            accountInfo.accountCredentials[0].value.contents.ipIdentity
        ).toEqual(0),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy.createdAt
        ).toEqual('202106'),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy.validTo
        ).toEqual('202206'),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy
                .revealedAttributes['nationality']
        ).toEqual('DK'),
        expect(
            accountInfo.accountCredentials[0].value.contents.policy
                .revealedAttributes['idDocType']
        ).toEqual('1'),

        normalAccountCredentialExpects,
    ]);
});

test('retrieves the same account info for credential of account as account address', async () => {
    const accountAddress = new AccountAddress(
        '3sAHwfehRNEnXk28W7A3XB3GzyBiuQkXLNRmDwDGPUe8JsoAcU'
    );
    const credId = new CredentialRegistrationId(
        'a8e810a15eeefcdd425126d6faed3a45fdf211392180d0fb3dc7e9e3382cb0dc6ce8e0d8bc46cfb6cfbb4ea5d8771966'
    );

    const blockHash =
        '6b01f2043d5621192480f4223644ef659dd5cda1e54a78fc64ad642587c73def';

    const accountInfo = await client.getAccountInfo(accountAddress, blockHash);
    const accountInfoCredential = await client.getAccountInfo(
        credId,
        blockHash
    );

    if (!accountInfo || !accountInfoCredential) {
        throw new Error('Test failed to find account info');
    }
    expect(accountInfo).toStrictEqual(accountInfoCredential);
});

test('retrieves the next account nonce', async () => {
    const accountAddress = new AccountAddress(
        '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
    );
    const nextAccountNonce = await client.getNextAccountNonce(accountAddress);
    if (!nextAccountNonce) {
        throw new Error(
            'Test could not find next account nonce that was expected to be available.'
        );
    }
    return Promise.all([
        expect(nextAccountNonce.nonce).toEqual(6n),
        expect(nextAccountNonce.allFinal).toBeTruthy(),
    ]);
});

test('transaction status for invalid hash fails', async () => {
    const invalidTransactionHash = 'P{L}GDA';
    await expect(
        client.getTransactionStatus(invalidTransactionHash)
    ).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidTransactionHash)
    );
});

test('transaction status for unknown transaction hash returns undefined', async () => {
    const transactionHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const transactionStatus = await client.getTransactionStatus(
        transactionHash
    );
    return expect(transactionStatus).toBeUndefined();
});

test('retrieves transaction status', async () => {
    const transactionHash =
        'f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f';
    const transactionStatus = await client.getTransactionStatus(
        transactionHash
    );

    if (transactionStatus === undefined || !transactionStatus.outcomes) {
        throw new Error('Test failed to find transaction status!');
    }

    const outcome = Object.values(transactionStatus.outcomes)[0];

    return Promise.all([
        expect(transactionStatus.status).toEqual('finalized'),
        expect(outcome.hash).toEqual(
            'f1f5f966e36b95d5474e6b85b85c273c81bac347c38621a0d8fefe68b69a430f'
        ),
        expect(outcome.sender).toEqual(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
        expect(outcome.cost).toEqual(5010n),
        expect(outcome.energyCost).toEqual(501n),
        expect(outcome.type.type).toEqual('accountTransaction'),
        expect(outcome.index).toEqual(0n),
    ]);
});

test('invalid block hash fails', async () => {
    const invalidBlockHash = 'P{L}GDA';
    await expect(client.getBlockInfo(invalidBlockHash)).rejects.toEqual(
        new Error('The input was not a valid hash: ' + invalidBlockHash)
    );
});

test('unknown block hash returns undefined', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const blockInfo = await client.getBlockInfo(blockHash);
    return expect(blockInfo).toBeUndefined();
});

test('retrieves block info', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const blockInfo = await client.getBlockInfo(blockHash);

    if (!blockInfo) {
        throw new Error('Test was unable to get block info');
    }

    return Promise.all([
        expect(blockInfo.transactionsSize).toEqual(0n),
        expect(blockInfo.blockParent).toEqual(
            '2633deb76d59bb4d3d78cdfaa3ab1920bb88332ae98bd2d7d52adfd8e553996f'
        ),
        expect(blockInfo.blockHash).toEqual(
            '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749'
        ),
        expect(blockInfo.finalized).toBeTruthy(),
        expect(blockInfo.blockStateHash).toEqual(
            'b40762eb4abb9701ee133c465f934075d377c0d09bfe209409e80bbb51af1771'
        ),
        expect(isValidDate(blockInfo.blockArriveTime)).toBeTruthy(),
        expect(isValidDate(blockInfo.blockReceiveTime)).toBeTruthy(),

        expect(blockInfo.transactionCount).toEqual(0n),
        expect(blockInfo.transactionEnergyCost).toEqual(0n),
        expect(blockInfo.blockSlot).toEqual(1915967n),
        expect(blockInfo.blockLastFinalized).toEqual(
            '2633deb76d59bb4d3d78cdfaa3ab1920bb88332ae98bd2d7d52adfd8e553996f'
        ),
        expect(blockInfo.blockSlotTime).toEqual(
            new Date('2021-05-13T01:03:11.750Z')
        ),
        expect(blockInfo.blockHeight).toEqual(22737n),
        expect(blockInfo.blockBaker).toEqual(3n),
    ]);
});

test('negative block height throws an error', async () => {
    const blockHeight = -431n;
    await expect(client.getBlocksAtHeight(blockHeight)).rejects.toEqual(
        new Error(
            'The block height has to be a positive integer, but it was: ' +
                blockHeight
        )
    );
});

test('no blocks returned for height not yet reached', async () => {
    const blockHeight = 18446744073709551615n;
    const blocksAtHeight = await client.getBlocksAtHeight(blockHeight);
    return expect(blocksAtHeight.length).toEqual(0);
});

test('retrieves blocks at block height', async () => {
    const blockHeight = 314n;
    const blocksAtHeight: string[] = await client.getBlocksAtHeight(
        blockHeight
    );
    return Promise.all([
        expect(blocksAtHeight.length).toEqual(1),
        expect(blocksAtHeight[0]).toEqual(
            '072a02694ec6539d022e616eeb9f05bacea60e1d7278d34457daeca5e6380b61'
        ),
    ]);
});

test('cryptographic parameters are retrieved at the given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const cryptographicParameters = await client.getCryptographicParameters(
        blockHash
    );

    if (!cryptographicParameters) {
        throw new Error('Test was unable to get cryptographic parameters');
    }

    return Promise.all([
        expect(cryptographicParameters.value.genesisString).toEqual(
            'Concordium Testnet Version 5'
        ),
        expect(cryptographicParameters.value.onChainCommitmentKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac'
        ),
        expect(cryptographicParameters.value.bulletproofGenerators).toEqual(
            bulletProofGenerators
        ),
    ]);
});

test('cryptographic parameters are undefined at unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const cryptographicParameters = await client.getCryptographicParameters(
        blockHash
    );

    return expect(cryptographicParameters).toBeUndefined();
});

test('peer list can be retrieved', async () => {
    const peerList = await client.getPeerList(false);
    const peersList = peerList.getPeersList();
    const peer = peersList[0];

    return Promise.all([
        expect(typeof peer.getIp === 'string'),
        expect(typeof peer.getPort === 'number'),
        expect(typeof peer.getNodeId === 'string'),
        expect(typeof peer.getJsPbMessageId === 'string'),
        expect(
            [
                PeerElement.CatchupStatus.UPTODATE,
                PeerElement.CatchupStatus.PENDING,
                PeerElement.CatchupStatus.CATCHINGUP,
            ].includes(peer.getCatchupStatus())
        ),
    ]);
});

test('identity providers are undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const identityProviders = await client.getIdentityProviders(blockHash);
    return expect(identityProviders).toBeUndefined();
});

test('identity providers are retrieved at the given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const identityProviders = await client.getIdentityProviders(blockHash);

    if (!identityProviders) {
        throw new Error('Test was unable to get identity providers');
    }

    const concordiumTestIp = identityProviders[0];
    const notabeneTestIp = identityProviders[1];

    return Promise.all([
        expect(concordiumTestIp.ipIdentity).toEqual(0),
        expect(concordiumTestIp.ipDescription.name).toEqual(
            'Concordium testnet IP'
        ),
        expect(concordiumTestIp.ipDescription.url).toEqual(''),
        expect(concordiumTestIp.ipDescription.description).toEqual(
            'Concordium testnet identity provider'
        ),
        expect(concordiumTestIp.ipCdiVerifyKey).toEqual(
            '2e1cff3988174c379432c1fad7ccfc385c897c4477c06617262cec7193226eca'
        ),
        expect(concordiumTestIp.ipVerifyKey).toEqual(ipVerifyKey1),

        expect(notabeneTestIp.ipIdentity).toEqual(1),
        expect(notabeneTestIp.ipDescription.name).toEqual('Notabene (Staging)'),
        expect(notabeneTestIp.ipDescription.url).toEqual(
            'https://notabene.studio'
        ),
        expect(notabeneTestIp.ipDescription.description).toEqual(
            'Notabene Identity Issuer (Staging Service)'
        ),
        expect(notabeneTestIp.ipCdiVerifyKey).toEqual(
            '4810d66439a25d9b345cf5c7ac11f9e512548c278542d9b24dc73541626d6197'
        ),
        expect(notabeneTestIp.ipVerifyKey).toEqual(ipVerifyKey2),
    ]);
});

test('anonymity revokers are undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const anonymityRevokers = await client.getAnonymityRevokers(blockHash);
    return expect(anonymityRevokers).toBeUndefined();
});

test('anonymity revokers are retrieved at the given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';
    const anonymityRevokers = await client.getAnonymityRevokers(blockHash);

    if (!anonymityRevokers) {
        throw new Error('Test could not find anonymity revokers');
    }

    const ar1 = anonymityRevokers[0];
    const ar2 = anonymityRevokers[1];
    const ar3 = anonymityRevokers[2];

    return Promise.all([
        expect(ar1.arIdentity).toEqual(1),
        expect(ar1.arDescription.name).toEqual('Testnet AR 1'),
        expect(ar1.arDescription.url).toEqual(''),
        expect(ar1.arDescription.description).toEqual(
            'Testnet anonymity revoker 1'
        ),
        expect(ar1.arPublicKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c58ed5281b5d117cb74068a5deef28f027c9055dd424b07043568ac040a4e51f3307f268a77eaebc36bd4bf7cdbbe238b8'
        ),

        expect(ar2.arIdentity).toEqual(2),
        expect(ar2.arDescription.name).toEqual('Testnet AR 2'),
        expect(ar2.arDescription.url).toEqual(''),
        expect(ar2.arDescription.description).toEqual(
            'Testnet anonymity revoker 2'
        ),
        expect(ar2.arPublicKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5aefb2334688a2ecc95e7c49e9ccbc7218b5c9e151ac22462d064f564ffa56bb8b3685fcdc8d7d8cb43f43d608e7e8515'
        ),

        expect(ar3.arIdentity).toEqual(3),
        expect(ar3.arDescription.name).toEqual('Testnet AR 3'),
        expect(ar3.arDescription.url).toEqual(''),
        expect(ar3.arDescription.description).toEqual(
            'Testnet anonymity revoker 3'
        ),
        expect(ar3.arPublicKey).toEqual(
            'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a791a28a6d3e7ca0857c0f996f94e65da78b8d9b5de5e32164e291e553ed103bf14d6fab1f21749d59664e34813afe77'
        ),
    ]);
});

test('reward status can be accessed at given block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8761d08554756f42bf268a42749';

    const rewardStatus = await client.getRewardStatus(blockHash);

    if (!rewardStatus) {
        throw new Error('Test could not retrieve reward status of block.');
    }

    const {
        finalizationRewardAccount,
        totalEncryptedAmount,
        bakingRewardAccount,
        totalAmount,
        gasAccount,
    } = rewardStatus;

    expect(finalizationRewardAccount).toBe(5n);
    expect(totalEncryptedAmount).toBe(0n);
    expect(bakingRewardAccount).toBe(3663751591n);
    expect(totalAmount).toBe(10014486887211834n);
    expect(gasAccount).toBe(3n);
});

test('new version of reward status can be accessed at given block', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';

    const rewardStatus = await client.getRewardStatus(blockHash);

    if (!rewardStatus) {
        throw new Error('Test could not retrieve reward status of block.');
    }

    if (!isRewardStatusV1(rewardStatus)) {
        throw new Error(
            'Test expected reward status to be delegation protocol version.'
        );
    }

    const {
        finalizationRewardAccount,
        totalEncryptedAmount,
        bakingRewardAccount,
        totalAmount,
        gasAccount,
        nextPaydayTime,
        protocolVersion,
        nextPaydayMintRate,
        totalStakedCapital,
        foundationTransactionRewards,
    } = rewardStatus;

    expect(finalizationRewardAccount).toBe(3n);
    expect(totalEncryptedAmount).toBe(0n);
    expect(bakingRewardAccount).toBe(2n);
    expect(totalAmount).toBe(188279875066742n);
    expect(gasAccount).toBe(3n);
    expect(protocolVersion).toBe(4n);
    expect(totalStakedCapital).toBe(15002000000000n);
    expect(foundationTransactionRewards).toBe(0n);
    expect(nextPaydayTime).toEqual(new Date('2022-03-07T07:15:01.5Z'));
    expect(nextPaydayMintRate).toBe(1.088e-5);
});

test('reward status is undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const rs = await client.getRewardStatus(blockHash);
    return expect(rs).toBeUndefined();
});

test('baker list can be accessed at given block', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';
    const bl = await client.getBakerList(blockHash);

    expect(bl).toEqual([0n, 1n, 2n, 3n, 4n]);
});

test('baker list is undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const bl = await client.getBakerList(blockHash);
    return expect(bl).toBeUndefined();
});

test('pool status can be accessed at given block for L-pool', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';

    const ps = await client.getPoolStatus(blockHash);

    if (!ps) {
        throw new Error('Test could not retrieve reward status of block.');
    }

    expect(ps.poolType).toBe(PoolStatusType.LPool);

    const {
        commissionRates,
        delegatedCapital,
        currentPaydayDelegatedCapital,
        currentPaydayTransactionFeesEarned,
    } = ps;

    expect(commissionRates.bakingCommission).toBe(0.1);
    expect(commissionRates.transactionCommission).toBe(0.1);
    expect(commissionRates.finalizationCommission).toBe(1);
    expect(delegatedCapital.toString()).toBe('1000000000');
    expect(currentPaydayDelegatedCapital.toString()).toBe('0');
    expect(currentPaydayTransactionFeesEarned.toString()).toBe('0');
});

test('pool status can be accessed at given block for specific baker', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';
    const bid: BakerId = 1n;

    const ps = await client.getPoolStatus(blockHash, bid);

    if (!ps) {
        throw new Error('Test could not retrieve reward status of block.');
    }

    const {
        poolType,
        delegatedCapital,
        bakerId,
        poolInfo: {
            openStatus,
            metadataUrl,
            commissionRates: {
                finalizationCommission,
                transactionCommission,
                bakingCommission,
            },
        },
        bakerAddress,
        bakerEquityCapital,
        delegatedCapitalCap,
        bakerStakePendingChange,
        currentPaydayStatus,
    } = ps;

    console.log(ps);
    console.log(ps.currentPaydayStatus);

    expect(poolType).toBe(PoolStatusType.BakerPool);
    expect(bakerId).toBe(1n);
    expect(bakerAddress).toBe(
        '39BjG2g6JaTUVSEizZQu6DrsPjwNMKW2ftqToBvTVTMna7pNud'
    );
    expect(delegatedCapital).toBe(0n);
    expect(openStatus).toBe(OpenStatusText.OpenForAll);
    expect(metadataUrl).toBe('');
    expect(finalizationCommission).toBe(1);
    expect(transactionCommission).toBe(0.05);
    expect(bakingCommission).toBe(0.05);
    expect(bakerEquityCapital).toBe(3000000000000n);
    expect(delegatedCapitalCap).toBe(1000666666666n);
    expect(bakerStakePendingChange.pendingChangeType).toBe(
        BakerPoolPendingChangeType.NoChange
    );
    expect(currentPaydayStatus?.bakerEquityCapital).toBe(3000000000000n);
    expect(currentPaydayStatus?.blocksBaked).toBe(25n);
    expect(currentPaydayStatus?.finalizationLive).toBe(true);
    expect(currentPaydayStatus?.transactionFeesEarned).toBe(0n);
    expect(currentPaydayStatus?.effectiveStake).toBe(3000000000000n);
    expect(currentPaydayStatus?.lotteryPower).toBe(0.2);
    expect(currentPaydayStatus?.delegatedCapital).toBe(0n);
});

test('pool status is undefined at an unknown block', async () => {
    const blockHash =
        '7f7409679e53875567e2ae812c9fcefe90ced8961d08554756f42bf268a42749';
    const ps = await client.getPoolStatus(blockHash);
    return expect(ps).toBeUndefined();
});

test('account info with new baker info can be accessed', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';
    const address = new AccountAddress(
        '2zmRFpd7g12oBAZHSDqnbJ3Eg5HGr2sE9aFCL6mD3pyUSsiDSJ'
    );

    const ai = await client.getAccountInfo(address, blockHash);

    if (!ai) {
        throw new Error('Expected account info to be accessible.');
    }

    if (!isBakerAccountV1(ai)) {
        throw new Error(
            'Test assumes the account is a baker on delegation protocol version'
        );
    }

    const {
        accountBaker: {
            bakerId,
            stakedAmount,
            bakerPoolInfo: {
                metadataUrl,
                openStatus,
                commissionRates: {
                    bakingCommission,
                    transactionCommission,
                    finalizationCommission,
                },
            },
            restakeEarnings,
            pendingChange,
        },
    } = ai;

    expect(bakerId).toBe(0n);
    expect(stakedAmount).toBe(3000000000000n);
    expect(restakeEarnings).toBe(false);
    expect(pendingChange).toBeUndefined();
    expect(metadataUrl).toBe('');
    expect(openStatus).toBe(OpenStatusText.OpenForAll);
    expect(bakingCommission).toBe(0.05);
    expect(transactionCommission).toBe(0.05);
    expect(finalizationCommission).toBe(1);
});

test('account info with delegation to specific baker can be accessed', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';
    const address = new AccountAddress(
        '3UztagvMc6dMeRgW51tG8SR18BdHXaGyWBdx8nAz3caKTrWnuo'
    );

    const ai = await client.getAccountInfo(address, blockHash);

    if (!ai) {
        throw new Error('Expected account info to be accessible.');
    }

    if (!isDelegatorAccount(ai)) {
        throw new Error('Test assumes the account is a delegator');
    }

    const {
        accountDelegation: {
            restakeEarnings,
            stakedAmount,
            pendingChange,
            delegationTarget,
        },
    } = ai;

    expect(stakedAmount).toBe(1000000000n);
    expect(restakeEarnings).toBe(true);
    expect(pendingChange).toBeUndefined();
    expect(delegationTarget.delegateType).toBe(DelegationTargetType.Baker);
    expect((delegationTarget as DelegationTargetBaker).bakerId).toBe(0n);
});

test('account info with delegation to L-pool can be accessed', async () => {
    const blockHash =
        '1e69dbed0234f0e8cf7965191bae42cd49415646984346e01716c8f8577ab6e0';
    const address = new AccountAddress(
        '4Y7qexYDywtB8K5NySAqZDUqg8FBNwDdu616NdvVqUfVQ1ULSq'
    );

    const ai = await client.getAccountInfo(address, blockHash);

    if (!ai) {
        throw new Error('Expected account info to be accessible.');
    }

    if (!isDelegatorAccount(ai)) {
        throw new Error('Test assumes the account is a delegator');
    }

    const {
        accountDelegation: {
            restakeEarnings,
            stakedAmount,
            pendingChange,
            delegationTarget,
        },
    } = ai;

    expect(stakedAmount).toBe(1000000000n);
    expect(restakeEarnings).toBe(true);
    expect(pendingChange).toBeUndefined();
    expect(delegationTarget.delegateType).toBe(DelegationTargetType.LPool);
});
