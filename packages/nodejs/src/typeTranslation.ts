import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import { mapRecord, unwrap } from './util';
import { Buffer } from 'buffer/';
import {
    AccountAddress,
    BakerPoolPendingChangeType,
    PoolStatusType,
} from '@concordium/common-sdk';

function unwrapToHex(x: Uint8Array | undefined): string {
    return Buffer.from(unwrap(x)).toString('hex');
}

function unwrapValueToHex(x: { value: Uint8Array }): string {
    return unwrapToHex(x.value);
}

function transRelease(release: v2.Release): v1.ReleaseScheduleWithTransactions {
    return {
        timestamp: transTimestamp(release.timestamp),
        amount: unwrap(release.amount?.value),
        transactions: release.transactions.map(unwrapValueToHex),
    };
}

function transDate(ym: v2.YearMonth): string {
    return String(ym.year) + String(ym.month).padStart(2, '0');
}

function transAttKey(attributeKey: number): v1.AttributeKey {
    return v1.AttributesKeys[attributeKey] as v1.AttributeKey;
}

function transCommits(
    cmm: v2.CredentialCommitments
): v1.CredentialDeploymentCommitments {
    return {
        cmmPrf: unwrapToHex(cmm.prf?.value),
        cmmCredCounter: unwrapToHex(cmm.credCounter?.value),
        cmmIdCredSecSharingCoeff:
            cmm.idCredSecSharingCoeff.map(unwrapValueToHex),
        cmmAttributes: mapRecord(cmm.attributes, unwrapValueToHex, transAttKey),
        cmmMaxAccounts: unwrapToHex(cmm.maxAccounts?.value),
    };
}

function transVerifyKey(verifyKey: v2.AccountVerifyKey): v1.VerifyKey {
    if (verifyKey.key.oneofKind === 'ed25519Key') {
        return {
            schemeId: 'Ed25519',
            verifyKey: unwrapToHex(verifyKey.key.ed25519Key),
        };
    } else {
        throw Error(
            'AccountVerifyKey was expected to be of type "ed25519Key", but found' +
                verifyKey.key.oneofKind
        );
    }
}

function transCredKeys(
    credKeys: v2.CredentialPublicKeys
): v1.CredentialPublicKeys {
    return {
        threshold: unwrap(credKeys.threshold?.value),
        keys: mapRecord(credKeys.keys, transVerifyKey),
    };
}

function transChainArData(chainArData: v2.ChainArData): v1.ChainArData {
    return {
        encIdCredPubShare: unwrapToHex(chainArData.encIdCredPubShare),
    };
}

function transCommissionRates(
    rates: v2.CommissionRates | undefined
): v1.CommissionRates {
    return {
        transactionCommission: transAmountFraction(rates?.transaction),
        bakingCommission: transAmountFraction(rates?.baking),
        finalizationCommission: transAmountFraction(rates?.finalization),
    };
}

function transCred(cred: v2.AccountCredential): v1.AccountCredential {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crd = cred.credentialValues as any;
    if (crd === undefined) {
        throw Error('CredentialValues were undefined.');
    }
    const isNormal = crd.oneofKind === 'normal';
    const credVals = isNormal ? crd.normal : crd.initial;

    const policy: v1.Policy = {
        validTo: transDate(unwrap(credVals.policy?.validTo)),
        createdAt: transDate(unwrap(credVals.policy?.createdAt)),
        revealedAttributes: mapRecord(
            credVals.policy?.attributes,
            unwrapToHex,
            transAttKey
        ),
    };
    const commonValues = {
        ipIdentity: unwrap(credVals.ipId?.value),
        credentialPublicKeys: transCredKeys(unwrap(credVals.keys)),
        policy: policy,
    };

    let value: v1.InitialAccountCredential | v1.NormalAccountCredential;
    if (isNormal) {
        const deploymentValues = {
            ...commonValues,
            credId: unwrapToHex(credVals.credId?.value),
            revocationThreshold: unwrap(credVals.arThreshold?.value),
            arData: mapRecord(credVals.arData, transChainArData, String),
            commitments: transCommits(unwrap(credVals.commitments)),
        };
        value = {
            type: 'normal',
            contents: deploymentValues,
        };
    } else {
        const deploymentValues = {
            ...commonValues,
            regId: unwrapToHex(credVals.credId?.value),
        };
        value = {
            type: 'initial',
            contents: deploymentValues,
        };
    }

    return {
        v: 0,
        value,
    };
}

function transDelegatorTarget(
    target: v2.DelegationTarget
): v1.DelegationTarget {
    if (target.target.oneofKind === 'passive') {
        return {
            delegateType: v1.DelegationTargetType.PassiveDelegation,
        };
    } else if (target.target.oneofKind === 'baker') {
        return {
            delegateType: v1.DelegationTargetType.Baker,
            bakerId: target.target.baker.value,
        };
    } else {
        throw Error(
            'DelegatorTarget expected to be of type "passive" or "baker", but found ' +
                target.target.oneofKind
        );
    }
}

function transTimestamp(timestamp: v2.Timestamp | undefined): Date {
    return new Date(Number(unwrap(timestamp?.value)) * 1000);
}

function transPendingChange(
    pendingChange: v2.StakePendingChange | undefined
): v1.StakePendingChangeV1 {
    const change = unwrap(pendingChange?.change);
    if (change.oneofKind === 'reduce') {
        return {
            newStake: unwrap(change.reduce.newStake?.value),
            effectiveTime: transTimestamp(change.reduce.effectiveTime),
            change: v1.StakePendingChangeType.ReduceStake,
        };
    } else if (change.oneofKind === 'remove') {
        return {
            effectiveTime: transTimestamp(change.remove),
            change: v1.StakePendingChangeType.RemoveStakeV1,
        };
    } else {
        throw Error(
            'PendingChange expected to be of type "reduce" or "remove", but found ' +
                change.oneofKind
        );
    }
}

function transDelegator(
    deleg: v2.AccountStakingInfo_Delegator
): v1.AccountDelegationDetails {
    return {
        restakeEarnings: deleg.restakeEarnings,
        stakedAmount: unwrap(deleg.stakedAmount?.value),
        delegationTarget: transDelegatorTarget(unwrap(deleg.target)),
        // Set the following value if deleg.pendingChange is set to true
        ...(deleg.pendingChange && {
            pendingChange: transPendingChange(deleg.pendingChange),
        }),
    };
}

function transAmountFraction(amount: v2.AmountFraction | undefined): number {
    return unwrap(amount?.partsPerHundredThousand) / 100000;
}

function transOpenStatus(
    openStatus: v2.OpenStatus | undefined
): v1.OpenStatusText {
    switch (unwrap(openStatus)) {
        case v2.OpenStatus.OPEN_FOR_ALL:
            return v1.OpenStatusText.OpenForAll;
        case v2.OpenStatus.CLOSED_FOR_NEW:
            return v1.OpenStatusText.ClosedForNew;
        case v2.OpenStatus.CLOSED_FOR_ALL:
            return v1.OpenStatusText.ClosedForAll;
    }
}

function transBaker(
    baker: v2.AccountStakingInfo_Baker
): v1.AccountBakerDetails {
    const bakerInfo = baker.bakerInfo;
    const bakerPoolInfo: v1.BakerPoolInfo = {
        openStatus: transOpenStatus(baker.poolInfo?.openStatus),
        metadataUrl: unwrap(baker.poolInfo?.url),
        commissionRates: transCommissionRates(baker.poolInfo?.commissionRates),
    };
    return {
        restakeEarnings: baker.restakeEarnings,
        bakerId: unwrap(baker.bakerInfo?.bakerId?.value),
        bakerAggregationVerifyKey: unwrapToHex(
            bakerInfo?.aggregationKey?.value
        ),
        bakerElectionVerifyKey: unwrapToHex(
            baker.bakerInfo?.electionKey?.value
        ),
        bakerSignatureVerifyKey: unwrapToHex(bakerInfo?.signatureKey?.value),
        bakerPoolInfo: bakerPoolInfo,
        stakedAmount: unwrap(baker.stakedAmount?.value),
        // Set the following value if baker.pendingChange is set to true
        ...(baker.pendingChange && {
            pendingChange: transPendingChange(baker.pendingChange),
        }),
    };
}

function translateChainParametersCommon(
    params: v2.ChainParametersV1 | v2.ChainParametersV0
): v1.ChainParametersCommon {
    return {
        electionDifficulty: transAmountFraction(
            params.electionDifficulty?.value
        ),
        euroPerEnergy: unwrap(params.euroPerEnergy?.value),
        microGTUPerEuro: unwrap(params.microCcdPerEuro?.value),
        accountCreationLimit: unwrap(params.accountCreationLimit?.value),
        foundationAccount: v1.AccountAddress.fromBytes(Buffer.from(unwrap(params.foundationAccount?.value))).address
    };
}

function translateCommissionRange(
    range: v2.InclusiveRangeAmountFraction | undefined
): v1.InclusiveRange<number> {
    return {
        min: transAmountFraction(range?.min),
        max: transAmountFraction(range?.max),
    };
}

function translateRewardParametersCommon(
    params: v2.ChainParametersV1 | v2.ChainParametersV0
): v1.RewardParametersCommon {
    return {
        transactionFeeDistribution: {
            baker: transAmountFraction(
                params.transactionFeeDistribution?.baker
            ),
            gasAccount: transAmountFraction(
                params.transactionFeeDistribution?.gasAccount
            ),
        },
        gASRewards: {
            baker: transAmountFraction(params.gasRewards?.baker),
            finalizationProof: transAmountFraction(
                params.gasRewards?.finalizationProof
            ),
            accountCreation: transAmountFraction(
                params.gasRewards?.accountCreation
            ),
            chainUpdate: transAmountFraction(params.gasRewards?.chainUpdate),
        },
    };
}

function translateMintRate(mintRate: v2.MintRate | undefined): number {
    return unwrap(mintRate?.mantissa) * 10 ** (-1*unwrap(mintRate?.exponent));
}

function transPoolPendingChange(
    change: v2.PoolPendingChange | undefined
): v1.BakerPoolPendingChange {
    switch (change?.change?.oneofKind) {
        case 'reduce': {
            return {
                pendingChangeType:
                    BakerPoolPendingChangeType.ReduceBakerCapital,
                effectiveTime: new Date(
                    Number(unwrap(change.change.reduce.effectiveTime?.value))
                ),
                bakerEquityCapital: unwrap(
                    change.change.reduce.reducedEquityCapital?.value
                ),
            };
        }
        case 'remove': {
            return {
                pendingChangeType: BakerPoolPendingChangeType.RemovePool,
                effectiveTime: new Date(
                    Number(unwrap(change.change.remove.effectiveTime?.value))
                ),
            };
        }
        default:
            return {
                pendingChangeType: BakerPoolPendingChangeType.NoChange,
            };
    }
}

function transPoolInfo(info: v2.BakerPoolInfo): v1.BakerPoolInfo {
    return {
        openStatus: transOpenStatus(info.openStatus),
        metadataUrl: info.url,
        commissionRates: transCommissionRates(info.commissionRates),
    };
}

function transPaydayStatus(
    status: v2.PoolCurrentPaydayInfo | undefined
): v1.CurrentPaydayBakerPoolStatus | undefined {
    if (!status) {
        return undefined;
    }
    return {
        blocksBaked: status.blocksBaked,
        finalizationLive: status.finalizationLive,
        transactionFeesEarned: unwrap(status.transactionFeesEarned?.value),
        effectiveStake: unwrap(status.effectiveStake?.value),
        lotteryPower: status.lotteryPower,
        bakerEquityCapital: unwrap(status.bakerEquityCapital?.value),
        delegatedCapital: unwrap(status.delegatedCapital?.value),
    };
}

export function accountInfo(acc: v2.AccountInfo): v1.AccountInfo {
    const accAdrRaw = Buffer.from(unwrap(acc.address?.value));
    const aggAmount = acc.encryptedBalance?.aggregatedAmount?.value;
    const numAggregated = acc.encryptedBalance?.numAggregated;

    const encryptedAmount: v1.AccountEncryptedAmount = {
        selfAmount: unwrapToHex(acc.encryptedBalance?.selfAmount?.value),
        startIndex: unwrap(acc.encryptedBalance?.startIndex),
        incomingAmounts: unwrap(acc.encryptedBalance?.incomingAmounts).map(
            unwrapValueToHex
        ),
        // Set the following values if they are not undefined
        ...(numAggregated && { numAggregated: numAggregated }),
        ...(aggAmount && { aggregatedAmount: unwrapToHex(aggAmount) }),
    };
    const releaseSchedule = {
        total: unwrap(acc.schedule?.total?.value),
        schedule: unwrap(acc.schedule?.schedules).map(transRelease),
    };
    const accInfoCommon: v1.AccountInfoSimple = {
        accountAddress: v1.AccountAddress.fromBytes(accAdrRaw).address,
        accountNonce: unwrap(acc.sequenceNumber?.value),
        accountAmount: unwrap(acc.amount?.value),
        accountIndex: unwrap(acc.index?.value),
        accountThreshold: unwrap(acc.threshold?.value),
        accountEncryptionKey: unwrapToHex(acc.encryptionKey?.value),
        accountEncryptedAmount: encryptedAmount,
        accountReleaseSchedule: releaseSchedule,
        accountCredentials: mapRecord(acc.creds, transCred),
    };

    if (acc.stake?.stakingInfo.oneofKind === 'delegator') {
        return {
            ...accInfoCommon,
            accountDelegation: transDelegator(acc.stake.stakingInfo.delegator),
        };
    } else if (acc.stake?.stakingInfo.oneofKind === 'baker') {
        return {
            ...accInfoCommon,
            accountBaker: transBaker(acc.stake.stakingInfo.baker),
        };
    } else {
        return accInfoCommon;
    }
}

export function nextAccountSequenceNumber(
    nasn: v2.NextAccountSequenceNumber
): v1.NextAccountNonce {
    return {
        nonce: unwrap(nasn.sequenceNumber?.value),
        allFinal: nasn.allFinal,
    };
}

export function cryptographicParameters(
    cp: v2.CryptographicParameters
): v1.CryptographicParameters {
    return {
        onChainCommitmentKey: unwrapToHex(cp.onChainCommitmentKey),
        bulletproofGenerators: unwrapToHex(cp.bulletproofGenerators),
        genesisString: cp.genesisString,
    };
}

export function blockChainParameters(
    params: v2.ChainParameters
): v1.ChainParameters {
    switch (params.parameters.oneofKind) {
        case 'v1': {
            const common = translateChainParametersCommon(params.parameters.v1);
            const commonRewardParameters = translateRewardParametersCommon(
                params.parameters.v1
            );
            const x: v1.ChainParametersV1 = {
                ...common,
                rewardPeriodLength: unwrap(
                    params.parameters.v1.timeParameters?.rewardPeriodLength
                        ?.value?.value
                ),
                mintPerPayday: translateMintRate(
                    params.parameters.v1.timeParameters?.mintPerPayday
                ),
                delegatorCooldown: unwrap(
                    params.parameters.v1.cooldownParameters?.delegatorCooldown
                        ?.value
                ),
                poolOwnerCooldown: unwrap(
                    params.parameters.v1.cooldownParameters?.poolOwnerCooldown
                        ?.value
                ),
                passiveFinalizationCommission: transAmountFraction(
                    params.parameters.v1.poolParameters
                        ?.passiveFinalizationCommission
                ),
                passiveBakingCommission: transAmountFraction(
                    params.parameters.v1.poolParameters?.passiveBakingCommission
                ),
                passiveTransactionCommission: transAmountFraction(
                    params.parameters.v1.poolParameters
                        ?.passiveTransactionCommission
                ),
                finalizationCommissionRange: translateCommissionRange(
                    params.parameters.v1.poolParameters?.commissionBounds
                        ?.finalization
                ),
                bakingCommissionRange: translateCommissionRange(
                    params.parameters.v1.poolParameters?.commissionBounds
                        ?.baking
                ),
                transactionCommissionRange: translateCommissionRange(
                    params.parameters.v1.poolParameters?.commissionBounds
                        ?.transaction
                ),
                minimumEquityCapital: unwrap(
                    params.parameters.v1.poolParameters?.minimumEquityCapital
                        ?.value
                ),
                capitalBound: transAmountFraction(
                    params.parameters.v1.poolParameters?.capitalBound?.value
                ),
                leverageBound: unwrap(
                    params.parameters.v1.poolParameters?.leverageBound?.value
                ),
                rewardParameters: {
                    ...commonRewardParameters,
                    mintDistribution: {
                        bakingReward: transAmountFraction(
                            params.parameters.v1.mintDistribution?.bakingReward
                        ),
                        finalizationReward: transAmountFraction(
                            params.parameters.v1.mintDistribution
                                ?.finalizationReward
                        ),
                    },
                },
            };
            return x;
        }
        case 'v0': {
            const common = translateChainParametersCommon(params.parameters.v0);
            const commonRewardParameters = translateRewardParametersCommon(
                params.parameters.v0
            );
            const x: v1.ChainParametersV0 = {
                ...common,
                bakerCooldownEpochs: unwrap(
                    params.parameters.v0.bakerCooldownEpochs?.value
                ),
                minimumThresholdForBaking: unwrap(
                    params.parameters.v0.minimumThresholdForBaking?.value
                ),
                rewardParameters: {
                    ...commonRewardParameters,
                    mintDistribution: {
                        bakingReward: transAmountFraction(
                            params.parameters.v0.mintDistribution?.bakingReward
                        ),
                        finalizationReward: transAmountFraction(
                            params.parameters.v0.mintDistribution
                                ?.finalizationReward
                        ),
                        mintPerSlot: translateMintRate(
                            params.parameters.v0.mintDistribution?.mintPerSlot
                        ),
                    },
                },
            };
            return x;
        }
        default:
            throw new Error('Missing chain parameters');
    }
}

export function bakerPoolInfo(info: v2.PoolInfoResponse): v1.BakerPoolStatus {
    return {
        poolType: PoolStatusType.BakerPool,
        bakerId: unwrap(info.baker?.value),
        bakerAddress: AccountAddress.fromBytes(
            Buffer.from(unwrap(info.address?.value))
        ).address,
        bakerEquityCapital: unwrap(info.equityCapital?.value),
        delegatedCapital: unwrap(info.delegatedCapital?.value),
        delegatedCapitalCap: unwrap(info.delegatedCapitalCap?.value),
        poolInfo: transPoolInfo(unwrap(info?.poolInfo)),
        bakerStakePendingChange: transPoolPendingChange(
            info.equityPendingChange
        ),
        currentPaydayStatus: transPaydayStatus(info.currentPaydayInfo),
        allPoolTotalCapital: unwrap(info.allPoolTotalCapital?.value),
    };
}

export function passiveDelegationInfo(
    info: v2.PassiveDelegationInfo
): v1.PassiveDelegationStatus {
    return {
        poolType: PoolStatusType.PassiveDelegation,
        delegatedCapital: unwrap(info.delegatedCapital?.value),
        commissionRates: transCommissionRates(info.commissionRates),
        currentPaydayTransactionFeesEarned: unwrap(
            info.currentPaydayTransactionFeesEarned?.value
        ),
        currentPaydayDelegatedCapital: unwrap(
            info.currentPaydayDelegatedCapital?.value
        ),
        allPoolTotalCapital: unwrap(info.allPoolTotalCapital?.value),
    };
}
