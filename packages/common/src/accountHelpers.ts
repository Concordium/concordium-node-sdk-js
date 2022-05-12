import {
    ReduceStakePendingChange,
    RemovalPendingChange,
    StakePendingChange,
    StakePendingChangeV1,
} from '.';
import {
    AccountInfo,
    AccountInfoBaker,
    AccountInfoBakerV0,
    AccountInfoBakerV1,
    AccountInfoDelegator,
    StakePendingChangeV0,
} from './types';

export const isDelegatorAccount = (
    ai: AccountInfo
): ai is AccountInfoDelegator =>
    (ai as AccountInfoDelegator).accountDelegation !== undefined;

export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker =>
    (ai as AccountInfoBaker).accountBaker !== undefined;

export const isBakerAccountV1 = (ai: AccountInfo): ai is AccountInfoBakerV1 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo !== undefined;

export const isBakerAccountV0 = (ai: AccountInfo): ai is AccountInfoBakerV0 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo === undefined;

export const isStakePendingChangeV1 = (
    spc: StakePendingChange
): spc is StakePendingChangeV1 =>
    (spc as StakePendingChangeV1).effectiveTime !== undefined;

export const isStakePendingChangeV0 = (
    spc: StakePendingChange
): spc is StakePendingChangeV0 =>
    (spc as StakePendingChangeV0).epoch !== undefined;

export const isReduceStakePendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is ReduceStakePendingChange =>
    (spc as ReduceStakePendingChange).newStake !== undefined;

export const isRemovalPendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is RemovalPendingChange => !isReduceStakePendingChange(spc);
