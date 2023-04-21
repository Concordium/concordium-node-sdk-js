import * as wasm from '@concordium/rust-bindings';
import { AccountAddress } from './types/accountAddress';
import {
    ReduceStakePendingChange,
    RemovalPendingChange,
    StakePendingChange,
    StakePendingChangeV1,
    AccountInfo,
    AccountInfoBaker,
    AccountInfoBakerV0,
    AccountInfoBakerV1,
    AccountInfoDelegator,
    StakePendingChangeV0,
    GenerateBakerKeysOutput,
} from './types';

export const isDelegatorAccount = (
    ai: AccountInfo
): ai is AccountInfoDelegator =>
    (ai as AccountInfoDelegator).accountDelegation !== undefined;

export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker =>
    (ai as AccountInfoBaker).accountBaker !== undefined;

export const isBakerAccountV1 = (ai: AccountInfo): ai is AccountInfoBakerV1 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo !== undefined;

export const isBakerAccountV0 = (ai: AccountInfo): ai is AccountInfoBakerV0 =>
    (ai as AccountInfoBakerV1).accountBaker?.bakerPoolInfo === undefined;

export const isStakePendingChangeV1 = (
    spc: StakePendingChange
): spc is StakePendingChangeV1 =>
    (spc as StakePendingChangeV1).effectiveTime !== undefined;

export const isStakePendingChangeV0 = (
    spc: StakePendingChange
): spc is StakePendingChangeV0 =>
    (spc as StakePendingChangeV0).epoch !== undefined;

export const isReduceStakePendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is ReduceStakePendingChange =>
    (spc as ReduceStakePendingChange).newStake !== undefined;

export const isRemovalPendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is RemovalPendingChange => !isReduceStakePendingChange(spc);

/**
 * Generates random baker keys for the specified account, that can be used with the configureBaker transaction
 * @param account the address of the account that the keys should be added to.
 * @returns an object containing the public baker keys, their associated proofs and their associated private keys.
 */
export function generateBakerKeys(
    account: AccountAddress
): GenerateBakerKeysOutput {
    const rawKeys = wasm.generateBakerKeys(account.address);
    try {
        return JSON.parse(rawKeys);
    } catch (e) {
        throw new Error(rawKeys);
    }
}
