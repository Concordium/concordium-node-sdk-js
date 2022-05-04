import { RewardStatus, RewardStatusV1 } from './types';

export const isRewardStatusV1 = (rs: RewardStatus): rs is RewardStatusV1 =>
    rs.protocolVersion !== undefined && rs.protocolVersion > 3n;
