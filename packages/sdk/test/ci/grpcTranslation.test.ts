import * as GRPC from '../../src/grpc-api/v2/concordium/types.js';
import {
    blockItemSummary,
    nextUpdateSequenceNumbers,
    pendingUpdate,
    trAuthorizationsV1,
    trChainParametersV3,
    trRejectReason,
    trUpdatePayload,
} from '../../src/grpc/translation.js';
import { Duration, LockId, RejectReasonTag, Timestamp, TransactionSummaryType, UpdateType } from '../../src/index.js';

const accessStructure: GRPC.AccessStructure = {
    accessPublicKeys: [{ value: 2 }],
    accessThreshold: { value: 1 },
};

function authorizations(tokenParameters?: GRPC.AccessStructure): GRPC.AuthorizationsV1 {
    const v0: GRPC.AuthorizationsV0 = {
        keys: [],
        emergency: accessStructure,
        protocol: accessStructure,
        parameterConsensus: accessStructure,
        parameterEuroPerEnergy: accessStructure,
        parameterMicroCCDPerEuro: accessStructure,
        parameterFoundationAccount: accessStructure,
        parameterMintDistribution: accessStructure,
        parameterTransactionFeeDistribution: accessStructure,
        parameterGasRewards: accessStructure,
        poolParameters: accessStructure,
        addAnonymityRevoker: accessStructure,
        addIdentityProvider: accessStructure,
    };

    return {
        v0,
        parameterCooldown: accessStructure,
        parameterTime: accessStructure,
        createPlt: accessStructure,
        tokenParameters,
    };
}

function chainParameters(maxLockDuration?: GRPC.Duration): GRPC.ChainParametersV3 {
    const fraction: GRPC.AmountFraction = { partsPerHundredThousand: 1 };
    const range: GRPC.InclusiveRangeAmountFraction = { min: fraction, max: fraction };

    return {
        consensusParameters: {
            timeoutParameters: {
                timeoutBase: { value: 1n },
                timeoutIncrease: { numerator: 2n, denominator: 1n },
                timeoutDecrease: { numerator: 1n, denominator: 2n },
            },
            minBlockTime: { value: 2n },
            blockEnergyLimit: { value: 3n },
        },
        euroPerEnergy: { value: { numerator: 1n, denominator: 1n } },
        microCcdPerEuro: { value: { numerator: 1n, denominator: 1n } },
        cooldownParameters: {
            poolOwnerCooldown: { value: 4n },
            delegatorCooldown: { value: 5n },
        },
        timeParameters: {
            rewardPeriodLength: { value: { value: 6n } },
            mintPerPayday: { mantissa: 1, exponent: 1 },
        },
        accountCreationLimit: { value: 7 },
        mintDistribution: { bakingReward: fraction, finalizationReward: fraction },
        transactionFeeDistribution: { baker: fraction, gasAccount: fraction },
        gasRewards: { baker: fraction, accountCreation: fraction, chainUpdate: fraction },
        foundationAccount: { value: new Uint8Array(32) },
        poolParameters: {
            passiveFinalizationCommission: fraction,
            passiveBakingCommission: fraction,
            passiveTransactionCommission: fraction,
            commissionBounds: { finalization: range, baking: range, transaction: range },
            minimumEquityCapital: { value: 8n },
            capitalBound: { value: fraction },
            leverageBound: { value: { numerator: 1n, denominator: 1n } },
        },
        rootKeys: { keys: [], threshold: { value: 1 } },
        level1Keys: { keys: [], threshold: { value: 1 } },
        level2Keys: authorizations(accessStructure),
        finalizationCommitteeParameters: {
            minimumFinalizers: 1,
            maximumFinalizers: 2,
            finalizerRelativeStakeThreshold: fraction,
        },
        validatorScoreParameters: { maximumMissedRounds: 9n },
        maxLockDuration,
    };
}

function sequenceNumbers(maxLockDuration?: GRPC.SequenceNumber): GRPC.NextUpdateSequenceNumbers {
    const sequenceNumber = { value: 1n };
    return {
        rootKeys: sequenceNumber,
        level1Keys: sequenceNumber,
        level2Keys: sequenceNumber,
        protocol: sequenceNumber,
        electionDifficulty: sequenceNumber,
        euroPerEnergy: sequenceNumber,
        microCcdPerEuro: sequenceNumber,
        foundationAccount: sequenceNumber,
        mintDistribution: sequenceNumber,
        transactionFeeDistribution: sequenceNumber,
        gasRewards: sequenceNumber,
        poolParameters: sequenceNumber,
        addAnonymityRevoker: sequenceNumber,
        addIdentityProvider: sequenceNumber,
        cooldownParameters: sequenceNumber,
        timeParameters: sequenceNumber,
        timeoutParameters: sequenceNumber,
        minBlockTime: sequenceNumber,
        blockEnergyLimit: sequenceNumber,
        finalizationCommitteeParameters: sequenceNumber,
        validatorScoreParameters: sequenceNumber,
        protocolLevelTokens: sequenceNumber,
        maxLockDuration,
    };
}

test('converts P11 and pre-P11 chain parameters and authorizations', () => {
    const p11 = trChainParametersV3(chainParameters({ value: 12_345n }));
    expect(p11.maxLockDuration).toEqual(Duration.fromMillis(12_345n));
    expect(p11.level2Keys.tokenParameters).toEqual({ authorizedKeys: [2], threshold: 1 });

    const preP11 = trChainParametersV3(chainParameters());
    expect(preP11.maxLockDuration).toBeUndefined();
    expect(trAuthorizationsV1(authorizations()).tokenParameters).toBeUndefined();
});

test('preserves token parameters in authorization update payloads', () => {
    const payload = trUpdatePayload({
        payload: {
            oneofKind: 'rootUpdate',
            rootUpdate: {
                updateType: {
                    oneofKind: 'level2KeysUpdateV1',
                    level2KeysUpdateV1: authorizations(accessStructure),
                },
            },
        },
    });

    expect(payload).toMatchObject({
        updateType: UpdateType.Root,
        update: {
            updatePayload: {
                tokenParameters: { authorizedKeys: [2], threshold: 1 },
            },
        },
    });
});

test('converts max lock duration update summaries and pending updates', () => {
    const summary = blockItemSummary({
        index: { value: 1n },
        energyCost: { value: 2n },
        hash: { value: new Uint8Array(32) },
        details: {
            oneofKind: 'update',
            update: {
                effectiveTime: { value: 3n },
                payload: {
                    payload: {
                        oneofKind: 'maxLockDurationUpdate',
                        maxLockDurationUpdate: { value: 4_000n },
                    },
                },
            },
        },
    });

    expect(summary).toMatchObject({
        type: TransactionSummaryType.UpdateTransaction,
        effectiveTime: 3n,
        payload: { updateType: UpdateType.MaxLockDuration, update: Duration.fromMillis(4_000n) },
    });

    const pending = pendingUpdate({
        effectiveTime: { value: 5n },
        effect: { oneofKind: 'maxLockDuration', maxLockDuration: { value: 6_000n } },
    });
    expect(pending).toEqual({
        effectiveTime: Timestamp.fromMillis(5n),
        effect: { updateType: UpdateType.MaxLockDuration, update: Duration.fromMillis(6_000n) },
    });
});

test('converts present and omitted max lock duration sequence numbers', () => {
    expect(nextUpdateSequenceNumbers(sequenceNumbers({ value: 11n })).maxLockDuration).toBe(11n);
    expect(nextUpdateSequenceNumbers(sequenceNumbers()).maxLockDuration).toBe(1n);
});

test('converts lock duration too long rejections with the lock identifier', () => {
    const lockId = { accountIndex: 7n, sequenceNumber: 8n, creationOrder: 9n };
    const rejection = trRejectReason({
        reason: { oneofKind: 'lockDurationTooLong', lockDurationTooLong: lockId },
    });

    expect(rejection).toEqual({
        tag: RejectReasonTag.LockDurationTooLong,
        contents: LockId.create(lockId.accountIndex, lockId.sequenceNumber, lockId.creationOrder),
    });
});
