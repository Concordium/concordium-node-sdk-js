import bs58check from 'bs58check';
import { Buffer } from 'buffer/index.js';

import * as GRPC_Kernel from '../grpc-api/v2/concordium/kernel.js';
import * as GRPC_PLT from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import * as GRPC from '../grpc-api/v2/concordium/types.js';
import * as PLT from '../plt/index.js';
import * as SDK from '../types.js';
import { TokenEvent, TokenTransferEvent, TransactionEventTag } from '../types.js';
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
import type { Upward } from './upward.js';

function unwrapToHex(bytes: Uint8Array | undefined): SDK.HexString {
    return Buffer.from(unwrap(bytes)).toString('hex');
}

export function unwrapValToHex(x: { value: Uint8Array } | undefined): string {
    return unwrapToHex(unwrap(x).value);
}

export function unwrapToBase58(address: GRPC_Kernel.AccountAddress | undefined): SDK.Base58String {
    return bs58check.encode(Buffer.concat([Buffer.of(1), unwrap(address?.value)]));
}

function trRelease(release: GRPC.Release): SDK.ReleaseScheduleWithTransactions {
    return {
        timestamp: trTimestamp(release.timestamp),
        amount: CcdAmount.fromProto(unwrap(release.amount)),
        transactions: release.transactions.map(unwrapValToHex),
    };
}

function trNewRelease(release: GRPC.NewRelease): SDK.ReleaseSchedule {
    return {
        timestamp: trTimestamp(release.timestamp),
        amount: CcdAmount.fromProto(unwrap(release.amount)),
    };
}

function trDate(ym: GRPC.YearMonth): string {
    return String(ym.year) + String(ym.month).padStart(2, '0');
}

function trAttKey(attributeKey: number): SDK.AttributeKey {
    return SDK.AttributesKeys[attributeKey] as SDK.AttributeKey;
}

function trCommits(cmm: GRPC.CredentialCommitments): SDK.CredentialDeploymentCommitments {
    return {
        cmmPrf: unwrapValToHex(cmm.prf),
        cmmCredCounter: unwrapValToHex(cmm.credCounter),
        cmmIdCredSecSharingCoeff: cmm.idCredSecSharingCoeff.map(unwrapValToHex),
        cmmAttributes: mapRecord(cmm.attributes, unwrapValToHex, trAttKey),
        cmmMaxAccounts: unwrapValToHex(cmm.maxAccounts),
    };
}

function trVerifyKey(verifyKey: GRPC.AccountVerifyKey): Upward<SDK.VerifyKey> {
    switch (verifyKey.key.oneofKind) {
        case 'ed25519Key':
            return {
                schemeId: 'Ed25519',
                verifyKey: unwrapToHex(verifyKey.key.ed25519Key),
            };
        case undefined:
            return null;
    }
}

function trCredKeys(credKeys: GRPC.CredentialPublicKeys): SDK.CredentialPublicKeys {
    return {
        threshold: unwrap(credKeys.threshold?.value),
        keys: mapRecord(credKeys.keys, trVerifyKey),
    };
}

function trChainArData(chainArData: GRPC.ChainArData): SDK.ChainArData {
    return {
        encIdCredPubShare: unwrapToHex(chainArData.encIdCredPubShare),
    };
}

function trCommissionRates(rates: GRPC.CommissionRates | undefined): SDK.CommissionRates {
    return {
        transactionCommission: trAmountFraction(rates?.transaction),
        bakingCommission: trAmountFraction(rates?.baking),
        finalizationCommission: trAmountFraction(rates?.finalization),
    };
}

function trCred(cred: GRPC.AccountCredential): SDK.AccountCredential {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const crd = cred.credentialValues as any;
    if (crd === undefined) {
        throw Error('CredentialValues were undefined.');
    }
    const isNormal = crd.oneofKind === 'normal';
    const credVals = isNormal ? crd.normal : crd.initial;

    const policy: SDK.Policy = {
        validTo: trDate(unwrap(credVals.policy?.validTo)),
        createdAt: trDate(unwrap(credVals.policy?.createdAt)),
        revealedAttributes: mapRecord(credVals.policy?.attributes, unwrapToHex, trAttKey),
    };
    const commonValues = {
        ipIdentity: unwrap(credVals.ipId?.value),
        credentialPublicKeys: trCredKeys(unwrap(credVals.keys)),
        policy: policy,
    };

    let value: SDK.InitialAccountCredential | SDK.NormalAccountCredential;
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

function trDelegatorTarget(target: GRPC.DelegationTarget): SDK.DelegationTarget {
    if (target.target.oneofKind === 'passive') {
        return {
            delegateType: SDK.DelegationTargetType.PassiveDelegation,
        };
    } else if (target.target.oneofKind === 'baker') {
        return {
            delegateType: SDK.DelegationTargetType.Baker,
            bakerId: target.target.baker.value,
        };
    } else {
        throw Error(
            'DelegatorTarget expected to be of type "passive" or "baker", but found ' + target.target.oneofKind
        );
    }
}

function trTimestamp(timestamp: GRPC.Timestamp | undefined): Date {
    return new Date(Number(unwrap(timestamp?.value)));
}

function trPendingChange(pendingChange: GRPC.StakePendingChange | undefined): SDK.StakePendingChange {
    const change = unwrap(pendingChange?.change);
    if (change.oneofKind === 'reduce') {
        return {
            newStake: unwrap(change.reduce.newStake?.value),
            effectiveTime: trTimestamp(change.reduce.effectiveTime),
            change: SDK.StakePendingChangeType.ReduceStake,
        };
    } else if (change.oneofKind === 'remove') {
        return {
            effectiveTime: trTimestamp(change.remove),
            change: SDK.StakePendingChangeType.RemoveStake,
        };
    } else {
        throw Error('PendingChange expected to be of type "reduce" or "remove", but found ' + change.oneofKind);
    }
}

function trDelegator(deleg: GRPC.AccountStakingInfo_Delegator): SDK.AccountDelegationDetails {
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

function trAmountFraction(amount: GRPC.AmountFraction | undefined): number {
    return unwrap(amount?.partsPerHundredThousand) / 100000;
}

function trOpenStatus(openStatus: GRPC.OpenStatus | undefined): Upward<SDK.OpenStatusText> {
    switch (openStatus) {
        case GRPC.OpenStatus.OPEN_FOR_ALL:
            return SDK.OpenStatusText.OpenForAll;
        case GRPC.OpenStatus.CLOSED_FOR_NEW:
            return SDK.OpenStatusText.ClosedForNew;
        case GRPC.OpenStatus.CLOSED_FOR_ALL:
            return SDK.OpenStatusText.ClosedForAll;
        case undefined:
            return null;
    }
}

function trBaker(baker: GRPC.AccountStakingInfo_Baker): SDK.AccountBakerDetails {
    const bakerInfo = baker.bakerInfo;
    const isSuspended = baker.isSuspended;

    const v0: SDK.AccountBakerDetails = {
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
        isSuspended,
    };

    if (baker.poolInfo === undefined) {
        return v0;
    }

    return {
        ...v0,
        version: 1,
        bakerPoolInfo: transPoolInfo(baker.poolInfo),
    };
}

function trHigherLevelKeysUpdate(update: GRPC.HigherLevelKeys): SDK.KeysWithThreshold {
    return {
        keys: update.keys.map(trUpdatePublicKey),
        threshold: unwrap(update.threshold?.value),
    };
}

function translateChainParametersCommon(
    params: GRPC.ChainParametersV1 | GRPC.ChainParametersV0
): SDK.ChainParametersCommon {
    return {
        euroPerEnergy: unwrap(params.euroPerEnergy?.value),
        microGTUPerEuro: unwrap(params.microCcdPerEuro?.value),
        accountCreationLimit: unwrap(params.accountCreationLimit?.value),
        foundationAccount: AccountAddress.fromProto(unwrap(params.foundationAccount)),
        level1Keys: trHigherLevelKeysUpdate(unwrap(params.level1Keys)),
        rootKeys: trHigherLevelKeysUpdate(unwrap(params.rootKeys)),
    };
}

function translateCommissionRange(range: GRPC.InclusiveRangeAmountFraction | undefined): SDK.InclusiveRange<number> {
    return {
        min: trAmountFraction(range?.min),
        max: trAmountFraction(range?.max),
    };
}

function translateRewardParametersCommon(
    params: GRPC.ChainParametersV1 | GRPC.ChainParametersV0
): SDK.RewardParametersCommon {
    const feeDistribution = params.transactionFeeDistribution;
    return {
        transactionFeeDistribution: {
            baker: trAmountFraction(feeDistribution?.baker),
            gasAccount: trAmountFraction(feeDistribution?.gasAccount),
        },
    };
}

function transPoolPendingChange(change: GRPC.PoolPendingChange | undefined): SDK.BakerPoolPendingChange {
    switch (change?.change?.oneofKind) {
        case 'reduce': {
            return {
                pendingChangeType: SDK.BakerPoolPendingChangeType.ReduceBakerCapital,
                // TODO ensure units are aligned
                effectiveTime: trTimestamp(change.change.reduce.effectiveTime),
                bakerEquityCapital: CcdAmount.fromProto(unwrap(change.change.reduce.reducedEquityCapital)),
            };
        }
        case 'remove': {
            return {
                pendingChangeType: SDK.BakerPoolPendingChangeType.RemovePool,
                effectiveTime: trTimestamp(change.change.remove.effectiveTime),
            };
        }
        default:
            return {
                pendingChangeType: SDK.BakerPoolPendingChangeType.NoChange,
            };
    }
}

function transPoolInfo(info: GRPC.BakerPoolInfo): SDK.BakerPoolInfo {
    return {
        openStatus: trOpenStatus(info.openStatus),
        metadataUrl: info.url,
        commissionRates: trCommissionRates(info.commissionRates),
    };
}

function transPaydayStatus(status: GRPC.PoolCurrentPaydayInfo): SDK.CurrentPaydayBakerPoolStatus {
    return {
        blocksBaked: status.blocksBaked,
        finalizationLive: status.finalizationLive,
        transactionFeesEarned: CcdAmount.fromProto(unwrap(status.transactionFeesEarned)),
        effectiveStake: CcdAmount.fromProto(unwrap(status.effectiveStake)),
        lotteryPower: status.lotteryPower,
        bakerEquityCapital: CcdAmount.fromProto(unwrap(status.bakerEquityCapital)),
        delegatedCapital: CcdAmount.fromProto(unwrap(status.delegatedCapital)),
        commissionRates: trCommissionRates(status.commissionRates),
        isPrimedForSuspension: status.isPrimedForSuspension ?? false,
        missedRounds: status.missedRounds ?? 0n,
    };
}

function transCooldown(cooldown: GRPC.Cooldown): SDK.Cooldown {
    return {
        amount: CcdAmount.fromProto(unwrap(cooldown.amount)),
        timestamp: Timestamp.fromProto(unwrap(cooldown.endTime)),
        status: cooldown.status as number,
    };
}

function trTokenAccountInfo(token: GRPC.AccountInfo_Token): PLT.TokenAccountInfo {
    return {
        id: PLT.TokenId.fromProto(unwrap(token.tokenId)),
        state: {
            balance: PLT.TokenAmount.fromProto(unwrap(token.tokenAccountState?.balance)),
            moduleState: PLT.Cbor.fromProto(unwrap(token.tokenAccountState?.moduleState)),
        },
    };
}

export function accountInfo(acc: GRPC.AccountInfo): SDK.AccountInfo {
    const aggAmount = acc.encryptedBalance?.aggregatedAmount?.value;
    const numAggregated = acc.encryptedBalance?.numAggregated;

    const accountEncryptedAmount: SDK.AccountEncryptedAmount = {
        selfAmount: unwrapValToHex(acc.encryptedBalance?.selfAmount),
        startIndex: unwrap(acc.encryptedBalance?.startIndex),
        incomingAmounts: unwrap(acc.encryptedBalance?.incomingAmounts).map(unwrapValToHex),
        // Set the following values if they are not undefined
        ...(numAggregated && { numAggregated: numAggregated }),
        ...(aggAmount && { aggregatedAmount: unwrapToHex(aggAmount) }),
    };
    const accountReleaseSchedule = {
        total: CcdAmount.fromProto(unwrap(acc.schedule?.total)),
        schedule: unwrap(acc.schedule?.schedules).map(trRelease),
    };
    const accountCooldowns = acc.cooldowns.map(transCooldown);
    const accountAmount = CcdAmount.fromProto(unwrap(acc.amount));

    let accountAvailableBalance: CcdAmount.Type;

    // This is undefined for node version <7, so we add this check to be backwards compatible.
    if (acc.availableBalance !== undefined) {
        accountAvailableBalance = CcdAmount.fromProto(unwrap(acc.availableBalance));
    } else {
        // NOTE: implementation borrowed from concordium-browser-wallet.
        let staked = 0n;
        switch (acc.stake?.stakingInfo.oneofKind) {
            case 'baker': {
                staked = unwrap(acc.stake.stakingInfo.baker.stakedAmount?.value);
                break;
            }
            case 'delegator': {
                staked = unwrap(acc.stake.stakingInfo.delegator.stakedAmount?.value);
                break;
            }
        }

        const scheduled = accountReleaseSchedule ? BigInt(accountReleaseSchedule.total.microCcdAmount) : 0n;

        const max = (first: bigint, second: bigint) => {
            return first > second ? first : second;
        };

        const atDisposal = accountAmount.microCcdAmount - max(scheduled, staked);
        accountAvailableBalance = CcdAmount.fromMicroCcd(atDisposal);
    }
    const accInfoCommon: SDK.AccountInfoSimple = {
        type: SDK.AccountInfoType.Simple,
        accountAddress: AccountAddress.fromProto(unwrap(acc.address)),
        accountNonce: SequenceNumber.fromProto(unwrap(acc.sequenceNumber)),
        accountAmount,
        accountIndex: unwrap(acc.index?.value),
        accountThreshold: unwrap(acc.threshold?.value),
        accountEncryptionKey: unwrapValToHex(acc.encryptionKey),
        accountEncryptedAmount,
        accountReleaseSchedule,
        accountCredentials: mapRecord(acc.creds, trCred),
        accountCooldowns,
        accountAvailableBalance,
        accountTokens: acc.tokens.map(trTokenAccountInfo),
    };

    if (acc.stake === undefined) {
        return accInfoCommon;
    }

    switch (acc.stake.stakingInfo.oneofKind) {
        case 'delegator':
            return {
                ...accInfoCommon,
                type: SDK.AccountInfoType.Delegator,
                accountDelegation: trDelegator(acc.stake.stakingInfo.delegator),
            };
        case 'baker':
            return {
                ...accInfoCommon,
                type: SDK.AccountInfoType.Baker,
                accountBaker: trBaker(acc.stake.stakingInfo.baker),
            };
        case undefined:
            return { ...accInfoCommon, type: SDK.AccountInfoType.Unknown, accountBaker: null };
    }
}

export function nextAccountSequenceNumber(nasn: GRPC.NextAccountSequenceNumber): SDK.NextAccountNonce {
    return {
        nonce: SequenceNumber.fromProto(unwrap(nasn.sequenceNumber)),
        allFinal: nasn.allFinal,
    };
}

export function cryptographicParameters(cp: GRPC.CryptographicParameters): SDK.CryptographicParameters {
    return {
        onChainCommitmentKey: unwrapToHex(cp.onChainCommitmentKey),
        bulletproofGenerators: unwrapToHex(cp.bulletproofGenerators),
        genesisString: cp.genesisString,
    };
}

function trChainParametersV0(v0: GRPC.ChainParametersV0): SDK.ChainParametersV0 {
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

function trChainParametersV1(params: GRPC.ChainParametersV1): SDK.ChainParametersV1 {
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

function trChainParametersV2(params: GRPC.ChainParametersV2 | GRPC.ChainParametersV3): SDK.ChainParametersV2 {
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

function trChainParametersV3(params: GRPC.ChainParametersV3): SDK.ChainParametersV3 {
    const { version, ...common } = trChainParametersV2(params);
    return {
        ...common,
        version: 3,
        validatorScoreParameters: {
            maxMissedRounds: unwrap(params.validatorScoreParameters?.maximumMissedRounds),
        },
    };
}

export function blockChainParameters(params: GRPC.ChainParameters): SDK.ChainParameters {
    switch (params.parameters.oneofKind) {
        case 'v3': {
            return trChainParametersV3(params.parameters.v3);
        }
        case 'v2': {
            return trChainParametersV2(params.parameters.v2);
        }
        case 'v1': {
            return trChainParametersV1(params.parameters.v1);
        }
        case 'v0': {
            return trChainParametersV0(params.parameters.v0);
        }
        case undefined:
            throw new Error('Missing chain parameters');
    }
}

export function bakerPoolInfo(info: GRPC.PoolInfoResponse): SDK.BakerPoolStatus {
    return {
        poolType: SDK.PoolStatusType.BakerPool,
        bakerId: unwrap(info.baker?.value),
        bakerAddress: AccountAddress.fromProto(unwrap(info.address)),
        bakerEquityCapital: info.equityCapital !== undefined ? CcdAmount.fromProto(info.equityCapital) : undefined,
        delegatedCapital: info.delegatedCapital !== undefined ? CcdAmount.fromProto(info.delegatedCapital) : undefined,
        delegatedCapitalCap:
            info.delegatedCapitalCap !== undefined ? CcdAmount.fromProto(info.delegatedCapitalCap) : undefined,
        poolInfo: info.poolInfo !== undefined ? transPoolInfo(info.poolInfo) : undefined,
        bakerStakePendingChange: transPoolPendingChange(info.equityPendingChange),
        currentPaydayStatus:
            info.currentPaydayInfo !== undefined ? transPaydayStatus(info.currentPaydayInfo) : undefined,
        allPoolTotalCapital: CcdAmount.fromProto(unwrap(info.allPoolTotalCapital)),
        isSuspended: info.isSuspended ?? false,
    };
}

export function passiveDelegationInfo(info: GRPC.PassiveDelegationInfo): SDK.PassiveDelegationStatus {
    return {
        poolType: SDK.PoolStatusType.PassiveDelegation,
        delegatedCapital: CcdAmount.fromProto(unwrap(info.delegatedCapital)),
        commissionRates: trCommissionRates(info.commissionRates),
        currentPaydayTransactionFeesEarned: CcdAmount.fromProto(unwrap(info.currentPaydayTransactionFeesEarned)),
        currentPaydayDelegatedCapital: CcdAmount.fromProto(unwrap(info.currentPaydayDelegatedCapital)),
        allPoolTotalCapital: CcdAmount.fromProto(unwrap(info.allPoolTotalCapital)),
    };
}

function translateProtocolVersion(pv: GRPC.ProtocolVersion): bigint {
    return BigInt(pv + 1); // Protocol version enum indexes from 0, i.e. pv.PROTOCOL_VERSION_1 = 0.
}

export function tokenomicsInfo(info: GRPC.TokenomicsInfo): Upward<SDK.RewardStatus> {
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
            return null;
    }
}

export function consensusInfo(ci: GRPC.ConsensusInfo): SDK.ConsensusStatus {
    const common: SDK.ConsensusStatusCommon = {
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

    if (ci.protocolVersion < GRPC.ProtocolVersion.PROTOCOL_VERSION_6) {
        const ci0: SDK.ConsensusStatusV0 = {
            ...common,
            version: 0,
            slotDuration: Duration.fromProto(unwrap(ci.slotDuration)),
        };

        return ci0;
    }

    const ci1: SDK.ConsensusStatusV1 = {
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

function trAddress(address: GRPC.Address): SDK.Address {
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

function trContractTraceElement(contractTraceElement: GRPC.ContractTraceElement): Upward<SDK.ContractTraceEvent> {
    const element = contractTraceElement.element;
    switch (element.oneofKind) {
        case 'updated':
            return {
                tag: SDK.TransactionEventTag.Updated,
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
                tag: SDK.TransactionEventTag.Transferred,
                from: ContractAddress.fromProto(unwrap(element.transferred.sender)),
                amount: CcdAmount.fromProto(unwrap(element.transferred.amount)),
                to: AccountAddress.fromProto(unwrap(element.transferred.receiver)),
            };
        case 'interrupted':
            return {
                tag: SDK.TransactionEventTag.Interrupted,
                address: ContractAddress.fromProto(unwrap(element.interrupted.address)),
                events: element.interrupted.events.map(ContractEvent.fromProto),
            };
        case 'resumed':
            return {
                tag: SDK.TransactionEventTag.Resumed,
                address: ContractAddress.fromProto(unwrap(element.resumed.address)),
                success: unwrap(element.resumed.success),
            };
        case 'upgraded':
            return {
                tag: SDK.TransactionEventTag.Upgraded,
                address: ContractAddress.fromProto(unwrap(element.upgraded.address)),
                from: unwrapValToHex(element.upgraded.from),
                to: unwrapValToHex(element.upgraded.to),
            };
        case undefined:
            return null;
    }
}

function trBakerEvent(bakerEvent: GRPC.BakerEvent, account: AccountAddress.Type): Upward<SDK.BakerEvent> {
    const event = bakerEvent.event;
    switch (event.oneofKind) {
        case 'bakerAdded': {
            const keysEvent = event.bakerAdded.keysEvent;
            return {
                tag: SDK.TransactionEventTag.BakerAdded,
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
                tag: SDK.TransactionEventTag.BakerRemoved,
                bakerId: unwrap(event.bakerRemoved.value),
                account,
            };
        case 'bakerStakeIncreased':
            return {
                tag: SDK.TransactionEventTag.BakerStakeIncreased,
                bakerId: unwrap(event.bakerStakeIncreased.bakerId?.value),
                newStake: CcdAmount.fromProto(unwrap(event.bakerStakeIncreased.newStake)),
                account,
            };
        case 'bakerStakeDecreased':
            return {
                tag: SDK.TransactionEventTag.BakerStakeDecreased,
                bakerId: unwrap(event.bakerStakeDecreased.bakerId?.value),
                newStake: CcdAmount.fromProto(unwrap(event.bakerStakeDecreased.newStake)),
                account,
            };
        case 'bakerRestakeEarningsUpdated': {
            const update = event.bakerRestakeEarningsUpdated;
            return {
                tag: SDK.TransactionEventTag.BakerSetRestakeEarnings,
                bakerId: unwrap(update.bakerId?.value),
                restakeEarnings: unwrap(update.restakeEarnings),
                account,
            };
        }
        case 'bakerKeysUpdated':
            return {
                tag: SDK.TransactionEventTag.BakerKeysUpdated,
                bakerId: unwrap(event.bakerKeysUpdated.bakerId?.value),
                account: AccountAddress.fromProto(unwrap(event.bakerKeysUpdated.account)),
                signKey: unwrapValToHex(event.bakerKeysUpdated.signKey),
                electionKey: unwrapValToHex(event.bakerKeysUpdated.electionKey),
                aggregationKey: unwrapValToHex(event.bakerKeysUpdated.aggregationKey),
            };
        case 'bakerSetOpenStatus': {
            const setOpenStatus = event.bakerSetOpenStatus;
            return {
                tag: SDK.TransactionEventTag.BakerSetOpenStatus,
                bakerId: unwrap(setOpenStatus.bakerId?.value),
                openStatus: trOpenStatus(setOpenStatus.openStatus),
                account,
            };
        }
        case 'bakerSetMetadataUrl': {
            const setURL = event.bakerSetMetadataUrl;
            return {
                tag: SDK.TransactionEventTag.BakerSetMetadataURL,
                bakerId: unwrap(setURL.bakerId?.value),
                metadataURL: setURL.url,
                account,
            };
        }
        case 'bakerSetTransactionFeeCommission': {
            const transferFeeComm = event.bakerSetTransactionFeeCommission;
            const amount = transferFeeComm.transactionFeeCommission;
            return {
                tag: SDK.TransactionEventTag.BakerSetTransactionFeeCommission,
                bakerId: unwrap(transferFeeComm.bakerId?.value),
                transactionFeeCommission: trAmountFraction(amount),
                account,
            };
        }
        case 'bakerSetBakingRewardCommission': {
            const rewardComm = event.bakerSetBakingRewardCommission;
            const amount = rewardComm.bakingRewardCommission;
            return {
                tag: SDK.TransactionEventTag.BakerSetBakingRewardCommission,
                bakerId: unwrap(rewardComm.bakerId?.value),
                bakingRewardCommission: trAmountFraction(amount),
                account,
            };
        }
        case 'bakerSetFinalizationRewardCommission': {
            const rewardComm = event.bakerSetFinalizationRewardCommission;
            const amount = rewardComm.finalizationRewardCommission;
            return {
                tag: SDK.TransactionEventTag.BakerSetFinalizationRewardCommission,
                bakerId: unwrap(rewardComm.bakerId?.value),
                finalizationRewardCommission: trAmountFraction(amount),
                account,
            };
        }
        case 'delegationRemoved': {
            return {
                tag: SDK.TransactionEventTag.BakerDelegationRemoved,
                delegatorId: unwrap(event.delegationRemoved.delegatorId?.id?.value),
            };
        }
        case 'bakerSuspended': {
            return {
                tag: SDK.TransactionEventTag.BakerSuspended,
                bakerId: unwrap(event.bakerSuspended.bakerId?.value),
            };
        }
        case 'bakerResumed': {
            return {
                tag: SDK.TransactionEventTag.BakerResumed,
                bakerId: unwrap(event.bakerResumed.bakerId?.value),
            };
        }
        case undefined:
            return null;
    }
}

function trDelegTarget(delegationTarget: GRPC.DelegationTarget | undefined): SDK.EventDelegationTarget {
    const target = delegationTarget?.target;
    if (target?.oneofKind === 'baker') {
        return {
            delegateType: SDK.DelegationTargetType.Baker,
            bakerId: Number(unwrap(target.baker.value)),
        };
    } else if (target?.oneofKind === 'passive') {
        return {
            delegateType: SDK.DelegationTargetType.PassiveDelegation,
        };
    } else {
        throw Error('Failed translating DelegationTarget, encountered undefined');
    }
}

function trDelegationEvent(
    delegationEvent: GRPC.DelegationEvent,
    account: AccountAddress.Type
): Upward<SDK.DelegationEvent> {
    const event = delegationEvent.event;
    switch (event.oneofKind) {
        case 'delegationStakeIncreased': {
            const stakeIncr = event.delegationStakeIncreased;
            return {
                tag: SDK.TransactionEventTag.DelegationStakeIncreased,
                delegatorId: unwrap(stakeIncr.delegatorId?.id?.value),
                newStake: CcdAmount.fromProto(unwrap(stakeIncr.newStake)),
                account,
            };
        }
        case 'delegationStakeDecreased': {
            const stakeDecr = event.delegationStakeDecreased;
            return {
                tag: SDK.TransactionEventTag.DelegationStakeDecreased,
                delegatorId: unwrap(stakeDecr.delegatorId?.id?.value),
                newStake: CcdAmount.fromProto(unwrap(stakeDecr.newStake)),
                account,
            };
        }
        case 'delegationSetRestakeEarnings': {
            const restake = event.delegationSetRestakeEarnings;
            return {
                tag: SDK.TransactionEventTag.DelegationSetRestakeEarnings,
                delegatorId: unwrap(restake.delegatorId?.id?.value),
                restakeEarnings: unwrap(restake.restakeEarnings),
                account,
            };
        }
        case 'delegationSetDelegationTarget': {
            const target = event.delegationSetDelegationTarget;
            return {
                tag: SDK.TransactionEventTag.DelegationSetDelegationTarget,
                delegatorId: unwrap(target.delegatorId?.id?.value),
                delegationTarget: trDelegTarget(target.delegationTarget),
                account,
            };
        }
        case 'delegationAdded':
            return {
                tag: SDK.TransactionEventTag.DelegationAdded,
                delegatorId: unwrap(event.delegationAdded.id?.value),
                account,
            };
        case 'delegationRemoved':
            return {
                tag: SDK.TransactionEventTag.DelegationRemoved,
                delegatorId: unwrap(event.delegationRemoved.id?.value),
                account,
            };
        case 'bakerRemoved':
            return {
                tag: SDK.TransactionEventTag.DelegationBakerRemoved,
                bakerId: unwrap(event.bakerRemoved.bakerId?.value),
            };
        case undefined:
            return null;
    }
}

function trRejectReason(rejectReason: GRPC.RejectReason | undefined): Upward<SDK.RejectReason> {
    function simpleReason(tag: SDK.SimpleRejectReasonTag): SDK.RejectReason {
        return {
            tag: SDK.RejectReasonTag[tag],
        };
    }

    const reason = unwrap(rejectReason?.reason);
    const Tag = SDK.RejectReasonTag;
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
        case 'nonExistentTokenId':
            return {
                tag: Tag.NonExistentTokenId,
                contents: PLT.TokenId.fromProto(reason.nonExistentTokenId),
            };
        case 'tokenUpdateTransactionFailed':
            return {
                tag: Tag.TokenUpdateTransactionFailed,
                contents: {
                    type: reason.tokenUpdateTransactionFailed.type,
                    tokenId: PLT.TokenId.fromProto(unwrap(reason.tokenUpdateTransactionFailed.tokenId)),
                    details: PLT.Cbor.fromProto(unwrap(reason.tokenUpdateTransactionFailed.details)),
                },
            };
        case undefined:
            return null;
    }
}

function trMintRate(mintRate: GRPC.MintRate | undefined): number {
    return unwrap(mintRate?.mantissa) * 10 ** (-1 * unwrap(mintRate?.exponent));
}

function trProtocolUpdate(update: GRPC.ProtocolUpdate): SDK.ProtocolUpdate {
    return {
        updateType: SDK.UpdateType.Protocol,
        update: {
            message: update.message,
            specificationHash: unwrapValToHex(update.specificationHash),
            specificationUrl: update.specificationUrl,
            specificationAuxiliaryData: unwrapToHex(update.specificationAuxiliaryData),
        },
    };
}
function trElectionDifficultyUpdate(elecDiff: GRPC.ElectionDifficulty): SDK.ElectionDifficultyUpdate {
    return {
        updateType: SDK.UpdateType.ElectionDifficulty,
        update: {
            electionDifficulty: trAmountFraction(elecDiff.value),
        },
    };
}
function trEuroPerEnergyUpdate(exchangeRate: GRPC.ExchangeRate): SDK.EuroPerEnergyUpdate {
    return {
        updateType: SDK.UpdateType.EuroPerEnergy,
        update: unwrap(exchangeRate.value),
    };
}
function trMicroCcdPerEuroUpdate(exchangeRate: GRPC.ExchangeRate): SDK.MicroGtuPerEuroUpdate {
    return {
        updateType: SDK.UpdateType.MicroGtuPerEuro,
        update: unwrap(exchangeRate.value),
    };
}
function trFoundationAccountUpdate(account: GRPC_Kernel.AccountAddress): SDK.FoundationAccountUpdate {
    return {
        updateType: SDK.UpdateType.FoundationAccount,
        update: {
            address: unwrapToBase58(account),
        },
    };
}

function trTransactionFeeDistributionUpdate(
    transFeeDist: GRPC.TransactionFeeDistribution
): SDK.TransactionFeeDistributionUpdate {
    return {
        updateType: SDK.UpdateType.TransactionFeeDistribution,
        update: {
            baker: trAmountFraction(transFeeDist.baker),
            gasAccount: trAmountFraction(transFeeDist.gasAccount),
        },
    };
}

function trGasRewardsUpdate(gasRewards: GRPC.GasRewards): SDK.GasRewardsV0Update {
    return {
        updateType: SDK.UpdateType.GasRewards,
        update: {
            version: 0,
            baker: trAmountFraction(gasRewards.baker),
            accountCreation: trAmountFraction(gasRewards.accountCreation),
            chainUpdate: trAmountFraction(gasRewards.accountCreation),
            finalizationProof: trAmountFraction(gasRewards.finalizationProof),
        },
    };
}

function trGasRewardsCpv2Update(gasRewards: GRPC.GasRewardsCpv2): SDK.GasRewardsV1Update {
    return {
        updateType: SDK.UpdateType.GasRewardsCpv2,
        update: {
            version: 1,
            baker: trAmountFraction(gasRewards.baker),
            accountCreation: trAmountFraction(gasRewards.accountCreation),
            chainUpdate: trAmountFraction(gasRewards.accountCreation),
        },
    };
}

function trBakerStakeThresholdUpdate(bakerStakeThreshold: GRPC.BakerStakeThreshold): SDK.BakerStakeThresholdUpdate {
    return {
        updateType: SDK.UpdateType.BakerStakeThreshold,
        update: {
            threshold: unwrap(bakerStakeThreshold.bakerStakeThreshold?.value),
        },
    };
}

function trPoolParametersCpv1Update(poolParams: GRPC.PoolParametersCpv1): SDK.PoolParametersUpdate {
    return {
        updateType: SDK.UpdateType.PoolParameters,
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

function trAddAnonymityRevokerUpdate(ar: GRPC.ArInfo): SDK.AddAnonymityRevokerUpdate {
    return {
        updateType: SDK.UpdateType.AddAnonymityRevoker,
        update: arInfo(ar),
    };
}
function trAddIdentityProviderUpdate(ip: GRPC.IpInfo): SDK.AddIdentityProviderUpdate {
    return {
        updateType: SDK.UpdateType.AddIdentityProvider,
        update: ipInfo(ip),
    };
}

function trCooldownParametersCpv1Update(cooldownParams: GRPC.CooldownParametersCpv1): SDK.CooldownParametersUpdate {
    return {
        updateType: SDK.UpdateType.CooldownParameters,
        update: {
            poolOwnerCooldown: unwrap(cooldownParams.poolOwnerCooldown?.value),
            delegatorCooldown: unwrap(cooldownParams.delegatorCooldown?.value),
        },
    };
}

function trTimeParametersCpv1Update(timeParams: GRPC.TimeParametersCpv1): SDK.TimeParametersUpdate {
    return {
        updateType: SDK.UpdateType.TimeParameters,
        update: {
            rewardPeriodLength: unwrap(timeParams.rewardPeriodLength?.value?.value),
            mintRatePerPayday: unwrap(timeParams.mintPerPayday),
        },
    };
}

function trTimeoutParameteresUpdate(timeout: GRPC.TimeoutParameters): SDK.TimeoutParametersUpdate {
    return {
        updateType: SDK.UpdateType.TimeoutParameters,
        update: {
            timeoutBase: Duration.fromProto(unwrap(timeout.timeoutBase)),
            timeoutDecrease: unwrap(timeout.timeoutDecrease),
            timeoutIncrease: unwrap(timeout.timeoutIncrease),
        },
    };
}

function trMinBlockTimeUpdate(duration: GRPC.Duration): SDK.MinBlockTimeUpdate {
    return {
        updateType: SDK.UpdateType.MinBlockTime,
        update: Duration.fromProto(duration),
    };
}

function trBlockEnergyLimitUpdate(energy: GRPC.Energy): SDK.BlockEnergyLimitUpdate {
    return {
        updateType: SDK.UpdateType.BlockEnergyLimit,
        update: Energy.fromProto(energy),
    };
}

function trFinalizationCommitteeParametersUpdate(
    params: GRPC.FinalizationCommitteeParameters
): SDK.FinalizationCommitteeParametersUpdate {
    return {
        updateType: SDK.UpdateType.FinalizationCommitteeParameters,
        update: {
            finalizerRelativeStakeThreshold: trAmountFraction(params.finalizerRelativeStakeThreshold),
            minimumFinalizers: params.minimumFinalizers,
            maximumFinalizers: params.maximumFinalizers,
        },
    };
}

function trMintDistributionCpv0Update(mintDist: GRPC.MintDistributionCpv0): SDK.MintDistributionUpdate {
    return {
        updateType: SDK.UpdateType.MintDistribution,
        update: {
            version: 0,
            bakingReward: trAmountFraction(mintDist.bakingReward),
            finalizationReward: trAmountFraction(mintDist.finalizationReward),
            mintPerSlot: trMintRate(mintDist.mintPerSlot),
        },
    };
}

function trMintDistributionCpv1Update(mintDist: GRPC.MintDistributionCpv1): SDK.MintDistributionUpdate {
    return {
        updateType: SDK.UpdateType.MintDistribution,
        update: {
            version: 1,
            bakingReward: trAmountFraction(mintDist.bakingReward),
            finalizationReward: trAmountFraction(mintDist.finalizationReward),
        },
    };
}

export function pendingUpdate(pendingUpdate: GRPC.PendingUpdate): SDK.PendingUpdate {
    return {
        effectiveTime: Timestamp.fromProto(unwrap(pendingUpdate.effectiveTime)),
        effect: trPendingUpdateEffect(pendingUpdate),
    };
}

export function trPendingUpdateEffect(pendingUpdate: GRPC.PendingUpdate): Upward<SDK.PendingUpdateEffect> {
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
                updateType: SDK.UpdateType.HigherLevelKeyUpdate,
                update: {
                    typeOfUpdate: SDK.HigherLevelKeyUpdateType.RootKeysUpdate,
                    updateKeys: effect.rootKeys.keys.map(trUpdatePublicKey),
                    threshold: unwrap(effect.rootKeys.threshold?.value),
                },
            };
        case 'level1Keys':
            return {
                updateType: SDK.UpdateType.HigherLevelKeyUpdate,
                update: {
                    typeOfUpdate: SDK.HigherLevelKeyUpdateType.Level1KeysUpdate,
                    updateKeys: effect.level1Keys.keys.map(trUpdatePublicKey),
                    threshold: unwrap(effect.level1Keys.threshold?.value),
                },
            };
        case 'level2KeysCpv0':
            return {
                updateType: SDK.UpdateType.AuthorizationKeysUpdate,
                update: {
                    typeOfUpdate: SDK.AuthorizationKeysUpdateType.Level2KeysUpdate,
                    updatePayload: trAuthorizationsV0(effect.level2KeysCpv0),
                },
            };
        case 'level2KeysCpv1':
            return {
                updateType: SDK.UpdateType.AuthorizationKeysUpdate,
                update: {
                    typeOfUpdate: SDK.AuthorizationKeysUpdateType.Level2KeysUpdateV1,
                    updatePayload: trAuthorizationsV1(effect.level2KeysCpv1),
                },
            };
        case 'validatorScoreParameters':
            return {
                updateType: SDK.UpdateType.ValidatorScoreParameters,
                update: {
                    maxMissedRounds: effect.validatorScoreParameters.maximumMissedRounds,
                },
            };
        case undefined:
            return null;
    }
}

function trUpdatePayload(updatePayload: GRPC.UpdatePayload | undefined): Upward<SDK.UpdateInstructionPayload> {
    if (updatePayload === undefined) {
        throw new Error('Unexpected missing update payload');
    }

    const payload = updatePayload.payload;
    switch (payload.oneofKind) {
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
                updateType: SDK.UpdateType.Root,
                update: keyUpdate,
            };
        }
        case 'level1Update': {
            const lvl1Update = payload.level1Update;
            const keyUpdate = trKeyUpdate(lvl1Update);
            return {
                updateType: SDK.UpdateType.Level1,
                update: keyUpdate,
            };
        }
        case 'validatorScoreParametersUpdate': {
            return {
                updateType: SDK.UpdateType.ValidatorScoreParameters,
                update: {
                    maxMissedRounds: payload.validatorScoreParametersUpdate.maximumMissedRounds,
                },
            };
        }
        case 'createPltUpdate':
            return {
                updateType: SDK.UpdateType.CreatePLT,
                update: {
                    tokenId: PLT.TokenId.fromProto(unwrap(payload.createPltUpdate.tokenId)),
                    moduleRef: PLT.TokenModuleReference.fromProto(unwrap(payload.createPltUpdate.tokenModule)),
                    decimals: payload.createPltUpdate.decimals,
                    initializationParameters: PLT.Cbor.fromProto(
                        unwrap(payload.createPltUpdate.initializationParameters)
                    ),
                },
            };
        case undefined:
            return null;
    }
}

function trCommissionRange(range: GRPC.InclusiveRangeAmountFraction | undefined): SDK.InclusiveRange<number> {
    return {
        min: trAmountFraction(range?.min),
        max: trAmountFraction(range?.max),
    };
}
function trUpdatePublicKey(key: GRPC.UpdatePublicKey): SDK.UpdatePublicKey {
    return {
        verifyKey: unwrapValToHex(key),
    };
}

function trAccessStructure(auths: GRPC.AccessStructure | undefined): SDK.Authorization {
    return {
        authorizedKeys: unwrap(auths).accessPublicKeys.map((key) => key.value),
        threshold: unwrap(auths?.accessThreshold?.value),
    };
}

function trOptionalAccessStructure(auths: GRPC.AccessStructure | undefined): SDK.Authorization | undefined {
    if (auths === undefined) {
        return undefined;
    }

    return {
        authorizedKeys: auths.accessPublicKeys.map((key) => key.value),
        threshold: unwrap(auths.accessThreshold?.value),
    };
}

function trKeyUpdate(keyUpdate: GRPC.RootUpdate | GRPC.Level1Update): SDK.KeyUpdate {
    switch (keyUpdate.updateType.oneofKind) {
        case 'rootKeysUpdate': {
            const update = keyUpdate.updateType.rootKeysUpdate;
            return {
                typeOfUpdate: SDK.HigherLevelKeyUpdateType.RootKeysUpdate,
                updateKeys: update.keys.map(trUpdatePublicKey),
                threshold: unwrap(update.threshold?.value),
            };
        }
        case 'level1KeysUpdate': {
            const update = keyUpdate.updateType.level1KeysUpdate;
            return {
                typeOfUpdate: SDK.HigherLevelKeyUpdateType.Level1KeysUpdate,
                updateKeys: update.keys.map(trUpdatePublicKey),
                threshold: unwrap(update.threshold?.value),
            };
        }
        case 'level2KeysUpdateV0': {
            const update = keyUpdate.updateType.level2KeysUpdateV0;
            return {
                typeOfUpdate: SDK.AuthorizationKeysUpdateType.Level2KeysUpdate,
                updatePayload: trAuthorizationsV0(update),
            };
        }
        case 'level2KeysUpdateV1': {
            const update = keyUpdate.updateType.level2KeysUpdateV1;
            const v0 = unwrap(update.v0);
            return {
                typeOfUpdate: SDK.AuthorizationKeysUpdateType.Level2KeysUpdateV1,
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

function trAuthorizationsV0(auths: GRPC.AuthorizationsV0): SDK.AuthorizationsV0 {
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

function trAuthorizationsV1(auths: GRPC.AuthorizationsV1): SDK.AuthorizationsV1 {
    return {
        ...trAuthorizationsV0(unwrap(auths.v0)),
        version: 1,
        cooldownParameters: trAccessStructure(auths.parameterCooldown),
        timeParameters: trAccessStructure(auths.parameterTime),
        createPlt: trOptionalAccessStructure(auths.createPlt),
    };
}

function trMemoEvent(memo: GRPC_Kernel.Memo): SDK.MemoEvent {
    return {
        tag: SDK.TransactionEventTag.TransferMemo,
        memo: unwrapValToHex(memo),
    };
}

function trTransactionType(type?: GRPC.TransactionType): SDK.TransactionKindString | undefined {
    switch (type) {
        case GRPC.TransactionType.DEPLOY_MODULE:
            return SDK.TransactionKindString.DeployModule;
        case GRPC.TransactionType.INIT_CONTRACT:
            return SDK.TransactionKindString.InitContract;
        case GRPC.TransactionType.UPDATE:
            return SDK.TransactionKindString.Update;
        case GRPC.TransactionType.TRANSFER:
            return SDK.TransactionKindString.Transfer;
        case GRPC.TransactionType.ADD_BAKER:
            return SDK.TransactionKindString.AddBaker;
        case GRPC.TransactionType.REMOVE_BAKER:
            return SDK.TransactionKindString.RemoveBaker;
        case GRPC.TransactionType.UPDATE_BAKER_STAKE:
            return SDK.TransactionKindString.UpdateBakerStake;
        case GRPC.TransactionType.UPDATE_BAKER_RESTAKE_EARNINGS:
            return SDK.TransactionKindString.UpdateBakerRestakeEarnings;
        case GRPC.TransactionType.UPDATE_BAKER_KEYS:
            return SDK.TransactionKindString.UpdateBakerKeys;
        case GRPC.TransactionType.UPDATE_CREDENTIAL_KEYS:
            return SDK.TransactionKindString.UpdateCredentialKeys;
        case GRPC.TransactionType.ENCRYPTED_AMOUNT_TRANSFER:
            return SDK.TransactionKindString.EncryptedAmountTransfer;
        case GRPC.TransactionType.TRANSFER_TO_ENCRYPTED:
            return SDK.TransactionKindString.TransferToEncrypted;
        case GRPC.TransactionType.TRANSFER_TO_PUBLIC:
            return SDK.TransactionKindString.TransferToPublic;
        case GRPC.TransactionType.TRANSFER_WITH_SCHEDULE:
            return SDK.TransactionKindString.TransferWithSchedule;
        case GRPC.TransactionType.UPDATE_CREDENTIALS:
            return SDK.TransactionKindString.UpdateCredentials;
        case GRPC.TransactionType.REGISTER_DATA:
            return SDK.TransactionKindString.RegisterData;
        case GRPC.TransactionType.TRANSFER_WITH_MEMO:
            return SDK.TransactionKindString.TransferWithMemo;
        case GRPC.TransactionType.ENCRYPTED_AMOUNT_TRANSFER_WITH_MEMO:
            return SDK.TransactionKindString.EncryptedAmountTransferWithMemo;
        case GRPC.TransactionType.TRANSFER_WITH_SCHEDULE_AND_MEMO:
            return SDK.TransactionKindString.TransferWithScheduleAndMemo;
        case GRPC.TransactionType.CONFIGURE_BAKER:
            return SDK.TransactionKindString.ConfigureBaker;
        case GRPC.TransactionType.CONFIGURE_DELEGATION:
            return SDK.TransactionKindString.ConfigureDelegation;
        case GRPC.TransactionType.TOKEN_UPDATE:
            return SDK.TransactionKindString.TokenUpdate;
        case undefined:
            return undefined;
    }
}

function trAccountTransactionSummary(
    details: GRPC.AccountTransactionDetails,
    baseBlockItemSummary: SDK.BaseBlockItemSummary
): SDK.AccountTransactionSummary {
    const base: SDK.BaseAccountTransactionSummary = {
        ...baseBlockItemSummary,
        type: SDK.TransactionSummaryType.AccountTransaction,
        cost: unwrap(details.cost?.value),
        sender: AccountAddress.fromProto(unwrap(details.sender)),
    };

    const effect = unwrap(details.effects?.effect);
    switch (effect.oneofKind) {
        case 'none':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.Failed,
                failedTransactionType: trTransactionType(effect.none.transactionType),
                rejectReason: trRejectReason(effect.none.rejectReason),
            };
        case 'moduleDeployed': {
            const event: SDK.ModuleDeployedEvent = {
                tag: SDK.TransactionEventTag.ModuleDeployed,
                contents: unwrapValToHex(effect.moduleDeployed),
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.DeployModule,
                moduleDeployed: event,
            };
        }
        case 'contractInitialized': {
            const contractInit = effect.contractInitialized;
            const event: SDK.ContractInitializedEvent = {
                tag: SDK.TransactionEventTag.ContractInitialized,
                address: ContractAddress.fromProto(unwrap(contractInit.address)),
                amount: CcdAmount.fromProto(unwrap(contractInit.amount)),
                initName: InitName.fromProto(unwrap(contractInit.initName)),
                events: unwrap(contractInit.events.map(unwrapValToHex)),
                contractVersion: unwrap(contractInit.contractVersion),
                ref: unwrapValToHex(contractInit.originRef),
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.InitContract,
                contractInitialized: event,
            };
        }
        case 'contractUpdateIssued':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.Update,
                events: effect.contractUpdateIssued.effects.map(trContractTraceElement),
            };
        case 'accountTransfer': {
            const transfer: SDK.AccountTransferredEvent = {
                tag: SDK.TransactionEventTag.Transferred,
                amount: CcdAmount.fromProto(unwrap(effect.accountTransfer.amount)),
                to: AccountAddress.fromProto(unwrap(effect.accountTransfer.receiver)),
            };
            if (effect.accountTransfer.memo) {
                return {
                    ...base,
                    transactionType: SDK.TransactionKindString.TransferWithMemo,
                    transfer,
                    memo: trMemoEvent(effect.accountTransfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: SDK.TransactionKindString.Transfer,
                    transfer,
                };
            }
        }
        case 'bakerAdded':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.AddBaker,
                bakerAdded: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as SDK.BakerAddedEvent,
            };
        case 'bakerRemoved':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.RemoveBaker,
                bakerRemoved: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as SDK.BakerRemovedEvent,
            };
        case 'bakerRestakeEarningsUpdated':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.UpdateBakerRestakeEarnings,
                bakerRestakeEarningsUpdated: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as SDK.BakerSetRestakeEarningsEvent,
            };
        case 'bakerKeysUpdated':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.UpdateBakerKeys,
                bakerKeysUpdated: trBakerEvent(
                    {
                        event: effect,
                    },
                    base.sender
                ) as SDK.BakerKeysUpdatedEvent,
            };
        case 'bakerStakeUpdated': {
            const increased = effect.bakerStakeUpdated.update?.increased;
            const update = effect.bakerStakeUpdated.update;
            const event: SDK.BakerStakeChangedEvent = {
                tag: increased
                    ? SDK.TransactionEventTag.BakerStakeIncreased
                    : SDK.TransactionEventTag.BakerStakeDecreased,
                bakerId: unwrap(update?.bakerId?.value),
                newStake: CcdAmount.fromProto(unwrap(update?.newStake)),
                account: base.sender,
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.UpdateBakerStake,
                bakerStakeChanged: event,
            };
        }
        case 'encryptedAmountTransferred': {
            const transfer = effect.encryptedAmountTransferred;
            const removed: SDK.EncryptedAmountsRemovedEvent = {
                tag: SDK.TransactionEventTag.EncryptedAmountsRemoved,
                inputAmount: unwrapValToHex(transfer.removed?.inputAmount),
                newAmount: unwrapValToHex(transfer.removed?.newAmount),
                upToIndex: Number(unwrap(transfer.removed?.upToIndex)),
                account: base.sender,
            };
            const added: SDK.NewEncryptedAmountEvent = {
                tag: SDK.TransactionEventTag.NewEncryptedAmount,
                account: AccountAddress.fromProto(unwrap(transfer.added?.receiver)),
                newIndex: Number(unwrap(transfer.added?.newIndex)),
                encryptedAmount: unwrapValToHex(transfer.added?.encryptedAmount),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType: SDK.TransactionKindString.EncryptedAmountTransferWithMemo,
                    removed,
                    added,
                    memo: trMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: SDK.TransactionKindString.EncryptedAmountTransfer,
                    removed,
                    added,
                };
            }
        }
        case 'transferredToEncrypted': {
            const transfer = effect.transferredToEncrypted;
            const added: SDK.EncryptedSelfAmountAddedEvent = {
                tag: SDK.TransactionEventTag.EncryptedSelfAmountAdded,
                account: AccountAddress.fromProto(unwrap(transfer.account)),
                amount: CcdAmount.fromProto(unwrap(transfer.amount)),
                newAmount: unwrapValToHex(transfer.newAmount),
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.TransferToEncrypted,
                added,
            };
        }
        case 'transferredToPublic': {
            const transfer = effect.transferredToPublic;
            const removed: SDK.EncryptedAmountsRemovedEvent = {
                tag: SDK.TransactionEventTag.EncryptedAmountsRemoved,
                account: base.sender,
                inputAmount: unwrapValToHex(transfer.removed?.inputAmount),
                newAmount: unwrapValToHex(transfer.removed?.newAmount),
                upToIndex: Number(unwrap(transfer.removed?.upToIndex)),
            };
            const added: SDK.AmountAddedByDecryptionEvent = {
                tag: SDK.TransactionEventTag.AmountAddedByDecryption,
                account: base.sender,
                amount: CcdAmount.fromProto(unwrap(transfer.amount)),
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.TransferToPublic,
                removed,
                added,
            };
        }
        case 'transferredWithSchedule': {
            const transfer = effect.transferredWithSchedule;
            const event: SDK.TransferredWithScheduleEvent = {
                tag: SDK.TransactionEventTag.TransferredWithSchedule,
                to: AccountAddress.fromProto(unwrap(transfer.receiver)),
                amount: transfer.amount.map(trNewRelease),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType: SDK.TransactionKindString.TransferWithScheduleAndMemo,
                    transfer: event,
                    memo: trMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: SDK.TransactionKindString.TransferWithSchedule,
                    event,
                };
            }
        }
        case 'credentialKeysUpdated': {
            const event: SDK.CredentialKeysUpdatedEvent = {
                tag: SDK.TransactionEventTag.CredentialKeysUpdated,
                credId: unwrapValToHex(effect.credentialKeysUpdated),
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.UpdateCredentialKeys,
                keysUpdated: event,
            };
        }
        case 'credentialsUpdated': {
            const update = effect.credentialsUpdated;
            const event: SDK.CredentialsUpdatedEvent = {
                tag: SDK.TransactionEventTag.CredentialsUpdated,
                newCredIds: update.newCredIds.map(unwrapValToHex),
                removedCredIds: update.removedCredIds.map(unwrapValToHex),
                newThreshold: unwrap(update.newThreshold?.value),
                account: base.sender,
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.UpdateCredentials,
                credentialsUpdated: event,
            };
        }
        case 'dataRegistered': {
            const event: SDK.DataRegisteredEvent = {
                tag: SDK.TransactionEventTag.DataRegistered,
                data: unwrapValToHex(effect.dataRegistered),
            };
            return {
                ...base,
                transactionType: SDK.TransactionKindString.RegisterData,
                dataRegistered: event,
            };
        }
        case 'bakerConfigured':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.ConfigureBaker,
                events: effect.bakerConfigured.events.map((event) => trBakerEvent(event, base.sender)),
            };
        case 'delegationConfigured':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.ConfigureDelegation,
                events: effect.delegationConfigured.events.map((x) => trDelegationEvent(x, base.sender)),
            };
        case 'tokenUpdateEffect':
            return {
                ...base,
                transactionType: SDK.TransactionKindString.TokenUpdate,
                events: effect.tokenUpdateEffect.events.map(tokenEvent),
            };
        case undefined:
            throw Error('Failed translating AccountTransactionEffects, encountered undefined value');
    }
}

function tokenEvent(event: GRPC_PLT.TokenEvent): Upward<TokenEvent> {
    switch (event.event.oneofKind) {
        case 'transferEvent':
            const transferEvent: TokenTransferEvent = {
                tag: TransactionEventTag.TokenTransfer,
                tokenId: PLT.TokenId.fromProto(unwrap(event.tokenId)),
                from: PLT.TokenHolder.fromProto(unwrap(event.event.transferEvent.from)),
                to: PLT.TokenHolder.fromProto(unwrap(event.event.transferEvent.to)),
                amount: PLT.TokenAmount.fromProto(unwrap(event.event.transferEvent.amount)),
            };
            if (event.event.transferEvent.memo) {
                transferEvent.memo = PLT.CborMemo.fromProto(unwrap(event.event.transferEvent.memo));
            }

            return transferEvent;
        case 'moduleEvent':
            return {
                tag: TransactionEventTag.TokenModuleEvent,
                tokenId: PLT.TokenId.fromProto(unwrap(event.tokenId)),
                type: event.event.moduleEvent.type,
                details: PLT.Cbor.fromProto(unwrap(event.event.moduleEvent.details)),
            };
        case 'mintEvent':
            return {
                tag: TransactionEventTag.TokenMint,
                tokenId: PLT.TokenId.fromProto(unwrap(event.tokenId)),
                amount: PLT.TokenAmount.fromProto(unwrap(event.event.mintEvent.amount)),
                target: PLT.TokenHolder.fromProto(unwrap(event.event.mintEvent.target)),
            };
        case 'burnEvent':
            return {
                tag: TransactionEventTag.TokenBurn,
                tokenId: PLT.TokenId.fromProto(unwrap(event.tokenId)),
                amount: PLT.TokenAmount.fromProto(unwrap(event.event.burnEvent.amount)),
                target: PLT.TokenHolder.fromProto(unwrap(event.event.burnEvent.target)),
            };
        case undefined:
            return null;
    }
}

function trCreatePltPayload(payload: GRPC_PLT.CreatePLT): PLT.CreatePLTPayload {
    return {
        tokenId: PLT.TokenId.fromProto(unwrap(payload.tokenId)),
        decimals: payload.decimals,
        moduleRef: PLT.TokenModuleReference.fromProto(unwrap(payload.tokenModule)),
        initializationParameters: PLT.Cbor.fromProto(unwrap(payload.initializationParameters)),
    };
}

export function blockItemSummary(summary: GRPC.BlockItemSummary): Upward<SDK.BlockItemSummary> {
    const base = {
        index: unwrap(summary.index?.value),
        energyCost: Energy.fromProto(unwrap(summary.energyCost)),
        hash: TransactionHash.fromProto(unwrap(summary.hash)),
    };
    switch (summary.details.oneofKind) {
        case 'accountTransaction':
            return trAccountTransactionSummary(summary.details.accountTransaction, base);
        case 'accountCreation':
            return {
                type: SDK.TransactionSummaryType.AccountCreation,
                ...base,
                credentialType:
                    summary.details.accountCreation.credentialType === GRPC.CredentialType.INITIAL
                        ? 'initial'
                        : 'normal',
                address: AccountAddress.fromProto(unwrap(summary.details.accountCreation.address)),
                regId: unwrapValToHex(summary.details.accountCreation.regId),
            };
        case 'update':
            return {
                type: SDK.TransactionSummaryType.UpdateTransaction,
                ...base,
                effectiveTime: unwrap(summary.details.update.effectiveTime?.value),
                payload: trUpdatePayload(summary.details.update.payload),
            };
        case 'tokenCreation':
            return {
                type: SDK.TransactionSummaryType.TokenCreation,
                ...base,
                payload: trCreatePltPayload(unwrap(summary.details.tokenCreation.createPlt)),
                events: summary.details.tokenCreation.events.map(tokenEvent),
            };
        case undefined:
            return null;
    }
}

function trBlockItemSummaryInBlock(summary: GRPC.BlockItemSummaryInBlock): SDK.BlockItemSummaryInBlock {
    return {
        blockHash: BlockHash.fromProto(unwrap(summary.blockHash)),
        summary: blockItemSummary(unwrap(summary.outcome)),
    };
}

export function blockItemStatus(itemStatus: GRPC.BlockItemStatus): SDK.BlockItemStatus {
    switch (itemStatus.status.oneofKind) {
        case 'received':
            return {
                status: SDK.TransactionStatusEnum.Received,
            };
        case 'committed':
            return {
                status: SDK.TransactionStatusEnum.Committed,
                outcomes: itemStatus.status.committed.outcomes.map(trBlockItemSummaryInBlock),
            };
        case 'finalized':
            return {
                status: SDK.TransactionStatusEnum.Finalized,
                outcome: trBlockItemSummaryInBlock(unwrap(itemStatus.status.finalized.outcome)),
            };
        default:
            throw Error('BlockItemStatus was undefined!');
    }
}

export function invokeInstanceResponse(invokeResponse: GRPC.InvokeInstanceResponse): SDK.InvokeContractResult {
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

function trInstanceInfoCommon(
    info: GRPC.InstanceInfo_V0 | GRPC.InstanceInfo_V1
): Omit<SDK.InstanceInfoCommon, 'version'> {
    return {
        amount: CcdAmount.fromProto(unwrap(info.amount)),
        sourceModule: ModuleReference.fromProto(unwrap(info.sourceModule)),
        owner: AccountAddress.fromBuffer(unwrap(info.owner?.value)),
        methods: info.methods.map(ReceiveName.fromProto),
        name: InitName.fromProto(unwrap(info.name)),
    };
}

export function instanceInfo(instanceInfo: GRPC.InstanceInfo): SDK.InstanceInfo {
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

export function commonBlockInfo(blockInfo: GRPC.ArrivedBlockInfo | GRPC.FinalizedBlockInfo): SDK.CommonBlockInfo {
    return {
        hash: BlockHash.fromProto(unwrap(blockInfo.hash)),
        height: unwrap(blockInfo.height?.value),
    };
}

export function instanceStateKVPair(state: GRPC.InstanceStateKVPair): SDK.InstanceStateKVPair {
    return {
        key: unwrapToHex(state.key),
        value: unwrapToHex(state.value),
    };
}

export function ipInfo(ip: GRPC.IpInfo): SDK.IpInfo {
    return {
        ipIdentity: unwrap(ip.identity?.value),
        ipDescription: unwrap(ip.description),
        ipVerifyKey: unwrapValToHex(ip.verifyKey),
        ipCdiVerifyKey: unwrapValToHex(ip.cdiVerifyKey),
    };
}

export function arInfo(ar: GRPC.ArInfo): SDK.ArInfo {
    return {
        arIdentity: unwrap(ar.identity?.value),
        arDescription: unwrap(ar.description),
        arPublicKey: unwrapValToHex(ar.publicKey),
    };
}

export function blocksAtHeightResponse(blocks: GRPC.BlocksAtHeightResponse): BlockHash.Type[] {
    return blocks.blocks.map(BlockHash.fromProto);
}

export function blockInfo(blockInfo: GRPC.BlockInfo): SDK.BlockInfo {
    const common: SDK.BlockInfoCommon = {
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

    if (blockInfo.protocolVersion < GRPC.ProtocolVersion.PROTOCOL_VERSION_6) {
        const bi0: SDK.BlockInfoV0 = {
            ...common,
            version: 0,
            blockSlot: unwrap(blockInfo.slotNumber?.value),
        };

        return bi0;
    }

    const bi1: SDK.BlockInfoV1 = {
        ...common,
        version: 1,
        round: unwrap(blockInfo.round?.value),
        epoch: unwrap(blockInfo.epoch?.value),
    };

    return bi1;
}

export function delegatorInfo(delegatorInfo: GRPC.DelegatorInfo): SDK.DelegatorInfo {
    return {
        account: AccountAddress.fromProto(unwrap(delegatorInfo.account)),
        stake: CcdAmount.fromProto(unwrap(delegatorInfo.stake)),
        ...(delegatorInfo.pendingChange && {
            pendingChange: trPendingChange(delegatorInfo.pendingChange),
        }),
    };
}

export function branch(branchV2: GRPC.Branch): SDK.Branch {
    return {
        blockHash: BlockHash.fromProto(unwrap(branchV2.blockHash)),
        children: branchV2.children.map(branch),
    };
}

function trBakerElectionInfo(bakerElectionInfo: GRPC.ElectionInfo_Baker): SDK.BakerElectionInfo {
    return {
        baker: unwrap(bakerElectionInfo.baker?.value),
        account: AccountAddress.fromProto(unwrap(bakerElectionInfo.account)),
        lotteryPower: bakerElectionInfo.lotteryPower,
    };
}

export function electionInfo(electionInfo: GRPC.ElectionInfo): SDK.ElectionInfo {
    const common: SDK.ElectionInfoCommon = {
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

export function nextUpdateSequenceNumbers(nextNums: GRPC.NextUpdateSequenceNumbers): SDK.NextUpdateSequenceNumbers {
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
        // We fall back to be backwards compatible.
        validatorScoreParameters: nextNums.validatorScoreParameters?.value ?? 1n,
        protocolLevelTokens: nextNums.protocolLevelTokens?.value ?? 1n,
    };
}

function trPassiveCommitteeInfo(
    passiveCommitteeInfo: GRPC.NodeInfo_BakerConsensusInfo_PassiveCommitteeInfo
): Upward<SDK.PassiveCommitteeInfo> {
    const passiveCommitteeInfoV2 = GRPC.NodeInfo_BakerConsensusInfo_PassiveCommitteeInfo;
    switch (passiveCommitteeInfo) {
        case passiveCommitteeInfoV2.NOT_IN_COMMITTEE:
            return SDK.PassiveCommitteeInfo.NotInCommittee;
        case passiveCommitteeInfoV2.ADDED_BUT_NOT_ACTIVE_IN_COMMITTEE:
            return SDK.PassiveCommitteeInfo.AddedButNotActiveInCommittee;
        case passiveCommitteeInfoV2.ADDED_BUT_WRONG_KEYS:
            return SDK.PassiveCommitteeInfo.AddedButWrongKeys;
        case undefined:
            return null;
    }
}

function trBakerConsensusInfoStatus(consensusInfo: GRPC.NodeInfo_BakerConsensusInfo): SDK.BakerConsensusInfoStatus {
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

function trNetworkInfo(networkInfo: GRPC.NodeInfo_NetworkInfo | undefined): SDK.NodeNetworkInfo {
    return {
        nodeId: unwrap(networkInfo?.nodeId?.value),
        peerTotalSent: unwrap(networkInfo?.peerTotalSent),
        peerTotalReceived: unwrap(networkInfo?.peerTotalReceived),
        avgBpsIn: unwrap(networkInfo?.avgBpsIn),
        avgBpsOut: unwrap(networkInfo?.avgBpsOut),
    };
}

export function trNodeInfo_Node(node: GRPC.NodeInfo_Node): SDK.NodeInfoConsensusStatus {
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

export function nodeInfo(nodeInfo: GRPC.NodeInfo): SDK.NodeInfo {
    let details: SDK.NodeInfoDetails;
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

function trCatchupStatus(catchupStatus: GRPC.PeersInfo_Peer_CatchupStatus): Upward<SDK.NodeCatchupStatus> {
    const CatchupStatus = GRPC.PeersInfo_Peer_CatchupStatus;
    switch (catchupStatus) {
        case CatchupStatus.CATCHINGUP:
            return SDK.NodeCatchupStatus.CatchingUp;
        case CatchupStatus.PENDING:
            return SDK.NodeCatchupStatus.Pending;
        case CatchupStatus.UPTODATE:
            return SDK.NodeCatchupStatus.UpToDate;
        case undefined:
            return null;
    }
}

function trPeerNetworkStats(networkStats: GRPC.PeersInfo_Peer_NetworkStats | undefined): SDK.PeerNetworkStats {
    return {
        packetsSent: unwrap(networkStats?.packetsSent),
        packetsReceived: unwrap(networkStats?.packetsReceived),
        latency: unwrap(networkStats?.latency),
    };
}

export function peerInfo(peerInfo: GRPC.PeersInfo_Peer): SDK.PeerInfo {
    let consensusInfo: SDK.PeerConsensusInfo;
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

function trAccountAmount(
    accountAmount: GRPC.BlockSpecialEvent_AccountAmounts_Entry
): SDK.BlockSpecialEventAccountAmount {
    return {
        account: AccountAddress.fromProto(unwrap(accountAmount.account)),
        amount: CcdAmount.fromProto(unwrap(accountAmount.amount)),
    };
}

export function blockSpecialEvent(specialEvent: GRPC.BlockSpecialEvent): Upward<SDK.BlockSpecialEvent> {
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
        case 'validatorSuspended': {
            return {
                tag: 'validatorSuspended',
                account: AccountAddress.fromProto(unwrap(event.validatorSuspended.account)),
                bakerId: unwrap(event.validatorSuspended.bakerId?.value),
            };
        }
        case 'validatorPrimedForSuspension': {
            return {
                tag: 'validatorPrimedForSuspension',
                account: AccountAddress.fromProto(unwrap(event.validatorPrimedForSuspension.account)),
                bakerId: unwrap(event.validatorPrimedForSuspension.bakerId?.value),
            };
        }
        case undefined: {
            return null;
        }
    }
}

function trFinalizationSummaryParty(party: GRPC.FinalizationSummaryParty): SDK.FinalizationSummaryParty {
    return {
        baker: unwrap(party.baker?.value),
        weight: party.weight,
        signed: party.signed,
    };
}

function trFinalizationSummary(summary: GRPC.FinalizationSummary): SDK.FinalizationSummary {
    return {
        block: BlockHash.fromProto(unwrap(summary.block)),
        index: unwrap(summary.index?.value),
        delay: unwrap(summary.delay?.value),
        finalizers: summary.finalizers.map(trFinalizationSummaryParty),
    };
}

export function blockFinalizationSummary(
    finalizationSummary: GRPC.BlockFinalizationSummary
): SDK.BlockFinalizationSummary {
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

export function blockCertificates(certs: GRPC.BlockCertificates): SDK.BlockCertificates {
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

export function quorumCertificate(cert: GRPC.QuorumCertificate): SDK.QuorumCertificate {
    return {
        blockHash: unwrapValToHex(cert.blockHash),
        round: unwrap(cert.round?.value),
        epoch: unwrap(cert.epoch?.value),
        aggregateSignature: unwrapValToHex(cert.aggregateSignature),
        signatories: cert.signatories.map((x) => unwrap(x.value)),
    };
}

export function timeoutCertificate(cert: GRPC.TimeoutCertificate): SDK.TimeoutCertificate {
    return {
        round: unwrap(cert.round?.value),
        minEpoch: unwrap(cert.minEpoch?.value),
        qcRoundsFirstEpoch: cert.qcRoundsFirstEpoch.map(finalizerRound),
        qcRoundsSecondEpoch: cert.qcRoundsSecondEpoch.map(finalizerRound),
        aggregateSignature: unwrapValToHex(cert.aggregateSignature),
    };
}

export function epochFinalizationEntry(cert: GRPC.EpochFinalizationEntry): SDK.EpochFinalizationEntry {
    return {
        finalizedQc: quorumCertificate(unwrap(cert.finalizedQc)),
        successorQc: quorumCertificate(unwrap(cert.successorQc)),
        successorProof: unwrapValToHex(cert.successorProof),
    };
}

export function finalizerRound(round: GRPC.FinalizerRound): SDK.FinalizerRound {
    return {
        round: unwrap(round.round?.value),
        finalizers: round.finalizers.map((x) => x.value),
    };
}

export function bakerRewardPeriodInfo(bakerRewardPeriod: GRPC.BakerRewardPeriodInfo): SDK.BakerRewardPeriodInfo {
    return {
        baker: bakerInfo(unwrap(bakerRewardPeriod.baker)),
        effectiveStake: CcdAmount.fromMicroCcd(unwrap(bakerRewardPeriod.effectiveStake?.value)),
        commissionRates: trCommissionRates(bakerRewardPeriod.commissionRates),
        equityCapital: CcdAmount.fromMicroCcd(unwrap(bakerRewardPeriod.equityCapital?.value)),
        delegatedCapital: CcdAmount.fromMicroCcd(unwrap(bakerRewardPeriod.delegatedCapital?.value)),
        isFinalizer: bakerRewardPeriod.isFinalizer,
    };
}

export function bakerInfo(bakerInfo: GRPC.BakerInfo): SDK.BakerInfo {
    return {
        bakerId: unwrap(bakerInfo.bakerId?.value),
        electionKey: unwrapValToHex(bakerInfo.electionKey),
        signatureKey: unwrapValToHex(bakerInfo.signatureKey),
        aggregationKey: unwrapValToHex(bakerInfo.aggregationKey),
    };
}

export function winningBaker(winningBaker: GRPC.WinningBaker): SDK.WinningBaker {
    return {
        round: unwrap(winningBaker.round?.value),
        winner: unwrap(winningBaker.winner?.value),
        present: winningBaker.present,
    };
}

export function trTokenInfo(tokenInfo: GRPC.TokenInfo): PLT.TokenInfo {
    const state: PLT.TokenState = {
        decimals: unwrap(tokenInfo.tokenState?.decimals),
        moduleRef: PLT.TokenModuleReference.fromProto(unwrap(tokenInfo.tokenState?.tokenModuleRef)),
        totalSupply: PLT.TokenAmount.fromProto(unwrap(tokenInfo.tokenState?.totalSupply)),
        moduleState: PLT.Cbor.fromProto(unwrap(tokenInfo.tokenState?.moduleState)),
    };
    return {
        id: PLT.TokenId.fromProto(unwrap(tokenInfo.tokenId)),
        state,
    };
}

// ---------------------------- //
// --- V1 => V2 translation --- //
// ---------------------------- //

export function accountTransactionSignatureToV2(
    signature: SDK.AccountTransactionSignature
): GRPC.AccountTransactionSignature {
    function trSig(a: string): GRPC.Signature {
        return { value: Buffer.from(a, 'hex') };
    }
    function trCredSig(a: SDK.CredentialSignature): GRPC.AccountSignatureMap {
        return { signatures: mapRecord(a, trSig) };
    }

    return { signatures: mapRecord(signature, trCredSig) };
}

export function BlocksAtHeightRequestToV2(request: SDK.BlocksAtHeightRequest): GRPC.BlocksAtHeightRequest {
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
