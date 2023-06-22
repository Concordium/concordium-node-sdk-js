import * as wasm from '@concordium/rust-bindings';
import { AccountAddress } from './types/accountAddress';
import {
    ReduceStakePendingChange,
    RemovalPendingChange,
    AccountInfo,
    AccountInfoBaker,
    AccountInfoDelegator,
    GenerateBakerKeysOutput,
} from './types';

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoDelegator}, i.e. the account is a delegator */
export const isDelegatorAccount = (
    ai: AccountInfo
): ai is AccountInfoDelegator =>
    (ai as AccountInfoDelegator).accountDelegation !== undefined;

/** Whether {@link AccountInfo} parameter given is of type {@link AccountInfoBaker}, i.e. the account is a baker. */
export const isBakerAccount = (ai: AccountInfo): ai is AccountInfoBaker =>
    (ai as AccountInfoBaker).accountBaker !== undefined;

/** Whether the pending change given is of type {@link ReduceStakePendingChange} */
export const isReduceStakePendingChange = (
    spc: ReduceStakePendingChange | RemovalPendingChange
): spc is ReduceStakePendingChange =>
    (spc as ReduceStakePendingChange).newStake !== undefined;

/** Whether the pending change given is of type {@link RemovalPendingChange} */
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
