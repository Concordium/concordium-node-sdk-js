import {
    isBlockSummaryV0,
    isBlockSummaryV1,
    isBlockSummaryV2,
    isConsensusStatusV0,
    isConsensusStatusV1,
} from '@concordium/common-sdk';
import { getNodeClient } from './testHelpers';

/**
 * These tests mostly serve the purpose of making sure that the types exposed follow the format returned by the API,
 * i.e. we don't change the types to conform to the v2 API, but rather translate the v2 types to the v1 types until we can
 * remove the v1 API entirely.
 */

const address = 'concordiumwalletnode.com';
const port = 10000;

const client = getNodeClient(address, port);

// eslint-disable-next-line prefer-const
let CHAIN_GENESIS_BLOCK: string | undefined = undefined;
// eslint-disable-next-line prefer-const
let PV4_BLOCK: string | undefined = undefined;
// eslint-disable-next-line prefer-const
let PV6_BLOCK: string | undefined = undefined;

// Mainnet blocks.
CHAIN_GENESIS_BLOCK =
    '9dd9ca4d19e9393877d2c44b70f89acbfc0883c2243e5eeaecc0d1cd0503f478';
PV4_BLOCK = '568589c9f5b3a3989c24d4c916bc2417a64c6dff6ec987595349c551a829d332';

test.each([CHAIN_GENESIS_BLOCK, PV4_BLOCK, PV6_BLOCK])(
    'blockSummary format as expected',
    async (block) => {
        if (block === undefined) {
            return;
        }

        const bs = await client.getBlockSummary(block);

        if (!bs) {
            throw new Error('could not find block');
        }

        // BlockSummary
        expect(typeof bs.protocolVersion).toEqual('bigint');

        // UpdateQueues
        expect(
            typeof bs.updates.updateQueues.foundationAccount.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            Array.isArray(bs.updates.updateQueues.foundationAccount.queue)
        ).toBeTruthy();
        expect(
            typeof bs.updates.updateQueues.euroPerEnergy.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.mintDistribution.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.microGTUPerEuro.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.protocol.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.rootKeys.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.gasRewards.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.level1Keys.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.level2Keys.nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.addAnonymityRevoker
                .nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.addIdentityProvider
                .nextSequenceNumber
        ).toEqual('bigint');
        expect(
            typeof bs.updates.updateQueues.transactionFeeDistribution
                .nextSequenceNumber
        ).toEqual('bigint');

        // Keys
        expect(bs.updates.keys.rootKeys.keys).toBeDefined();
        expect(bs.updates.keys.rootKeys.threshold).toBeDefined();
        expect(bs.updates.keys.level1Keys.keys).toBeDefined();
        expect(bs.updates.keys.level2Keys.keys).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.addAnonymityRevoker.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.poolParameters.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.transactionFeeDistribution.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.addIdentityProvider.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.protocol.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.microGTUPerEuro.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.mintDistribution.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.euroPerEnergy.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.foundationAccount.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.electionDifficulty.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.emergency.authorizedKeys
        ).toBeDefined();
        expect(
            bs.updates.keys.level2Keys.paramGASRewards.authorizedKeys
        ).toBeDefined();

        // Test format of chain parameters holds
        expect(
            typeof bs.updates.chainParameters.microGTUPerEuro.numerator
        ).toEqual('bigint');
        expect(
            typeof bs.updates.chainParameters.microGTUPerEuro.denominator
        ).toEqual('bigint');
        expect(
            bs.updates.chainParameters.rewardParameters.gASRewards.baker
        ).toBeDefined();
        expect(
            bs.updates.chainParameters.rewardParameters.gASRewards.chainUpdate
        ).toBeDefined();
        expect(
            bs.updates.chainParameters.rewardParameters.gASRewards
                .accountCreation
        ).toBeDefined();
        expect(
            bs.updates.chainParameters.rewardParameters.mintDistribution
                .bakingReward
        ).toBeDefined();
        expect(
            bs.updates.chainParameters.rewardParameters.mintDistribution
                .finalizationReward
        ).toBeDefined();
        expect(bs.updates.chainParameters.euroPerEnergy).toBeDefined();
        expect(bs.updates.chainParameters.foundationAccountIndex).toBeDefined();
        expect(bs.updates.chainParameters.accountCreationLimit).toBeDefined();

        if (isBlockSummaryV0(bs)) {
            expect(
                typeof bs.updates.updateQueues.electionDifficulty
                    .nextSequenceNumber
            ).toEqual('bigint');
            expect(
                typeof bs.updates.updateQueues.bakerStakeThreshold
                    .nextSequenceNumber
            ).toEqual('bigint');

            expect(
                typeof bs.updates.chainParameters.bakerCooldownEpochs
            ).toEqual('bigint');
        } else if (isBlockSummaryV1(bs)) {
            expect(
                typeof bs.updates.updateQueues.electionDifficulty
                    .nextSequenceNumber
            ).toEqual('bigint');
            expect(
                typeof bs.updates.updateQueues.poolParameters.nextSequenceNumber
            ).toEqual('bigint');
            expect(
                typeof bs.updates.updateQueues.timeParameters.nextSequenceNumber
            ).toEqual('bigint');
            expect(
                typeof bs.updates.updateQueues.cooldownParameters
                    .nextSequenceNumber
            ).toEqual('bigint');

            expect(
                bs.updates.keys.level2Keys.cooldownParameters.authorizedKeys
            ).toBeDefined();
            expect(
                bs.updates.keys.level2Keys.timeParameters.authorizedKeys
            ).toBeDefined();

            expect(bs.updates.chainParameters.electionDifficulty).toBeDefined();
            expect(
                bs.updates.chainParameters.rewardParameters.gASRewards
                    .finalizationProof
            );
            expect(bs.updates.chainParameters.mintPerPayday).toBeDefined();
            expect(bs.updates.chainParameters.capitalBound).toBeDefined();
            expect(bs.updates.chainParameters.leverageBound).toBeDefined();
            expect(
                bs.updates.chainParameters.finalizationCommissionRange.min
            ).toBeDefined();
        } else if (isBlockSummaryV2(bs)) {
            expect(
                typeof bs.updates.updateQueues.consensus2TimingParameters
                    .nextSequenceNumber
            ).toEqual('bigint');

            expect(
                bs.updates.keys.level2Keys.cooldownParameters.authorizedKeys
            ).toBeDefined();
            expect(
                bs.updates.keys.level2Keys.timeParameters.authorizedKeys
            ).toBeDefined();

            expect(bs.updates.chainParameters.minimumFinalizers).toBeDefined();
            expect(bs.updates.chainParameters.maximumFinalizers).toBeDefined();
            expect(typeof bs.updates.chainParameters.blockEnergyLimit).toEqual(
                'bigint'
            );
            expect(typeof bs.updates.chainParameters.minBlockTime).toEqual(
                'bigint'
            );
            expect(typeof bs.updates.chainParameters.timeoutBase).toEqual(
                'bigint'
            );
            expect(
                typeof bs.updates.chainParameters.timeoutDecrease.numerator
            ).toEqual('bigint');
            expect(
                typeof bs.updates.chainParameters.timeoutIncrease.denominator
            ).toEqual('bigint');
            expect(
                bs.updates.chainParameters.finalizerRelativeStakeThreshold
            ).toBeDefined();
        }
    }
);

test('consensusStatus format as expected', async () => {
    const cs = await client.getConsensusStatus();

    expect(typeof cs.protocolVersion).toEqual('bigint');
    expect(cs.bestBlock).toBeDefined();
    expect(cs.genesisTime instanceof Date).toBeTruthy();
    expect(cs.genesisBlock).toBeDefined();
    expect(cs.genesisIndex).toBeDefined();
    expect(typeof cs.epochDuration).toEqual('bigint');
    expect(typeof cs.bestBlockHeight).toEqual('bigint');
    expect(typeof cs.finalizationCount).toEqual('bigint');
    expect(cs.lastFinalizedBlock).toBeDefined();
    expect(typeof cs.blocksReceivedCount).toEqual('bigint');
    expect(typeof cs.blocksVerifiedCount).toEqual('bigint');
    expect(cs.blockArriveLatencyEMA).toBeDefined();
    expect(cs.blockLastArrivedTime instanceof Date).toBeTruthy();
    expect(cs.currentEraGenesisTime instanceof Date).toBeTruthy();
    expect(cs.blockArriveLatencyEMSD).toBeDefined();
    expect(cs.currentEraGenesisBlock).toBeDefined();
    expect(cs.transactionsPerBlockEMA).toBeDefined();
    expect(typeof cs.lastFinalizedBlockHeight).toEqual('bigint');
    expect(cs.transactionsPerBlockEMSD).toBeDefined();

    if (isConsensusStatusV0(cs)) {
        expect(typeof cs.slotDuration).toEqual('bigint');
    } else if (isConsensusStatusV1(cs)) {
        expect(typeof cs.concordiumBFTStatus.currentTimeoutDuration).toEqual(
            'bigint'
        );
        expect(typeof cs.concordiumBFTStatus.currentEpoch).toEqual('bigint');
        expect(typeof cs.concordiumBFTStatus.currentRound).toEqual('bigint');
        expect(
            cs.concordiumBFTStatus.triggerBlockTime instanceof Date
        ).toBeTruthy();
    }
});
