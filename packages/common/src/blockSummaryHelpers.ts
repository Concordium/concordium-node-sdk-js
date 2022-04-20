import {
    Authorizations,
    AuthorizationsV1,
    BlockSummary,
    BlockSummaryV1,
    ChainParameters,
    ChainParametersV1,
    Keys,
    KeysV1,
    UpdateQueues,
    UpdateQueuesV1,
    Updates,
    UpdatesV1,
} from './types';

export const isAuthorizationsV1 = (a: Authorizations): a is AuthorizationsV1 =>
    (a as AuthorizationsV1).timeParameters !== undefined;

export const isChainParametersV1 = (
    cp: ChainParameters
): cp is ChainParametersV1 =>
    (cp as ChainParametersV1).mintPerPayday !== undefined;

export const isKeysV1 = (k: Keys): k is KeysV1 =>
    isAuthorizationsV1(k.level2Keys);

export const isUpdateQueuesV1 = (uq: UpdateQueues): uq is UpdateQueuesV1 =>
    (uq as UpdateQueuesV1).timeParameters !== undefined;

export const isUpdatesV1 = (u: Updates): u is UpdatesV1 =>
    isUpdateQueuesV1(u.updateQueues);

export const isBlockSummaryV1 = (bs: BlockSummary): bs is BlockSummaryV1 =>
    (bs as BlockSummaryV1).protocolVersion !== undefined;
