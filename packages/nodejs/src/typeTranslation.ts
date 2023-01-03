import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import { mapRecord, unwrap } from './util';
import { Buffer } from 'buffer/';

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

export function translateAccountInfo(acc: v2.AccountInfo): v1.AccountInfo {
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
