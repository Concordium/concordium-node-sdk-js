import {
    AccountInfo,
    AccountInfoBaker,
    AccountInfoBakerV1,
    AccountInfoDelegator,
} from './types';

export const isDelegatorAccount = (
    ai: AccountInfo
): ai is AccountInfoDelegator =>
    (ai as AccountInfoDelegator).accountDelegation !== undefined;

export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker =>
    (ai as AccountInfoBaker).accountBaker !== undefined;

export const isBakerAccountV1 = (ai: AccountInfo): ai is AccountInfoBakerV1 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo !== undefined;
