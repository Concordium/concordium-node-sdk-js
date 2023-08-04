import {
    ReduceStakePendingChange,
    RemovalPendingChange,
    AccountInfo,
    AccountInfoBaker,
    AccountInfoDelegator,
} from './types';

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoDelegator}, i.e. the account is a delegator */
export const isDelegatorAccount = (
    ai: AccountInfo
): ai is AccountInfoDelegator =>
    (ai as AccountInfoDelegator).accountDelegation !== undefined;

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBaker}, i.e. the account is a baker. */
export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker =>
    (ai as AccountInfoBaker).accountBaker !== undefined;

/** Whether the pending change given is of type {@link ReduceStakePendingChange} */
export const isReduceStakePendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is ReduceStakePendingChange =>
    (spc as ReduceStakePendingChange).newStake !== undefined;

/** Whether the pending change given is of type {@link RemovalPendingChange} */
export const isRemovalPendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is RemovalPendingChange => !isReduceStakePendingChange(spc);
