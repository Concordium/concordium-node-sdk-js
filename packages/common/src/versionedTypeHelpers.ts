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
} from './types';

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBakerV0} */
export const isBakerAccountV0 = (ai: AccountInfo): ai is AccountInfoBakerV0 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo === undefined;

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBakerV1} */
export const isBakerAccountV1 = (ai: AccountInfo): ai is AccountInfoBakerV1 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo !== undefined;

/** Whether {@link StakePendingChange} parameter given is of type {@link StakePendingChangeV0} */
export const isStakePendingChangeV0 = (
    spc: StakePendingChange
): spc is StakePendingChangeV0 =>
    (spc as StakePendingChangeV0).epoch !== undefined;

/** Whether {@link StakePendingChange} parameter given is of type {@link StakePendingChangeV1} */
export const isStakePendingChangeV1 = (
    spc: StakePendingChange
): spc is StakePendingChangeV1 =>
    (spc as StakePendingChangeV1).effectiveTime !== undefined;

/** Whether {@link Authorizations} parameter given is of type {@link AuthorizationsV1} */
export const isAuthorizationsV1 = (
    as: Authorizations
): as is AuthorizationsV1 =>
    (as as AuthorizationsV1).timeParameters !== undefined;

/** Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV0} */
export const isChainParametersV0 = (
    cp: ChainParameters
): cp is ChainParametersV0 =>
    (cp as ChainParametersV0).minimumThresholdForBaking !== undefined;

/** Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV1} */
export const isChainParametersV1 = (
    cp: ChainParameters
): cp is ChainParametersV1 =>
    (cp as ChainParametersV1).timeParameters !== undefined &&
    !isChainParametersV2(cp);

/** Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV2} */
export const isChainParametersV2 = (
    cp: ChainParameters
): cp is ChainParametersV2 =>
    (cp as ChainParametersV2).consensusParameters !== undefined;

/** Whether {@link Keys} parameter given is of type {@link KeysV0} */
export const isKeysV0 = (ks: Keys): ks is KeysV0 =>
    !isAuthorizationsV1(ks.level2Keys);

/** Whether {@link Keys} parameter given is of type {@link KeysV1} */
export const isKeysV1 = (ks: Keys): ks is KeysV1 =>
    isAuthorizationsV1(ks.level2Keys);

/** Whether {@link BlockInfo} parameter given is of type {@link BlockInfoV0} */
export const isBlockInfoV0 = (bi: BlockInfo): bi is BlockInfoV0 =>
    (bi as BlockInfoV0).blockSlot !== undefined;

/** Whether {@link BlockInfo} parameter given is of type {@link BlockInfoV1} */
export const isBlockInfoV1 = (bi: BlockInfo): bi is BlockInfoV1 =>
    (bi as BlockInfoV1).round !== undefined;

/** Whether {@link ConensusStatus} parameter given is of type {@link ConsensusStatusV0} */
export const isConsensusStatusV0 = (
    cs: ConsensusStatus
): cs is ConsensusStatusV0 =>
    (cs as ConsensusStatusV0).slotDuration !== undefined;

/** Whether {@link ConensusStatus} parameter given is of type {@link ConsensusStatusV1} */
export const isConsensusStatusV1 = (
    cs: ConsensusStatus
): cs is ConsensusStatusV1 =>
    (cs as ConsensusStatusV1).currentRound !== undefined;

/** Whether {@link ElectionInfo} parameter given is of type {@link ElectionInfoV0} */
export const isElectionInfoV0 = (ei: ElectionInfo): ei is ElectionInfoV0 =>
    (ei as ElectionInfoV0).electionDifficulty !== undefined;

/** Whether {@link ElectionInfo} parameter given is of type {@link ElectionInfoV1} */
export const isElectionInfoV1 = (ei: ElectionInfo): ei is ElectionInfoV1 =>
    !isElectionInfoV0(ei);
