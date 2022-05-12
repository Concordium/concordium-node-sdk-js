import { RewardStatus, RewardStatusV1 } from './types';

export function isRewardStatusV1(rs: RewardStatus): rs is RewardStatusV1 {
    return rs.protocolVersion !== undefined && rs.protocolVersion > 3n;
}
