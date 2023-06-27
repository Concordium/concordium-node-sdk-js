import {
    BlockSummary,
    BlockSummaryV0,
    BlockSummaryV1,
    BlockSummaryV2,
    UpdateQueues,
    UpdateQueuesV0,
    UpdateQueuesV1,
    UpdateQueuesV2,
    Updates,
    UpdatesV0,
    UpdatesV1,
    UpdatesV2,
} from './types';

/** Whether {@link UpdateQueues} parameter given is of type {@link UpdateQueuesV0} */
export const isUpdateQueuesV0 = (uq: UpdateQueues): uq is UpdateQueuesV0 =>
    (uq as UpdateQueuesV0).bakerStakeThreshold !== undefined;

/** Whether {@link UpdateQueues} parameter given is of type {@link UpdateQueuesV1} */
export const isUpdateQueuesV1 = (uq: UpdateQueues): uq is UpdateQueuesV1 =>
    (uq as UpdateQueuesV1).timeParameters !== undefined;

/** Whether {@link UpdateQueues} parameter given is of type {@link UpdateQueuesV2} */
export const isUpdateQueuesV2 = (uq: UpdateQueues): uq is UpdateQueuesV2 =>
    (uq as UpdateQueuesV2).consensus2TimingParameters !== undefined;

export const isUpdatesV0 = (u: Updates): u is UpdatesV0 =>
    isUpdateQueuesV0(u.updateQueues);

export const isUpdatesV1 = (u: Updates): u is UpdatesV1 =>
    isUpdateQueuesV1(u.updateQueues);

export const isUpdatesV2 = (u: Updates): u is UpdatesV2 =>
    isUpdateQueuesV2(u.updateQueues);

export const isBlockSummaryV0 = (bs: BlockSummary): bs is BlockSummaryV0 =>
    bs.protocolVersion === undefined || bs.protocolVersion <= 3n;

export const isBlockSummaryV1 = (bs: BlockSummary): bs is BlockSummaryV1 =>
    bs.protocolVersion !== undefined &&
    bs.protocolVersion > 3n &&
    bs.protocolVersion <= 5n;

export const isBlockSummaryV2 = (bs: BlockSummary): bs is BlockSummaryV2 =>
    bs.protocolVersion !== undefined && bs.protocolVersion > 5n;
