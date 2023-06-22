import {
    BlockSummary,
    BlockSummaryV0,
    BlockSummaryV1,
    Updates,
    UpdatesV0,
    UpdatesV1,
} from './types';
import { isUpdateQueuesV0, isUpdateQueuesV1 } from './versionedTypeHelpers';

export const isUpdatesV1 = (u: Updates): u is UpdatesV1 =>
    isUpdateQueuesV1(u.updateQueues);

export const isUpdatesV0 = (u: Updates): u is UpdatesV0 =>
    isUpdateQueuesV0(u.updateQueues);

export const isBlockSummaryV1 = (bs: BlockSummary): bs is BlockSummaryV1 =>
    bs.protocolVersion !== undefined && bs.protocolVersion > 3n;

export const isBlockSummaryV0 = (bs: BlockSummary): bs is BlockSummaryV0 =>
    bs.protocolVersion === undefined || bs.protocolVersion <= 3n;
