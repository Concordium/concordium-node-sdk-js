import {
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
    RewardStatus,
    RewardStatusV1,
} from './types.js';

/**
 * Whether {@link Authorizations} parameter given is of type {@link AuthorizationsV1}
 *
 * @deprecated check the `version` member instead.
 */
export const isAuthorizationsV1 = (as: Authorizations): as is AuthorizationsV1 => as.version === 1;

/**
 * Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV0}
 *
 * @deprecated check the `version` member instead.
 */
export const isChainParametersV0 = (cp: ChainParameters): cp is ChainParametersV0 => cp.version === 0;

/**
 * Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV1}
 *
 * @deprecated check the `version` member instead.
 */
export const isChainParametersV1 = (cp: ChainParameters): cp is ChainParametersV1 => cp.version === 1;

/**
 * Whether {@link ChainParameters} parameter given is of type {@link ChainParametersV2}
 *
 * @deprecated check the `version` member instead.
 */
export const isChainParametersV2 = (cp: ChainParameters): cp is ChainParametersV2 => cp.version === 2;

/**
 * Whether {@link BlockInfo} parameter given is of type {@link BlockInfoV0}
 *
 * @deprecated check the `version` member instead.
 */
export const isBlockInfoV0 = (bi: BlockInfo): bi is BlockInfoV0 => bi.version === 0;

/**
 * Whether {@link BlockInfo} parameter given is of type {@link BlockInfoV1}
 *
 * @deprecated check the `version` member instead.
 */
export const isBlockInfoV1 = (bi: BlockInfo): bi is BlockInfoV1 => bi.version === 1;

/**
 * Whether {@link ConensusStatus} parameter given is of type {@link ConsensusStatusV0}
 *
 * @deprecated check the `version` member instead.
 */
export const isConsensusStatusV0 = (cs: ConsensusStatus): cs is ConsensusStatusV0 => cs.version === 0;

/**
 * Whether {@link ConensusStatus} parameter given is of type {@link ConsensusStatusV1}
 *
 * @deprecated check the `version` member instead.
 */
export const isConsensusStatusV1 = (cs: ConsensusStatus): cs is ConsensusStatusV1 => cs.version === 1;

/**
 * Whether {@link ElectionInfo} parameter given is of type {@link ElectionInfoV0}
 *
 * @deprecated check the `version` member instead.
 */
export const isElectionInfoV0 = (ei: ElectionInfo): ei is ElectionInfoV0 => ei.version === 0;

/**
 * Whether {@link ElectionInfo} parameter given is of type {@link ElectionInfoV1}
 *
 * @deprecated check the `version` member instead.
 */
export const isElectionInfoV1 = (ei: ElectionInfo): ei is ElectionInfoV1 => ei.version === 1;

/**
 * Whether {@link InstanceInfo} parameter given is of type {@link InstanceInfoV1}
 *
 * @deprecated check the `version` member instead.
 */
export const isInstanceInfoV1 = (info: InstanceInfo): info is InstanceInfoV1 => info.version === 1;

/**
 * Whether {@link InstanceInfo} parameter given is of type {@link InstanceInfoV0}
 *
 * @deprecated check the `version` member instead.
 */
export const isInstanceInfoV0 = (info: InstanceInfo): info is InstanceInfoV0 =>
    info.version === undefined || info.version === 0;

/**
 * Whether {@link RewardStatus} parameter given is of type {@link RewardStatusV1}
 *
 * @deprecated check the `version` member instead.
 */
export function isRewardStatusV1(rs: RewardStatus): rs is RewardStatusV1 {
    return rs.version === 1;
}
