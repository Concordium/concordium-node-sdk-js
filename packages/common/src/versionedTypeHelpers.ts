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
    InstanceInfo,
    InstanceInfoV0,
    InstanceInfoV1,
} from './types.js';

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBakerV0} */
export const isBakerAccountV0 = (ai: AccountInfo): ai is AccountInfoBakerV0 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo === undefined;

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBakerV1} */
export const isBakerAccountV1 = (ai: AccountInfo): ai is AccountInfoBakerV1 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo !== undefined;

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
    (cp as ChainParametersV1).mintPerPayday !== undefined &&
    !isChainParametersV2(cp);

/** Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV2} */
export const isChainParametersV2 = (
    cp: ChainParameters
): cp is ChainParametersV2 =>
    (cp as ChainParametersV2).maximumFinalizers !== undefined;

/** Whether {@link BlockInfo} parameter given is of type {@link BlockInfoV0} */
export const isBlockInfoV0 = (bi: BlockInfo): bi is BlockInfoV0 =>
    (bi as BlockInfoV0).blockSlot !== undefined;

/** Whether {@link BlockInfo} parameter given is of type {@link BlockInfoV1} */
export const isBlockInfoV1 = (bi: BlockInfo): bi is BlockInfoV1 =>
    (bi as BlockInfoV1).round !== undefined;

/** Whether {@link ConensusStatus} parameter given is of type {@link ConsensusStatusV0} */
export const isConsensusStatusV0 = (
    cs: ConsensusStatus
): cs is ConsensusStatusV0 => (cs as ConsensusStatusV0).slotDuration != null;

/** Whether {@link ConensusStatus} parameter given is of type {@link ConsensusStatusV1} */
export const isConsensusStatusV1 = (
    cs: ConsensusStatus
): cs is ConsensusStatusV1 =>
    (cs as ConsensusStatusV1).concordiumBFTStatus !== undefined;

/** Whether {@link ElectionInfo} parameter given is of type {@link ElectionInfoV0} */
export const isElectionInfoV0 = (ei: ElectionInfo): ei is ElectionInfoV0 =>
    (ei as ElectionInfoV0).electionDifficulty !== undefined;

/** Whether {@link ElectionInfo} parameter given is of type {@link ElectionInfoV1} */
export const isElectionInfoV1 = (ei: ElectionInfo): ei is ElectionInfoV1 =>
    !isElectionInfoV0(ei);

export const isInstanceInfoV1 = (info: InstanceInfo): info is InstanceInfoV1 =>
    info.version === 1;

export const isInstanceInfoV0 = (info: InstanceInfo): info is InstanceInfoV0 =>
    info.version === undefined || info.version === 0;
