import {
    AccountInfo,
    AccountInfoBaker,
    AccountInfoDelegator,
    AccountInfoType,
    ReduceStakePendingChange,
    RemovalPendingChange,
    StakePendingChange,
    StakePendingChangeType,
} from './types.js';

/**
 * Whether {@link AccountInfo} parameter given is of type {@link AccountInfoDelegator}, i.e. the account is a delegator
 *
 * @deprecated check `type` member instead.
 */
export const isDelegatorAccount = (ai: AccountInfo): ai is AccountInfoDelegator =>
    ai.type === AccountInfoType.Delegator;

/**
 * Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBaker}, i.e. the account is a baker.
 *
 * @deprecated check `type` member instead.
 */
export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker => ai.type === AccountInfoType.Baker;

/**
 * Whether the pending change given is of type {@link ReduceStakePendingChange}
 *
 * @deprecated check `change` member instead.
 */
export const isReduceStakePendingChange = (spc: StakePendingChange): spc is ReduceStakePendingChange =>
    spc.change === StakePendingChangeType.ReduceStake;

/**
 * Whether the pending change given is of type {@link RemovalPendingChange}
 *
 * @deprecated check `change` member instead.
 */
export const isRemovalPendingChange = (spc: StakePendingChange): spc is RemovalPendingChange =>
    spc.change === StakePendingChangeType.RemoveStake;
