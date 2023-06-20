import {
    Authorizations,
    AuthorizationsV1,
    BlockSummary,
    BlockSummaryV0,
    BlockSummaryV1,
    ChainParameters,
    ChainParametersV0,
    ChainParametersV1,
    ChainParametersV2,
    Keys,
    KeysV0,
    KeysV1,
    UpdateQueues,
    UpdateQueuesV0,
    UpdateQueuesV1,
    Updates,
    UpdatesV0,
    UpdatesV1,
} from './types';

export const isAuthorizationsV1 = (a: Authorizations): a is AuthorizationsV1 =>
    (a as AuthorizationsV1).timeParameters !== undefined;

export const isChainParametersV1 = (
    cp: ChainParameters
): cp is ChainParametersV1 =>
    (cp as ChainParametersV1).timeParameters !== undefined &&
    !isChainParametersV2(cp);

export const isChainParametersV0 = (
    cp: ChainParameters
): cp is ChainParametersV0 =>
    (cp as ChainParametersV0).minimumThresholdForBaking !== undefined;

export const isChainParametersV2 = (
    cp: ChainParameters
): cp is ChainParametersV2 =>
    (cp as ChainParametersV2).consensusParameters !== undefined;

export const isKeysV1 = (k: Keys): k is KeysV1 =>
    isAuthorizationsV1(k.level2Keys);

export const isKeysV0 = (k: Keys): k is KeysV0 =>
    !isAuthorizationsV1(k.level2Keys);

export const isUpdateQueuesV1 = (uq: UpdateQueues): uq is UpdateQueuesV1 =>
    (uq as UpdateQueuesV1).timeParameters !== undefined;

export const isUpdateQueuesV0 = (uq: UpdateQueues): uq is UpdateQueuesV0 =>
    (uq as UpdateQueuesV0).bakerStakeThreshold !== undefined;

export const isUpdatesV1 = (u: Updates): u is UpdatesV1 =>
    isUpdateQueuesV1(u.updateQueues);

export const isUpdatesV0 = (u: Updates): u is UpdatesV0 =>
    isUpdateQueuesV0(u.updateQueues);

export const isBlockSummaryV1 = (bs: BlockSummary): bs is BlockSummaryV1 =>
    bs.protocolVersion !== undefined && bs.protocolVersion > 3n;

export const isBlockSummaryV0 = (bs: BlockSummary): bs is BlockSummaryV0 =>
    bs.protocolVersion === undefined || bs.protocolVersion <= 3n;
