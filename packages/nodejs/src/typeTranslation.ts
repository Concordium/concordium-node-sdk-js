import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import { mapRecord, unwrap } from './util';
import { Buffer } from 'buffer/';
import {
    AuthorizationKeysUpdateType,
    HigherLevelKeyUpdateType,
    RejectReasonTag,
    TransactionEventTag,
    TransactionKindString,
} from '@concordium/common-sdk';
import bs58check from 'bs58check';

function unwrapToHex(bytes: Uint8Array | undefined): v1.HexString {
    return Buffer.from(unwrap(bytes)).toString('hex');
}

function unwrapToBase58(
    address: v2.AccountAddress | undefined
): v1.Base58String {
    return bs58check.encode(
        Buffer.concat([Buffer.of(1), unwrap(address?.value)])
    );
}

function unwrapValToHex(x: { value: Uint8Array } | undefined): string {
    return unwrapToHex(unwrap(x).value);
}

function transModuleRef(
    moduleRef: v2.ModuleRef | undefined
): v1.ModuleReference {
    return new v1.ModuleReference(unwrapValToHex(moduleRef));
}

function transRelease(release: v2.Release): v1.ReleaseScheduleWithTransactions {
    return {
        timestamp: transTimestamp(release.timestamp),
        amount: unwrap(release.amount?.value),
        transactions: release.transactions.map(unwrapValToHex),
    };
}

function transNewRelease(release: v2.NewRelease): v1.ReleaseSchedule {
    return {
        timestamp: transTimestamp(release.timestamp),
        amount: unwrap(release.amount?.value),
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
        cmmPrf: unwrapValToHex(cmm.prf),
        cmmCredCounter: unwrapValToHex(cmm.credCounter),
        cmmIdCredSecSharingCoeff: cmm.idCredSecSharingCoeff.map(unwrapValToHex),
        cmmAttributes: mapRecord(cmm.attributes, unwrapValToHex, transAttKey),
        cmmMaxAccounts: unwrapValToHex(cmm.maxAccounts),
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
            credId: unwrapValToHex(credVals.credId),
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
    const rates = baker.poolInfo?.commissionRates;
    const commissionRates: v1.CommissionRates = {
        transactionCommission: transAmountFraction(rates?.transaction),
        bakingCommission: transAmountFraction(rates?.baking),
        finalizationCommission: transAmountFraction(rates?.finalization),
    };
    const bakerPoolInfo: v1.BakerPoolInfo = {
        openStatus: transOpenStatus(baker.poolInfo?.openStatus),
        metadataUrl: unwrap(baker.poolInfo?.url),
        commissionRates: commissionRates,
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
            pendingChange: transPendingChange(baker.pendingChange),
        }),
    };
}

export function accountInfo(acc: v2.AccountInfo): v1.AccountInfo {
    const accAdrRaw = Buffer.from(unwrap(acc.address?.value));
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
        schedule: unwrap(acc.schedule?.schedules).map(transRelease),
    };
    const accInfoCommon: v1.AccountInfoSimple = {
        accountAddress: v1.AccountAddress.fromBytes(accAdrRaw).address,
        accountNonce: unwrap(acc.sequenceNumber?.value),
        accountAmount: unwrap(acc.amount?.value),
        accountIndex: unwrap(acc.index?.value),
        accountThreshold: unwrap(acc.threshold?.value),
        accountEncryptionKey: unwrapValToHex(acc.encryptionKey),
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
        genesisTime: transTimestamp(ci.genesisTime),
        currentEraGenesisTime: transTimestamp(ci.currentEraGenesisTime),
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
            blockLastReceivedTime: transTimestamp(ci.blockLastReceivedTime),
        }),
        ...(ci.blockLastArrivedTime && {
            blockLastArrivedTime: transTimestamp(ci.blockLastArrivedTime),
        }),
        ...(ci.lastFinalizedTime && {
            lastFinalizedTime: transTimestamp(ci.lastFinalizedTime),
        }),
    };
}

function transAccountAddress(
    accountAddress: v2.AccountAddress | undefined
): v1.AddressAccount {
    return {
        type: 'AddressAccount',
        address: unwrapToBase58(accountAddress),
    };
}

function transAddress(
    addr: v2.Address | v2.ContractAddress | v2.AccountAddress | undefined
): v1.Address {
    const accountAddress = <v2.AccountAddress>unwrap(addr);
    const contractAddress = <v2.ContractAddress>unwrap(addr);
    const address = <v2.Address>unwrap(addr);

    if (accountAddress.value) {
        return transAccountAddress(accountAddress);
    } else if (contractAddress.index) {
        return {
            type: 'AddressContract',
            address: contractAddress,
        };
    } else if (address.type.oneofKind === 'account') {
        return transAccountAddress(address.type.account);
    } else if (address.type.oneofKind === 'contract') {
        return {
            type: 'AddressContract',
            address: address.type.contract,
        };
    } else {
        throw Error('Invalid address encountered!');
    }
}

function transContractTraceElement(
    contractTraceElement: v2.ContractTraceElement
): v1.ContractTraceEvent {
    const element = contractTraceElement.element;
    switch (element.oneofKind) {
        case 'updated':
            return {
                tag: TransactionEventTag.Updated,
                contractVersion: element.updated.contractVersion,
                address: unwrap(element.updated.address),
                instigator: transAddress(element.updated.instigator),
                amount: unwrap(element.updated.amount?.value),
                message: unwrapValToHex(element.updated.parameter),
                receiveName: unwrap(element.updated.receiveName?.value),
                events: element.updated.events.map(unwrapValToHex),
            };
        case 'transferred':
            return {
                tag: TransactionEventTag.Transferred,
                from: transAddress(element.transferred.sender),
                amount: unwrap(element.transferred.amount?.value),
                to: transAddress(element.transferred.receiver),
            };
        case 'interrupted':
            return {
                tag: TransactionEventTag.Interrupted,
                address: unwrap(element.interrupted.address),
                events: element.interrupted.events.map(unwrapValToHex),
            };
        case 'resumed':
            return {
                tag: TransactionEventTag.Resumed,
                address: unwrap(element.resumed.address),
                success: unwrap(element.resumed.success),
            };
        case 'upgraded':
            return {
                tag: TransactionEventTag.Upgraded,
                address: unwrap(element.upgraded.address),
                from: transModuleRef(element.upgraded.from),
                to: transModuleRef(element.upgraded.to),
            };
        default:
            throw Error(
                'Invalid ContractTraceElement received, not able to translate to Transaction Event!'
            );
    }
}

function transBakerEvent(bakerEvent: v2.BakerEvent): v1.BakerEvent {
    const event = bakerEvent.event;
    switch (event.oneofKind) {
        case 'bakerAdded': {
            const keysEvent = event.bakerAdded.keysEvent;
            return {
                tag: TransactionEventTag.BakerAdded,
                bakerId: Number(unwrap(keysEvent?.bakerId?.value)),
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
                tag: TransactionEventTag.BakerRemoved,
                bakerId: Number(unwrap(event.bakerRemoved.value)),
            };
        case 'bakerStakeIncreased':
            return {
                tag: TransactionEventTag.BakerStakeIncreased,
                bakerId: Number(unwrap(event.bakerStakeIncreased.bakerId)),
                newStake: unwrap(event.bakerStakeIncreased.newStake?.value),
            };
        case 'bakerStakeDecreased':
            return {
                tag: TransactionEventTag.BakerStakeDecreased,
                bakerId: Number(unwrap(event.bakerStakeDecreased.bakerId)),
                newStake: unwrap(event.bakerStakeDecreased.newStake?.value),
            };
        case 'bakerRestakeEarningsUpdated': {
            const update = event.bakerRestakeEarningsUpdated;
            return {
                tag: TransactionEventTag.BakerSetRestakeEarnings,
                bakerId: Number(unwrap(update.bakerId?.value)),
                restakeEarnings: unwrap(update.restakeEarnings),
            };
        }
        case 'bakerKeysUpdated':
            return {
                tag: TransactionEventTag.BakerKeysUpdated,
                bakerId: Number(unwrap(event.bakerKeysUpdated.bakerId?.value)),
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
                tag: TransactionEventTag.BakerSetOpenStatus,
                bakerId: Number(unwrap(setOpenStatus.bakerId?.value)),
                openStatus: transOpenStatus(setOpenStatus.openStatus),
            };
        }
        case 'bakerSetMetadataUrl': {
            const setURL = event.bakerSetMetadataUrl;
            return {
                tag: TransactionEventTag.BakerSetMetadataURL,
                bakerId: Number(unwrap(setURL.bakerId?.value)),
                metadataURL: setURL.url,
            };
        }
        case 'bakerSetTransactionFeeCommission': {
            const transFeeComm = event.bakerSetTransactionFeeCommission;
            const amount = transFeeComm.transactionFeeCommission;
            return {
                tag: TransactionEventTag.BakerSetTransactionFeeCommission,
                bakerId: Number(unwrap(transFeeComm.bakerId?.value)),
                transactionFeeCommission: transAmountFraction(amount),
            };
        }
        case 'bakerSetBakingRewardCommission': {
            const rewardComm = event.bakerSetBakingRewardCommission;
            const amount = rewardComm.bakingRewardCommission;
            return {
                tag: TransactionEventTag.BakerSetBakingRewardCommission,
                bakerId: Number(unwrap(rewardComm.bakerId?.value)),
                bakingRewardCommission: transAmountFraction(amount),
            };
        }
        case 'bakerSetFinalizationRewardCommission': {
            const rewardComm = event.bakerSetFinalizationRewardCommission;
            const amount = rewardComm.finalizationRewardCommission;
            return {
                tag: TransactionEventTag.BakerSetFinalizationRewardCommission,
                bakerId: Number(unwrap(rewardComm.bakerId?.value)),
                finalizationRewardCommission: transAmountFraction(amount),
            };
        }
        case undefined:
            throw Error('Failed translating BakerEvent, encountered undefined');
    }
}

function transDelegTarget(
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

function transDelegationEvent(
    delegationEvent: v2.DelegationEvent
): v1.DelegationEvent {
    const event = delegationEvent.event;
    switch (event.oneofKind) {
        case 'delegationStakeIncreased': {
            const stakeIncr = event.delegationStakeIncreased;
            return {
                tag: TransactionEventTag.DelegationStakeIncreased,
                delegatorId: Number(unwrap(stakeIncr.delegatorId?.id?.value)),
                newStake: unwrap(stakeIncr.newStake?.value),
            };
        }
        case 'delegationStakeDecreased': {
            const stakeDecr = event.delegationStakeDecreased;
            return {
                tag: TransactionEventTag.DelegationStakeIncreased,
                delegatorId: Number(unwrap(stakeDecr.delegatorId?.id?.value)),
                newStake: unwrap(stakeDecr.newStake?.value),
            };
        }
        case 'delegationSetRestakeEarnings': {
            const restake = event.delegationSetRestakeEarnings;
            return {
                tag: TransactionEventTag.DelegationSetRestakeEarnings,
                delegatorId: Number(unwrap(restake.delegatorId?.id?.value)),
                restakeEarnings: unwrap(restake.restakeEarnings),
            };
        }
        case 'delegationSetDelegationTarget': {
            const target = event.delegationSetDelegationTarget;
            return {
                tag: TransactionEventTag.DelegationSetDelegationTarget,
                delegatorId: Number(unwrap(target.delegatorId?.id?.value)),
                delegationTarget: transDelegTarget(target.delegationTarget),
            };
        }
        case 'delegationAdded':
            return {
                tag: TransactionEventTag.DelegationAdded,
                delegatorId: Number(unwrap(event.delegationAdded.id?.value)),
            };
        case 'delegationRemoved':
            return {
                tag: TransactionEventTag.DelegationAdded,
                delegatorId: Number(unwrap(event.delegationRemoved.id?.value)),
            };
        default:
            throw Error('Unrecognized event type. This should be impossible.');
    }
}

function transRejectReason(
    rejectReason: v2.RejectReason | undefined
): v1.RejectReason {
    function simpleReason(tag: v1.SimpleRejectReasonTag): v1.RejectReason {
        return {
            tag: RejectReasonTag[tag],
        };
    }

    const reason = unwrap(rejectReason?.reason);
    const Tag = RejectReasonTag;
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
                contents: [
                    unwrapValToHex(reason.invalidInitMethod.moduleRef),
                    unwrap(reason.invalidInitMethod.initName?.value),
                ],
            };
        case 'invalidReceiveMethod':
            return {
                tag: Tag.InvalidReceiveMethod,
                contents: [
                    unwrapValToHex(reason.invalidReceiveMethod.moduleRef),
                    unwrap(reason.invalidReceiveMethod.receiveName?.value),
                ],
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
                contents: [
                    transAddress(reason.amountTooLarge.address),
                    unwrap(String(reason.amountTooLarge.amount?.value)),
                ],
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
                contents: Number(unwrap(reason.alreadyABaker.value)),
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
                contents: Number(
                    unwrap(reason.delegationTargetNotABaker.value)
                ),
            };
        case undefined:
            throw Error(
                'Failed translating RejectReason, encountered undefined value'
            );
    }
}

function translateMintRate(mintRate: v2.MintRate | undefined): number {
    return unwrap(mintRate?.mantissa) * 10 ** (-1 * unwrap(mintRate?.exponent));
}

function translateUpdatePayload(
    payload: v2.UpdatePayload
): v1.UpdateInstructionPayload {
    switch (payload.payload.oneofKind) {
        case 'protocolUpdate': {
            const update = payload.payload.protocolUpdate;
            return {
                updateType: v1.UpdateType.Protocol,
                update: {
                    message: update.message,
                    specificationHash: unwrapToHex(
                        update.specificationHash?.value
                    ),
                    specificationUrl: update.specificationUrl,
                    specificationAuxiliaryData: unwrapToHex(
                        update.specificationAuxiliaryData
                    ),
                },
            };
        }
        case 'electionDifficultyUpdate':
            return {
                updateType: v1.UpdateType.ElectionDifficulty,
                update: {
                    electionDifficulty: transAmountFraction(
                        payload.payload.electionDifficultyUpdate.value
                    ),
                },
            };
        case 'euroPerEnergyUpdate':
            return {
                updateType: v1.UpdateType.EuroPerEnergy,
                update: unwrap(payload.payload.euroPerEnergyUpdate.value),
            };
        case 'microCcdPerEuroUpdate':
            return {
                updateType: v1.UpdateType.MicroGtuPerEuro,
                update: unwrap(payload.payload.microCcdPerEuroUpdate.value),
            };
        case 'foundationAccountUpdate':
            return {
                updateType: v1.UpdateType.FoundationAccount,
                update: {
                    address: unwrapValToHex(
                        payload.payload.foundationAccountUpdate
                    ),
                },
            };
        case 'mintDistributionUpdate': {
            const update = payload.payload.mintDistributionUpdate;
            return {
                updateType: v1.UpdateType.MintDistribution,
                update: {
                    bakingReward: transAmountFraction(update.bakingReward),
                    finalizationReward: transAmountFraction(
                        update.finalizationReward
                    ),
                    mintPerSlot: translateMintRate(update.mintPerSlot),
                },
            };
        }
        case 'transactionFeeDistributionUpdate': {
            const update = payload.payload.transactionFeeDistributionUpdate;
            return {
                updateType: v1.UpdateType.TransactionFeeDistribution,
                update: {
                    baker: transAmountFraction(update.baker),
                    gasAccount: transAmountFraction(update.gasAccount),
                },
            };
        }
        case 'gasRewardsUpdate': {
            const update = payload.payload.gasRewardsUpdate;
            return {
                updateType: v1.UpdateType.GasRewards,
                update: {
                    baker: transAmountFraction(update.baker),
                    finalizationProof: transAmountFraction(
                        update.finalizationProof
                    ),
                    accountCreation: transAmountFraction(
                        update.accountCreation
                    ),
                    chainUpdate: transAmountFraction(update.accountCreation),
                },
            };
        }
        case 'bakerStakeThresholdUpdate': {
            const update = payload.payload.bakerStakeThresholdUpdate;
            return {
                updateType: v1.UpdateType.BakerStakeThreshold,
                update: {
                    threshold: unwrap(update.bakerStakeThreshold?.value),
                },
            };
        }
        case 'rootUpdate': {
            const rootUpdate = payload.payload.rootUpdate;
            const keyUpdate: v1.KeyUpdate = translateKeyUpdate(rootUpdate);
            return {
                updateType: v1.UpdateType.Root,
                update: keyUpdate,
            };
        }
        case 'level1Update': {
            const lvl1Update = payload.payload.level1Update;
            const keyUpdate: v1.KeyUpdate = translateKeyUpdate(lvl1Update);
            return {
                updateType: v1.UpdateType.Level1,
                update: keyUpdate,
            };
        }
        case 'addAnonymityRevokerUpdate': {
            const update = payload.payload.addAnonymityRevokerUpdate;
            return {
                updateType: v1.UpdateType.AddAnonymityRevoker,
                update: {
                    arDescription: unwrap(update.description),
                    arIdentity: unwrap(update.identity?.value),
                    arPublicKey: unwrapValToHex(update.publicKey),
                },
            };
        }
        case 'addIdentityProviderUpdate': {
            const update = payload.payload.addIdentityProviderUpdate;
            return {
                updateType: v1.UpdateType.AddIdentityProvider,
                update: {
                    ipDescription: unwrap(update.description),
                    ipIdentity: unwrap(update.identity?.value),
                    ipVerifyKey: unwrapValToHex(update.verifyKey),
                    ipCdiVerifyKey: unwrapValToHex(update.cdiVerifyKey),
                },
            };
        }
        case 'cooldownParametersCpv1Update': {
            const update = payload.payload.cooldownParametersCpv1Update;
            return {
                updateType: v1.UpdateType.CooldownParameters,
                update: {
                    poolOwnerCooldown: unwrap(update.poolOwnerCooldown?.value),
                    delegatorCooldown: unwrap(update.delegatorCooldown?.value),
                },
            };
        }
        case 'poolParametersCpv1Update': {
            const update = payload.payload.poolParametersCpv1Update;
            return {
                updateType: v1.UpdateType.PoolParameters,
                update: {
                    passiveCommissions: {
                        transactionCommission: transAmountFraction(
                            update.passiveTransactionCommission
                        ),
                        bakingCommission: transAmountFraction(
                            update.passiveBakingCommission
                        ),
                        finalizationCommission: transAmountFraction(
                            update.passiveFinalizationCommission
                        ),
                    },
                    commissionBounds: {
                        transactionFeeCommission: translateCommissionRange(
                            update.commissionBounds?.transaction
                        ),
                        bakingRewardCommission: translateCommissionRange(
                            update.commissionBounds?.baking
                        ),
                        finalizationRewardCommission: translateCommissionRange(
                            update.commissionBounds?.finalization
                        ),
                    },
                    minimumEquityCapital: unwrap(
                        update.minimumEquityCapital?.value
                    ),
                    capitalBound: transAmountFraction(
                        update.capitalBound?.value
                    ),
                    leverageBound: unwrap(update.leverageBound?.value),
                },
            };
        }
        case 'timeParametersCpv1Update': {
            const update = payload.payload.timeParametersCpv1Update;
            return {
                updateType: v1.UpdateType.TimeParameters,
                update: {
                    rewardPeriodLength: unwrap(
                        update.rewardPeriodLength?.value?.value
                    ),
                    mintRatePerPayday: unwrap(update.mintPerPayday),
                },
            };
        }
        case 'mintDistributionCpv1Update':
            const update = payload.payload.mintDistributionCpv1Update;
            return {
                updateType: v1.UpdateType.MintDistribution,
                update: {
                    bakingReward: transAmountFraction(update.bakingReward),
                    finalizationReward: transAmountFraction(
                        update.finalizationReward
                    ),
                },
            };
        case undefined:
            throw new Error('Unexpected missing update payload');
    }
}

function translateCommissionRange(
    range: v2.InclusiveRangeAmountFraction | undefined
): v1.InclusiveRange<number> {
    return {
        min: transAmountFraction(range?.min),
        max: transAmountFraction(range?.max),
    };
}
function translateUpdatePublicKey(key: v2.UpdatePublicKey): v1.VerifyKey {
    return {
        schemeId: 'Ed25519',
        verifyKey: unwrapValToHex(key),
    };
}

function translateAccessStructure(
    auths: v2.AccessStructure | undefined
): v1.Authorization {
    return {
        authorizedKeys: unwrap(auths).accessPublicKeys.map((key) => key.value),
        threshold: unwrap(auths?.accessThreshold?.value),
    };
}

function translateKeyUpdate(
    keyUpdate: v2.RootUpdate | v2.Level1Update
): v1.KeyUpdate {
    switch (keyUpdate.updateType.oneofKind) {
        case 'rootKeysUpdate': {
            const update = keyUpdate.updateType.rootKeysUpdate;
            return {
                typeOfUpdate: HigherLevelKeyUpdateType.RootKeysUpdate,
                updateKeys: update.keys.map(translateUpdatePublicKey),
                threshold: unwrap(update.threshold?.value),
            };
        }
        case 'level1KeysUpdate': {
            const update = keyUpdate.updateType.level1KeysUpdate;
            return {
                typeOfUpdate: HigherLevelKeyUpdateType.Level1KeysUpdate,
                updateKeys: update.keys.map(translateUpdatePublicKey),
                threshold: unwrap(update.threshold?.value),
            };
        }
        case 'level2KeysUpdateV0': {
            const update = keyUpdate.updateType.level2KeysUpdateV0;
            return {
                typeOfUpdate: AuthorizationKeysUpdateType.Level2KeysUpdate,
                updatePayload: translateAuthorizationsV0(update),
            };
        }
        case 'level2KeysUpdateV1': {
            const update = keyUpdate.updateType.level2KeysUpdateV1;
            const v0 = unwrap(update.v0);
            return {
                typeOfUpdate: AuthorizationKeysUpdateType.Level2KeysUpdateV1,
                updatePayload: {
                    ...translateAuthorizationsV0(v0),
                    cooldownParameters: translateAccessStructure(
                        update.parameterCooldown
                    ),
                    timeParameters: translateAccessStructure(
                        update.parameterTime
                    ),
                },
            };
        }
        case undefined:
            throw new Error('Unexpected missing update type');
    }
}

function translateAuthorizationsV0(
    auths: v2.AuthorizationsV0
): v1.AuthorizationsV0 {
    return {
        keys: auths.keys.map(translateUpdatePublicKey),
        addIdentityProvider: translateAccessStructure(
            auths.addIdentityProvider
        ),
        addAnonymityRevoker: translateAccessStructure(
            auths.addAnonymityRevoker
        ),
        emergency: translateAccessStructure(auths.emergency),
        electionDifficulty: translateAccessStructure(
            auths.parameterElectionDifficulty
        ),
        euroPerEnergy: translateAccessStructure(auths.parameterEuroPerEnergy),
        foundationAccount: translateAccessStructure(
            auths.parameterFoundationAccount
        ),
        microGTUPerEuro: translateAccessStructure(
            auths.parameterMicroCCDPerEuro
        ),
        paramGASRewards: translateAccessStructure(auths.parameterGasRewards),
        mintDistribution: translateAccessStructure(
            auths.parameterMintDistribution
        ),
        transactionFeeDistribution: translateAccessStructure(
            auths.parameterTransactionFeeDistribution
        ),
        poolParameters: translateAccessStructure(auths.poolParameters),
        protocol: translateAccessStructure(auths.protocol),
    };
}

function translateMemoEvent(memo: v2.Memo): v1.MemoEvent {
    return {
        tag: TransactionEventTag.TransferMemo,
        memo: unwrapValToHex(memo),
    };
}

function translateTransactionType(
    type: v2.TransactionType | undefined
): v1.TransactionKindString {
    switch (type) {
        case v2.TransactionType.DEPLOY_MODULE:
            return TransactionKindString.DeployModule;
        case v2.TransactionType.INIT_CONTRACT:
            return TransactionKindString.InitContract;
        case v2.TransactionType.UPDATE:
            return TransactionKindString.Update;
        case v2.TransactionType.TRANSFER:
            return TransactionKindString.Transfer;
        case v2.TransactionType.ADD_BAKER:
            return TransactionKindString.AddBaker;
        case v2.TransactionType.REMOVE_BAKER:
            return TransactionKindString.RemoveBaker;
        case v2.TransactionType.UPDATE_BAKER_STAKE:
            return TransactionKindString.UpdateBakerStake;
        case v2.TransactionType.UPDATE_BAKER_RESTAKE_EARNINGS:
            return TransactionKindString.UpdateBakerRestakeEarnings;
        case v2.TransactionType.UPDATE_BAKER_KEYS:
            return TransactionKindString.UpdateBakerKeys;
        case v2.TransactionType.UPDATE_CREDENTIAL_KEYS:
            return TransactionKindString.UpdateCredentialKeys;
        case v2.TransactionType.ENCRYPTED_AMOUNT_TRANSFER:
            return TransactionKindString.EncryptedAmountTransfer;
        case v2.TransactionType.TRANSFER_TO_ENCRYPTED:
            return TransactionKindString.TransferToEncrypted;
        case v2.TransactionType.TRANSFER_TO_PUBLIC:
            return TransactionKindString.TransferToPublic;
        case v2.TransactionType.TRANSFER_WITH_SCHEDULE:
            return TransactionKindString.TransferWithSchedule;
        case v2.TransactionType.UPDATE_CREDENTIALS:
            return TransactionKindString.UpdateCredentials;
        case v2.TransactionType.REGISTER_DATA:
            return TransactionKindString.RegisterData;
        case v2.TransactionType.TRANSFER_WITH_MEMO:
            return TransactionKindString.TransferWithMemo;
        case v2.TransactionType.ENCRYPTED_AMOUNT_TRANSFER_WITH_MEMO:
            return TransactionKindString.EncryptedAmountTransferWithMemo;
        case v2.TransactionType.TRANSFER_WITH_SCHEDULE_AND_MEMO:
            return TransactionKindString.TransferWithScheduleAndMemo;
        case v2.TransactionType.CONFIGURE_BAKER:
            return TransactionKindString.ConfigureBaker;
        case v2.TransactionType.CONFIGURE_DELEGATION:
            return TransactionKindString.ConfigureDelegation;
        case undefined:
            throw new Error('Unexpected missing transaction type');
    }
}

function translateAccountTransactionSummary(
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
                failedTransactionType: translateTransactionType(
                    effect.none.transactionType
                ),
                rejectReason: transRejectReason(effect.none.rejectReason),
            };
        case 'moduleDeployed': {
            const event: v1.ModuleDeployedEvent = {
                tag: TransactionEventTag.ModuleDeployed,
                contents: transModuleRef(effect.moduleDeployed),
            };
            return {
                ...base,
                transactionType: TransactionKindString.DeployModule,
                moduleDeployed: event,
            };
        }
        case 'contractInitialized': {
            const contractInit = effect.contractInitialized;
            const event: v1.ContractInitializedEvent = {
                tag: TransactionEventTag.ContractInitialized,
                address: unwrap(contractInit.address),
                amount: unwrap(contractInit.amount?.value),
                contractName: unwrap(contractInit.initName?.value),
                events: unwrap(contractInit.events.map(unwrapValToHex)),
                contractVersion: unwrap(contractInit.contractVersion),
                originRef: transModuleRef(contractInit.originRef),
            };
            return {
                ...base,
                transactionType: TransactionKindString.InitContract,
                contractInitialized: event,
            };
        }
        case 'contractUpdateIssued': {
            return {
                ...base,
                transactionType: TransactionKindString.Update,
                events: effect.contractUpdateIssued.effects.map(
                    transContractTraceElement
                ),
            };
        }
        case 'accountTransfer': {
            const transfer: v1.TransferredEvent = {
                tag: TransactionEventTag.Transferred,
                amount: unwrap(effect.accountTransfer.amount?.value),
                to: transAccountAddress(effect.accountTransfer.receiver),
            };
            if (effect.accountTransfer.memo) {
                return {
                    ...base,
                    transactionType: TransactionKindString.TransferWithMemo,
                    transfer,
                    memo: translateMemoEvent(effect.accountTransfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: TransactionKindString.Transfer,
                    transfer,
                };
            }
        }
        case 'bakerAdded':
            return {
                ...base,
                transactionType: TransactionKindString.AddBaker,
                bakerAdded: transBakerEvent({
                    event: effect,
                }) as v1.BakerAddedEvent,
            };
        case 'bakerRemoved':
            return {
                ...base,
                transactionType: TransactionKindString.RemoveBaker,
                bakerRemoved: transBakerEvent({
                    event: effect,
                }) as v1.BakerRemovedEvent,
            };
        case 'bakerRestakeEarningsUpdated':
            return {
                ...base,
                transactionType:
                    TransactionKindString.UpdateBakerRestakeEarnings,
                bakerRestakeEarningsUpdated: transBakerEvent({
                    event: effect,
                }) as v1.BakerSetRestakeEarningsEvent,
            };
        case 'bakerKeysUpdated':
            return {
                ...base,
                transactionType: TransactionKindString.UpdateBakerKeys,
                bakerKeysUpdated: transBakerEvent({
                    event: effect,
                }) as v1.BakerKeysUpdatedEvent,
            };
        case 'bakerStakeUpdated': {
            const increased = effect.bakerStakeUpdated.update?.increased;
            const update = effect.bakerStakeUpdated.update;
            const event: v1.BakerStakeChangedEvent = {
                tag: increased
                    ? TransactionEventTag.BakerStakeIncreased
                    : TransactionEventTag.BakerStakeDecreased,
                bakerId: Number(unwrap(update?.bakerId)),
                newStake: unwrap(update?.newStake?.value),
            };
            return {
                ...base,
                transactionType: TransactionKindString.UpdateBakerStake,
                bakerStakeChanged: event,
            };
        }
        case 'encryptedAmountTransferred': {
            const transfer = effect.encryptedAmountTransferred;
            const removed: v1.EncryptedAmountsRemovedEvent = {
                tag: TransactionEventTag.EncryptedAmountsRemoved,
                inputAmount: unwrapValToHex(transfer.removed?.inputAmount),
                newAmount: unwrapValToHex(transfer.removed?.newAmount),
                upToindex: Number(unwrap(transfer.removed?.upToIndex)),
            };
            const added: v1.NewEncryptedAmountEvent = {
                tag: TransactionEventTag.NewEncryptedAmount,
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
                        TransactionKindString.EncryptedAmountTransferWithMemo,
                    removed,
                    added,
                    memo: translateMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType:
                        TransactionKindString.EncryptedAmountTransfer,
                    removed,
                    added,
                };
            }
        }
        case 'transferredToEncrypted': {
            const transfer = effect.transferredToEncrypted;
            const added: v1.EncryptedSelfAmountAddedEvent = {
                tag: TransactionEventTag.EncryptedSelfAmountAdded,
                account: unwrapToBase58(transfer.account),
                amount: unwrap(transfer.amount?.value),
                newAmount: unwrapValToHex(transfer.newAmount),
            };
            return {
                ...base,
                transactionType: TransactionKindString.TransferToEncrypted,
                added,
            };
        }
        case 'transferredToPublic': {
            const transfer = effect.transferredToPublic;
            const removed: v1.EncryptedAmountsRemovedEvent = {
                tag: TransactionEventTag.EncryptedAmountsRemoved,
                inputAmount: unwrapValToHex(transfer.removed?.inputAmount),
                newAmount: unwrapValToHex(transfer.removed?.newAmount),
                upToindex: Number(unwrap(transfer.removed?.upToIndex)),
            };
            const added: v1.AmountAddedByDecryptionEvent = {
                tag: TransactionEventTag.AmountAddedByDecryption,
                amount: unwrap(transfer.amount?.value),
            };
            return {
                ...base,
                transactionType: TransactionKindString.TransferToPublic,
                removed,
                added,
            };
        }
        case 'transferredWithSchedule': {
            const transfer = effect.transferredWithSchedule;
            const event: v1.TransferredWithScheduleEvent = {
                tag: TransactionEventTag.TransferredWithSchedule,
                to: unwrapToBase58(transfer.receiver),
                amount: transfer.amount.map(transNewRelease),
            };
            if (transfer.memo) {
                return {
                    ...base,
                    transactionType:
                        TransactionKindString.TransferWithScheduleAndMemo,
                    transfer: event,
                    memo: translateMemoEvent(transfer.memo),
                };
            } else {
                return {
                    ...base,
                    transactionType: TransactionKindString.TransferWithSchedule,
                    event,
                };
            }
        }
        case 'credentialKeysUpdated': {
            const event: v1.CredentialKeysUpdatedEvent = {
                tag: TransactionEventTag.CredentialKeysUpdated,
                credId: unwrapValToHex(effect.credentialKeysUpdated),
            };
            return {
                ...base,
                transactionType: TransactionKindString.UpdateCredentialKeys,
                keysUpdated: event,
            };
        }
        case 'credentialsUpdated': {
            const update = effect.credentialsUpdated;
            const event: v1.CredentialsUpdatedEvent = {
                tag: TransactionEventTag.CredentialsUpdated,
                newCredIds: update.newCredIds.map(unwrapValToHex),
                removedCredIDs: update.removedCredIds.map(unwrapValToHex),
                newThreshold: unwrap(update.newThreshold?.value),
            };
            return {
                ...base,
                transactionType: TransactionKindString.UpdateCredentials,
                credentialsUpdated: event,
            };
        }
        case 'dataRegistered': {
            const event: v1.DataRegisteredEvent = {
                tag: TransactionEventTag.DataRegistered,
                data: unwrapValToHex(effect.dataRegistered),
            };
            return {
                ...base,
                transactionType: TransactionKindString.RegisterData,
                dataRegistered: event,
            };
        }
        case 'bakerConfigured':
            return {
                ...base,
                transactionType: TransactionKindString.ConfigureBaker,
                events: effect.bakerConfigured.events.map(transBakerEvent),
            };
        case 'delegationConfigured':
            return {
                ...base,
                transactionType: TransactionKindString.ConfigureDelegation,
                events: effect.delegationConfigured.events.map(
                    transDelegationEvent
                ),
            };
        case undefined:
            throw Error(
                'Failed translating AccountTransactionEffects, encountered undefined value'
            );
    }
}

function transBlockItemSummary(
    summary: v2.BlockItemSummary
): v1.BlockItemSummary {
    const base = {
        index: unwrap(summary.index?.value),
        energyCost: unwrap(summary.energyCost?.value),
        hash: unwrapValToHex(summary.hash),
    };
    if (summary.details.oneofKind === 'accountTransaction') {
        return translateAccountTransactionSummary(
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
            payload: translateUpdatePayload(
                unwrap(summary.details.update.payload)
            ),
        };
    } else {
        throw Error('Invalid BlockItemSummary encountered!');
    }
}

function transBlockItemSummaryInBlock(
    summary: v2.BlockItemSummaryInBlock
): v1.BlockItemSummaryInBlock {
    return {
        blockHash: unwrapValToHex(summary.blockHash),
        summary: transBlockItemSummary(unwrap(summary.outcome)),
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
                    transBlockItemSummaryInBlock
                ),
            };
        case 'finalized':
            return {
                status: v1.TransactionStatusEnum.Finalized,
                outcome: transBlockItemSummaryInBlock(
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
                reason: transRejectReason(invokeResponse.result.failure.reason),
            };
        case 'success': {
            const result = invokeResponse.result.success;
            return {
                tag: 'success',
                usedEnergy: unwrap(result.usedEnergy?.value),
                returnValue: result.returnValue
                    ? Buffer.from(unwrap(result.returnValue)).toString('hex')
                    : undefined,
                events: result.effects.map(transContractTraceElement),
            };
        }
        default:
            throw Error('BlockItemStatus was undefined!');
    }
}

// ---------------------------- //
// --- V1 => V2 translation --- //
// ---------------------------- //

export function accountTransactionSignatureToV2(
    signature: v1.AccountTransactionSignature
): v2.AccountTransactionSignature {
    function transSig(a: string): v2.Signature {
        return { value: Buffer.from(a, 'hex') };
    }
    function transCredSig(a: v1.CredentialSignature): v2.AccountSignatureMap {
        return { signatures: mapRecord(a, transSig) };
    }

    return { signatures: mapRecord(signature, transCredSig) };
}
