import * as v1 from './types';
import * as v2 from '../grpc/v2/concordium/types';
import { mapRecord, unwrap } from './util';
import { Buffer } from 'buffer/';
import bs58check from 'bs58check';
import { AccountAddress } from './types/accountAddress';
import { ModuleReference } from './types/moduleReference';
import { CcdAmount } from './types/ccdAmount';
import { Base58String } from './types';

function unwrapToHex(bytes: Uint8Array | undefined): v1.HexString {
    return Buffer.from(unwrap(bytes)).toString('hex');
}

export function unwrapValToHex(x: { value: Uint8Array } | undefined): string {
    return unwrapToHex(unwrap(x).value);
}

export function unwrapToBase58(
    address: v2.AccountAddress | undefined
): v1.Base58String {
    return bs58check.encode(
        Buffer.concat([Buffer.of(1), unwrap(address?.value)])
    );
}

function trRelease(release: v2.Release): v1.ReleaseScheduleWithTransactions {
    return {
        timestamp: trTimestamp(release.timestamp),
        amount: unwrap(release.amount?.value),
        transactions: release.transactions.map(unwrapValToHex),
    };
}

function trNewRelease(release: v2.NewRelease): v1.ReleaseSchedule {
    return {
        timestamp: trTimestamp(release.timestamp),
        amount: unwrap(release.amount?.value),
    };
}

function trDate(ym: v2.YearMonth): string {
    return String(ym.year) + String(ym.month).padStart(2, '0');
}

function trAttKey(attributeKey: number): v1.AttributeKey {
    return v1.AttributesKeys[attributeKey] as v1.AttributeKey;
}

function trCommits(
    cmm: v2.CredentialCommitments
): v1.CredentialDeploymentCommitments {
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
        throw Error(
            'AccountVerifyKey was expected to be of type "ed25519Key", but found' +
                verifyKey.key.oneofKind
        );
    }
}

function trCredKeys(
    credKeys: v2.CredentialPublicKeys
): v1.CredentialPublicKeys {
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

function trCommissionRates(
    rates: v2.CommissionRates | undefined
): v1.CommissionRates {
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
        revealedAttributes: mapRecord(
            credVals.policy?.attributes,
            unwrapToHex,
            trAttKey
        ),
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
            'DelegatorTarget expected to be of type "passive" or "baker", but found ' +
                target.target.oneofKind
        );
    }
}

function trTimestamp(timestamp: v2.Timestamp | undefined): Date {
    return new Date(Number(unwrap(timestamp?.value)));
}

function trPendingChange(
    pendingChange: v2.StakePendingChange | undefined
): v1.StakePendingChangeV1 {
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
            change: v1.StakePendingChangeType.RemoveStakeV1,
        };
    } else {
        throw Error(
            'PendingChange expected to be of type "reduce" or "remove", but found ' +
                change.oneofKind
        );
    }
}

function trDelegator(
    deleg: v2.AccountStakingInfo_Delegator
): v1.AccountDelegationDetails {
    return {
        restakeEarnings: deleg.restakeEarnings,
        stakedAmount: unwrap(deleg.stakedAmount?.value),
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

function trOpenStatus(
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

function trBaker(baker: v2.AccountStakingInfo_Baker): v1.AccountBakerDetails {
    const bakerInfo = baker.bakerInfo;
    const bakerPoolInfo: v1.BakerPoolInfo = {
        openStatus: trOpenStatus(baker.poolInfo?.openStatus),
        metadataUrl: unwrap(baker.poolInfo?.url),
        commissionRates: trCommissionRates(baker.poolInfo?.commissionRates),
    };
    return {
        restakeEarnings: baker.restakeEarnings,
        bakerId: unwrap(baker.bakerInfo?.bakerId?.value),
        bakerAggregationVerifyKey: unwrapValToHex(bakerInfo?.aggregationKey),
        bakerElectionVerifyKey: unwrapValToHex(baker.bakerInfo?.electionKey),
        bakerSignatureVerifyKey: unwrapValToHex(bakerInfo?.signatureKey),
        bakerPoolInfo: bakerPoolInfo,
        stakedAmount: unwrap(baker.stakedAmount?.value),
        // Set the following value if baker.pendingChange is set to true
        ...(baker.pendingChange && {
            pendingChange: trPendingChange(baker.pendingChange),
        }),
    };
}

function translateChainParametersCommon(
    params: v2.ChainParametersV1 | v2.ChainParametersV0
): v1.ChainParametersCommon {
    return {
        electionDifficulty: trAmountFraction(params.electionDifficulty?.value),
        euroPerEnergy: unwrap(params.euroPerEnergy?.value),
        microGTUPerEuro: unwrap(params.microCcdPerEuro?.value),
        accountCreationLimit: unwrap(params.accountCreationLimit?.value),
        foundationAccount: unwrapToBase58(params.foundationAccount),
    };
}

function translateCommissionRange(
    range: v2.InclusiveRangeAmountFraction | undefined
): v1.InclusiveRange<number> {
    return {
        min: trAmountFraction(range?.min),
        max: trAmountFraction(range?.max),
    };
}

function translateRewardParametersCommon(
    params: v2.ChainParametersV1 | v2.ChainParametersV0
): v1.RewardParametersCommon {
    const feeDistribution = params.transactionFeeDistribution;
    const gasRewards = params.gasRewards;
    return {
        transactionFeeDistribution: {
            baker: trAmountFraction(feeDistribution?.baker),
            gasAccount: trAmountFraction(feeDistribution?.gasAccount),
        },
        gASRewards: {
            baker: trAmountFraction(gasRewards?.baker),
            finalizationProof: trAmountFraction(gasRewards?.finalizationProof),
            accountCreation: trAmountFraction(gasRewards?.accountCreation),
            chainUpdate: trAmountFraction(gasRewards?.chainUpdate),
        },
    };
}

function transPoolPendingChange(
    change: v2.PoolPendingChange | undefined
): v1.BakerPoolPendingChange {
    switch (change?.change?.oneofKind) {
        case 'reduce': {
            return {
                pendingChangeType:
                    v1.BakerPoolPendingChangeType.ReduceBakerCapital,
                // TODO ensure units are aligned
                effectiveTime: trTimestamp(change.change.reduce.effectiveTime),
                bakerEquityCapital: unwrap(
                    change.change.reduce.reducedEquityCapital?.value
                ),
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

function transPaydayStatus(
    status: v2.PoolCurrentPaydayInfo | undefined
): v1.CurrentPaydayBakerPoolStatus | null {
    if (!status) {
        return null;
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
    const aggAmount = acc.encryptedBalance?.aggregatedAmount?.value;
    const numAggregated = acc.encryptedBalance?.numAggregated;

    const encryptedAmount: v1.AccountEncryptedAmount = {
        selfAmount: unwrapValToHex(acc.encryptedBalance?.selfAmount),
        startIndex: unwrap(acc.encryptedBalance?.startIndex),
        incomingAmounts: unwrap(acc.encryptedBalance?.incomingAmounts).map(
            unwrapValToHex
        ),
        // Set the following values if they are not undefined
        ...(numAggregated && { numAggregated: numAggregated }),
        ...(aggAmount && { aggregatedAmount: unwrapToHex(aggAmount) }),
    };
    const releaseSchedule = {
        total: unwrap(acc.schedule?.total?.value),
        schedule: unwrap(acc.schedule?.schedules).map(trRelease),
    };
    const accInfoCommon: v1.AccountInfoSimple = {
        accountAddress: unwrapToBase58(acc.address),
        accountNonce: unwrap(acc.sequenceNumber?.value),
        accountAmount: unwrap(acc.amount?.value),
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
            accountDelegation: trDelegator(acc.stake.stakingInfo.delegator),
        };
    } else if (acc.stake?.stakingInfo.oneofKind === 'baker') {
        return {
            ...accInfoCommon,
            accountBaker: trBaker(acc.stake.stakingInfo.baker),
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
            const v1 = params.parameters.v1;
            const commonRewardParameters = translateRewardParametersCommon(v1);
            return {
                ...common,
                rewardPeriodLength: unwrap(
                    v1.timeParameters?.rewardPeriodLength?.value?.value
                ),
                mintPerPayday: trMintRate(v1.timeParameters?.mintPerPayday),
                delegatorCooldown: unwrap(
                    v1.cooldownParameters?.delegatorCooldown?.value
                ),
                poolOwnerCooldown: unwrap(
                    v1.cooldownParameters?.poolOwnerCooldown?.value
                ),
                passiveFinalizationCommission: trAmountFraction(
                    v1.poolParameters?.passiveFinalizationCommission
                ),
                passiveBakingCommission: trAmountFraction(
                    v1.poolParameters?.passiveBakingCommission
                ),
                passiveTransactionCommission: trAmountFraction(
                    v1.poolParameters?.passiveTransactionCommission
                ),
                finalizationCommissionRange: translateCommissionRange(
                    v1.poolParameters?.commissionBounds?.finalization
                ),
                bakingCommissionRange: translateCommissionRange(
                    v1.poolParameters?.commissionBounds?.baking
                ),
                transactionCommissionRange: translateCommissionRange(
                    v1.poolParameters?.commissionBounds?.transaction
                ),
                minimumEquityCapital: unwrap(
                    v1.poolParameters?.minimumEquityCapital?.value
                ),
                capitalBound: trAmountFraction(
                    v1.poolParameters?.capitalBound?.value
                ),
                leverageBound: unwrap(v1.poolParameters?.leverageBound?.value),
                rewardParameters: {
                    ...commonRewardParameters,
                    mintDistribution: {
                        bakingReward: trAmountFraction(
                            v1.mintDistribution?.bakingReward
                        ),
                        finalizationReward: trAmountFraction(
                            v1.mintDistribution?.finalizationReward
                        ),
                    },
                },
            };
        }
        case 'v0': {
            const common = translateChainParametersCommon(params.parameters.v0);
            const v0 = params.parameters.v0;
            const commonRewardParameters = translateRewardParametersCommon(v0);
            return {
                ...common,
                bakerCooldownEpochs: unwrap(v0.bakerCooldownEpochs?.value),
                minimumThresholdForBaking: unwrap(
                    v0.minimumThresholdForBaking?.value
                ),
                rewardParameters: {
                    ...commonRewardParameters,
                    mintDistribution: {
                        bakingReward: trAmountFraction(
                            v0.mintDistribution?.bakingReward
                        ),
                        finalizationReward: trAmountFraction(
                            v0.mintDistribution?.finalizationReward
                        ),
                        mintPerSlot: trMintRate(
                            v0.mintDistribution?.mintPerSlot
                        ),
                    },
                },
            };
        }
        default:
            throw new Error('Missing chain parameters');
    }
}

export function bakerPoolInfo(info: v2.PoolInfoResponse): v1.BakerPoolStatus {
    return {
        poolType: v1.PoolStatusType.BakerPool,
        bakerId: unwrap(info.baker?.value),
        bakerAddress: unwrapToBase58(info.address),
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
        poolType: v1.PoolStatusType.PassiveDelegation,
        delegatedCapital: unwrap(info.delegatedCapital?.value),
        commissionRates: trCommissionRates(info.commissionRates),
        currentPaydayTransactionFeesEarned: unwrap(
            info.currentPaydayTransactionFeesEarned?.value
        ),
        currentPaydayDelegatedCapital: unwrap(
            info.currentPaydayDelegatedCapital?.value
        ),
        allPoolTotalCapital: unwrap(info.allPoolTotalCapital?.value),
    };
}

export function tokenomicsInfo(info: v2.TokenomicsInfo): v1.RewardStatus {
    switch (info.tokenomics.oneofKind) {
        case 'v0': {
            const v0 = info.tokenomics.v0;
            return {
                protocolVersion: BigInt(v0.protocolVersion),
                totalAmount: unwrap(v0.totalAmount?.value),
                totalEncryptedAmount: unwrap(v0.totalEncryptedAmount?.value),
                bakingRewardAccount: unwrap(v0.bakingRewardAccount?.value),
                finalizationRewardAccount: unwrap(
                    v0.finalizationRewardAccount?.value
                ),
                gasAccount: unwrap(v0.gasAccount?.value),
            };
        }
        case 'v1': {
            const v1 = info.tokenomics.v1;
            return {
                protocolVersion: BigInt(v1.protocolVersion),
                totalAmount: unwrap(v1.totalAmount?.value),
                totalEncryptedAmount: unwrap(v1.totalEncryptedAmount?.value),
                bakingRewardAccount: unwrap(v1.bakingRewardAccount?.value),
                finalizationRewardAccount: unwrap(
                    v1.finalizationRewardAccount?.value
                ),
                gasAccount: unwrap(v1.gasAccount?.value),
                foundationTransactionRewards: unwrap(
                    v1.foundationTransactionRewards?.value
                ),
                nextPaydayTime: trTimestamp(v1.nextPaydayTime),
                nextPaydayMintRate: unwrap(v1.nextPaydayMintRate),
                totalStakedCapital: unwrap(v1.totalStakedCapital?.value),
            };
        }
        case undefined:
            throw new Error('Missing tokenomics info');
    }
}

export function consensusInfo(ci: v2.ConsensusInfo): v1.ConsensusStatus {
    return {
        bestBlock: unwrapValToHex(ci.bestBlock),
        genesisBlock: unwrapValToHex(ci.genesisBlock),
        currentEraGenesisBlock: unwrapValToHex(ci.currentEraGenesisBlock),
        lastFinalizedBlock: unwrapValToHex(ci.lastFinalizedBlock),
        epochDuration: unwrap(ci.epochDuration?.value),
        slotDuration: unwrap(ci.slotDuration?.value),
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
        protocolVersion: BigInt(unwrap(ci.protocolVersion)),
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
}

function trAccountAddress(
    accountAddress: v2.AccountAddress | undefined
): v1.AddressAccount {
    return {
        type: 'AddressAccount',
        address: unwrapToBase58(accountAddress),
    };
}

function trAddress(
    addr: v2.Address | v2.ContractAddress | v2.AccountAddress | undefined
): v1.Address {
    const accountAddress = <v2.AccountAddress>unwrap(addr);
    const contractAddress = <v2.ContractAddress>unwrap(addr);
    const address = <v2.Address>unwrap(addr);

    if (accountAddress.value) {
        return trAccountAddress(accountAddress);
    } else if (contractAddress.index) {
        return {
            type: 'AddressContract',
            address: contractAddress,
        };
    } else if (address.type.oneofKind === 'account') {
        return trAccountAddress(address.type.account);
    } else if (address.type.oneofKind === 'contract') {
        return {
            type: 'AddressContract',
            address: address.type.contract,
        };
    } else {
        throw Error('Invalid address encountered!');
    }
}

function trContractTraceElement(
    contractTraceElement: v2.ContractTraceElement
): v1.ContractTraceEvent {
    const element = contractTraceElement.element;
    switch (element.oneofKind) {
        case 'updated':
            return {
                tag: v1.TransactionEventTag.Updated,
                contractVersion: element.updated.contractVersion,
                address: unwrap(element.updated.address),
                instigator: trAddress(element.updated.instigator),
                amount: unwrap(element.updated.amount?.value),
                message: unwrapValToHex(element.updated.parameter),
                receiveName: unwrap(element.updated.receiveName?.value),
                events: element.updated.events.map(unwrapValToHex),
            };
        case 'transferred':
            return {
                tag: v1.TransactionEventTag.Transferred,
                from: trAddress(element.transferred.sender),
                amount: unwrap(element.transferred.amount?.value),
                to: trAddress(element.transferred.receiver),
            };
        case 'interrupted':
            return {
                tag: v1.TransactionEventTag.Interrupted,
                address: unwrap(element.interrupted.address),
                events: element.interrupted.events.map(unwrapValToHex),
            };
        case 'resumed':
            return {
                tag: v1.TransactionEventTag.Resumed,
                address: unwrap(element.resumed.address),
                success: unwrap(element.resumed.success),
            };
        case 'upgraded':
            return {
                tag: v1.TransactionEventTag.Upgraded,
                address: unwrap(element.upgraded.address),
                from: unwrapValToHex(element.upgraded.from),
                to: unwrapValToHex(element.upgraded.to),
            };
        default:
            throw Error(
                'Invalid ContractTraceElement received, not able to translate to Transaction Event!'
            );
    }
}

function trBakerEvent(
    bakerEvent: v2.BakerEvent,
    account: Base58String
): v1.BakerEvent {
    const event = bakerEvent.event;
    switch (event.oneofKind) {
        case 'bakerAdded': {
            const keysEvent = event.bakerAdded.keysEvent;
            return {
                tag: v1.TransactionEventTag.BakerAdded,
                bakerId: unwrap(keysEvent?.bakerId?.value),
                account: unwrapToBase58(keysEvent?.account),
                signKey: unwrapValToHex(keysEvent?.signKey),
                electionKey: unwrapValToHex(keysEvent?.electionKey),
                aggregationKey: unwrapValToHex(keysEvent?.aggregationKey),
                stake: unwrap(event.bakerAdded.stake?.value),
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
                newStake: unwrap(event.bakerStakeIncreased.newStake?.value),
                account,
            };
        case 'bakerStakeDecreased':
            return {
                tag: v1.TransactionEventTag.BakerStakeDecreased,
                bakerId: unwrap(event.bakerStakeDecreased.bakerId?.value),
                newStake: unwrap(event.bakerStakeDecreased.newStake?.value),
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
                account: unwrapToBase58(event.bakerKeysUpdated.account),
                signKey: unwrapValToHex(event.bakerKeysUpdated.signKey),
                electionKey: unwrapValToHex(event.bakerKeysUpdated.electionKey),
                aggregationKey: unwrapValToHex(
                    event.bakerKeysUpdated.aggregationKey
                ),
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
                tag: v1.TransactionEventTag
                    .BakerSetFinalizationRewardCommission,
                bakerId: unwrap(rewardComm.bakerId?.value),
                finalizationRewardCommission: trAmountFraction(amount),
                account,
            };
        }
        case undefined:
            throw Error('Failed translating BakerEvent, encountered undefined');
    }
}

function trDelegTarget(
    delegationTarget: v2.DelegationTarget | undefined
): v1.EventDelegationTarget {
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

function trDelegationEvent(
    delegationEvent: v2.DelegationEvent,
    account: Base58String
): v1.DelegationEvent {
    const event = delegationEvent.event;
    switch (event.oneofKind) {
        case 'delegationStakeIncreased': {
            const stakeIncr = event.delegationStakeIncreased;
            return {
                tag: v1.TransactionEventTag.DelegationStakeIncreased,
                delegatorId: Number(unwrap(stakeIncr.delegatorId?.id?.value)),
                newStake: unwrap(stakeIncr.newStake?.value),
                account,
            };
        }
        case 'delegationStakeDecreased': {
            const stakeDecr = event.delegationStakeDecreased;
            return {
                tag: v1.TransactionEventTag.DelegationStakeDecreased,
                delegatorId: Number(unwrap(stakeDecr.delegatorId?.id?.value)),
                newStake: unwrap(stakeDecr.newStake?.value),
                account,
            };
        }
        case 'delegationSetRestakeEarnings': {
            const restake = event.delegationSetRestakeEarnings;
            return {
                tag: v1.TransactionEventTag.DelegationSetRestakeEarnings,
                delegatorId: Number(unwrap(restake.delegatorId?.id?.value)),
                restakeEarnings: unwrap(restake.restakeEarnings),
                account,
            };
        }
        case 'delegationSetDelegationTarget': {
            const target = event.delegationSetDelegationTarget;
            return {
                tag: v1.TransactionEventTag.DelegationSetDelegationTarget,
                delegatorId: Number(unwrap(target.delegatorId?.id?.value)),
                delegationTarget: trDelegTarget(target.delegationTarget),
                account,
            };
        }
        case 'delegationAdded':
            return {
                tag: v1.TransactionEventTag.DelegationAdded,
                delegatorId: Number(unwrap(event.delegationAdded.id?.value)),
                account,
            };
        case 'delegationRemoved':
            return {
                tag: v1.TransactionEventTag.DelegationRemoved,
                delegatorId: Number(unwrap(event.delegationRemoved.id?.value)),
                account,
            };
        default:
            throw Error('Unrecognized event type. This should be impossible.');
    }
}

function trRejectReason(
    rejectReason: v2.RejectReason | undefined
): v1.RejectReason {
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
                    moduleRef: unwrapValToHex(
                        reason.invalidInitMethod.moduleRef
                    ),
                    initName: unwrap(reason.invalidInitMethod.initName?.value),
                },
            };
        case 'invalidReceiveMethod':
            return {
                tag: Tag.InvalidReceiveMethod,
                contents: {
                    moduleRef: unwrapValToHex(
                        reason.invalidReceiveMethod.moduleRef
                    ),
                    receiveName: unwrap(
                        reason.invalidReceiveMethod.receiveName?.value
                    ),
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
                contents: reason.invalidContractAddress,
            };
        case 'amountTooLarge':
            return {
                tag: Tag.AmountTooLarge,
                contents: {
                    address: trAddress(reason.amountTooLarge.address),
                    amount: unwrap(reason.amountTooLarge.amount?.value),
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
                contractAddress: unwrap(reason.rejectedReceive.contractAddress),
                receiveName: unwrap(reason.rejectedReceive.receiveName?.value),
                rejectReason: unwrap(reason.rejectedReceive.rejectReason),
                parameter: unwrapValToHex(reason.rejectedReceive.parameter),
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
            throw Error(
                'Failed translating RejectReason, encountered undefined value'
            );
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
            specificationAuxiliaryData: unwrapToHex(
                update.specificationAuxiliaryData
            ),
        },
    };
}
function trElectionDifficultyUpdate(
    elecDiff: v2.ElectionDifficulty
): v1.ElectionDifficultyUpdate {
    return {
        updateType: v1.UpdateType.ElectionDifficulty,
        update: {
            electionDifficulty: trAmountFraction(elecDiff.value),
        },
    };
}
function trEuroPerEnergyUpdate(
    exchangeRate: v2.ExchangeRate
): v1.EuroPerEnergyUpdate {
    return {
        updateType: v1.UpdateType.EuroPerEnergy,
        update: unwrap(exchangeRate.value),
    };
}
function trMicroCcdPerEuroUpdate(
    exchangeRate: v2.ExchangeRate
): v1.MicroGtuPerEuroUpdate {
    return {
        updateType: v1.UpdateType.MicroGtuPerEuro,
        update: unwrap(exchangeRate.value),
    };
}
function trFoundationAccountUpdate(
    account: v2.AccountAddress
): v1.FoundationAccountUpdate {
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

function trGasRewardsUpdate(gasRewards: v2.GasRewards): v1.GasRewardsUpdate {
    return {
        updateType: v1.UpdateType.GasRewards,
        update: {
            baker: trAmountFraction(gasRewards.baker),
            finalizationProof: trAmountFraction(gasRewards.finalizationProof),
            accountCreation: trAmountFraction(gasRewards.accountCreation),
            chainUpdate: trAmountFraction(gasRewards.accountCreation),
        },
    };
}

function trBakerStakeThresholdUpdate(
    bakerStakeThreshold: v2.BakerStakeThreshold
): v1.BakerStakeThresholdUpdate {
    return {
        updateType: v1.UpdateType.BakerStakeThreshold,
        update: {
            threshold: unwrap(bakerStakeThreshold.bakerStakeThreshold?.value),
        },
    };
}

function trPoolParametersCpv1Update(
    poolParams: v2.PoolParametersCpv1
): v1.PoolParametersUpdate {
    return {
        updateType: v1.UpdateType.PoolParameters,
        update: {
            passiveCommissions: {
                transactionCommission: trAmountFraction(
                    poolParams.passiveTransactionCommission
                ),
                bakingCommission: trAmountFraction(
                    poolParams.passiveBakingCommission
                ),
                finalizationCommission: trAmountFraction(
                    poolParams.passiveFinalizationCommission
                ),
            },
            commissionBounds: {
                transactionFeeCommission: trCommissionRange(
                    poolParams.commissionBounds?.transaction
                ),
                bakingRewardCommission: trCommissionRange(
                    poolParams.commissionBounds?.baking
                ),
                finalizationRewardCommission: trCommissionRange(
                    poolParams.commissionBounds?.finalization
                ),
            },
            minimumEquityCapital: unwrap(
                poolParams.minimumEquityCapital?.value
            ),
            capitalBound: trAmountFraction(poolParams.capitalBound?.value),
            leverageBound: unwrap(poolParams.leverageBound?.value),
        },
    };
}

function trAddAnonymityRevokerUpdate(
    ar: v2.ArInfo
): v1.AddAnonymityRevokerUpdate {
    return {
        updateType: v1.UpdateType.AddAnonymityRevoker,
        update: arInfo(ar),
    };
}
function trAddIdentityProviderUpdate(
    ip: v2.IpInfo
): v1.AddIdentityProviderUpdate {
    return {
        updateType: v1.UpdateType.AddIdentityProvider,
        update: ipInfo(ip),
    };
}

function trCooldownParametersCpv1Update(
    cooldownParams: v2.CooldownParametersCpv1
): v1.CooldownParametersUpdate {
    return {
        updateType: v1.UpdateType.CooldownParameters,
        update: {
            poolOwnerCooldown: unwrap(cooldownParams.poolOwnerCooldown?.value),
            delegatorCooldown: unwrap(cooldownParams.delegatorCooldown?.value),
        },
    };
}

function trTimeParametersCpv1Update(
    timeParams: v2.TimeParametersCpv1
): v1.TimeParametersUpdate {
    return {
        updateType: v1.UpdateType.TimeParameters,
        update: {
            rewardPeriodLength: unwrap(
                timeParams.rewardPeriodLength?.value?.value
            ),
            mintRatePerPayday: unwrap(timeParams.mintPerPayday),
        },
    };
}
function trMintDistributionCpv0Update(
    mintDist: v2.MintDistributionCpv0
): v1.MintDistributionUpdate {
    return {
        updateType: v1.UpdateType.MintDistribution,
        update: {
            bakingReward: trAmountFraction(mintDist.bakingReward),
            finalizationReward: trAmountFraction(mintDist.finalizationReward),
            mintPerSlot: trMintRate(mintDist.mintPerSlot),
        },
    };
}

function trMintDistributionCpv1Update(
    mintDist: v2.MintDistributionCpv1
): v1.MintDistributionUpdate {
    return {
        updateType: v1.UpdateType.MintDistribution,
        update: {
            bakingReward: trAmountFraction(mintDist.bakingReward),
            finalizationReward: trAmountFraction(mintDist.finalizationReward),
        },
    };
}

export function pendingUpdate(
    pendingUpdate: v2.PendingUpdate
): v1.PendingUpdate {
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
            return trTransactionFeeDistributionUpdate(
                effect.transactionFeeDistribution
            );
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
                    typeOfUpdate:
                        v1.AuthorizationKeysUpdateType.Level2KeysUpdate,
                    updatePayload: trAuthorizationsV0(effect.level2KeysCpv0),
                },
            };
        case 'level2KeysCpv1':
            return {
                updateType: v1.UpdateType.AuthorizationKeysUpdate,
                update: {
                    typeOfUpdate:
                        v1.AuthorizationKeysUpdateType.Level2KeysUpdateV1,
                    updatePayload: trAuthorizationsV1(effect.level2KeysCpv1),
                },
            };
        case undefined:
            throw Error('Unexpected missing pending update');
    }
}

function trUpdatePayload(
    updatePayload: v2.UpdatePayload | undefined
): v1.UpdateInstructionPayload {
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
            return trTransactionFeeDistributionUpdate(
                payload.transactionFeeDistributionUpdate
            );
        case 'gasRewardsUpdate':
            return trGasRewardsUpdate(payload.gasRewardsUpdate);
        case 'bakerStakeThresholdUpdate':
            return trBakerStakeThresholdUpdate(
                payload.bakerStakeThresholdUpdate
            );
        case 'addAnonymityRevokerUpdate':
            return trAddAnonymityRevokerUpdate(
                payload.addAnonymityRevokerUpdate
            );
        case 'addIdentityProviderUpdate':
            return trAddIdentityProviderUpdate(
                payload.addIdentityProviderUpdate
            );
        case 'cooldownParametersCpv1Update':
            return trCooldownParametersCpv1Update(
                payload.cooldownParametersCpv1Update
            );
        case 'poolParametersCpv1Update':
            return trPoolParametersCpv1Update(payload.poolParametersCpv1Update);
        case 'timeParametersCpv1Update':
            return trTimeParametersCpv1Update(payload.timeParametersCpv1Update);
        case 'mintDistributionCpv1Update':
            return trMintDistributionCpv1Update(
                payload.mintDistributionCpv1Update
            );
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
    }
}

function trCommissionRange(
    range: v2.InclusiveRangeAmountFraction | undefined
): v1.InclusiveRange<number> {
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

function trAccessStructure(
    auths: v2.AccessStructure | undefined
): v1.Authorization {
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
                    cooldownParameters: trAccessStructure(
                        update.parameterCooldown
                    ),
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
        keys: auths.keys.map(trUpdatePublicKey),
        addIdentityProvider: trAccessStructure(auths.addIdentityProvider),
        addAnonymityRevoker: trAccessStructure(auths.addAnonymityRevoker),
        emergency: trAccessStructure(auths.emergency),
        electionDifficulty: trAccessStructure(
            auths.parameterElectionDifficulty
        ),
        euroPerEnergy: trAccessStructure(auths.parameterEuroPerEnergy),
        foundationAccount: trAccessStructure(auths.parameterFoundationAccount),
        microGTUPerEuro: trAccessStructure(auths.parameterMicroCCDPerEuro),
        paramGASRewards: trAccessStructure(auths.parameterGasRewards),
        mintDistribution: trAccessStructure(auths.parameterMintDistribution),
        transactionFeeDistribution: trAccessStructure(
            auths.parameterTransactionFeeDistribution
        ),
        poolParameters: trAccessStructure(auths.poolParameters),
        protocol: trAccessStructure(auths.protocol),
    };
}

function trAuthorizationsV1(auths: v2.AuthorizationsV1): v1.AuthorizationsV1 {
    return {
        ...trAuthorizationsV0(unwrap(auths.v0)),
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

function trTransactionType(
    type?: v2.TransactionType
): v1.TransactionKindString | undefined {
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
        sender: unwrapToBase58(details.sender),
    };

    const effect = unwrap(details.effects?.effect);
    switch (effect.oneofKind) {
        case 'none':
            return {
                ...base,
                transactionType: v1.TransactionKindString.Failed,
                failedTransactionType: trTransactionType(
                    effect.none.transactionType
                ),
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
                address: unwrap(contractInit.address),
                amount: unwrap(contractInit.amount?.value),
                initName: unwrap(contractInit.initName?.value),
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
                events: effect.contractUpdateIssued.effects.map(
                    trContractTraceElement
                ),
            };
        case 'accountTransfer': {
            const transfer: v1.AccountTransferredEvent = {
                tag: v1.TransactionEventTag.Transferred,
                amount: unwrap(effect.accountTransfer.amount?.value),
                to: trAccountAddress(effect.accountTransfer.receiver).address,
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
                transactionType:
                    v1.TransactionKindString.UpdateBakerRestakeEarnings,
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
                newStake: unwrap(update?.newStake?.value),
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
                account: unwrapToBase58(transfer.added?.receiver),
                newIndex: Number(unwrap(transfer.added?.newIndex)),
                encryptedAmount: unwrapValToHex(
                    transfer.added?.encryptedAmount
                ),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType:
                        v1.TransactionKindString
                            .EncryptedAmountTransferWithMemo,
                    removed,
                    added,
                    memo: trMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType:
                        v1.TransactionKindString.EncryptedAmountTransfer,
                    removed,
                    added,
                };
            }
        }
        case 'transferredToEncrypted': {
            const transfer = effect.transferredToEncrypted;
            const added: v1.EncryptedSelfAmountAddedEvent = {
                tag: v1.TransactionEventTag.EncryptedSelfAmountAdded,
                account: unwrapToBase58(transfer.account),
                amount: unwrap(transfer.amount?.value),
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
                amount: unwrap(transfer.amount?.value),
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
                to: unwrapToBase58(transfer.receiver),
                amount: transfer.amount.map(trNewRelease),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType:
                        v1.TransactionKindString.TransferWithScheduleAndMemo,
                    transfer: event,
                    memo: trMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType:
                        v1.TransactionKindString.TransferWithSchedule,
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
                events: effect.bakerConfigured.events.map((event) =>
                    trBakerEvent(event, base.sender)
                ),
            };
        case 'delegationConfigured':
            return {
                ...base,
                transactionType: v1.TransactionKindString.ConfigureDelegation,
                events: effect.delegationConfigured.events.map((x) =>
                    trDelegationEvent(x, base.sender)
                ),
            };
        case undefined:
            throw Error(
                'Failed translating AccountTransactionEffects, encountered undefined value'
            );
    }
}

export function blockItemSummary(
    summary: v2.BlockItemSummary
): v1.BlockItemSummary {
    const base = {
        index: unwrap(summary.index?.value),
        energyCost: unwrap(summary.energyCost?.value),
        hash: unwrapValToHex(summary.hash),
    };
    if (summary.details.oneofKind === 'accountTransaction') {
        return trAccountTransactionSummary(
            summary.details.accountTransaction,
            base
        );
    } else if (summary.details.oneofKind === 'accountCreation') {
        return {
            type: v1.TransactionSummaryType.AccountCreation,
            ...base,
            credentialType:
                summary.details.accountCreation.credentialType ===
                v2.CredentialType.INITIAL
                    ? 'initial'
                    : 'normal',
            address: unwrapToBase58(summary.details.accountCreation.address),
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

function trBlockItemSummaryInBlock(
    summary: v2.BlockItemSummaryInBlock
): v1.BlockItemSummaryInBlock {
    return {
        blockHash: unwrapValToHex(summary.blockHash),
        summary: blockItemSummary(unwrap(summary.outcome)),
    };
}

export function blockItemStatus(
    itemStatus: v2.BlockItemStatus
): v1.BlockItemStatus {
    switch (itemStatus.status.oneofKind) {
        case 'received':
            return {
                status: v1.TransactionStatusEnum.Received,
            };
        case 'committed':
            return {
                status: v1.TransactionStatusEnum.Committed,
                outcomes: itemStatus.status.committed.outcomes.map(
                    trBlockItemSummaryInBlock
                ),
            };
        case 'finalized':
            return {
                status: v1.TransactionStatusEnum.Finalized,
                outcome: trBlockItemSummaryInBlock(
                    unwrap(itemStatus.status.finalized.outcome)
                ),
            };
        default:
            throw Error('BlockItemStatus was undefined!');
    }
}

export function invokeInstanceResponse(
    invokeResponse: v2.InvokeInstanceResponse
): v1.InvokeContractResult {
    switch (invokeResponse.result.oneofKind) {
        case 'failure':
            return {
                tag: 'failure',
                usedEnergy: unwrap(
                    invokeResponse.result.failure.usedEnergy?.value
                ),
                reason: trRejectReason(invokeResponse.result.failure.reason),
            };
        case 'success': {
            const result = invokeResponse.result.success;
            return {
                tag: 'success',
                usedEnergy: unwrap(result.usedEnergy?.value),
                returnValue: result.returnValue
                    ? Buffer.from(unwrap(result.returnValue)).toString('hex')
                    : undefined,
                events: result.effects.map(trContractTraceElement),
            };
        }
        default:
            throw Error('BlockItemStatus was undefined!');
    }
}

function trInstanceInfoCommon(
    info: v2.InstanceInfo_V0 | v2.InstanceInfo_V1
): Omit<v1.InstanceInfoCommon, 'version'> {
    return {
        amount: new CcdAmount(unwrap(info.amount?.value)),
        sourceModule: ModuleReference.fromBytes(
            Buffer.from(unwrap(info.sourceModule?.value))
        ),
        owner: AccountAddress.fromBytes(Buffer.from(unwrap(info.owner?.value))),
        methods: info.methods.map((name) => name.value),
        name: unwrap(info.name?.value),
    };
}

export function instanceInfo(instanceInfo: v2.InstanceInfo): v1.InstanceInfo {
    switch (instanceInfo.version.oneofKind) {
        case 'v0':
            return {
                ...trInstanceInfoCommon(instanceInfo.version.v0),
                version: 0,
                model: Buffer.from(
                    unwrap(instanceInfo.version.v0.model?.value)
                ),
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

export function commonBlockInfo(
    blockInfo: v2.ArrivedBlockInfo | v2.FinalizedBlockInfo
): v1.CommonBlockInfo {
    return {
        hash: unwrapValToHex(blockInfo.hash),
        height: unwrap(blockInfo.height?.value),
    };
}

export function instanceStateKVPair(
    state: v2.InstanceStateKVPair
): v1.InstanceStateKVPair {
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

export function blocksAtHeightResponse(
    blocks: v2.BlocksAtHeightResponse
): v1.HexString[] {
    return blocks.blocks.map(unwrapValToHex);
}

export function blockInfo(blockInfo: v2.BlockInfo): v1.BlockInfo {
    return {
        blockParent: unwrapValToHex(blockInfo.parentBlock),
        blockHash: unwrapValToHex(blockInfo.hash),
        blockStateHash: unwrapValToHex(blockInfo.stateHash),
        blockLastFinalized: unwrapValToHex(blockInfo.lastFinalizedBlock),
        blockHeight: unwrap(blockInfo.height?.value),
        blockBaker: unwrap(blockInfo.baker?.value),
        blockSlot: unwrap(blockInfo.slotNumber?.value),
        blockArriveTime: trTimestamp(blockInfo.arriveTime),
        blockReceiveTime: trTimestamp(blockInfo.receiveTime),
        blockSlotTime: trTimestamp(blockInfo.slotTime),
        finalized: blockInfo.finalized,
        transactionCount: BigInt(blockInfo.transactionCount),
        transactionsSize: BigInt(blockInfo.transactionsSize),
        transactionEnergyCost: unwrap(blockInfo.transactionsEnergyCost?.value),
        genesisIndex: unwrap(blockInfo.genesisIndex?.value),
        eraBlockHeight: Number(unwrap(blockInfo.eraBlockHeight?.value)),
    };
}

export function delegatorInfo(
    delegatorInfo: v2.DelegatorInfo
): v1.DelegatorInfo {
    return {
        account: unwrapToBase58(delegatorInfo.account),
        stake: unwrap(delegatorInfo.stake?.value),
        ...(delegatorInfo.pendingChange && {
            pendingChange: trPendingChange(delegatorInfo.pendingChange),
        }),
    };
}

export function branch(branchV2: v2.Branch): v1.Branch {
    return {
        blockHash: unwrapValToHex(branchV2.blockHash),
        children: branchV2.children.map(branch),
    };
}

function trBakerElectionInfo(
    bakerElectionInfo: v2.ElectionInfo_Baker
): v1.BakerElectionInfo {
    return {
        baker: unwrap(bakerElectionInfo.baker?.value),
        account: unwrapToBase58(bakerElectionInfo.account),
        lotteryPower: bakerElectionInfo.lotteryPower,
    };
}

export function electionInfo(electionInfo: v2.ElectionInfo): v1.ElectionInfo {
    return {
        electionDifficulty: trAmountFraction(
            electionInfo.electionDifficulty?.value
        ),
        electionNonce: unwrapValToHex(electionInfo.electionNonce),
        bakerElectionInfo:
            electionInfo.bakerElectionInfo.map(trBakerElectionInfo),
    };
}

export function nextUpdateSequenceNumbers(
    nextNums: v2.NextUpdateSequenceNumbers
): v1.NextUpdateSequenceNumbers {
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
        transactionFeeDistribution: unwrap(
            nextNums.transactionFeeDistribution?.value
        ),
        gasRewards: unwrap(nextNums.gasRewards?.value),
        poolParameters: unwrap(nextNums.poolParameters?.value),
        addAnonymityRevoker: unwrap(nextNums.addAnonymityRevoker?.value),
        addIdentityProvider: unwrap(nextNums.addIdentityProvider?.value),
        cooldownParameters: unwrap(nextNums.cooldownParameters?.value),
        timeParameters: unwrap(nextNums.timeParameters?.value),
    };
}

function trPassiveCommitteeInfo(
    passiveCommitteeInfo: v2.NodeInfo_BakerConsensusInfo_PassiveCommitteeInfo
): v1.PassiveCommitteeInfo {
    const passiveCommitteeInfoV2 =
        v2.NodeInfo_BakerConsensusInfo_PassiveCommitteeInfo;
    switch (passiveCommitteeInfo) {
        case passiveCommitteeInfoV2.NOT_IN_COMMITTEE:
            return v1.PassiveCommitteeInfo.NotInCommittee;
        case passiveCommitteeInfoV2.ADDED_BUT_NOT_ACTIVE_IN_COMMITTEE:
            return v1.PassiveCommitteeInfo.AddedButNotActiveInCommittee;
        case passiveCommitteeInfoV2.ADDED_BUT_WRONG_KEYS:
            return v1.PassiveCommitteeInfo.AddedButWrongKeys;
    }
}

function trBakerConsensusInfoStatus(
    consensusInfo: v2.NodeInfo_BakerConsensusInfo
): v1.BakerConsensusInfoStatus {
    if (consensusInfo.status.oneofKind === 'passiveCommitteeInfo') {
        return {
            tag: 'passiveCommitteeInfo',
            passiveCommitteeInfo: trPassiveCommitteeInfo(
                consensusInfo.status.passiveCommitteeInfo
            ),
        };
    } else if (consensusInfo.status.oneofKind === 'activeBakerCommitteeInfo') {
        return {
            tag: 'activeBakerCommitteeInfo',
        };
    } else if (
        consensusInfo.status.oneofKind === 'activeFinalizerCommitteeInfo'
    ) {
        return {
            tag: 'activeFinalizerCommitteeInfo',
        };
    } else {
        throw Error(
            'Error translating NodeInfoConsensusStatus: unexpected undefined'
        );
    }
}

function trNetworkInfo(
    networkInfo: v2.NodeInfo_NetworkInfo | undefined
): v1.NodeNetworkInfo {
    return {
        nodeId: unwrap(networkInfo?.nodeId?.value),
        peerTotalSent: unwrap(networkInfo?.peerTotalSent),
        peerTotalReceived: unwrap(networkInfo?.peerTotalReceived),
        avgBpsIn: unwrap(networkInfo?.avgBpsIn),
        avgBpsOut: unwrap(networkInfo?.avgBpsOut),
    };
}

export function trNodeInfo_Node(
    node: v2.NodeInfo_Node
): v1.NodeInfoConsensusStatus {
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
        localTime: unwrap(nodeInfo.localTime?.value),
        peerUptime: unwrap(nodeInfo.peerUptime?.value),
        networkInfo: trNetworkInfo(nodeInfo.networkInfo),
        details,
    };
}

function trCatchupStatus(
    catchupStatus: v2.PeersInfo_Peer_CatchupStatus
): v1.NodeCatchupStatus {
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

function trPeerNetworkStats(
    networkStats: v2.PeersInfo_Peer_NetworkStats | undefined
): v1.PeerNetworkStats {
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
            catchupStatus: trCatchupStatus(
                peerInfo.consensusInfo.nodeCatchupStatus
            ),
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
    accountAmount: v2.BlockSpecialEvent_AccountAmounts_Entry
): v1.BlockSpecialEventAccountAmount {
    return {
        account: unwrapToBase58(accountAmount.account),
        amount: unwrap(accountAmount.amount?.value),
    };
}

export function blockSpecialEvent(
    specialEvent: v2.BlockSpecialEvent
): v1.BlockSpecialEvent {
    const event = specialEvent.event;
    switch (event.oneofKind) {
        case 'bakingRewards': {
            return {
                tag: 'bakingRewards',
                bakingRewards: unwrap(
                    event.bakingRewards.bakerRewards
                ).entries.map(trAccountAmount),
                remainder: unwrap(event.bakingRewards.remainder?.value),
            };
        }
        case 'mint': {
            return {
                tag: 'mint',
                mintBakingReward: unwrap(event.mint.mintBakingReward?.value),
                mintFinalizationReward: unwrap(
                    event.mint.mintFinalizationReward?.value
                ),
                mintPlatformDevelopmentCharge: unwrap(
                    event.mint.mintPlatformDevelopmentCharge?.value
                ),
                foundationAccount: unwrapToBase58(event.mint.foundationAccount),
            };
        }
        case 'finalizationRewards': {
            return {
                tag: 'finalizationRewards',
                finalizationRewards:
                    event.finalizationRewards.finalizationRewards?.entries.map(
                        trAccountAmount
                    ),
                remainder: unwrap(event.finalizationRewards.remainder?.value),
            };
        }
        case 'blockReward': {
            return {
                tag: 'blockReward',
                transactionFees: unwrap(
                    event.blockReward.transactionFees?.value
                ),
                oldGasAccount: unwrap(event.blockReward.oldGasAccount?.value),
                newGasAccount: unwrap(event.blockReward.newGasAccount?.value),
                bakerReward: unwrap(event.blockReward.bakerReward?.value),
                foundationCharge: unwrap(
                    event.blockReward.foundationCharge?.value
                ),
                baker: unwrapToBase58(event.blockReward.baker),
                foundationAccount: unwrapToBase58(event.blockReward.baker),
            };
        }
        case 'paydayFoundationReward': {
            return {
                tag: 'paydayFoundationReward',
                foundationAccount: unwrapToBase58(
                    event.paydayFoundationReward.foundationAccount
                ),
                developmentCharge: unwrap(
                    event.paydayFoundationReward.developmentCharge?.value
                ),
            };
        }
        case 'paydayAccountReward': {
            return {
                tag: 'paydayAccountReward',
                account: unwrapToBase58(event.paydayAccountReward.account),
                transactionFees: unwrap(
                    event.paydayAccountReward.transactionFees?.value
                ),
                bakerReward: unwrap(
                    event.paydayAccountReward.bakerReward?.value
                ),
                finalizationReward: unwrap(
                    event.paydayAccountReward.finalizationReward?.value
                ),
            };
        }
        case 'blockAccrueReward': {
            return {
                tag: 'blockAccrueReward',
                transactionFees: unwrap(
                    event.blockAccrueReward.transactionFees?.value
                ),
                oldGasAccount: unwrap(
                    event.blockAccrueReward.oldGasAccount?.value
                ),
                newGasAccount: unwrap(
                    event.blockAccrueReward.newGasAccount?.value
                ),
                bakerReward: unwrap(event.blockAccrueReward.bakerReward?.value),
                passiveReward: unwrap(
                    event.blockAccrueReward.passiveReward?.value
                ),
                foundationCharge: unwrap(
                    event.blockAccrueReward.foundationCharge?.value
                ),
                baker: unwrap(event.blockAccrueReward.baker?.value),
            };
        }
        case 'paydayPoolReward': {
            const poolOwner = event.paydayPoolReward.poolOwner?.value;
            return {
                tag: 'paydayPoolReward',
                transactionFees: unwrap(
                    event.paydayPoolReward.transactionFees?.value
                ),
                bakerReward: unwrap(event.paydayPoolReward.bakerReward?.value),
                finalizationReward: unwrap(
                    event.paydayPoolReward.finalizationReward?.value
                ),
                ...(poolOwner && { poolOwner }),
            };
        }
        case undefined: {
            throw Error(
                'Error translating BlockSpecialEvent: unexpected undefined'
            );
        }
    }
}

function trFinalizationSummaryParty(
    party: v2.FinalizationSummaryParty
): v1.FinalizationSummaryParty {
    return {
        baker: unwrap(party.baker?.value),
        weight: party.weight,
        signed: party.signed,
    };
}

function trFinalizationSummary(
    summary: v2.FinalizationSummary
): v1.FinalizationSummary {
    return {
        block: unwrapValToHex(summary.block),
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
        throw Error(
            'Error translating BlockFinalizationSummary: unexpected undefined'
        );
    }
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

export function BlocksAtHeightRequestToV2(
    request: v1.BlocksAtHeightRequest
): v2.BlocksAtHeightRequest {
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
