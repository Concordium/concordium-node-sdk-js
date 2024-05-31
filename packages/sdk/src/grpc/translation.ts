import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';

import * as v2 from '../grpc-api/v2/concordium/types.js';
import * as v1 from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as BlockHash from '../types/BlockHash.js';
import * as CcdAmount from '../types/CcdAmount.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as ContractEvent from '../types/ContractEvent.js';
import * as Duration from '../types/Duration.js';
import * as Energy from '../types/Energy.js';
import * as InitName from '../types/InitName.js';
import * as ModuleReference from '../types/ModuleReference.js';
import * as Parameter from '../types/Parameter.js';
import * as ReceiveName from '../types/ReceiveName.js';
import * as ReturnValue from '../types/ReturnValue.js';
import * as SequenceNumber from '../types/SequenceNumber.js';
import * as Timestamp from '../types/Timestamp.js';
import * as TransactionHash from '../types/TransactionHash.js';
import { mapRecord, unwrap } from '../util.js';

function unwrapToHex(bytes: Uint8Array | undefined): v1.HexString {
    return Buffer.from(unwrap(bytes)).toString('hex');
}

export function unwrapValToHex(x: { value: Uint8Array } | undefined): string {
    return unwrapToHex(unwrap(x).value);
}

export function unwrapToBase58(address: v2.AccountAddress | undefined): v1.Base58String {
    return bs58check.encode(Buffer.concat([Buffer.of(1), unwrap(address?.value)]));
}

function trRelease(release: v2.Release): v1.ReleaseScheduleWithTransactions {
    return {
        timestamp: trTimestamp(release.timestamp),
        amount: CcdAmount.fromProto(unwrap(release.amount)),
        transactions: release.transactions.map(unwrapValToHex),
    };
}

function trNewRelease(release: v2.NewRelease): v1.ReleaseSchedule {
    return {
        timestamp: trTimestamp(release.timestamp),
        amount: CcdAmount.fromProto(unwrap(release.amount)),
    };
}

function trDate(ym: v2.YearMonth): string {
    return String(ym.year) + String(ym.month).padStart(2, '0');
}

function trAttKey(attributeKey: number): v1.AttributeKey {
    return v1.AttributesKeys[attributeKey] as v1.AttributeKey;
}

function trCommits(cmm: v2.CredentialCommitments): v1.CredentialDeploymentCommitments {
    return {
        cmmPrf: unwrapValToHex(cmm.prf),
        cmmCredCounter: unwrapValToHex(cmm.credCounter),
        cmmIdCredSecSharingCoeff: cmm.idCredSecSharingCoeff.map(unwrapValToHex),
        cmmAttributes: mapRecord(cmm.attributes, unwrapValToHex, trAttKey),
        cmmMaxAccounts: unwrapValToHex(cmm.maxAccounts),
    };
}

function trVerifyKey(verifyKey: v2.AccountVerifyKey): v1.VerifyKey {
    if (verifyKey.key.oneofKind === 'ed25519Key') {
        return {
            schemeId: 'Ed25519',
            verifyKey: unwrapToHex(verifyKey.key.ed25519Key),
        };
    } else {
        throw Error('AccountVerifyKey was expected to be of type "ed25519Key", but found' + verifyKey.key.oneofKind);
    }
}

function trCredKeys(credKeys: v2.CredentialPublicKeys): v1.CredentialPublicKeys {
    return {
        threshold: unwrap(credKeys.threshold?.value),
        keys: mapRecord(credKeys.keys, trVerifyKey),
    };
}

function trChainArData(chainArData: v2.ChainArData): v1.ChainArData {
    return {
        encIdCredPubShare: unwrapToHex(chainArData.encIdCredPubShare),
    };
}

function trCommissionRates(rates: v2.CommissionRates | undefined): v1.CommissionRates {
    return {
        transactionCommission: trAmountFraction(rates?.transaction),
        bakingCommission: trAmountFraction(rates?.baking),
        finalizationCommission: trAmountFraction(rates?.finalization),
    };
}

function trCred(cred: v2.AccountCredential): v1.AccountCredential {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crd = cred.credentialValues as any;
    if (crd === undefined) {
        throw Error('CredentialValues were undefined.');
    }
    const isNormal = crd.oneofKind === 'normal';
    const credVals = isNormal ? crd.normal : crd.initial;

    const policy: v1.Policy = {
        validTo: trDate(unwrap(credVals.policy?.validTo)),
        createdAt: trDate(unwrap(credVals.policy?.createdAt)),
        revealedAttributes: mapRecord(credVals.policy?.attributes, unwrapToHex, trAttKey),
    };
    const commonValues = {
        ipIdentity: unwrap(credVals.ipId?.value),
        credentialPublicKeys: trCredKeys(unwrap(credVals.keys)),
        policy: policy,
    };

    let value: v1.InitialAccountCredential | v1.NormalAccountCredential;
    if (isNormal) {
        const deploymentValues = {
            ...commonValues,
            credId: unwrapValToHex(credVals.credId),
            revocationThreshold: unwrap(credVals.arThreshold?.value),
            arData: mapRecord(credVals.arData, trChainArData, String),
            commitments: trCommits(unwrap(credVals.commitments)),
        };
        value = {
            type: 'normal',
            contents: deploymentValues,
        };
    } else {
        const deploymentValues = {
            ...commonValues,
            regId: unwrapValToHex(credVals.credId),
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

function trDelegatorTarget(target: v2.DelegationTarget): v1.DelegationTarget {
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
            'DelegatorTarget expected to be of type "passive" or "baker", but found ' + target.target.oneofKind
        );
    }
}

function trTimestamp(timestamp: v2.Timestamp | undefined): Date {
    return new Date(Number(unwrap(timestamp?.value)));
}

function trPendingChange(pendingChange: v2.StakePendingChange | undefined): v1.StakePendingChange {
    const change = unwrap(pendingChange?.change);
    if (change.oneofKind === 'reduce') {
        return {
            newStake: unwrap(change.reduce.newStake?.value),
            effectiveTime: trTimestamp(change.reduce.effectiveTime),
            change: v1.StakePendingChangeType.ReduceStake,
        };
    } else if (change.oneofKind === 'remove') {
        return {
            effectiveTime: trTimestamp(change.remove),
            change: v1.StakePendingChangeType.RemoveStake,
        };
    } else {
        throw Error('PendingChange expected to be of type "reduce" or "remove", but found ' + change.oneofKind);
    }
}

function trDelegator(deleg: v2.AccountStakingInfo_Delegator): v1.AccountDelegationDetails {
    return {
        restakeEarnings: deleg.restakeEarnings,
        stakedAmount: CcdAmount.fromProto(unwrap(deleg.stakedAmount)),
        delegationTarget: trDelegatorTarget(unwrap(deleg.target)),
        // Set the following value if deleg.pendingChange is set to true
        ...(deleg.pendingChange && {
            pendingChange: trPendingChange(deleg.pendingChange),
        }),
    };
}

function trAmountFraction(amount: v2.AmountFraction | undefined): number {
    return unwrap(amount?.partsPerHundredThousand) / 100000;
}

function trOpenStatus(openStatus: v2.OpenStatus | undefined): v1.OpenStatusText {
    switch (unwrap(openStatus)) {
        case v2.OpenStatus.OPEN_FOR_ALL:
            return v1.OpenStatusText.OpenForAll;
        case v2.OpenStatus.CLOSED_FOR_NEW:
            return v1.OpenStatusText.ClosedForNew;
        case v2.OpenStatus.CLOSED_FOR_ALL:
            return v1.OpenStatusText.ClosedForAll;
    }
}

function trBaker(baker: v2.AccountStakingInfo_Baker): v1.AccountBakerDetails {
    const bakerInfo = baker.bakerInfo;

    const v0: v1.AccountBakerDetails = {
        version: 0,
        restakeEarnings: baker.restakeEarnings,
        bakerId: unwrap(bakerInfo?.bakerId?.value),
        bakerAggregationVerifyKey: unwrapValToHex(bakerInfo?.aggregationKey),
        bakerElectionVerifyKey: unwrapValToHex(baker.bakerInfo?.electionKey),
        bakerSignatureVerifyKey: unwrapValToHex(bakerInfo?.signatureKey),
        stakedAmount: CcdAmount.fromProto(unwrap(baker.stakedAmount)),
        // Set the following value if baker.pendingChange is set to true
        ...(baker.pendingChange && {
            pendingChange: trPendingChange(baker.pendingChange),
        }),
    };

    if (baker.poolInfo === undefined) {
        return v0;
    }

    const bakerPoolInfo: v1.BakerPoolInfo = {
        openStatus: trOpenStatus(baker.poolInfo?.openStatus),
        metadataUrl: unwrap(baker.poolInfo?.url),
        commissionRates: trCommissionRates(baker.poolInfo?.commissionRates),
    };
    return {
        ...v0,
        version: 1,
        bakerPoolInfo: bakerPoolInfo,
    };
}

function trHigherLevelKeysUpdate(update: v2.HigherLevelKeys): v1.KeysWithThreshold {
    return {
        keys: update.keys.map(trUpdatePublicKey),
        threshold: unwrap(update.threshold?.value),
    };
}

function translateChainParametersCommon(params: v2.ChainParametersV1 | v2.ChainParametersV0): v1.ChainParametersCommon {
    return {
        euroPerEnergy: unwrap(params.euroPerEnergy?.value),
        microGTUPerEuro: unwrap(params.microCcdPerEuro?.value),
        accountCreationLimit: unwrap(params.accountCreationLimit?.value),
        foundationAccount: AccountAddress.fromProto(unwrap(params.foundationAccount)),
        level1Keys: trHigherLevelKeysUpdate(unwrap(params.level1Keys)),
        rootKeys: trHigherLevelKeysUpdate(unwrap(params.rootKeys)),
    };
}

function translateCommissionRange(range: v2.InclusiveRangeAmountFraction | undefined): v1.InclusiveRange<number> {
    return {
        min: trAmountFraction(range?.min),
        max: trAmountFraction(range?.max),
    };
}

function translateRewardParametersCommon(
    params: v2.ChainParametersV1 | v2.ChainParametersV0
): v1.RewardParametersCommon {
    const feeDistribution = params.transactionFeeDistribution;
    return {
        transactionFeeDistribution: {
            baker: trAmountFraction(feeDistribution?.baker),
            gasAccount: trAmountFraction(feeDistribution?.gasAccount),
        },
    };
}

function transPoolPendingChange(change: v2.PoolPendingChange | undefined): v1.BakerPoolPendingChange {
    switch (change?.change?.oneofKind) {
        case 'reduce': {
            return {
                pendingChangeType: v1.BakerPoolPendingChangeType.ReduceBakerCapital,
                // TODO ensure units are aligned
                effectiveTime: trTimestamp(change.change.reduce.effectiveTime),
                bakerEquityCapital: CcdAmount.fromProto(unwrap(change.change.reduce.reducedEquityCapital)),
            };
        }
        case 'remove': {
            return {
                pendingChangeType: v1.BakerPoolPendingChangeType.RemovePool,
                effectiveTime: trTimestamp(change.change.remove.effectiveTime),
            };
        }
        default:
            return {
                pendingChangeType: v1.BakerPoolPendingChangeType.NoChange,
            };
    }
}

function transPoolInfo(info: v2.BakerPoolInfo): v1.BakerPoolInfo {
    return {
        openStatus: trOpenStatus(info.openStatus),
        metadataUrl: info.url,
        commissionRates: trCommissionRates(info.commissionRates),
    };
}

function transPaydayStatus(status: v2.PoolCurrentPaydayInfo | undefined): v1.CurrentPaydayBakerPoolStatus | null {
    if (!status) {
        return null;
    }
    return {
        blocksBaked: status.blocksBaked,
        finalizationLive: status.finalizationLive,
        transactionFeesEarned: CcdAmount.fromProto(unwrap(status.transactionFeesEarned)),
        effectiveStake: CcdAmount.fromProto(unwrap(status.effectiveStake)),
        lotteryPower: status.lotteryPower,
        bakerEquityCapital: CcdAmount.fromProto(unwrap(status.bakerEquityCapital)),
        delegatedCapital: CcdAmount.fromProto(unwrap(status.delegatedCapital)),
        commissionRates: trCommissionRates(status.commissionRates),
    };
}

export function accountInfo(acc: v2.AccountInfo): v1.AccountInfo {
    const aggAmount = acc.encryptedBalance?.aggregatedAmount?.value;
    const numAggregated = acc.encryptedBalance?.numAggregated;

    const encryptedAmount: v1.AccountEncryptedAmount = {
        selfAmount: unwrapValToHex(acc.encryptedBalance?.selfAmount),
        startIndex: unwrap(acc.encryptedBalance?.startIndex),
        incomingAmounts: unwrap(acc.encryptedBalance?.incomingAmounts).map(unwrapValToHex),
        // Set the following values if they are not undefined
        ...(numAggregated && { numAggregated: numAggregated }),
        ...(aggAmount && { aggregatedAmount: unwrapToHex(aggAmount) }),
    };
    const releaseSchedule = {
        total: CcdAmount.fromProto(unwrap(acc.schedule?.total)),
        schedule: unwrap(acc.schedule?.schedules).map(trRelease),
    };
    const accInfoCommon: v1.AccountInfoSimple = {
        type: v1.AccountInfoType.Simple,
        accountAddress: AccountAddress.fromProto(unwrap(acc.address)),
        accountNonce: SequenceNumber.fromProto(unwrap(acc.sequenceNumber)),
        accountAmount: CcdAmount.fromProto(unwrap(acc.amount)),
        accountIndex: unwrap(acc.index?.value),
        accountThreshold: unwrap(acc.threshold?.value),
        accountEncryptionKey: unwrapValToHex(acc.encryptionKey),
        accountEncryptedAmount: encryptedAmount,
        accountReleaseSchedule: releaseSchedule,
        accountCredentials: mapRecord(acc.creds, trCred),
    };

    if (acc.stake?.stakingInfo.oneofKind === 'delegator') {
        return {
            ...accInfoCommon,
            type: v1.AccountInfoType.Delegator,
            accountDelegation: trDelegator(acc.stake.stakingInfo.delegator),
        };
    } else if (acc.stake?.stakingInfo.oneofKind === 'baker') {
        return {
            ...accInfoCommon,
            type: v1.AccountInfoType.Baker,
            accountBaker: trBaker(acc.stake.stakingInfo.baker),
        };
    } else {
        return accInfoCommon;
    }
}

export function nextAccountSequenceNumber(nasn: v2.NextAccountSequenceNumber): v1.NextAccountNonce {
    return {
        nonce: SequenceNumber.fromProto(unwrap(nasn.sequenceNumber)),
        allFinal: nasn.allFinal,
    };
}

export function cryptographicParameters(cp: v2.CryptographicParameters): v1.CryptographicParameters {
    return {
        onChainCommitmentKey: unwrapToHex(cp.onChainCommitmentKey),
        bulletproofGenerators: unwrapToHex(cp.bulletproofGenerators),
        genesisString: cp.genesisString,
    };
}

function trChainParametersV0(v0: v2.ChainParametersV0): v1.ChainParametersV0 {
    const common = translateChainParametersCommon(v0);
    const commonRewardParameters = translateRewardParametersCommon(v0);
    return {
        ...common,
        version: 0,
        level2Keys: trAuthorizationsV0(unwrap(v0.level2Keys)),
        electionDifficulty: trAmountFraction(v0.electionDifficulty?.value),
        bakerCooldownEpochs: unwrap(v0.bakerCooldownEpochs?.value),
        minimumThresholdForBaking: CcdAmount.fromProto(unwrap(v0.minimumThresholdForBaking)),
        rewardParameters: {
            version: 0,
            ...commonRewardParameters,
            gASRewards: {
                version: 0,
                baker: trAmountFraction(v0.gasRewards?.baker),
                finalizationProof: trAmountFraction(v0.gasRewards?.finalizationProof),
                accountCreation: trAmountFraction(v0.gasRewards?.accountCreation),
                chainUpdate: trAmountFraction(v0.gasRewards?.chainUpdate),
            },
            mintDistribution: {
                version: 0,
                bakingReward: trAmountFraction(v0.mintDistribution?.bakingReward),
                finalizationReward: trAmountFraction(v0.mintDistribution?.finalizationReward),
                mintPerSlot: trMintRate(v0.mintDistribution?.mintPerSlot),
            },
        },
    };
}

function trChainParametersV1(params: v2.ChainParametersV1): v1.ChainParametersV1 {
    const common = translateChainParametersCommon(params);
    const commonRewardParameters = translateRewardParametersCommon(params);
    return {
        ...common,
        version: 1,
        level2Keys: trAuthorizationsV1(unwrap(params.level2Keys)),
        electionDifficulty: trAmountFraction(params.electionDifficulty?.value),
        rewardPeriodLength: unwrap(params.timeParameters?.rewardPeriodLength?.value?.value),
        mintPerPayday: trMintRate(params.timeParameters?.mintPerPayday),
        delegatorCooldown: unwrap(params.cooldownParameters?.delegatorCooldown?.value),
        poolOwnerCooldown: unwrap(params.cooldownParameters?.poolOwnerCooldown?.value),
        passiveFinalizationCommission: trAmountFraction(params.poolParameters?.passiveFinalizationCommission),
        passiveBakingCommission: trAmountFraction(params.poolParameters?.passiveBakingCommission),
        passiveTransactionCommission: trAmountFraction(params.poolParameters?.passiveTransactionCommission),
        finalizationCommissionRange: translateCommissionRange(params.poolParameters?.commissionBounds?.finalization),
        bakingCommissionRange: translateCommissionRange(params.poolParameters?.commissionBounds?.baking),
        transactionCommissionRange: translateCommissionRange(params.poolParameters?.commissionBounds?.transaction),
        minimumEquityCapital: CcdAmount.fromProto(unwrap(params.poolParameters?.minimumEquityCapital)),
        capitalBound: trAmountFraction(params.poolParameters?.capitalBound?.value),
        leverageBound: unwrap(params.poolParameters?.leverageBound?.value),
        rewardParameters: {
            ...commonRewardParameters,
            version: 1,
            gASRewards: {
                version: 0,
                baker: trAmountFraction(params.gasRewards?.baker),
                finalizationProof: trAmountFraction(params.gasRewards?.finalizationProof),
                accountCreation: trAmountFraction(params.gasRewards?.accountCreation),
                chainUpdate: trAmountFraction(params.gasRewards?.chainUpdate),
            },
            mintDistribution: {
                version: 1,
                bakingReward: trAmountFraction(params.mintDistribution?.bakingReward),
                finalizationReward: trAmountFraction(params.mintDistribution?.finalizationReward),
            },
        },
    };
}

function trChainParametersV2(params: v2.ChainParametersV2): v1.ChainParametersV2 {
    const common = translateChainParametersCommon(params);
    const commonRewardParameters = translateRewardParametersCommon(params);

    return {
        ...common,
        version: 2,
        level2Keys: trAuthorizationsV1(unwrap(params.level2Keys)),
        rewardPeriodLength: unwrap(params.timeParameters?.rewardPeriodLength?.value?.value),
        mintPerPayday: trMintRate(params.timeParameters?.mintPerPayday),
        delegatorCooldown: unwrap(params.cooldownParameters?.delegatorCooldown?.value),
        poolOwnerCooldown: unwrap(params.cooldownParameters?.poolOwnerCooldown?.value),
        passiveFinalizationCommission: trAmountFraction(params.poolParameters?.passiveFinalizationCommission),
        passiveBakingCommission: trAmountFraction(params.poolParameters?.passiveBakingCommission),
        passiveTransactionCommission: trAmountFraction(params.poolParameters?.passiveTransactionCommission),
        finalizationCommissionRange: translateCommissionRange(params.poolParameters?.commissionBounds?.finalization),
        bakingCommissionRange: translateCommissionRange(params.poolParameters?.commissionBounds?.baking),
        transactionCommissionRange: translateCommissionRange(params.poolParameters?.commissionBounds?.transaction),
        minimumEquityCapital: CcdAmount.fromProto(unwrap(params.poolParameters?.minimumEquityCapital)),
        capitalBound: trAmountFraction(params.poolParameters?.capitalBound?.value),
        leverageBound: unwrap(params.poolParameters?.leverageBound?.value),
        rewardParameters: {
            ...commonRewardParameters,
            version: 2,
            gASRewards: {
                version: 1,
                baker: trAmountFraction(params.gasRewards?.baker),
                accountCreation: trAmountFraction(params.gasRewards?.accountCreation),
                chainUpdate: trAmountFraction(params.gasRewards?.chainUpdate),
            },
            mintDistribution: {
                version: 1,
                bakingReward: trAmountFraction(params.mintDistribution?.bakingReward),
                finalizationReward: trAmountFraction(params.mintDistribution?.finalizationReward),
            },
        },
        timeoutBase: Duration.fromProto(unwrap(params.consensusParameters?.timeoutParameters?.timeoutBase)),
        timeoutDecrease: unwrap(params.consensusParameters?.timeoutParameters?.timeoutDecrease),
        timeoutIncrease: unwrap(params.consensusParameters?.timeoutParameters?.timeoutIncrease),
        minBlockTime: Duration.fromProto(unwrap(params.consensusParameters?.minBlockTime)),
        blockEnergyLimit: Energy.fromProto(unwrap(params.consensusParameters?.blockEnergyLimit)),
        finalizerRelativeStakeThreshold: trAmountFraction(
            params.finalizationCommitteeParameters?.finalizerRelativeStakeThreshold
        ),
        minimumFinalizers: unwrap(params.finalizationCommitteeParameters?.minimumFinalizers),
        maximumFinalizers: unwrap(params.finalizationCommitteeParameters?.maximumFinalizers),
    };
}

export function blockChainParameters(params: v2.ChainParameters): v1.ChainParameters {
    switch (params.parameters.oneofKind) {
        case 'v2': {
            return trChainParametersV2(params.parameters.v2);
        }
        case 'v1': {
            return trChainParametersV1(params.parameters.v1);
        }
        case 'v0': {
            return trChainParametersV0(params.parameters.v0);
        }
        default:
            throw new Error('Missing chain parameters');
    }
}

export function bakerPoolInfo(info: v2.PoolInfoResponse): v1.BakerPoolStatus {
    return {
        poolType: v1.PoolStatusType.BakerPool,
        bakerId: unwrap(info.baker?.value),
        bakerAddress: AccountAddress.fromProto(unwrap(info.address)),
        bakerEquityCapital: CcdAmount.fromProto(unwrap(info.equityCapital)),
        delegatedCapital: CcdAmount.fromProto(unwrap(info.delegatedCapital)),
        delegatedCapitalCap: CcdAmount.fromProto(unwrap(info.delegatedCapitalCap)),
        poolInfo: transPoolInfo(unwrap(info?.poolInfo)),
        bakerStakePendingChange: transPoolPendingChange(info.equityPendingChange),
        currentPaydayStatus: transPaydayStatus(info.currentPaydayInfo),
        allPoolTotalCapital: CcdAmount.fromProto(unwrap(info.allPoolTotalCapital)),
    };
}

export function passiveDelegationInfo(info: v2.PassiveDelegationInfo): v1.PassiveDelegationStatus {
    return {
        poolType: v1.PoolStatusType.PassiveDelegation,
        delegatedCapital: CcdAmount.fromProto(unwrap(info.delegatedCapital)),
        commissionRates: trCommissionRates(info.commissionRates),
        currentPaydayTransactionFeesEarned: CcdAmount.fromProto(unwrap(info.currentPaydayTransactionFeesEarned)),
        currentPaydayDelegatedCapital: CcdAmount.fromProto(unwrap(info.currentPaydayDelegatedCapital)),
        allPoolTotalCapital: CcdAmount.fromProto(unwrap(info.allPoolTotalCapital)),
    };
}

function translateProtocolVersion(pv: v2.ProtocolVersion): bigint {
    return BigInt(pv + 1); // Protocol version enum indexes from 0, i.e. pv.PROTOCOL_VERSION_1 = 0.
}

export function tokenomicsInfo(info: v2.TokenomicsInfo): v1.RewardStatus {
    switch (info.tokenomics.oneofKind) {
        case 'v0': {
            const v0 = info.tokenomics.v0;
            return {
                version: 0,
                protocolVersion: translateProtocolVersion(v0.protocolVersion),
                totalAmount: CcdAmount.fromProto(unwrap(v0.totalAmount)),
                totalEncryptedAmount: CcdAmount.fromProto(unwrap(v0.totalEncryptedAmount)),
                bakingRewardAccount: CcdAmount.fromProto(unwrap(v0.bakingRewardAccount)),
                finalizationRewardAccount: CcdAmount.fromProto(unwrap(v0.finalizationRewardAccount)),
                gasAccount: CcdAmount.fromProto(unwrap(v0.gasAccount)),
            };
        }
        case 'v1': {
            const v1 = info.tokenomics.v1;
            return {
                version: 1,
                protocolVersion: translateProtocolVersion(v1.protocolVersion),
                totalAmount: CcdAmount.fromProto(unwrap(v1.totalAmount)),
                totalEncryptedAmount: CcdAmount.fromProto(unwrap(v1.totalEncryptedAmount)),
                bakingRewardAccount: CcdAmount.fromProto(unwrap(v1.bakingRewardAccount)),
                finalizationRewardAccount: CcdAmount.fromProto(unwrap(v1.finalizationRewardAccount)),
                gasAccount: CcdAmount.fromProto(unwrap(v1.gasAccount)),
                foundationTransactionRewards: CcdAmount.fromProto(unwrap(v1.foundationTransactionRewards)),
                nextPaydayTime: trTimestamp(v1.nextPaydayTime),
                nextPaydayMintRate: unwrap(v1.nextPaydayMintRate),
                totalStakedCapital: CcdAmount.fromProto(unwrap(v1.totalStakedCapital)),
            };
        }
        case undefined:
            throw new Error('Missing tokenomics info');
    }
}

export function consensusInfo(ci: v2.ConsensusInfo): v1.ConsensusStatus {
    const common: v1.ConsensusStatusCommon = {
        bestBlock: BlockHash.fromProto(unwrap(ci.bestBlock)),
        genesisBlock: BlockHash.fromProto(unwrap(ci.genesisBlock)),
        currentEraGenesisBlock: BlockHash.fromProto(unwrap(ci.currentEraGenesisBlock)),
        lastFinalizedBlock: BlockHash.fromProto(unwrap(ci.lastFinalizedBlock)),
        epochDuration: Duration.fromProto(unwrap(ci.epochDuration)),
        bestBlockHeight: unwrap(ci.bestBlockHeight?.value),
        lastFinalizedBlockHeight: unwrap(ci.lastFinalizedBlockHeight?.value),
        finalizationCount: BigInt(unwrap(ci.finalizationCount)),
        blocksVerifiedCount: BigInt(unwrap(ci.blocksVerifiedCount)),
        blocksReceivedCount: BigInt(unwrap(ci.blocksReceivedCount)),
        blockArriveLatencyEMA: unwrap(ci.blockArriveLatencyEma),
        blockArriveLatencyEMSD: unwrap(ci.blockArriveLatencyEmsd),
        blockReceiveLatencyEMA: unwrap(ci.blockReceiveLatencyEma),
        blockReceiveLatencyEMSD: unwrap(ci.blockReceiveLatencyEmsd),
        transactionsPerBlockEMA: unwrap(ci.transactionsPerBlockEma),
        transactionsPerBlockEMSD: unwrap(ci.transactionsPerBlockEmsd),
        genesisTime: trTimestamp(ci.genesisTime),
        currentEraGenesisTime: trTimestamp(ci.currentEraGenesisTime),
        genesisIndex: unwrap(ci.genesisIndex?.value),
        protocolVersion: translateProtocolVersion(unwrap(ci.protocolVersion)),
        // Only include the following if they are not undefined
        ...(ci.blockReceivePeriodEma && {
            blockReceivePeriodEMA: ci.blockReceivePeriodEma,
        }),
        ...(ci.blockReceivePeriodEmsd && {
            blockReceivePeriodEMSD: ci.blockReceivePeriodEmsd,
        }),
        ...(ci.blockArrivePeriodEma && {
            blockArrivePeriodEMA: ci.blockArrivePeriodEma,
        }),
        ...(ci.blockArrivePeriodEmsd && {
            blockArrivePeriodEMSD: ci.blockArrivePeriodEmsd,
        }),
        ...(ci.finalizationPeriodEma && {
            blockArrivePeriodEMA: ci.blockArrivePeriodEma,
        }),
        ...(ci.finalizationPeriodEmsd && {
            blockArrivePeriodEMSD: ci.blockArrivePeriodEmsd,
        }),
        ...(ci.blockLastReceivedTime && {
            blockLastReceivedTime: trTimestamp(ci.blockLastReceivedTime),
        }),
        ...(ci.blockLastArrivedTime && {
            blockLastArrivedTime: trTimestamp(ci.blockLastArrivedTime),
        }),
        ...(ci.lastFinalizedTime && {
            lastFinalizedTime: trTimestamp(ci.lastFinalizedTime),
        }),
    };

    if (ci.protocolVersion < v2.ProtocolVersion.PROTOCOL_VERSION_6) {
        const ci0: v1.ConsensusStatusV0 = {
            ...common,
            version: 0,
            slotDuration: Duration.fromProto(unwrap(ci.slotDuration)),
        };

        return ci0;
    }

    const ci1: v1.ConsensusStatusV1 = {
        ...common,
        version: 1,
        concordiumBFTStatus: {
            currentTimeoutDuration: Duration.fromProto(unwrap(ci.currentTimeoutDuration)),
            currentRound: unwrap(ci.currentRound?.value),
            currentEpoch: unwrap(ci.currentEpoch?.value),
            triggerBlockTime: trTimestamp(ci.triggerBlockTime),
        },
    };

    return ci1;
}

function trAddress(address: v2.Address): v1.Address {
    if (address.type.oneofKind === 'account') {
        return {
            type: 'AddressAccount',
            address: AccountAddress.fromProto(unwrap(address.type.account)),
        };
    } else if (address.type.oneofKind === 'contract') {
        return {
            type: 'AddressContract',
            address: ContractAddress.fromProto(address.type.contract),
        };
    } else {
        throw Error('Invalid address encountered!');
    }
}

function trContractTraceElement(contractTraceElement: v2.ContractTraceElement): v1.ContractTraceEvent {
    const element = contractTraceElement.element;
    switch (element.oneofKind) {
        case 'updated':
            return {
                tag: v1.TransactionEventTag.Updated,
                contractVersion: element.updated.contractVersion,
                address: ContractAddress.fromProto(unwrap(element.updated.address)),
                instigator: trAddress(unwrap(element.updated.instigator)),
                amount: CcdAmount.fromProto(unwrap(element.updated.amount)),
                message: Parameter.fromProto(unwrap(element.updated.parameter)),
                receiveName: ReceiveName.fromProto(unwrap(element.updated.receiveName)),
                events: element.updated.events.map(ContractEvent.fromProto),
            };
        case 'transferred':
            return {
                tag: v1.TransactionEventTag.Transferred,
                from: ContractAddress.fromProto(unwrap(element.transferred.sender)),
                amount: CcdAmount.fromProto(unwrap(element.transferred.amount)),
                to: AccountAddress.fromProto(unwrap(element.transferred.receiver)),
            };
        case 'interrupted':
            return {
                tag: v1.TransactionEventTag.Interrupted,
                address: ContractAddress.fromProto(unwrap(element.interrupted.address)),
                events: element.interrupted.events.map(ContractEvent.fromProto),
            };
        case 'resumed':
            return {
                tag: v1.TransactionEventTag.Resumed,
                address: ContractAddress.fromProto(unwrap(element.resumed.address)),
                success: unwrap(element.resumed.success),
            };
        case 'upgraded':
            return {
                tag: v1.TransactionEventTag.Upgraded,
                address: ContractAddress.fromProto(unwrap(element.upgraded.address)),
                from: unwrapValToHex(element.upgraded.from),
                to: unwrapValToHex(element.upgraded.to),
            };
        default:
            throw Error('Invalid ContractTraceElement received, not able to translate to Transaction Event!');
    }
}

function trBakerEvent(bakerEvent: v2.BakerEvent, account: AccountAddress.Type): v1.BakerEvent {
    const event = bakerEvent.event;
    switch (event.oneofKind) {
        case 'bakerAdded': {
            const keysEvent = event.bakerAdded.keysEvent;
            return {
                tag: v1.TransactionEventTag.BakerAdded,
                bakerId: unwrap(keysEvent?.bakerId?.value),
                account: AccountAddress.fromProto(unwrap(keysEvent?.account)),
                signKey: unwrapValToHex(keysEvent?.signKey),
                electionKey: unwrapValToHex(keysEvent?.electionKey),
                aggregationKey: unwrapValToHex(keysEvent?.aggregationKey),
                stake: CcdAmount.fromProto(unwrap(event.bakerAdded.stake)),
                restakeEarnings: unwrap(event.bakerAdded.restakeEarnings),
            };
        }
        case 'bakerRemoved':
            return {
                tag: v1.TransactionEventTag.BakerRemoved,
                bakerId: unwrap(event.bakerRemoved.value),
                account,
            };
        case 'bakerStakeIncreased':
            return {
                tag: v1.TransactionEventTag.BakerStakeIncreased,
                bakerId: unwrap(event.bakerStakeIncreased.bakerId?.value),
                newStake: CcdAmount.fromProto(unwrap(event.bakerStakeIncreased.newStake)),
                account,
            };
        case 'bakerStakeDecreased':
            return {
                tag: v1.TransactionEventTag.BakerStakeDecreased,
                bakerId: unwrap(event.bakerStakeDecreased.bakerId?.value),
                newStake: CcdAmount.fromProto(unwrap(event.bakerStakeDecreased.newStake)),
                account,
            };
        case 'bakerRestakeEarningsUpdated': {
            const update = event.bakerRestakeEarningsUpdated;
            return {
                tag: v1.TransactionEventTag.BakerSetRestakeEarnings,
                bakerId: unwrap(update.bakerId?.value),
                restakeEarnings: unwrap(update.restakeEarnings),
                account,
            };
        }
        case 'bakerKeysUpdated':
            return {
                tag: v1.TransactionEventTag.BakerKeysUpdated,
                bakerId: unwrap(event.bakerKeysUpdated.bakerId?.value),
                account: AccountAddress.fromProto(unwrap(event.bakerKeysUpdated.account)),
                signKey: unwrapValToHex(event.bakerKeysUpdated.signKey),
                electionKey: unwrapValToHex(event.bakerKeysUpdated.electionKey),
                aggregationKey: unwrapValToHex(event.bakerKeysUpdated.aggregationKey),
            };
        case 'bakerSetOpenStatus': {
            const setOpenStatus = event.bakerSetOpenStatus;
            return {
                tag: v1.TransactionEventTag.BakerSetOpenStatus,
                bakerId: unwrap(setOpenStatus.bakerId?.value),
                openStatus: trOpenStatus(setOpenStatus.openStatus),
                account,
            };
        }
        case 'bakerSetMetadataUrl': {
            const setURL = event.bakerSetMetadataUrl;
            return {
                tag: v1.TransactionEventTag.BakerSetMetadataURL,
                bakerId: unwrap(setURL.bakerId?.value),
                metadataURL: setURL.url,
                account,
            };
        }
        case 'bakerSetTransactionFeeCommission': {
            const transferFeeComm = event.bakerSetTransactionFeeCommission;
            const amount = transferFeeComm.transactionFeeCommission;
            return {
                tag: v1.TransactionEventTag.BakerSetTransactionFeeCommission,
                bakerId: unwrap(transferFeeComm.bakerId?.value),
                transactionFeeCommission: trAmountFraction(amount),
                account,
            };
        }
        case 'bakerSetBakingRewardCommission': {
            const rewardComm = event.bakerSetBakingRewardCommission;
            const amount = rewardComm.bakingRewardCommission;
            return {
                tag: v1.TransactionEventTag.BakerSetBakingRewardCommission,
                bakerId: unwrap(rewardComm.bakerId?.value),
                bakingRewardCommission: trAmountFraction(amount),
                account,
            };
        }
        case 'bakerSetFinalizationRewardCommission': {
            const rewardComm = event.bakerSetFinalizationRewardCommission;
            const amount = rewardComm.finalizationRewardCommission;
            return {
                tag: v1.TransactionEventTag.BakerSetFinalizationRewardCommission,
                bakerId: unwrap(rewardComm.bakerId?.value),
                finalizationRewardCommission: trAmountFraction(amount),
                account,
            };
        }
        case undefined:
            throw Error('Failed translating BakerEvent, encountered undefined');
    }
}

function trDelegTarget(delegationTarget: v2.DelegationTarget | undefined): v1.EventDelegationTarget {
    const target = delegationTarget?.target;
    if (target?.oneofKind === 'baker') {
        return {
            delegateType: v1.DelegationTargetType.Baker,
            bakerId: Number(unwrap(target.baker.value)),
        };
    } else if (target?.oneofKind === 'passive') {
        return {
            delegateType: v1.DelegationTargetType.PassiveDelegation,
        };
    } else {
        throw 'Failed translating DelegationTarget, encountered undefined';
    }
}

function trDelegationEvent(delegationEvent: v2.DelegationEvent, account: AccountAddress.Type): v1.DelegationEvent {
    const event = delegationEvent.event;
    switch (event.oneofKind) {
        case 'delegationStakeIncreased': {
            const stakeIncr = event.delegationStakeIncreased;
            return {
                tag: v1.TransactionEventTag.DelegationStakeIncreased,
                delegatorId: unwrap(stakeIncr.delegatorId?.id?.value),
                newStake: CcdAmount.fromProto(unwrap(stakeIncr.newStake)),
                account,
            };
        }
        case 'delegationStakeDecreased': {
            const stakeDecr = event.delegationStakeDecreased;
            return {
                tag: v1.TransactionEventTag.DelegationStakeDecreased,
                delegatorId: unwrap(stakeDecr.delegatorId?.id?.value),
                newStake: CcdAmount.fromProto(unwrap(stakeDecr.newStake)),
                account,
            };
        }
        case 'delegationSetRestakeEarnings': {
            const restake = event.delegationSetRestakeEarnings;
            return {
                tag: v1.TransactionEventTag.DelegationSetRestakeEarnings,
                delegatorId: unwrap(restake.delegatorId?.id?.value),
                restakeEarnings: unwrap(restake.restakeEarnings),
                account,
            };
        }
        case 'delegationSetDelegationTarget': {
            const target = event.delegationSetDelegationTarget;
            return {
                tag: v1.TransactionEventTag.DelegationSetDelegationTarget,
                delegatorId: unwrap(target.delegatorId?.id?.value),
                delegationTarget: trDelegTarget(target.delegationTarget),
                account,
            };
        }
        case 'delegationAdded':
            return {
                tag: v1.TransactionEventTag.DelegationAdded,
                delegatorId: unwrap(event.delegationAdded.id?.value),
                account,
            };
        case 'delegationRemoved':
            return {
                tag: v1.TransactionEventTag.DelegationRemoved,
                delegatorId: unwrap(event.delegationRemoved.id?.value),
                account,
            };
        default:
            throw Error('Unrecognized event type. This should be impossible.');
    }
}

function trRejectReason(rejectReason: v2.RejectReason | undefined): v1.RejectReason {
    function simpleReason(tag: v1.SimpleRejectReasonTag): v1.RejectReason {
        return {
            tag: v1.RejectReasonTag[tag],
        };
    }

    const reason = unwrap(rejectReason?.reason);
    const Tag = v1.RejectReasonTag;
    switch (reason.oneofKind) {
        case 'moduleNotWf':
            return simpleReason(Tag.ModuleNotWF);
        case 'runtimeFailure':
            return simpleReason(Tag.RuntimeFailure);
        case 'serializationFailure':
            return simpleReason(Tag.SerializationFailure);
        case 'outOfEnergy':
            return simpleReason(Tag.OutOfEnergy);
        case 'invalidProof':
            return simpleReason(Tag.InvalidProof);
        case 'insufficientBalanceForBakerStake':
            return simpleReason(Tag.InsufficientBalanceForBakerStake);
        case 'stakeUnderMinimumThresholdForBaking':
            return simpleReason(Tag.StakeUnderMinimumThresholdForBaking);
        case 'bakerInCooldown':
            return simpleReason(Tag.BakerInCooldown);
        case 'nonExistentCredentialId':
            return simpleReason(Tag.NonExistentCredentialID);
        case 'keyIndexAlreadyInUse':
            return simpleReason(Tag.KeyIndexAlreadyInUse);
        case 'invalidAccountThreshold':
            return simpleReason(Tag.InvalidAccountThreshold);
        case 'invalidCredentialKeySignThreshold':
            return simpleReason(Tag.InvalidCredentialKeySignThreshold);
        case 'invalidEncryptedAmountTransferProof':
            return simpleReason(Tag.InvalidEncryptedAmountTransferProof);
        case 'invalidTransferToPublicProof':
            return simpleReason(Tag.InvalidTransferToPublicProof);
        case 'invalidIndexOnEncryptedTransfer':
            return simpleReason(Tag.InvalidIndexOnEncryptedTransfer);
        case 'zeroScheduledAmount':
            return simpleReason(Tag.ZeroScheduledAmount);
        case 'nonIncreasingSchedule':
            return simpleReason(Tag.NonIncreasingSchedule);
        case 'firstScheduledReleaseExpired':
            return simpleReason(Tag.FirstScheduledReleaseExpired);
        case 'invalidCredentials':
            return simpleReason(Tag.InvalidCredentials);
        case 'removeFirstCredential':
            return simpleReason(Tag.RemoveFirstCredential);
        case 'credentialHolderDidNotSign':
            return simpleReason(Tag.CredentialHolderDidNotSign);
        case 'notAllowedMultipleCredentials':
            return simpleReason(Tag.NotAllowedMultipleCredentials);
        case 'notAllowedToReceiveEncrypted':
            return simpleReason(Tag.NotAllowedToReceiveEncrypted);
        case 'notAllowedToHandleEncrypted':
            return simpleReason(Tag.NotAllowedToHandleEncrypted);
        case 'missingBakerAddParameters':
            return simpleReason(Tag.MissingBakerAddParameters);
        case 'finalizationRewardCommissionNotInRange':
            return simpleReason(Tag.FinalizationRewardCommissionNotInRange);
        case 'bakingRewardCommissionNotInRange':
            return simpleReason(Tag.BakingRewardCommissionNotInRange);
        case 'transactionFeeCommissionNotInRange':
            return simpleReason(Tag.TransactionFeeCommissionNotInRange);
        case 'alreadyADelegator':
            return simpleReason(Tag.AlreadyADelegator);
        case 'insufficientBalanceForDelegationStake':
            return simpleReason(Tag.InsufficientBalanceForDelegationStake);
        case 'missingDelegationAddParameters':
            return simpleReason(Tag.MissingDelegationAddParameters);
        case 'insufficientDelegationStake':
            return simpleReason(Tag.InsufficientDelegationStake);
        case 'delegatorInCooldown':
            return simpleReason(Tag.DelegatorInCooldown);
        case 'stakeOverMaximumThresholdForPool':
            return simpleReason(Tag.StakeOverMaximumThresholdForPool);
        case 'poolWouldBecomeOverDelegated':
            return simpleReason(Tag.PoolWouldBecomeOverDelegated);
        case 'poolClosed':
            return simpleReason(Tag.PoolClosed);
        case 'moduleHashAlreadyExists':
            return {
                tag: Tag.ModuleHashAlreadyExists,
                contents: unwrapValToHex(reason.moduleHashAlreadyExists),
            };
        case 'invalidAccountReference':
            return {
                tag: Tag.InvalidAccountReference,
                contents: unwrapToBase58(reason.invalidAccountReference),
            };
        case 'invalidInitMethod':
            return {
                tag: Tag.InvalidInitMethod,
                contents: {
                    moduleRef: ModuleReference.fromProto(unwrap(reason.invalidInitMethod.moduleRef)),
                    initName: InitName.fromProto(unwrap(reason.invalidInitMethod.initName)),
                },
            };
        case 'invalidReceiveMethod':
            return {
                tag: Tag.InvalidReceiveMethod,
                contents: {
                    moduleRef: ModuleReference.fromProto(unwrap(reason.invalidReceiveMethod.moduleRef)),
                    receiveName: ReceiveName.fromProto(unwrap(reason.invalidReceiveMethod.receiveName)),
                },
            };
        case 'invalidModuleReference':
            return {
                tag: Tag.InvalidModuleReference,
                contents: unwrapValToHex(reason.invalidModuleReference),
            };
        case 'invalidContractAddress':
            return {
                tag: Tag.InvalidContractAddress,
                contents: ContractAddress.fromProto(reason.invalidContractAddress),
            };
        case 'amountTooLarge':
            return {
                tag: Tag.AmountTooLarge,
                contents: {
                    address: trAddress(unwrap(reason.amountTooLarge.address)),
                    amount: CcdAmount.fromProto(unwrap(reason.amountTooLarge.amount)),
                },
            };
        case 'rejectedInit':
            return {
                tag: Tag.RejectedInit,
                rejectReason: reason.rejectedInit.rejectReason,
            };
        case 'rejectedReceive':
            return {
                tag: Tag.RejectedReceive,
                contractAddress: ContractAddress.fromProto(unwrap(reason.rejectedReceive.contractAddress)),
                receiveName: ReceiveName.fromProto(unwrap(reason.rejectedReceive.receiveName)),
                rejectReason: unwrap(reason.rejectedReceive.rejectReason),
                parameter: Parameter.fromProto(unwrap(reason.rejectedReceive.parameter)),
            };
        case 'alreadyABaker':
            return {
                tag: Tag.AlreadyABaker,
                contents: unwrap(reason.alreadyABaker.value),
            };
        case 'notABaker':
            return {
                tag: Tag.NotABaker,
                contents: unwrapToBase58(reason.notABaker),
            };
        case 'duplicateAggregationKey':
            return {
                tag: Tag.DuplicateAggregationKey,
                contents: unwrapValToHex(reason.duplicateAggregationKey),
            };
        case 'encryptedAmountSelfTransfer':
            return {
                tag: Tag.EncryptedAmountSelfTransfer,
                contents: unwrapToBase58(reason.encryptedAmountSelfTransfer),
            };
        case 'scheduledSelfTransfer':
            return {
                tag: Tag.ScheduledSelfTransfer,
                contents: unwrapToBase58(reason.scheduledSelfTransfer),
            };
        case 'duplicateCredIds':
            return {
                tag: Tag.DuplicateCredIDs,
                contents: reason.duplicateCredIds.ids.map(unwrapValToHex),
            };
        case 'nonExistentCredIds':
            return {
                tag: Tag.NonExistentCredIDs,
                contents: reason.nonExistentCredIds.ids.map(unwrapValToHex),
            };
        case 'notADelegator':
            return {
                tag: Tag.NotADelegator,
                contents: unwrapToBase58(reason.notADelegator),
            };
        case 'delegationTargetNotABaker':
            return {
                tag: Tag.DelegationTargetNotABaker,
                contents: unwrap(reason.delegationTargetNotABaker.value),
            };
        case undefined:
            throw Error('Failed translating RejectReason, encountered undefined value');
    }
}

function trMintRate(mintRate: v2.MintRate | undefined): number {
    return unwrap(mintRate?.mantissa) * 10 ** (-1 * unwrap(mintRate?.exponent));
}

function trProtocolUpdate(update: v2.ProtocolUpdate): v1.ProtocolUpdate {
    return {
        updateType: v1.UpdateType.Protocol,
        update: {
            message: update.message,
            specificationHash: unwrapValToHex(update.specificationHash),
            specificationUrl: update.specificationUrl,
            specificationAuxiliaryData: unwrapToHex(update.specificationAuxiliaryData),
        },
    };
}
function trElectionDifficultyUpdate(elecDiff: v2.ElectionDifficulty): v1.ElectionDifficultyUpdate {
    return {
        updateType: v1.UpdateType.ElectionDifficulty,
        update: {
            electionDifficulty: trAmountFraction(elecDiff.value),
        },
    };
}
function trEuroPerEnergyUpdate(exchangeRate: v2.ExchangeRate): v1.EuroPerEnergyUpdate {
    return {
        updateType: v1.UpdateType.EuroPerEnergy,
        update: unwrap(exchangeRate.value),
    };
}
function trMicroCcdPerEuroUpdate(exchangeRate: v2.ExchangeRate): v1.MicroGtuPerEuroUpdate {
    return {
        updateType: v1.UpdateType.MicroGtuPerEuro,
        update: unwrap(exchangeRate.value),
    };
}
function trFoundationAccountUpdate(account: v2.AccountAddress): v1.FoundationAccountUpdate {
    return {
        updateType: v1.UpdateType.FoundationAccount,
        update: {
            address: unwrapToBase58(account),
        },
    };
}

function trTransactionFeeDistributionUpdate(
    transFeeDist: v2.TransactionFeeDistribution
): v1.TransactionFeeDistributionUpdate {
    return {
        updateType: v1.UpdateType.TransactionFeeDistribution,
        update: {
            baker: trAmountFraction(transFeeDist.baker),
            gasAccount: trAmountFraction(transFeeDist.gasAccount),
        },
    };
}

function trGasRewardsUpdate(gasRewards: v2.GasRewards): v1.GasRewardsV0Update {
    return {
        updateType: v1.UpdateType.GasRewards,
        update: {
            version: 0,
            baker: trAmountFraction(gasRewards.baker),
            accountCreation: trAmountFraction(gasRewards.accountCreation),
            chainUpdate: trAmountFraction(gasRewards.accountCreation),
            finalizationProof: trAmountFraction(gasRewards.finalizationProof),
        },
    };
}

function trGasRewardsCpv2Update(gasRewards: v2.GasRewardsCpv2): v1.GasRewardsV1Update {
    return {
        updateType: v1.UpdateType.GasRewardsCpv2,
        update: {
            version: 1,
            baker: trAmountFraction(gasRewards.baker),
            accountCreation: trAmountFraction(gasRewards.accountCreation),
            chainUpdate: trAmountFraction(gasRewards.accountCreation),
        },
    };
}

function trBakerStakeThresholdUpdate(bakerStakeThreshold: v2.BakerStakeThreshold): v1.BakerStakeThresholdUpdate {
    return {
        updateType: v1.UpdateType.BakerStakeThreshold,
        update: {
            threshold: unwrap(bakerStakeThreshold.bakerStakeThreshold?.value),
        },
    };
}

function trPoolParametersCpv1Update(poolParams: v2.PoolParametersCpv1): v1.PoolParametersUpdate {
    return {
        updateType: v1.UpdateType.PoolParameters,
        update: {
            passiveCommissions: {
                transactionCommission: trAmountFraction(poolParams.passiveTransactionCommission),
                bakingCommission: trAmountFraction(poolParams.passiveBakingCommission),
                finalizationCommission: trAmountFraction(poolParams.passiveFinalizationCommission),
            },
            commissionBounds: {
                transactionFeeCommission: trCommissionRange(poolParams.commissionBounds?.transaction),
                bakingRewardCommission: trCommissionRange(poolParams.commissionBounds?.baking),
                finalizationRewardCommission: trCommissionRange(poolParams.commissionBounds?.finalization),
            },
            minimumEquityCapital: CcdAmount.fromProto(unwrap(poolParams.minimumEquityCapital)),
            capitalBound: trAmountFraction(poolParams.capitalBound?.value),
            leverageBound: unwrap(poolParams.leverageBound?.value),
        },
    };
}

function trAddAnonymityRevokerUpdate(ar: v2.ArInfo): v1.AddAnonymityRevokerUpdate {
    return {
        updateType: v1.UpdateType.AddAnonymityRevoker,
        update: arInfo(ar),
    };
}
function trAddIdentityProviderUpdate(ip: v2.IpInfo): v1.AddIdentityProviderUpdate {
    return {
        updateType: v1.UpdateType.AddIdentityProvider,
        update: ipInfo(ip),
    };
}

function trCooldownParametersCpv1Update(cooldownParams: v2.CooldownParametersCpv1): v1.CooldownParametersUpdate {
    return {
        updateType: v1.UpdateType.CooldownParameters,
        update: {
            poolOwnerCooldown: unwrap(cooldownParams.poolOwnerCooldown?.value),
            delegatorCooldown: unwrap(cooldownParams.delegatorCooldown?.value),
        },
    };
}

function trTimeParametersCpv1Update(timeParams: v2.TimeParametersCpv1): v1.TimeParametersUpdate {
    return {
        updateType: v1.UpdateType.TimeParameters,
        update: {
            rewardPeriodLength: unwrap(timeParams.rewardPeriodLength?.value?.value),
            mintRatePerPayday: unwrap(timeParams.mintPerPayday),
        },
    };
}

function trTimeoutParameteresUpdate(timeout: v2.TimeoutParameters): v1.TimeoutParametersUpdate {
    return {
        updateType: v1.UpdateType.TimeoutParameters,
        update: {
            timeoutBase: Duration.fromProto(unwrap(timeout.timeoutBase)),
            timeoutDecrease: unwrap(timeout.timeoutDecrease),
            timeoutIncrease: unwrap(timeout.timeoutIncrease),
        },
    };
}

function trMinBlockTimeUpdate(duration: v2.Duration): v1.MinBlockTimeUpdate {
    return {
        updateType: v1.UpdateType.MinBlockTime,
        update: Duration.fromProto(duration),
    };
}

function trBlockEnergyLimitUpdate(energy: v2.Energy): v1.BlockEnergyLimitUpdate {
    return {
        updateType: v1.UpdateType.BlockEnergyLimit,
        update: Energy.fromProto(energy),
    };
}

function trFinalizationCommitteeParametersUpdate(
    params: v2.FinalizationCommitteeParameters
): v1.FinalizationCommitteeParametersUpdate {
    return {
        updateType: v1.UpdateType.FinalizationCommitteeParameters,
        update: {
            finalizerRelativeStakeThreshold: trAmountFraction(params.finalizerRelativeStakeThreshold),
            minimumFinalizers: params.minimumFinalizers,
            maximumFinalizers: params.maximumFinalizers,
        },
    };
}

function trMintDistributionCpv0Update(mintDist: v2.MintDistributionCpv0): v1.MintDistributionUpdate {
    return {
        updateType: v1.UpdateType.MintDistribution,
        update: {
            version: 0,
            bakingReward: trAmountFraction(mintDist.bakingReward),
            finalizationReward: trAmountFraction(mintDist.finalizationReward),
            mintPerSlot: trMintRate(mintDist.mintPerSlot),
        },
    };
}

function trMintDistributionCpv1Update(mintDist: v2.MintDistributionCpv1): v1.MintDistributionUpdate {
    return {
        updateType: v1.UpdateType.MintDistribution,
        update: {
            version: 1,
            bakingReward: trAmountFraction(mintDist.bakingReward),
            finalizationReward: trAmountFraction(mintDist.finalizationReward),
        },
    };
}

export function pendingUpdate(pendingUpdate: v2.PendingUpdate): v1.PendingUpdate {
    return {
        effectiveTime: Timestamp.fromProto(unwrap(pendingUpdate.effectiveTime)),
        effect: trPendingUpdateEffect(pendingUpdate),
    };
}

export function trPendingUpdateEffect(pendingUpdate: v2.PendingUpdate): v1.PendingUpdateEffect {
    const effect = pendingUpdate.effect;
    switch (effect.oneofKind) {
        case 'protocol':
            return trProtocolUpdate(effect.protocol);
        case 'electionDifficulty':
            return trElectionDifficultyUpdate(effect.electionDifficulty);
        case 'euroPerEnergy':
            return trEuroPerEnergyUpdate(effect.euroPerEnergy);
        case 'microCcdPerEuro':
            return trMicroCcdPerEuroUpdate(effect.microCcdPerEuro);
        case 'foundationAccount':
            return trFoundationAccountUpdate(effect.foundationAccount);
        case 'transactionFeeDistribution':
            return trTransactionFeeDistributionUpdate(effect.transactionFeeDistribution);
        case 'gasRewards':
            return trGasRewardsUpdate(effect.gasRewards);
        case 'poolParametersCpv0':
            return trBakerStakeThresholdUpdate(effect.poolParametersCpv0);
        case 'poolParametersCpv1':
            return trPoolParametersCpv1Update(effect.poolParametersCpv1);
        case 'addAnonymityRevoker':
            return trAddAnonymityRevokerUpdate(effect.addAnonymityRevoker);
        case 'addIdentityProvider':
            return trAddIdentityProviderUpdate(effect.addIdentityProvider);
        case 'cooldownParameters':
            return trCooldownParametersCpv1Update(effect.cooldownParameters);
        case 'timeParameters':
            return trTimeParametersCpv1Update(effect.timeParameters);
        case 'mintDistributionCpv0':
            return trMintDistributionCpv0Update(effect.mintDistributionCpv0);
        case 'mintDistributionCpv1':
            return trMintDistributionCpv1Update(effect.mintDistributionCpv1);
        case 'gasRewardsCpv2':
            return trGasRewardsCpv2Update(effect.gasRewardsCpv2);
        case 'timeoutParameters':
            return trTimeoutParameteresUpdate(effect.timeoutParameters);
        case 'minBlockTime':
            return trMinBlockTimeUpdate(effect.minBlockTime);
        case 'blockEnergyLimit':
            return trBlockEnergyLimitUpdate(effect.blockEnergyLimit);
        case 'finalizationCommitteeParameters':
            return trFinalizationCommitteeParametersUpdate(effect.finalizationCommitteeParameters);
        case 'rootKeys':
            return {
                updateType: v1.UpdateType.HigherLevelKeyUpdate,
                update: {
                    typeOfUpdate: v1.HigherLevelKeyUpdateType.RootKeysUpdate,
                    updateKeys: effect.rootKeys.keys.map(trUpdatePublicKey),
                    threshold: unwrap(effect.rootKeys.threshold?.value),
                },
            };
        case 'level1Keys':
            return {
                updateType: v1.UpdateType.HigherLevelKeyUpdate,
                update: {
                    typeOfUpdate: v1.HigherLevelKeyUpdateType.Level1KeysUpdate,
                    updateKeys: effect.level1Keys.keys.map(trUpdatePublicKey),
                    threshold: unwrap(effect.level1Keys.threshold?.value),
                },
            };
        case 'level2KeysCpv0':
            return {
                updateType: v1.UpdateType.AuthorizationKeysUpdate,
                update: {
                    typeOfUpdate: v1.AuthorizationKeysUpdateType.Level2KeysUpdate,
                    updatePayload: trAuthorizationsV0(effect.level2KeysCpv0),
                },
            };
        case 'level2KeysCpv1':
            return {
                updateType: v1.UpdateType.AuthorizationKeysUpdate,
                update: {
                    typeOfUpdate: v1.AuthorizationKeysUpdateType.Level2KeysUpdateV1,
                    updatePayload: trAuthorizationsV1(effect.level2KeysCpv1),
                },
            };
        case undefined:
            throw Error('Unexpected missing pending update');
        default:
            throw Error(`Unsupported update: ${effect}`);
    }
}

function trUpdatePayload(updatePayload: v2.UpdatePayload | undefined): v1.UpdateInstructionPayload {
    const payload = updatePayload?.payload;
    switch (payload?.oneofKind) {
        case 'protocolUpdate':
            return trProtocolUpdate(payload.protocolUpdate);
        case 'electionDifficultyUpdate':
            return trElectionDifficultyUpdate(payload.electionDifficultyUpdate);
        case 'euroPerEnergyUpdate':
            return trEuroPerEnergyUpdate(payload.euroPerEnergyUpdate);
        case 'microCcdPerEuroUpdate':
            return trMicroCcdPerEuroUpdate(payload.microCcdPerEuroUpdate);
        case 'foundationAccountUpdate':
            return trFoundationAccountUpdate(payload.foundationAccountUpdate);
        case 'mintDistributionUpdate':
            return trMintDistributionCpv1Update(payload.mintDistributionUpdate);
        case 'transactionFeeDistributionUpdate':
            return trTransactionFeeDistributionUpdate(payload.transactionFeeDistributionUpdate);
        case 'gasRewardsUpdate':
            return trGasRewardsUpdate(payload.gasRewardsUpdate);
        case 'bakerStakeThresholdUpdate':
            return trBakerStakeThresholdUpdate(payload.bakerStakeThresholdUpdate);
        case 'addAnonymityRevokerUpdate':
            return trAddAnonymityRevokerUpdate(payload.addAnonymityRevokerUpdate);
        case 'addIdentityProviderUpdate':
            return trAddIdentityProviderUpdate(payload.addIdentityProviderUpdate);
        case 'cooldownParametersCpv1Update':
            return trCooldownParametersCpv1Update(payload.cooldownParametersCpv1Update);
        case 'poolParametersCpv1Update':
            return trPoolParametersCpv1Update(payload.poolParametersCpv1Update);
        case 'timeParametersCpv1Update':
            return trTimeParametersCpv1Update(payload.timeParametersCpv1Update);
        case 'mintDistributionCpv1Update':
            return trMintDistributionCpv1Update(payload.mintDistributionCpv1Update);
        case 'gasRewardsCpv2Update':
            return trGasRewardsCpv2Update(payload.gasRewardsCpv2Update);
        case 'timeoutParametersUpdate':
            return trTimeoutParameteresUpdate(payload.timeoutParametersUpdate);
        case 'minBlockTimeUpdate':
            return trMinBlockTimeUpdate(payload.minBlockTimeUpdate);
        case 'blockEnergyLimitUpdate':
            return trBlockEnergyLimitUpdate(payload.blockEnergyLimitUpdate);
        case 'finalizationCommitteeParametersUpdate':
            return trFinalizationCommitteeParametersUpdate(payload.finalizationCommitteeParametersUpdate);
        case 'rootUpdate': {
            const rootUpdate = payload.rootUpdate;
            const keyUpdate = trKeyUpdate(rootUpdate);
            return {
                updateType: v1.UpdateType.Root,
                update: keyUpdate,
            };
        }
        case 'level1Update': {
            const lvl1Update = payload.level1Update;
            const keyUpdate = trKeyUpdate(lvl1Update);
            return {
                updateType: v1.UpdateType.Level1,
                update: keyUpdate,
            };
        }
        case undefined:
            throw new Error('Unexpected missing update payload');
        default:
            throw Error(`Unsupported update payload type: ${payload}`);
    }
}

function trCommissionRange(range: v2.InclusiveRangeAmountFraction | undefined): v1.InclusiveRange<number> {
    return {
        min: trAmountFraction(range?.min),
        max: trAmountFraction(range?.max),
    };
}
function trUpdatePublicKey(key: v2.UpdatePublicKey): v1.VerifyKey {
    return {
        schemeId: 'Ed25519',
        verifyKey: unwrapValToHex(key),
    };
}

function trAccessStructure(auths: v2.AccessStructure | undefined): v1.Authorization {
    return {
        authorizedKeys: unwrap(auths).accessPublicKeys.map((key) => key.value),
        threshold: unwrap(auths?.accessThreshold?.value),
    };
}

function trKeyUpdate(keyUpdate: v2.RootUpdate | v2.Level1Update): v1.KeyUpdate {
    switch (keyUpdate.updateType.oneofKind) {
        case 'rootKeysUpdate': {
            const update = keyUpdate.updateType.rootKeysUpdate;
            return {
                typeOfUpdate: v1.HigherLevelKeyUpdateType.RootKeysUpdate,
                updateKeys: update.keys.map(trUpdatePublicKey),
                threshold: unwrap(update.threshold?.value),
            };
        }
        case 'level1KeysUpdate': {
            const update = keyUpdate.updateType.level1KeysUpdate;
            return {
                typeOfUpdate: v1.HigherLevelKeyUpdateType.Level1KeysUpdate,
                updateKeys: update.keys.map(trUpdatePublicKey),
                threshold: unwrap(update.threshold?.value),
            };
        }
        case 'level2KeysUpdateV0': {
            const update = keyUpdate.updateType.level2KeysUpdateV0;
            return {
                typeOfUpdate: v1.AuthorizationKeysUpdateType.Level2KeysUpdate,
                updatePayload: trAuthorizationsV0(update),
            };
        }
        case 'level2KeysUpdateV1': {
            const update = keyUpdate.updateType.level2KeysUpdateV1;
            const v0 = unwrap(update.v0);
            return {
                typeOfUpdate: v1.AuthorizationKeysUpdateType.Level2KeysUpdateV1,
                updatePayload: {
                    ...trAuthorizationsV0(v0),
                    version: 1,
                    cooldownParameters: trAccessStructure(update.parameterCooldown),
                    timeParameters: trAccessStructure(update.parameterTime),
                },
            };
        }
        case undefined:
            throw new Error('Unexpected missing update type');
    }
}

function trAuthorizationsV0(auths: v2.AuthorizationsV0): v1.AuthorizationsV0 {
    return {
        version: 0,
        keys: auths.keys.map(trUpdatePublicKey),
        addIdentityProvider: trAccessStructure(auths.addIdentityProvider),
        addAnonymityRevoker: trAccessStructure(auths.addAnonymityRevoker),
        emergency: trAccessStructure(auths.emergency),
        electionDifficulty: trAccessStructure(auths.parameterConsensus),
        euroPerEnergy: trAccessStructure(auths.parameterEuroPerEnergy),
        foundationAccount: trAccessStructure(auths.parameterFoundationAccount),
        microGTUPerEuro: trAccessStructure(auths.parameterMicroCCDPerEuro),
        paramGASRewards: trAccessStructure(auths.parameterGasRewards),
        mintDistribution: trAccessStructure(auths.parameterMintDistribution),
        transactionFeeDistribution: trAccessStructure(auths.parameterTransactionFeeDistribution),
        poolParameters: trAccessStructure(auths.poolParameters),
        protocol: trAccessStructure(auths.protocol),
    };
}

function trAuthorizationsV1(auths: v2.AuthorizationsV1): v1.AuthorizationsV1 {
    return {
        ...trAuthorizationsV0(unwrap(auths.v0)),
        version: 1,
        cooldownParameters: trAccessStructure(auths.parameterCooldown),
        timeParameters: trAccessStructure(auths.parameterTime),
    };
}

function trMemoEvent(memo: v2.Memo): v1.MemoEvent {
    return {
        tag: v1.TransactionEventTag.TransferMemo,
        memo: unwrapValToHex(memo),
    };
}

function trTransactionType(type?: v2.TransactionType): v1.TransactionKindString | undefined {
    switch (type) {
        case v2.TransactionType.DEPLOY_MODULE:
            return v1.TransactionKindString.DeployModule;
        case v2.TransactionType.INIT_CONTRACT:
            return v1.TransactionKindString.InitContract;
        case v2.TransactionType.UPDATE:
            return v1.TransactionKindString.Update;
        case v2.TransactionType.TRANSFER:
            return v1.TransactionKindString.Transfer;
        case v2.TransactionType.ADD_BAKER:
            return v1.TransactionKindString.AddBaker;
        case v2.TransactionType.REMOVE_BAKER:
            return v1.TransactionKindString.RemoveBaker;
        case v2.TransactionType.UPDATE_BAKER_STAKE:
            return v1.TransactionKindString.UpdateBakerStake;
        case v2.TransactionType.UPDATE_BAKER_RESTAKE_EARNINGS:
            return v1.TransactionKindString.UpdateBakerRestakeEarnings;
        case v2.TransactionType.UPDATE_BAKER_KEYS:
            return v1.TransactionKindString.UpdateBakerKeys;
        case v2.TransactionType.UPDATE_CREDENTIAL_KEYS:
            return v1.TransactionKindString.UpdateCredentialKeys;
        case v2.TransactionType.ENCRYPTED_AMOUNT_TRANSFER:
            return v1.TransactionKindString.EncryptedAmountTransfer;
        case v2.TransactionType.TRANSFER_TO_ENCRYPTED:
            return v1.TransactionKindString.TransferToEncrypted;
        case v2.TransactionType.TRANSFER_TO_PUBLIC:
            return v1.TransactionKindString.TransferToPublic;
        case v2.TransactionType.TRANSFER_WITH_SCHEDULE:
            return v1.TransactionKindString.TransferWithSchedule;
        case v2.TransactionType.UPDATE_CREDENTIALS:
            return v1.TransactionKindString.UpdateCredentials;
        case v2.TransactionType.REGISTER_DATA:
            return v1.TransactionKindString.RegisterData;
        case v2.TransactionType.TRANSFER_WITH_MEMO:
            return v1.TransactionKindString.TransferWithMemo;
        case v2.TransactionType.ENCRYPTED_AMOUNT_TRANSFER_WITH_MEMO:
            return v1.TransactionKindString.EncryptedAmountTransferWithMemo;
        case v2.TransactionType.TRANSFER_WITH_SCHEDULE_AND_MEMO:
            return v1.TransactionKindString.TransferWithScheduleAndMemo;
        case v2.TransactionType.CONFIGURE_BAKER:
            return v1.TransactionKindString.ConfigureBaker;
        case v2.TransactionType.CONFIGURE_DELEGATION:
            return v1.TransactionKindString.ConfigureDelegation;
        case undefined:
            return undefined;
    }
}

function trAccountTransactionSummary(
    details: v2.AccountTransactionDetails,
    baseBlockItemSummary: v1.BaseBlockItemSummary
): v1.AccountTransactionSummary {
    const base: v1.BaseAccountTransactionSummary = {
        ...baseBlockItemSummary,
        type: v1.TransactionSummaryType.AccountTransaction,
        cost: unwrap(details.cost?.value),
        sender: AccountAddress.fromProto(unwrap(details.sender)),
    };

    const effect = unwrap(details.effects?.effect);
    switch (effect.oneofKind) {
        case 'none':
            return {
                ...base,
                transactionType: v1.TransactionKindString.Failed,
                failedTransactionType: trTransactionType(effect.none.transactionType),
                rejectReason: trRejectReason(effect.none.rejectReason),
            };
        case 'moduleDeployed': {
            const event: v1.ModuleDeployedEvent = {
                tag: v1.TransactionEventTag.ModuleDeployed,
                contents: unwrapValToHex(effect.moduleDeployed),
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.DeployModule,
                moduleDeployed: event,
            };
        }
        case 'contractInitialized': {
            const contractInit = effect.contractInitialized;
            const event: v1.ContractInitializedEvent = {
                tag: v1.TransactionEventTag.ContractInitialized,
                address: ContractAddress.fromProto(unwrap(contractInit.address)),
                amount: CcdAmount.fromProto(unwrap(contractInit.amount)),
                initName: InitName.fromProto(unwrap(contractInit.initName)),
                events: unwrap(contractInit.events.map(unwrapValToHex)),
                contractVersion: unwrap(contractInit.contractVersion),
                ref: unwrapValToHex(contractInit.originRef),
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.InitContract,
                contractInitialized: event,
            };
        }
        case 'contractUpdateIssued':
            return {
                ...base,
                transactionType: v1.TransactionKindString.Update,
                events: effect.contractUpdateIssued.effects.map(trContractTraceElement),
            };
        case 'accountTransfer': {
            const transfer: v1.AccountTransferredEvent = {
                tag: v1.TransactionEventTag.Transferred,
                amount: CcdAmount.fromProto(unwrap(effect.accountTransfer.amount)),
                to: AccountAddress.fromProto(unwrap(effect.accountTransfer.receiver)),
            };
            if (effect.accountTransfer.memo) {
                return {
                    ...base,
                    transactionType: v1.TransactionKindString.TransferWithMemo,
                    transfer,
                    memo: trMemoEvent(effect.accountTransfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: v1.TransactionKindString.Transfer,
                    transfer,
                };
            }
        }
        case 'bakerAdded':
            return {
                ...base,
                transactionType: v1.TransactionKindString.AddBaker,
                bakerAdded: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as v1.BakerAddedEvent,
            };
        case 'bakerRemoved':
            return {
                ...base,
                transactionType: v1.TransactionKindString.RemoveBaker,
                bakerRemoved: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as v1.BakerRemovedEvent,
            };
        case 'bakerRestakeEarningsUpdated':
            return {
                ...base,
                transactionType: v1.TransactionKindString.UpdateBakerRestakeEarnings,
                bakerRestakeEarningsUpdated: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as v1.BakerSetRestakeEarningsEvent,
            };
        case 'bakerKeysUpdated':
            return {
                ...base,
                transactionType: v1.TransactionKindString.UpdateBakerKeys,
                bakerKeysUpdated: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as v1.BakerKeysUpdatedEvent,
            };
        case 'bakerStakeUpdated': {
            const increased = effect.bakerStakeUpdated.update?.increased;
            const update = effect.bakerStakeUpdated.update;
            const event: v1.BakerStakeChangedEvent = {
                tag: increased
                    ? v1.TransactionEventTag.BakerStakeIncreased
                    : v1.TransactionEventTag.BakerStakeDecreased,
                bakerId: unwrap(update?.bakerId?.value),
                newStake: CcdAmount.fromProto(unwrap(update?.newStake)),
                account: base.sender,
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.UpdateBakerStake,
                bakerStakeChanged: event,
            };
        }
        case 'encryptedAmountTransferred': {
            const transfer = effect.encryptedAmountTransferred;
            const removed: v1.EncryptedAmountsRemovedEvent = {
                tag: v1.TransactionEventTag.EncryptedAmountsRemoved,
                inputAmount: unwrapValToHex(transfer.removed?.inputAmount),
                newAmount: unwrapValToHex(transfer.removed?.newAmount),
                upToIndex: Number(unwrap(transfer.removed?.upToIndex)),
                account: base.sender,
            };
            const added: v1.NewEncryptedAmountEvent = {
                tag: v1.TransactionEventTag.NewEncryptedAmount,
                account: AccountAddress.fromProto(unwrap(transfer.added?.receiver)),
                newIndex: Number(unwrap(transfer.added?.newIndex)),
                encryptedAmount: unwrapValToHex(transfer.added?.encryptedAmount),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType: v1.TransactionKindString.EncryptedAmountTransferWithMemo,
                    removed,
                    added,
                    memo: trMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: v1.TransactionKindString.EncryptedAmountTransfer,
                    removed,
                    added,
                };
            }
        }
        case 'transferredToEncrypted': {
            const transfer = effect.transferredToEncrypted;
            const added: v1.EncryptedSelfAmountAddedEvent = {
                tag: v1.TransactionEventTag.EncryptedSelfAmountAdded,
                account: AccountAddress.fromProto(unwrap(transfer.account)),
                amount: CcdAmount.fromProto(unwrap(transfer.amount)),
                newAmount: unwrapValToHex(transfer.newAmount),
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.TransferToEncrypted,
                added,
            };
        }
        case 'transferredToPublic': {
            const transfer = effect.transferredToPublic;
            const removed: v1.EncryptedAmountsRemovedEvent = {
                tag: v1.TransactionEventTag.EncryptedAmountsRemoved,
                account: base.sender,
                inputAmount: unwrapValToHex(transfer.removed?.inputAmount),
                newAmount: unwrapValToHex(transfer.removed?.newAmount),
                upToIndex: Number(unwrap(transfer.removed?.upToIndex)),
            };
            const added: v1.AmountAddedByDecryptionEvent = {
                tag: v1.TransactionEventTag.AmountAddedByDecryption,
                account: base.sender,
                amount: CcdAmount.fromProto(unwrap(transfer.amount)),
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.TransferToPublic,
                removed,
                added,
            };
        }
        case 'transferredWithSchedule': {
            const transfer = effect.transferredWithSchedule;
            const event: v1.TransferredWithScheduleEvent = {
                tag: v1.TransactionEventTag.TransferredWithSchedule,
                to: AccountAddress.fromProto(unwrap(transfer.receiver)),
                amount: transfer.amount.map(trNewRelease),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType: v1.TransactionKindString.TransferWithScheduleAndMemo,
                    transfer: event,
                    memo: trMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: v1.TransactionKindString.TransferWithSchedule,
                    event,
                };
            }
        }
        case 'credentialKeysUpdated': {
            const event: v1.CredentialKeysUpdatedEvent = {
                tag: v1.TransactionEventTag.CredentialKeysUpdated,
                credId: unwrapValToHex(effect.credentialKeysUpdated),
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.UpdateCredentialKeys,
                keysUpdated: event,
            };
        }
        case 'credentialsUpdated': {
            const update = effect.credentialsUpdated;
            const event: v1.CredentialsUpdatedEvent = {
                tag: v1.TransactionEventTag.CredentialsUpdated,
                newCredIds: update.newCredIds.map(unwrapValToHex),
                removedCredIds: update.removedCredIds.map(unwrapValToHex),
                newThreshold: unwrap(update.newThreshold?.value),
                account: base.sender,
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.UpdateCredentials,
                credentialsUpdated: event,
            };
        }
        case 'dataRegistered': {
            const event: v1.DataRegisteredEvent = {
                tag: v1.TransactionEventTag.DataRegistered,
                data: unwrapValToHex(effect.dataRegistered),
            };
            return {
                ...base,
                transactionType: v1.TransactionKindString.RegisterData,
                dataRegistered: event,
            };
        }
        case 'bakerConfigured':
            return {
                ...base,
                transactionType: v1.TransactionKindString.ConfigureBaker,
                events: effect.bakerConfigured.events.map((event) => trBakerEvent(event, base.sender)),
            };
        case 'delegationConfigured':
            return {
                ...base,
                transactionType: v1.TransactionKindString.ConfigureDelegation,
                events: effect.delegationConfigured.events.map((x) => trDelegationEvent(x, base.sender)),
            };
        case undefined:
            throw Error('Failed translating AccountTransactionEffects, encountered undefined value');
    }
}

export function blockItemSummary(summary: v2.BlockItemSummary): v1.BlockItemSummary {
    const base = {
        index: unwrap(summary.index?.value),
        energyCost: Energy.fromProto(unwrap(summary.energyCost)),
        hash: TransactionHash.fromProto(unwrap(summary.hash)),
    };
    if (summary.details.oneofKind === 'accountTransaction') {
        return trAccountTransactionSummary(summary.details.accountTransaction, base);
    } else if (summary.details.oneofKind === 'accountCreation') {
        return {
            type: v1.TransactionSummaryType.AccountCreation,
            ...base,
            credentialType:
                summary.details.accountCreation.credentialType === v2.CredentialType.INITIAL ? 'initial' : 'normal',
            address: AccountAddress.fromProto(unwrap(summary.details.accountCreation.address)),
            regId: unwrapValToHex(summary.details.accountCreation.regId),
        };
    } else if (summary.details.oneofKind === 'update') {
        return {
            type: v1.TransactionSummaryType.UpdateTransaction,
            ...base,
            effectiveTime: unwrap(summary.details.update.effectiveTime?.value),
            payload: trUpdatePayload(summary.details.update.payload),
        };
    } else {
        throw Error('Invalid BlockItemSummary encountered!');
    }
}

function trBlockItemSummaryInBlock(summary: v2.BlockItemSummaryInBlock): v1.BlockItemSummaryInBlock {
    return {
        blockHash: BlockHash.fromProto(unwrap(summary.blockHash)),
        summary: blockItemSummary(unwrap(summary.outcome)),
    };
}

export function blockItemStatus(itemStatus: v2.BlockItemStatus): v1.BlockItemStatus {
    switch (itemStatus.status.oneofKind) {
        case 'received':
            return {
                status: v1.TransactionStatusEnum.Received,
            };
        case 'committed':
            return {
                status: v1.TransactionStatusEnum.Committed,
                outcomes: itemStatus.status.committed.outcomes.map(trBlockItemSummaryInBlock),
            };
        case 'finalized':
            return {
                status: v1.TransactionStatusEnum.Finalized,
                outcome: trBlockItemSummaryInBlock(unwrap(itemStatus.status.finalized.outcome)),
            };
        default:
            throw Error('BlockItemStatus was undefined!');
    }
}

export function invokeInstanceResponse(invokeResponse: v2.InvokeInstanceResponse): v1.InvokeContractResult {
    switch (invokeResponse.result.oneofKind) {
        case 'failure':
            return {
                tag: 'failure',
                usedEnergy: Energy.fromProto(unwrap(invokeResponse.result.failure.usedEnergy)),
                reason: trRejectReason(invokeResponse.result.failure.reason),
                returnValue:
                    invokeResponse.result.failure.returnValue === undefined
                        ? undefined
                        : ReturnValue.fromBuffer(invokeResponse.result.failure.returnValue),
            };
        case 'success': {
            const result = invokeResponse.result.success;
            return {
                tag: 'success',
                usedEnergy: Energy.fromProto(unwrap(result.usedEnergy)),
                returnValue: result.returnValue === undefined ? undefined : ReturnValue.fromBuffer(result.returnValue),
                events: result.effects.map(trContractTraceElement),
            };
        }
        default:
            throw Error('BlockItemStatus was undefined!');
    }
}

function trInstanceInfoCommon(info: v2.InstanceInfo_V0 | v2.InstanceInfo_V1): Omit<v1.InstanceInfoCommon, 'version'> {
    return {
        amount: CcdAmount.fromProto(unwrap(info.amount)),
        sourceModule: ModuleReference.fromProto(unwrap(info.sourceModule)),
        owner: AccountAddress.fromBuffer(unwrap(info.owner?.value)),
        methods: info.methods.map(ReceiveName.fromProto),
        name: InitName.fromProto(unwrap(info.name)),
    };
}

export function instanceInfo(instanceInfo: v2.InstanceInfo): v1.InstanceInfo {
    switch (instanceInfo.version.oneofKind) {
        case 'v0':
            return {
                ...trInstanceInfoCommon(instanceInfo.version.v0),
                version: 0,
                model: Buffer.from(unwrap(instanceInfo.version.v0.model?.value)),
            };
        case 'v1':
            return {
                ...trInstanceInfoCommon(instanceInfo.version.v1),
                version: 1,
            };

        default:
            throw Error('InstanceInfo was undefined');
    }
}

export function commonBlockInfo(blockInfo: v2.ArrivedBlockInfo | v2.FinalizedBlockInfo): v1.CommonBlockInfo {
    return {
        hash: BlockHash.fromProto(unwrap(blockInfo.hash)),
        height: unwrap(blockInfo.height?.value),
    };
}

export function instanceStateKVPair(state: v2.InstanceStateKVPair): v1.InstanceStateKVPair {
    return {
        key: unwrapToHex(state.key),
        value: unwrapToHex(state.value),
    };
}

export function ipInfo(ip: v2.IpInfo): v1.IpInfo {
    return {
        ipIdentity: unwrap(ip.identity?.value),
        ipDescription: unwrap(ip.description),
        ipVerifyKey: unwrapValToHex(ip.verifyKey),
        ipCdiVerifyKey: unwrapValToHex(ip.cdiVerifyKey),
    };
}

export function arInfo(ar: v2.ArInfo): v1.ArInfo {
    return {
        arIdentity: unwrap(ar.identity?.value),
        arDescription: unwrap(ar.description),
        arPublicKey: unwrapValToHex(ar.publicKey),
    };
}

export function blocksAtHeightResponse(blocks: v2.BlocksAtHeightResponse): BlockHash.Type[] {
    return blocks.blocks.map(BlockHash.fromProto);
}

export function blockInfo(blockInfo: v2.BlockInfo): v1.BlockInfo {
    const common: v1.BlockInfoCommon = {
        blockParent: BlockHash.fromProto(unwrap(blockInfo.parentBlock)),
        blockHash: BlockHash.fromProto(unwrap(blockInfo.hash)),
        blockStateHash: unwrapValToHex(blockInfo.stateHash),
        blockLastFinalized: BlockHash.fromProto(unwrap(blockInfo.lastFinalizedBlock)),
        blockHeight: unwrap(blockInfo.height?.value),
        blockBaker: blockInfo.baker?.value,
        blockArriveTime: trTimestamp(blockInfo.arriveTime),
        blockReceiveTime: trTimestamp(blockInfo.receiveTime),
        blockSlotTime: trTimestamp(blockInfo.slotTime),
        finalized: blockInfo.finalized,
        transactionCount: BigInt(blockInfo.transactionCount),
        transactionsSize: BigInt(blockInfo.transactionsSize),
        transactionEnergyCost: Energy.fromProto(unwrap(blockInfo.transactionsEnergyCost)),
        genesisIndex: unwrap(blockInfo.genesisIndex?.value),
        eraBlockHeight: Number(unwrap(blockInfo.eraBlockHeight?.value)),
        protocolVersion: translateProtocolVersion(blockInfo.protocolVersion),
    };

    if (blockInfo.protocolVersion < v2.ProtocolVersion.PROTOCOL_VERSION_6) {
        const bi0: v1.BlockInfoV0 = {
            ...common,
            version: 0,
            blockSlot: unwrap(blockInfo.slotNumber?.value),
        };

        return bi0;
    }

    const bi1: v1.BlockInfoV1 = {
        ...common,
        version: 1,
        round: unwrap(blockInfo.round?.value),
        epoch: unwrap(blockInfo.epoch?.value),
    };

    return bi1;
}

export function delegatorInfo(delegatorInfo: v2.DelegatorInfo): v1.DelegatorInfo {
    return {
        account: AccountAddress.fromProto(unwrap(delegatorInfo.account)),
        stake: CcdAmount.fromProto(unwrap(delegatorInfo.stake)),
        ...(delegatorInfo.pendingChange && {
            pendingChange: trPendingChange(delegatorInfo.pendingChange),
        }),
    };
}

export function branch(branchV2: v2.Branch): v1.Branch {
    return {
        blockHash: BlockHash.fromProto(unwrap(branchV2.blockHash)),
        children: branchV2.children.map(branch),
    };
}

function trBakerElectionInfo(bakerElectionInfo: v2.ElectionInfo_Baker): v1.BakerElectionInfo {
    return {
        baker: unwrap(bakerElectionInfo.baker?.value),
        account: AccountAddress.fromProto(unwrap(bakerElectionInfo.account)),
        lotteryPower: bakerElectionInfo.lotteryPower,
    };
}

export function electionInfo(electionInfo: v2.ElectionInfo): v1.ElectionInfo {
    const common: v1.ElectionInfoCommon = {
        electionNonce: unwrapValToHex(electionInfo.electionNonce),
        bakerElectionInfo: electionInfo.bakerElectionInfo.map(trBakerElectionInfo),
    };

    if (electionInfo.electionDifficulty === undefined) {
        // election difficulty removed in protocol version 6.
        return {
            ...common,
            version: 1,
        };
    }

    return {
        ...common,
        version: 0,
        electionDifficulty: trAmountFraction(electionInfo.electionDifficulty?.value),
    };
}

export function nextUpdateSequenceNumbers(nextNums: v2.NextUpdateSequenceNumbers): v1.NextUpdateSequenceNumbers {
    return {
        rootKeys: unwrap(nextNums.rootKeys?.value),
        level1Keys: unwrap(nextNums.level1Keys?.value),
        level2Keys: unwrap(nextNums.level2Keys?.value),
        protocol: unwrap(nextNums.protocol?.value),
        electionDifficulty: unwrap(nextNums.electionDifficulty?.value),
        euroPerEnergy: unwrap(nextNums.euroPerEnergy?.value),
        microCcdPerEuro: unwrap(nextNums.microCcdPerEuro?.value),
        foundationAccount: unwrap(nextNums.foundationAccount?.value),
        mintDistribution: unwrap(nextNums.mintDistribution?.value),
        transactionFeeDistribution: unwrap(nextNums.transactionFeeDistribution?.value),
        gasRewards: unwrap(nextNums.gasRewards?.value),
        poolParameters: unwrap(nextNums.poolParameters?.value),
        addAnonymityRevoker: unwrap(nextNums.addAnonymityRevoker?.value),
        addIdentityProvider: unwrap(nextNums.addIdentityProvider?.value),
        cooldownParameters: unwrap(nextNums.cooldownParameters?.value),
        timeParameters: unwrap(nextNums.timeParameters?.value),
        timeoutParameters: unwrap(nextNums.timeoutParameters?.value),
        minBlockTime: unwrap(nextNums.minBlockTime?.value),
        blockEnergyLimit: unwrap(nextNums.blockEnergyLimit?.value),
        finalizationCommiteeParameters: unwrap(nextNums.finalizationCommitteeParameters?.value),
    };
}

function trPassiveCommitteeInfo(
    passiveCommitteeInfo: v2.NodeInfo_BakerConsensusInfo_PassiveCommitteeInfo
): v1.PassiveCommitteeInfo {
    const passiveCommitteeInfoV2 = v2.NodeInfo_BakerConsensusInfo_PassiveCommitteeInfo;
    switch (passiveCommitteeInfo) {
        case passiveCommitteeInfoV2.NOT_IN_COMMITTEE:
            return v1.PassiveCommitteeInfo.NotInCommittee;
        case passiveCommitteeInfoV2.ADDED_BUT_NOT_ACTIVE_IN_COMMITTEE:
            return v1.PassiveCommitteeInfo.AddedButNotActiveInCommittee;
        case passiveCommitteeInfoV2.ADDED_BUT_WRONG_KEYS:
            return v1.PassiveCommitteeInfo.AddedButWrongKeys;
    }
}

function trBakerConsensusInfoStatus(consensusInfo: v2.NodeInfo_BakerConsensusInfo): v1.BakerConsensusInfoStatus {
    if (consensusInfo.status.oneofKind === 'passiveCommitteeInfo') {
        return {
            tag: 'passiveCommitteeInfo',
            passiveCommitteeInfo: trPassiveCommitteeInfo(consensusInfo.status.passiveCommitteeInfo),
        };
    } else if (consensusInfo.status.oneofKind === 'activeBakerCommitteeInfo') {
        return {
            tag: 'activeBakerCommitteeInfo',
        };
    } else if (consensusInfo.status.oneofKind === 'activeFinalizerCommitteeInfo') {
        return {
            tag: 'activeFinalizerCommitteeInfo',
        };
    } else {
        throw Error('Error translating NodeInfoConsensusStatus: unexpected undefined');
    }
}

function trNetworkInfo(networkInfo: v2.NodeInfo_NetworkInfo | undefined): v1.NodeNetworkInfo {
    return {
        nodeId: unwrap(networkInfo?.nodeId?.value),
        peerTotalSent: unwrap(networkInfo?.peerTotalSent),
        peerTotalReceived: unwrap(networkInfo?.peerTotalReceived),
        avgBpsIn: unwrap(networkInfo?.avgBpsIn),
        avgBpsOut: unwrap(networkInfo?.avgBpsOut),
    };
}

export function trNodeInfo_Node(node: v2.NodeInfo_Node): v1.NodeInfoConsensusStatus {
    const status = node.consensusStatus;
    switch (status.oneofKind) {
        case 'active':
            return {
                tag: 'active',
                bakerId: unwrap(status.active.bakerId?.value),
                status: trBakerConsensusInfoStatus(status.active),
            };
        case 'notRunning':
            return {
                tag: 'notRunning',
            };
        case 'passive':
            return {
                tag: 'passive',
            };
        case undefined:
            throw Error('Error translating nodeinfo: unexpected undefined');
    }
}

export function nodeInfo(nodeInfo: v2.NodeInfo): v1.NodeInfo {
    let details: v1.NodeInfoDetails;
    if (nodeInfo.details.oneofKind === 'bootstrapper') {
        details = {
            tag: 'bootstrapper',
        };
    } else if (nodeInfo.details.oneofKind === 'node') {
        details = {
            tag: 'node',
            consensusStatus: trNodeInfo_Node(nodeInfo.details.node),
        };
    } else {
        throw Error('Invalid nodeinfo');
    }

    return {
        peerVersion: nodeInfo.peerVersion,
        localTime: Timestamp.fromProto(unwrap(nodeInfo.localTime)),
        peerUptime: Duration.fromProto(unwrap(nodeInfo.peerUptime)),
        networkInfo: trNetworkInfo(nodeInfo.networkInfo),
        details,
    };
}

function trCatchupStatus(catchupStatus: v2.PeersInfo_Peer_CatchupStatus): v1.NodeCatchupStatus {
    const CatchupStatus = v2.PeersInfo_Peer_CatchupStatus;
    switch (catchupStatus) {
        case CatchupStatus.CATCHINGUP:
            return v1.NodeCatchupStatus.CatchingUp;
        case CatchupStatus.PENDING:
            return v1.NodeCatchupStatus.Pending;
        case CatchupStatus.UPTODATE:
            return v1.NodeCatchupStatus.UpToDate;
    }
}

function trPeerNetworkStats(networkStats: v2.PeersInfo_Peer_NetworkStats | undefined): v1.PeerNetworkStats {
    return {
        packetsSent: unwrap(networkStats?.packetsSent),
        packetsReceived: unwrap(networkStats?.packetsReceived),
        latency: unwrap(networkStats?.latency),
    };
}

export function peerInfo(peerInfo: v2.PeersInfo_Peer): v1.PeerInfo {
    let consensusInfo: v1.PeerConsensusInfo;
    if (peerInfo.consensusInfo.oneofKind === 'bootstrapper') {
        consensusInfo = {
            tag: 'bootstrapper',
        };
    } else if (peerInfo.consensusInfo.oneofKind === 'nodeCatchupStatus') {
        consensusInfo = {
            tag: 'nodeCatchupStatus',
            catchupStatus: trCatchupStatus(peerInfo.consensusInfo.nodeCatchupStatus),
        };
    } else {
        throw Error('Error translating peerInfo: unexpected undefined');
    }
    return {
        peerId: unwrap(peerInfo.peerId?.value),
        ip: unwrap(peerInfo.socketAddress?.ip?.value),
        port: unwrap(peerInfo.socketAddress?.port?.value),
        networkStats: trPeerNetworkStats(peerInfo.networkStats),
        consensusInfo,
    };
}

function trAccountAmount(accountAmount: v2.BlockSpecialEvent_AccountAmounts_Entry): v1.BlockSpecialEventAccountAmount {
    return {
        account: AccountAddress.fromProto(unwrap(accountAmount.account)),
        amount: CcdAmount.fromProto(unwrap(accountAmount.amount)),
    };
}

export function blockSpecialEvent(specialEvent: v2.BlockSpecialEvent): v1.BlockSpecialEvent {
    const event = specialEvent.event;
    switch (event.oneofKind) {
        case 'bakingRewards': {
            return {
                tag: 'bakingRewards',
                bakingRewards: unwrap(event.bakingRewards.bakerRewards).entries.map(trAccountAmount),
                remainder: CcdAmount.fromProto(unwrap(event.bakingRewards.remainder)),
            };
        }
        case 'mint': {
            return {
                tag: 'mint',
                mintBakingReward: CcdAmount.fromProto(unwrap(event.mint.mintBakingReward)),
                mintFinalizationReward: CcdAmount.fromProto(unwrap(event.mint.mintFinalizationReward)),
                mintPlatformDevelopmentCharge: CcdAmount.fromProto(unwrap(event.mint.mintPlatformDevelopmentCharge)),
                foundationAccount: AccountAddress.fromProto(unwrap(event.mint.foundationAccount)),
            };
        }
        case 'finalizationRewards': {
            return {
                tag: 'finalizationRewards',
                finalizationRewards: event.finalizationRewards.finalizationRewards?.entries.map(trAccountAmount),
                remainder: CcdAmount.fromProto(unwrap(event.finalizationRewards.remainder)),
            };
        }
        case 'blockReward': {
            return {
                tag: 'blockReward',
                transactionFees: CcdAmount.fromProto(unwrap(event.blockReward.transactionFees)),
                oldGasAccount: CcdAmount.fromProto(unwrap(event.blockReward.oldGasAccount)),
                newGasAccount: CcdAmount.fromProto(unwrap(event.blockReward.newGasAccount)),
                bakerReward: CcdAmount.fromProto(unwrap(event.blockReward.bakerReward)),
                foundationCharge: CcdAmount.fromProto(unwrap(event.blockReward.foundationCharge)),
                baker: AccountAddress.fromProto(unwrap(event.blockReward.baker)),
                foundationAccount: AccountAddress.fromProto(unwrap(event.blockReward.baker)),
            };
        }
        case 'paydayFoundationReward': {
            return {
                tag: 'paydayFoundationReward',
                foundationAccount: AccountAddress.fromProto(unwrap(event.paydayFoundationReward.foundationAccount)),
                developmentCharge: CcdAmount.fromProto(unwrap(event.paydayFoundationReward.developmentCharge)),
            };
        }
        case 'paydayAccountReward': {
            return {
                tag: 'paydayAccountReward',
                account: AccountAddress.fromProto(unwrap(event.paydayAccountReward.account)),
                transactionFees: CcdAmount.fromProto(unwrap(event.paydayAccountReward.transactionFees)),
                bakerReward: CcdAmount.fromProto(unwrap(event.paydayAccountReward.bakerReward)),
                finalizationReward: CcdAmount.fromProto(unwrap(event.paydayAccountReward.finalizationReward)),
            };
        }
        case 'blockAccrueReward': {
            return {
                tag: 'blockAccrueReward',
                transactionFees: CcdAmount.fromProto(unwrap(event.blockAccrueReward.transactionFees)),
                oldGasAccount: CcdAmount.fromProto(unwrap(event.blockAccrueReward.oldGasAccount)),
                newGasAccount: CcdAmount.fromProto(unwrap(event.blockAccrueReward.newGasAccount)),
                bakerReward: CcdAmount.fromProto(unwrap(event.blockAccrueReward.bakerReward)),
                passiveReward: CcdAmount.fromProto(unwrap(event.blockAccrueReward.passiveReward)),
                foundationCharge: CcdAmount.fromProto(unwrap(event.blockAccrueReward.foundationCharge)),
                baker: unwrap(event.blockAccrueReward.baker?.value),
            };
        }
        case 'paydayPoolReward': {
            const poolOwner = event.paydayPoolReward.poolOwner?.value;
            return {
                tag: 'paydayPoolReward',
                transactionFees: CcdAmount.fromProto(unwrap(event.paydayPoolReward.transactionFees)),
                bakerReward: CcdAmount.fromProto(unwrap(event.paydayPoolReward.bakerReward)),
                finalizationReward: CcdAmount.fromProto(unwrap(event.paydayPoolReward.finalizationReward)),
                ...(poolOwner !== undefined && { poolOwner }),
            };
        }
        case undefined: {
            throw Error('Error translating BlockSpecialEvent: unexpected undefined');
        }
    }
}

function trFinalizationSummaryParty(party: v2.FinalizationSummaryParty): v1.FinalizationSummaryParty {
    return {
        baker: unwrap(party.baker?.value),
        weight: party.weight,
        signed: party.signed,
    };
}

function trFinalizationSummary(summary: v2.FinalizationSummary): v1.FinalizationSummary {
    return {
        block: BlockHash.fromProto(unwrap(summary.block)),
        index: unwrap(summary.index?.value),
        delay: unwrap(summary.delay?.value),
        finalizers: summary.finalizers.map(trFinalizationSummaryParty),
    };
}

export function blockFinalizationSummary(
    finalizationSummary: v2.BlockFinalizationSummary
): v1.BlockFinalizationSummary {
    const summary = finalizationSummary.summary;
    if (summary.oneofKind === 'none') {
        return {
            tag: 'none',
        };
    } else if (summary.oneofKind === 'record') {
        return {
            tag: 'record',
            record: trFinalizationSummary(summary.record),
        };
    } else {
        throw Error('Error translating BlockFinalizationSummary: unexpected undefined');
    }
}

export function blockCertificates(certs: v2.BlockCertificates): v1.BlockCertificates {
    return {
        ...(certs.quorumCertificate !== undefined && {
            quorumCertificate: quorumCertificate(certs.quorumCertificate),
        }),
        ...(certs.timeoutCertificate !== undefined && {
            timeoutCertificate: timeoutCertificate(certs.timeoutCertificate),
        }),
        ...(certs.epochFinalizationEntry !== undefined && {
            epochFinalizationEntry: epochFinalizationEntry(certs.epochFinalizationEntry),
        }),
    };
}

export function quorumCertificate(cert: v2.QuorumCertificate): v1.QuorumCertificate {
    return {
        blockHash: unwrapValToHex(cert.blockHash),
        round: unwrap(cert.round?.value),
        epoch: unwrap(cert.epoch?.value),
        aggregateSignature: unwrapValToHex(cert.aggregateSignature),
        signatories: cert.signatories.map((x) => unwrap(x.value)),
    };
}

export function timeoutCertificate(cert: v2.TimeoutCertificate): v1.TimeoutCertificate {
    return {
        round: unwrap(cert.round?.value),
        minEpoch: unwrap(cert.minEpoch?.value),
        qcRoundsFirstEpoch: cert.qcRoundsFirstEpoch.map(finalizerRound),
        qcRoundsSecondEpoch: cert.qcRoundsSecondEpoch.map(finalizerRound),
        aggregateSignature: unwrapValToHex(cert.aggregateSignature),
    };
}

export function epochFinalizationEntry(cert: v2.EpochFinalizationEntry): v1.EpochFinalizationEntry {
    return {
        finalizedQc: quorumCertificate(unwrap(cert.finalizedQc)),
        successorQc: quorumCertificate(unwrap(cert.successorQc)),
        successorProof: unwrapValToHex(cert.successorProof),
    };
}

export function finalizerRound(round: v2.FinalizerRound): v1.FinalizerRound {
    return {
        round: unwrap(round.round?.value),
        finalizers: round.finalizers.map((x) => x.value),
    };
}

export function bakerRewardPeriodInfo(bakerRewardPeriod: v2.BakerRewardPeriodInfo): v1.BakerRewardPeriodInfo {
    return {
        baker: bakerInfo(unwrap(bakerRewardPeriod.baker)),
        effectiveStake: CcdAmount.fromMicroCcd(unwrap(bakerRewardPeriod.effectiveStake?.value)),
        commissionRates: trCommissionRates(bakerRewardPeriod.commissionRates),
        equityCapital: CcdAmount.fromMicroCcd(unwrap(bakerRewardPeriod.equityCapital?.value)),
        delegatedCapital: CcdAmount.fromMicroCcd(unwrap(bakerRewardPeriod.delegatedCapital?.value)),
        isFinalizer: bakerRewardPeriod.isFinalizer,
    };
}

export function bakerInfo(bakerInfo: v2.BakerInfo): v1.BakerInfo {
    return {
        bakerId: unwrap(bakerInfo.bakerId?.value),
        electionKey: unwrapValToHex(bakerInfo.electionKey),
        signatureKey: unwrapValToHex(bakerInfo.signatureKey),
        aggregationKey: unwrapValToHex(bakerInfo.aggregationKey),
    };
}

export function winningBaker(winningBaker: v2.WinningBaker): v1.WinningBaker {
    return {
        round: unwrap(winningBaker.round?.value),
        winner: unwrap(winningBaker.winner?.value),
        present: winningBaker.present,
    };
}

// ---------------------------- //
// --- V1 => V2 translation --- //
// ---------------------------- //

export function accountTransactionSignatureToV2(
    signature: v1.AccountTransactionSignature
): v2.AccountTransactionSignature {
    function trSig(a: string): v2.Signature {
        return { value: Buffer.from(a, 'hex') };
    }
    function trCredSig(a: v1.CredentialSignature): v2.AccountSignatureMap {
        return { signatures: mapRecord(a, trSig) };
    }

    return { signatures: mapRecord(signature, trCredSig) };
}

export function BlocksAtHeightRequestToV2(request: v1.BlocksAtHeightRequest): v2.BlocksAtHeightRequest {
    if (typeof request === 'bigint') {
        return {
            blocksAtHeight: {
                oneofKind: 'absolute',
                absolute: { height: { value: request } },
            },
        };
    } else {
        return {
            blocksAtHeight: {
                oneofKind: 'relative',
                relative: {
                    genesisIndex: { value: request.genesisIndex },
                    height: { value: request.height },
                    restrict: request.restrict,
                },
            },
        };
    }
}
