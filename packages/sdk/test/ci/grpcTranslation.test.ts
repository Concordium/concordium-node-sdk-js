import * as GRPC_PLT from '../../src/grpc-api/v2/concordium/protocol-level-tokens.js';
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
import {
    AccountAddress,
    Cbor,
    Duration,
    LockId,
    RejectReasonTag,
    Timestamp,
    TokenAmount,
    TokenId,
    TransactionEventTag,
    TransactionKindString,
    TransactionSummaryType,
    UpdateType,
    affectedAccounts,
} from '../../src/index.js';

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

function tokenUpdateSummary(effect: GRPC_PLT.TokenEffect) {
    return blockItemSummary({
        index: { value: 1n },
        energyCost: { value: 2n },
        hash: { value: new Uint8Array(32) },
        details: {
            oneofKind: 'accountTransaction',
            accountTransaction: {
                cost: { value: 0n },
                sender: { value: new Uint8Array(32) },
                effects: { effect: { oneofKind: 'tokenUpdateEffect', tokenUpdateEffect: effect } },
            },
        },
    });
}

const tokenId = { value: 'TEST' };
const holder: GRPC_PLT.TokenHolder = {
    address: { oneofKind: 'account', account: { value: new Uint8Array(32).fill(1) } },
};
const amount = { value: 7n, decimals: 2 };
const lockId = { accountIndex: 1n, sequenceNumber: 2n, creationOrder: 0n };
const transfer: GRPC_PLT.TokenEvent = {
    tokenId,
    event: { oneofKind: 'transferEvent', transferEvent: { from: holder, to: holder, amount } },
};

it('reads legacy field-1 token events when the unified list is empty, preserving token JSON', () => {
    const effect = GRPC_PLT.TokenEffect.create({ tokenEvents: [transfer] });
    const bytes = GRPC_PLT.TokenEffect.toBinary(effect);
    expect(bytes[0]).toBe(10); // length-delimited field 1, as used by P9/P10
    const summary = tokenUpdateSummary(GRPC_PLT.TokenEffect.fromBinary(bytes));
    expect(summary).toMatchObject({
        transactionType: TransactionKindString.TokenUpdate,
        events: [
            {
                tag: TransactionEventTag.TokenTransfer,
                tokenId: TokenId.fromString('TEST'),
                amount: TokenAmount.create(7n, 2),
            },
        ],
    });
    if (
        summary?.type !== TransactionSummaryType.AccountTransaction ||
        summary.transactionType !== TransactionKindString.TokenUpdate
    )
        throw new Error('Wrong summary');
    expect(JSON.parse(JSON.stringify(summary.events[0]))).toMatchObject({ tag: 'TokenTransfer', tokenId: 'TEST' });
    expect(summary.events[0]).not.toHaveProperty('fromLock');
    expect(summary.events[0]).not.toHaveProperty('toLock');
});

it('uses unified events once, preserving lock-send unlock and ordinary transfer effects', () => {
    const effect: GRPC_PLT.TokenEffect = {
        tokenEvents: [transfer],
        events: [
            {
                event: {
                    oneofKind: 'lockEvent',
                    lockEvent: {
                        event: {
                            oneofKind: 'unlockAmountEvent',
                            unlockAmountEvent: { tokenId, lockId, tokenHolder: holder, amount },
                        },
                    },
                },
            },
            { event: { oneofKind: 'tokenEvent', tokenEvent: transfer } },
            {
                event: {
                    oneofKind: 'lockEvent',
                    lockEvent: {
                        event: {
                            oneofKind: 'lockAmountEvent',
                            lockAmountEvent: { tokenId, lockId, tokenHolder: holder, amount },
                        },
                    },
                },
            },
            {
                event: {
                    oneofKind: 'lockEvent',
                    lockEvent: {
                        event: {
                            oneofKind: 'lockCreateEvent',
                            lockCreateEvent: { lockId, lockConfig: { value: new Uint8Array([0xa0]) } },
                        },
                    },
                },
            },
            {
                event: {
                    oneofKind: 'lockEvent',
                    lockEvent: { event: { oneofKind: 'lockDestroyEvent', lockDestroyEvent: { lockId } } },
                },
            },
        ],
    };
    const summary = tokenUpdateSummary(GRPC_PLT.TokenEffect.fromBinary(GRPC_PLT.TokenEffect.toBinary(effect)));
    expect(summary).toMatchObject({
        events: [
            {
                tag: TransactionEventTag.UnlockAmount,
                tokenId: TokenId.fromString('TEST'),
                lockId: LockId.create(1n, 2n, 0n),
                tokenHolder: { address: AccountAddress.fromBuffer(new Uint8Array(32).fill(1)) },
                amount: TokenAmount.create(7n, 2),
            },
            { tag: TransactionEventTag.TokenTransfer },
            { tag: TransactionEventTag.LockAmount, amount: TokenAmount.create(7n, 2) },
            { tag: TransactionEventTag.LockCreated, lockConfig: Cbor.fromHexString('a0') },
            { tag: TransactionEventTag.LockDestroyed },
        ],
    });
    if (summary === null) throw new Error('Unknown summary');
    expect(affectedAccounts(summary)).toEqual([
        AccountAddress.fromBuffer(new Uint8Array(32)),
        AccountAddress.fromBuffer(new Uint8Array(32).fill(1)),
    ]);
    expect(summary).not.toHaveProperty('tokenEvents');
});

it('preserves module event details and unknown event variants without falling back', () => {
    const summary = tokenUpdateSummary({
        tokenEvents: [transfer],
        events: [
            {
                event: {
                    oneofKind: 'tokenEvent',
                    tokenEvent: {
                        tokenId,
                        event: {
                            oneofKind: 'moduleEvent',
                            moduleEvent: { type: 'pause', details: { value: new Uint8Array([0xa0]) } },
                        },
                    },
                },
            },
            { event: { oneofKind: undefined } },
            { event: { oneofKind: 'tokenEvent', tokenEvent: { tokenId, event: { oneofKind: undefined } } } },
            { event: { oneofKind: 'lockEvent', lockEvent: { event: { oneofKind: undefined } } } },
        ],
    });
    expect(summary).toMatchObject({
        events: [
            { tag: TransactionEventTag.TokenModuleEvent, type: 'pause', details: Cbor.fromHexString('a0') },
            null,
            null,
            null,
        ],
    });
    expect(() =>
        tokenUpdateSummary({
            tokenEvents: [],
            events: [{ event: { oneofKind: 'tokenEvent', tokenEvent: { event: transfer.event } } }],
        })
    ).toThrow(/token id/);
});
