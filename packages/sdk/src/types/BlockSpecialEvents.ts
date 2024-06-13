import type { BakerId } from '../types.js';
import * as AccountAddress from './AccountAddress.js';
import * as CcdAmount from './CcdAmount.js';

export type BlockSpecialEvent =
    | BlockSpecialEventBakingRewards
    | BlockSpecialEventMint
    | BlockSpecialEventFinalizationRewards
    | BlockSpecialEventBlockReward
    | BlockSpecialEventPaydayFoundationReward
    | BlockSpecialEventPaydayAccountReward
    | BlockSpecialEventBlockAccrueReward
    | BlockSpecialEventPaydayPoolReward;

export interface BlockSpecialEventBakingRewards {
    tag: 'bakingRewards';
    // The amount awarded to each baker.
    bakingRewards: BlockSpecialEventAccountAmount[];
    // The remaining balance of the baker reward account.
    remainder: CcdAmount.Type;
}

export interface BlockSpecialEventMint {
    tag: 'mint';
    // The amount allocated to the banking reward account.
    mintBakingReward: CcdAmount.Type;
    // The amount allocated to the finalization reward account.
    mintFinalizationReward: CcdAmount.Type;
    // The amount allocated as the platform development charge.
    mintPlatformDevelopmentCharge: CcdAmount.Type;
    // The account to which the platform development charge is paid.
    foundationAccount: AccountAddress.Type;
}

export interface BlockSpecialEventFinalizationRewards {
    tag: 'finalizationRewards';
    // The amount awarded to each finalizer.
    finalizationRewards?: BlockSpecialEventAccountAmount[];
    // The remaining balance of the finalization reward account.
    remainder?: CcdAmount.Type;
}

export interface BlockSpecialEventBlockReward {
    tag: 'blockReward';
    // The total fees paid for transactions in the block.
    transactionFees: CcdAmount.Type;
    // The old balance of the GAS account.
    oldGasAccount: CcdAmount.Type;
    // The new balance of the GAS account.
    newGasAccount: CcdAmount.Type;
    // The amount awarded to the baker.
    bakerReward: CcdAmount.Type;
    // The amount awarded to the foundation.
    foundationCharge: CcdAmount.Type;
    // The baker of the block, who receives the award.
    baker: AccountAddress.Type;
    // The foundation account.
    foundationAccount: AccountAddress.Type;
}

export interface BlockSpecialEventPaydayFoundationReward {
    tag: 'paydayFoundationReward';
    // The account that got rewarded.
    foundationAccount: AccountAddress.Type;
    // The transaction fee reward at payday to the account.
    developmentCharge: CcdAmount.Type;
}

export interface BlockSpecialEventPaydayAccountReward {
    tag: 'paydayAccountReward';
    // The account that got rewarded.
    account: AccountAddress.Type;
    // The transaction fee reward at payday to the account.
    transactionFees: CcdAmount.Type;
    // The baking reward at payday to the account.
    bakerReward: CcdAmount.Type;
    // The finalization reward at payday to the account.
    finalizationReward: CcdAmount.Type;
}

export interface BlockSpecialEventBlockAccrueReward {
    tag: 'blockAccrueReward';
    // The total fees paid for transactions in the block.
    transactionFees: CcdAmount.Type;
    // The old balance of the GAS account.
    oldGasAccount: CcdAmount.Type;
    // The new balance of the GAS account.
    newGasAccount: CcdAmount.Type;
    // The amount awarded to the baker.
    bakerReward: CcdAmount.Type;
    // The amount awarded to the passive delegators.
    passiveReward: CcdAmount.Type;
    // The amount awarded to the foundation.
    foundationCharge: CcdAmount.Type;
    // The baker of the block, who will receive the award.
    baker: BakerId;
}

export interface BlockSpecialEventPaydayPoolReward {
    tag: 'paydayPoolReward';
    // The pool owner (passive delegators when not present).
    poolOwner?: BakerId;
    // Accrued transaction fees for pool.
    transactionFees: CcdAmount.Type;
    // Accrued baking rewards for pool.
    bakerReward: CcdAmount.Type;
    // Accrued finalization rewards for pool.
    finalizationReward: CcdAmount.Type;
}

export interface BlockSpecialEventAccountAmount {
    // The key type
    account: AccountAddress.Type;
    // The value type
    amount: CcdAmount.Type;
}

/**
 * Gets a list of {@link AccountAddress.Type} account addresses affected the {@link BlockSpecialEvent}.
 *
 * @param {BlockSpecialEvent} event - The block special event to check.
 *
 * @returns {AccountAddress.Type[]} List of account addresses affected by the event.
 */
export function specialEventAffectedAccounts(
    event: Exclude<BlockSpecialEvent, BlockSpecialEventBlockAccrueReward | BlockSpecialEventPaydayPoolReward>
): AccountAddress.Type[];
export function specialEventAffectedAccounts(
    event: BlockSpecialEventBlockAccrueReward | BlockSpecialEventPaydayPoolReward
): never[];
export function specialEventAffectedAccounts(event: BlockSpecialEvent): AccountAddress.Type[];
export function specialEventAffectedAccounts(event: BlockSpecialEvent): AccountAddress.Type[] {
    switch (event.tag) {
        case 'bakingRewards':
            return event.bakingRewards.map((br) => br.account);
        case 'finalizationRewards':
            return event.finalizationRewards?.map((fr) => fr.account) ?? [];
        case 'mint':
        case 'paydayFoundationReward':
            return [event.foundationAccount];
        case 'paydayAccountReward':
            return [event.account];
        case 'blockReward': {
            if (AccountAddress.equals(event.baker, event.foundationAccount)) {
                return [event.baker];
            }
            return [event.baker, event.foundationAccount];
        }
        default:
            return [];
    }
}
