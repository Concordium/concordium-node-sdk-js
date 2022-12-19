import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import { recordMap, unwrap } from './util';

function unwrapHex(x: Uint8Array | undefined): string {
    return Buffer.from(unwrap(x)).toString('hex');
}
function unwrapValueToHex(x: v2.EncryptedAmount | v2.TransactionHash): string {
    return unwrapHex(x.value);
}

function transRelease(x: v2.Release): v1.ReleaseScheduleWithTransactions {
    return {
        timestamp: new Date(Number(unwrap(x.timestamp?.value)) * 1000),
        amount: unwrap(x.amount?.value),
        transactions: x.transactions.map(unwrapValueToHex),
    };
}

function transDate(x: v2.YearMonth): string {
    const month = x.month < 10 ? '0' + String(x.month) : String(x.month);
    return String(x.year) + month;
}

function transAttKey(x: number): v1.AttributeKey {
    return v1.AttributesKeys[x] as v1.AttributeKey;
}

function transCommit(x: v2.Commitment): string {
    return unwrapHex(x.value);
}

function transCommits(
    cmm: v2.CredentialCommitments
): v1.CredentialDeploymentCommitments {
    return {
        cmmPrf: unwrapHex(cmm.prf?.value),
        cmmCredCounter: unwrapHex(cmm.credCounter?.value),
        cmmIdCredSecSharingCoeff:
            cmm.idCredSecSharingCoeff.map(unwrapValueToHex),
        cmmAttributes: recordMap(cmm.attributes, transCommit, transAttKey),
        cmmMaxAccounts: unwrapHex(cmm.maxAccounts?.value),
    };
}

function transVerifyKey(verifyKey: v2.AccountVerifyKey): v1.VerifyKey {
    if (verifyKey.key.oneofKind === 'ed25519Key') {
        return {
            schemeId: 'Ed25519',
            verifyKey: unwrapHex(verifyKey.key.ed25519Key),
        };
    } else {
        throw Error('Undefined value found.');
    }
}

function transCredKeys(
    credKeys: v2.CredentialPublicKeys
): v1.CredentialPublicKeys {
    return {
        threshold: unwrap(credKeys.threshold?.value),
        keys: recordMap(credKeys.keys, transVerifyKey),
    };
}

function transChainArData(chainArData: v2.ChainArData): v1.ChainArData {
    return {
        encIdCredPubShare: unwrapHex(chainArData.encIdCredPubShare),
    };
}

function transCred(cred: v2.AccountCredential): v1.AccountCredential {
    const crd = cred.credentialValues as any;
    if (crd === undefined) {
        throw Error('Unexpected undefined value found');
    }
    const isNormal = crd.oneofKind === 'normal';
    const credVals = isNormal ? crd.normal : crd.initial;

    const policy: v1.Policy = {
        validTo: transDate(unwrap(credVals.policy?.validTo)),
        createdAt: transDate(unwrap(credVals.policy?.createdAt)),
        revealedAttributes: recordMap(
            credVals.policy?.attributes,
            unwrapHex,
            transAttKey
        ), //as Record<v1.AttributeKey, string>,
    };
    const deploymentValues = {
        ipIdentity: unwrap(credVals.ipId?.value),
        credentialPublicKeys: transCredKeys(unwrap(credVals.keys)),
        policy: policy,
        ...((isNormal && {
            // if isNormal...
            credId: unwrapHex(credVals.credId?.value),
            revocationThreshold: unwrap(credVals.arThreshold?.value),
            arData: recordMap(credVals.arData, transChainArData, String),
            commitments: transCommits(unwrap(credVals.commitments)),
        }) || {
            // else...
            regId: unwrapHex(credVals.credId?.value),
        }),
    };
    const val = {
        type: isNormal ? 'normal' : 'initial',
        contents: deploymentValues,
    };

    return {
        v: 0,
        value: isNormal
            ? (val as v1.NormalAccountCredential)
            : (val as v1.InitialAccountCredential),
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
        throw Error('asdf');
    }
}

function transTimestamp(timestamp: v2.Timestamp | undefined): Date {
    return new Date(Number(unwrap(timestamp?.value)) * 1000);
}

// StakePendingChangeV0Common, this is only done for v1
function transPendingChange(
    pendingChange: v2.StakePendingChange | undefined
): v1.StakePendingChange {
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
        throw Error('Unexpected undefined variable found.');
    }
}

function transDelegator(
    deleg: v2.AccountStakingInfo_Delegator
): v1.AccountDelegationDetails {
    return {
        restakeEarnings: deleg.restakeEarnings,
        stakedAmount: unwrap(deleg.stakedAmount?.value),
        delegationTarget: transDelegatorTarget(unwrap(deleg.target)),
        ...(deleg.pendingChange && {
            pendingChange: transPendingChange(
                deleg.pendingChange
            ) as v1.StakePendingChangeV1,
        }),
    };
}

function transAmountFraction(amount: v2.AmountFraction | undefined): number {
    return unwrap(amount?.partsPerHundredThousand) / 100000;
}

// Todo: Smart way to do this?
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
        bakerAggregationVerifyKey: unwrapHex(bakerInfo?.aggregationKey?.value),
        bakerElectionVerifyKey: unwrapHex(baker.bakerInfo?.electionKey?.value),
        bakerSignatureVerifyKey: unwrapHex(bakerInfo?.signatureKey?.value),
        bakerPoolInfo: bakerPoolInfo,
        stakedAmount: unwrap(baker.stakedAmount?.value),
        ...(baker.pendingChange && {
            pendingChange: transPendingChange(baker.pendingChange),
        }),
    };
}

export function translateAccountInfo(acc: v2.AccountInfo): v1.AccountInfo {
    const accAdrRaw = Buffer.from(unwrap(acc.address?.value)) as any;
    const aggAmount = acc.encryptedBalance?.aggregatedAmount?.value;
    const numAggregated = acc.encryptedBalance?.numAggregated;

    const encryptedAmount: v1.AccountEncryptedAmount = {
        selfAmount: unwrapHex(acc.encryptedBalance?.selfAmount?.value),
        startIndex: unwrap(acc.encryptedBalance?.startIndex),
        incomingAmounts: unwrap(acc.encryptedBalance?.incomingAmounts).map(
            unwrapValueToHex
        ),
        // Set the following values if they are not undefined
        ...(numAggregated && { numAggregated: numAggregated }),
        ...(aggAmount && { aggregatedAmount: unwrapHex(aggAmount) }),
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
        accountEncryptionKey: unwrapHex(acc.encryptionKey?.value),
        accountEncryptedAmount: encryptedAmount,
        accountReleaseSchedule: releaseSchedule,
        accountCredentials: recordMap(acc.creds, transCred),
    };
    if (acc.stake?.stakingInfo.oneofKind === 'delegator') {
        const accInfo = accInfoCommon as v1.AccountInfoDelegator;
        accInfo.accountDelegation = transDelegator(
            acc.stake.stakingInfo.delegator
        );
        return accInfo;
    }
    if (acc.stake?.stakingInfo.oneofKind === 'baker') {
        const accInfo = accInfoCommon as v1.AccountInfoBaker;
        accInfo.accountBaker = transBaker(acc.stake.stakingInfo.baker);
        return accInfo;
    }
    return accInfoCommon;
}
