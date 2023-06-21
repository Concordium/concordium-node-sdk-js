import {
    AccountInfo,
    AccountInfoBakerV0,
    AccountInfoBakerV1,
    Authorizations,
    AuthorizationsV1,
    BlockInfo,
    BlockInfoV0,
    BlockInfoV1,
    ChainParameters,
    ChainParametersV0,
    ChainParametersV1,
    ChainParametersV2,
    ConsensusStatus,
    ConsensusStatusV0,
    ConsensusStatusV1,
    ElectionInfo,
    ElectionInfoV0,
    ElectionInfoV1,
    Keys,
    KeysV0,
    KeysV1,
    StakePendingChange,
    StakePendingChangeV0,
    StakePendingChangeV1,
    UpdateQueues,
    UpdateQueuesV0,
    UpdateQueuesV1,
} from './types';

export const isBakerAccountV0 = (ai: AccountInfo): ai is AccountInfoBakerV0 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo === undefined;

export const isBakerAccountV1 = (ai: AccountInfo): ai is AccountInfoBakerV1 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo !== undefined;

export const isStakePendingChangeV0 = (
    spc: StakePendingChange
): spc is StakePendingChangeV0 =>
    (spc as StakePendingChangeV0).epoch !== undefined;

export const isStakePendingChangeV1 = (
    spc: StakePendingChange
): spc is StakePendingChangeV1 =>
    (spc as StakePendingChangeV1).effectiveTime !== undefined;

export const isAuthorizationsV0 = (
    as: Authorizations
): as is AuthorizationsV1 => !isAuthorizationsV1(as);

export const isAuthorizationsV1 = (
    as: Authorizations
): as is AuthorizationsV1 =>
    (as as AuthorizationsV1).timeParameters !== undefined;

export const isChainParametersV0 = (
    cp: ChainParameters
): cp is ChainParametersV0 =>
    (cp as ChainParametersV0).minimumThresholdForBaking !== undefined;

export const isChainParametersV1 = (
    cp: ChainParameters
): cp is ChainParametersV1 =>
    (cp as ChainParametersV1).timeParameters !== undefined &&
    !isChainParametersV2(cp);

export const isChainParametersV2 = (
    cp: ChainParameters
): cp is ChainParametersV2 =>
    (cp as ChainParametersV2).consensusParameters !== undefined;

export const isKeysV0 = (ks: Keys): ks is KeysV0 =>
    !isAuthorizationsV1(ks.level2Keys);

export const isKeysV1 = (ks: Keys): ks is KeysV1 =>
    isAuthorizationsV1(ks.level2Keys);

export const isUpdateQueuesV0 = (uq: UpdateQueues): uq is UpdateQueuesV0 =>
    (uq as UpdateQueuesV0).bakerStakeThreshold !== undefined;

export const isUpdateQueuesV1 = (uq: UpdateQueues): uq is UpdateQueuesV1 =>
    (uq as UpdateQueuesV1).timeParameters !== undefined;

export const isBlockInfoV0 = (bi: BlockInfo): bi is BlockInfoV0 =>
    (bi as BlockInfoV0).blockSlot !== undefined;

export const isBlockInfoV1 = (bi: BlockInfo): bi is BlockInfoV1 =>
    (bi as BlockInfoV1).round !== undefined;

export const isConsensusStatusV0 = (
    cs: ConsensusStatus
): cs is ConsensusStatusV0 =>
    (cs as ConsensusStatusV0).slotDuration !== undefined;

export const isConsensusStatusV1 = (
    cs: ConsensusStatus
): cs is ConsensusStatusV1 =>
    (cs as ConsensusStatusV1).currentRound !== undefined;

export const isElectionInfoV0 = (ei: ElectionInfo): ei is ElectionInfoV0 =>
    (ei as ElectionInfoV0).electionDifficulty !== undefined;

export const isElectionInfoV1 = (ei: ElectionInfo): ei is ElectionInfoV1 =>
    !isElectionInfoV0(ei);
