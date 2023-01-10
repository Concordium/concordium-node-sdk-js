import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import { mapRecord, unwrap } from './util';
import { Buffer } from 'buffer/';
import { BakerAddedEvent, TransactionEventTag } from '@concordium/common-sdk';
import * as bs58check from 'bs58check';

function unwrapToHex(bytes: Uint8Array | undefined): v1.HexString {
    return Buffer.from(unwrap(bytes)).toString('hex');
}

function unwrapToBase58(address: v2.AccountAddress | undefined): v1.Base58String {
    return bs58check.encode(Buffer.concat([Buffer.of(1), unwrap(address?.value)]));
}

function unwrapValToHex(x: { value: Uint8Array } | undefined): string {
    return unwrapToHex(unwrap(x).value);
}

function transModuleRef(moduleRef: v2.ModuleRef | undefined): v1.ModuleReference {
    return new v1.ModuleReference(unwrapValToHex(moduleRef))
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
        amount: unwrap(release.amount?.value)
    }
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

const NotImplemented = Error("functionality not implemented yet")

function transContractAddress(contractAddress: v2.ContractAddress | undefined): v1.ContractAddress {
    return {
        index: unwrap(contractAddress?.index),
        subindex: unwrap(contractAddress?.subindex)
    }
}

function transAccountAddress(accountAddress: v2.AccountAddress | undefined): v1.AddressAccount {
    return {
        type: 'AddressAccount',
        address: unwrapToBase58(accountAddress)
    }
}

function transAddress(addr: v2.Address | v2.ContractAddress | v2.AccountAddress | undefined): v1.Address {
    const accountAddress = <v2.AccountAddress>unwrap(addr);
    const contractAddress = <v2.ContractAddress>unwrap(addr);
    const address = <v2.Address>unwrap(addr);

    if (accountAddress.value) {
        return transAccountAddress(accountAddress)
    } else if (contractAddress.index) {
        return {
            type: 'AddressContract',
            address: transContractAddress(contractAddress)
        }
    } else if (address.type.oneofKind === "account") {
        return transAccountAddress(address.type.account)
    } else if(address.type.oneofKind === 'contract') {
        return {
            type: 'AddressContract',
            address: transContractAddress(address.type.contract)
        }
    } else {
        throw Error("Invalid address encountered!")
    }
}

function transContractTraceElement(contractTraceElement: v2.ContractTraceElement): v1.TransactionEvent {
    const element = contractTraceElement.element;
    switch (element.oneofKind) {
        case "updated":
            return {
                tag: TransactionEventTag.Updated,
                contractVersion: element.updated.contractVersion,
                address: unwrap(element.updated.address),
                instigator: transAddress(element.updated.instigator),
                amount: unwrap(element.updated.amount?.value),
                message: unwrapValToHex(element.updated.parameter),
                receiveName: unwrap(element.updated.receiveName?.value),
                events: element.updated.events.map(unwrapValToHex),
            }
        case "transferred":
            return  {
                tag: TransactionEventTag.Transferred,
                from: transAddress(element.transferred.sender),
                amount: unwrap(element.transferred.amount?.value),
                to: transAddress(element.transferred.receiver)
            }
        case "interrupted":
            return {
                tag: TransactionEventTag.Interrupted,
                address: transContractAddress(element.interrupted.address),
                events: element.interrupted.events.map(unwrapValToHex)
            }
        case "resumed":
            return {
                tag: TransactionEventTag.Resumed,
                address: transContractAddress(element.resumed.address),
                success: unwrap(element.resumed.success)
            }
        case "upgraded":
            return {
                tag: TransactionEventTag.Upgraded,
                address: transContractAddress(element.upgraded.address),
                from: transModuleRef(element.upgraded.from),
                to: transModuleRef(element.upgraded.to)
            }
        default:
            throw Error("Invalid ContractTraceElement received, not able to translate to Transaction Event!")
    }
}

function transBakerEvent(bakerEvent: v2.BakerEvent): v1.TransactionEvent {
    const event = bakerEvent.event;
    switch (event.oneofKind) {
        case "bakerAdded":
            return {
                tag: TransactionEventTag.BakerAdded,
                bakerId: Number(unwrap(event.bakerAdded.keysEvent?.bakerId?.value)),
                account: unwrapToBase58(event.bakerAdded.keysEvent?.account),
                signKey: unwrapValToHex(event.bakerAdded.keysEvent?.signKey),
                electionKey: unwrapValToHex(event.bakerAdded.keysEvent?.electionKey),
                aggregationKey: unwrapValToHex(event.bakerAdded.keysEvent?.aggregationKey),
                stake: unwrap(event.bakerAdded.stake?.value),
                restakeEarnings: unwrap(event.bakerAdded.restakeEarnings)
            }
        case "bakerRemoved":
            return {
                tag: TransactionEventTag.BakerRemoved,
                bakerId: Number(unwrap(event.bakerRemoved.value)),

            }
        case "bakerStakeIncreased":
            return {
                tag: TransactionEventTag.BakerStakeIncreased,
                bakerId: Number(unwrap(event.bakerStakeIncreased.bakerId)),
                newStake: unwrap(event.bakerStakeIncreased.newStake?.value)
            }
        case "bakerStakeDecreased":
            return {
                tag: TransactionEventTag.BakerStakeDecreased,
                bakerId: Number(unwrap(event.bakerStakeDecreased.bakerId)),
                newStake: unwrap(event.bakerStakeDecreased.newStake?.value)
            }
        case "bakerRestakeEarningsUpdated":
            return {
                tag: TransactionEventTag.BakerSetRestakeEarnings,
                bakerId: Number(unwrap(event.bakerRestakeEarningsUpdated.bakerId?.value)),
                restakeEarnings: unwrap(event.bakerRestakeEarningsUpdated.restakeEarnings)
            }
        case "bakerKeysUpdated":
            return {
                tag: TransactionEventTag.BakerKeysUpdated,
                bakerId: Number(unwrap(event.bakerKeysUpdated.bakerId?.value)),
                account: unwrapToBase58(event.bakerKeysUpdated.account),
                signKey: unwrapValToHex(event.bakerKeysUpdated.signKey),
                electionKey: unwrapValToHex(event.bakerKeysUpdated.electionKey),
                aggregationKey: unwrapValToHex(event.bakerKeysUpdated.aggregationKey)
            }
        case "bakerSetOpenStatus":
            return {
                tag: TransactionEventTag.BakerSetOpenStatus,
                bakerId: Number(unwrap(event.bakerSetOpenStatus.bakerId?.value)),
                openStatus: transOpenStatus(event.bakerSetOpenStatus.openStatus),
            }
        case "bakerSetMetadataUrl":
            return {
                tag: TransactionEventTag.BakerSetMetadataURL,
                bakerId: Number(unwrap(event.bakerSetMetadataUrl.bakerId?.value)),
                metadataURL: event.bakerSetMetadataUrl.url
            }
        case "bakerSetTransactionFeeCommission":
            return {
                tag: TransactionEventTag.BakerSetTransactionFeeCommission,
                bakerId: Number(unwrap(event.bakerSetTransactionFeeCommission.bakerId?.value)),
                transactionFeeCommission: transAmountFraction(event.bakerSetTransactionFeeCommission.transactionFeeCommission)
            }
        case "bakerSetBakingRewardCommission":
            return {
                tag: TransactionEventTag.BakerSetBakingRewardCommission,
                bakerId: Number(unwrap(event.bakerSetBakingRewardCommission.bakerId?.value)),
                bakingRewardCommission: transAmountFraction(event.bakerSetBakingRewardCommission.bakingRewardCommission)
            }
        case "bakerSetFinalizationRewardCommission":
            return {
                tag: TransactionEventTag.BakerSetFinalizationRewardCommission,
                bakerId: Number(unwrap(event.bakerSetFinalizationRewardCommission.bakerId?.value)),
                finalizationRewardCommission: transAmountFraction(event.bakerSetFinalizationRewardCommission.finalizationRewardCommission)
            }
        case undefined:
            throw Error("Failed translating BakerEvent, encountered undefined")
    }
}

function transDelegationEvent(bakerEvent: v2.DelegationEvent): v1.TransactionEvent {
    throw NotImplemented
}

function transRejectReason(rejectReason: v2.RejectReason | undefined): v1.RejectReason {
    throw NotImplemented
}

function transTransactionEvent(accountTransactionEffects: v2.AccountTransactionEffects): v1.TransactionEvent[] | v1.RejectReason {
    const effect = accountTransactionEffects.effect;
    switch (effect.oneofKind) {
        case "none":
            return transRejectReason(effect.none.rejectReason)
        case "moduleDeployed":
            return [{
                tag: TransactionEventTag.ModuleDeployed,
                contents: transModuleRef(effect.moduleDeployed)
            }]
        case "contractInitialized":
            return [{
                tag: TransactionEventTag.ContractInitialized,
                address: unwrap(effect.contractInitialized.address),
                amount: unwrap(effect.contractInitialized.amount?.value),
                contractName: unwrap(effect.contractInitialized.initName?.value),
                events: unwrap(effect.contractInitialized.events.map(unwrapValToHex)),
                contractVersion: unwrap(effect.contractInitialized.contractVersion),
                originRef: transModuleRef(effect.contractInitialized.originRef)
            }]
        case "contractUpdateIssued":
            return effect.contractUpdateIssued.effects.map(transContractTraceElement);
        case "accountTransfer": {
            let ret: v1.TransactionEvent[] = [];
            if (effect.accountTransfer.memo) {
                const memo: v1.MemoEvent = {
                    tag: TransactionEventTag.TransferMemo,
                    memo: unwrapValToHex(effect.accountTransfer.memo),
                }
                ret.push(memo)
            }
            const transfer: v1.TransferredEvent = {
                tag: TransactionEventTag.Transferred,
                amount: unwrap(effect.accountTransfer.amount?.value),
                to: transAccountAddress(effect.accountTransfer.receiver),
            }
            ret.push(transfer)
            return ret
        }
        case "bakerAdded":
        case "bakerRemoved":
        case "bakerRestakeEarningsUpdated":
        case "bakerKeysUpdated":
            return [transBakerEvent({event: effect})]
        case "bakerStakeUpdated": {
            const increased = effect.bakerStakeUpdated.update?.increased;
            return [{
                tag: increased ? TransactionEventTag.BakerStakeIncreased : TransactionEventTag.BakerStakeDecreased,
                bakerId: Number(unwrap(effect.bakerStakeUpdated.update?.bakerId)),
                newStake: unwrap(effect.bakerStakeUpdated.update?.newStake?.value)
            }]
        }
        case "encryptedAmountTransferred":
            /*
            const removed = {
                tag: TransactionEventTag.EncryptedAmountsRemoved,
                account: unwrapToBase58(effect.encryptedAmountTransferred.removed?.account),
                amount: unwrapValToHex(effect.encryptedAmountTransferred.removed?.inputAmount),
                newAmount: unwrapValToHex(effect.encryptedAmountTransferred.removed?.newAmount),
                upToIndex: unwrap(effect.encryptedAmountTransferred.removed?.upToIndex)
            }
            */
           throw NotImplemented;
        case "transferredToEncrypted":
            throw NotImplemented
        case "transferredToPublic":
            throw NotImplemented
        case "transferredWithSchedule": {
            let ret: v1.TransactionEvent[] = [];
            if (effect.transferredWithSchedule.memo) {
                const memo: v1.MemoEvent = {
                    tag: TransactionEventTag.TransferMemo,
                    memo: unwrapValToHex(effect.transferredWithSchedule.memo),
                }
                ret.push(memo)
            }
            const transfer: v1.TransferredWithScheduleEvent = {
                tag: TransactionEventTag.TransferredWithSchedule,
                to: unwrapToBase58(effect.transferredWithSchedule.receiver),
                amount: effect.transferredWithSchedule.amount.map(transNewRelease)
            }
            ret.push(transfer)
            return ret
        }
        case "credentialsUpdated":
            return [{
                tag: TransactionEventTag.CredentialsUpdated,
                newCredIds: effect.credentialsUpdated.newCredIds.map(unwrapValToHex),
                removedCredIDs: effect.credentialsUpdated.removedCredIds.map(unwrapValToHex),
                newThreshold: unwrap(effect.credentialsUpdated.newThreshold?.value),
            }]
        case "dataRegistered":
            return [{
                tag: TransactionEventTag.DataRegistered,
                data: unwrapValToHex(effect.dataRegistered)
            }]
        case "bakerConfigured":
            return effect.bakerConfigured.events.map(transBakerEvent)
        case "delegationConfigured":
            return effect.delegationConfigured.events.map(transDelegationEvent)
        case undefined:
            throw Error("Failed translating AccountTransactionEffects, encountered undefined value")
    }
}

function BlockItemSummary(summary: v2.BlockItemSummary): v1.TransactionSummary {
    if (summary.details.oneofKind === "accountTransaction") {
        throw NotImplemented
    } else if (summary.details.oneofKind === "accountCreation") {
        throw NotImplemented
    } else if (summary.details.oneofKind === "update") {
        throw NotImplemented
    }
    else {
        throw Error("Invalid BlockItemSummary encountered!");
    }
}

function transBlockItemSummaryInBlock(summary: v2.BlockItemSummaryInBlock): [string, v1.TransactionSummary] {
    throw NotImplemented;
}

function transBlockItemSummaryInBlocks(summaries: v2.BlockItemSummaryInBlock[]): Record<string, v1.TransactionSummary> {
    const ret: Record<string, v1.TransactionSummary> = {};
    for (const summary of summaries) {
        const [blockHash, outcome] = transBlockItemSummaryInBlock(summary);
        ret[blockHash] = outcome
    }
    return ret
}

// Todo: committed and finalized
export function blockItemStatus(itemStatus: v2.BlockItemStatus): v1.TransactionStatus {
    if (itemStatus.status.oneofKind === 'received') {
        return {
            status: v1.TransactionStatusEnum.Received,
        };
    } else if (itemStatus.status.oneofKind === 'committed') {
        return {
            status: v1.TransactionStatusEnum.Committed,
            outcomes: transBlockItemSummaryInBlocks(itemStatus.status.committed.outcomes)
        };
    } else if (itemStatus.status.oneofKind === 'finalized') {
        return {
            status: v1.TransactionStatusEnum.Finalized,
            outcomes: transBlockItemSummaryInBlocks([unwrap(itemStatus.status.finalized.outcome)])
        };
    } else {
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
