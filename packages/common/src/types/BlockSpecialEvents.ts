import { Amount, BakerId, Base58String } from '../types';

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
    remainder: Amount;
}

export interface BlockSpecialEventMint {
    tag: 'mint';
    // The amount allocated to the banking reward account.
    mintBakingReward: Amount;
    // The amount allocated to the finalization reward account.
    mintFinalizationReward: Amount;
    // The amount allocated as the platform development charge.
    mintPlatformDevelopmentCharge: Amount;
    // The account to which the platform development charge is paid.
    foundationAccount: Base58String;
}

export interface BlockSpecialEventFinalizationRewards {
    tag: 'finalizationRewards';
    // The amount awarded to each finalizer.
    finalizationRewards?: BlockSpecialEventAccountAmount[];
    // The remaining balance of the finalization reward account.
    remainder?: Amount;
}

export interface BlockSpecialEventBlockReward {
    tag: 'blockReward';
    // The total fees paid for transactions in the block.
    transactionFees: Amount;
    // The old balance of the GAS account.
    oldGasAccount: Amount;
    // The new balance of the GAS account.
    newGasAccount: Amount;
    // The amount awarded to the baker.
    bakerReward: Amount;
    // The amount awarded to the foundation.
    foundationCharge: Amount;
    // The baker of the block, who receives the award.
    baker: Base58String;
    // The foundation account.
    foundationAccount: Base58String;
}

export interface BlockSpecialEventPaydayFoundationReward {
    tag: 'paydayFoundationReward';
    // The account that got rewarded.
    foundationAccount: Base58String;
    // The transaction fee reward at payday to the account.
    developmentCharge: Amount;
}

export interface BlockSpecialEventPaydayAccountReward {
    tag: 'paydayAccountReward';
    // The account that got rewarded.
    account: Base58String;
    // The transaction fee reward at payday to the account.
    transactionFees: Amount;
    // The baking reward at payday to the account.
    bakerReward: Amount;
    // The finalization reward at payday to the account.
    finalizationReward: Amount;
}

export interface BlockSpecialEventBlockAccrueReward {
    tag: 'blockAccrueReward';
    // The total fees paid for transactions in the block.
    transactionFees: Amount;
    // The old balance of the GAS account.
    oldGasAccount: Amount;
    // The new balance of the GAS account.
    newGasAccount: Amount;
    // The amount awarded to the baker.
    bakerReward: Amount;
    // The amount awarded to the passive delegators.
    passiveReward: Amount;
    // The amount awarded to the foundation.
    foundationCharge: Amount;
    // The baker of the block, who will receive the award.
    baker: BakerId;
}

export interface BlockSpecialEventPaydayPoolReward {
    tag: 'paydayPoolReward';
    // The pool owner (passive delegators when not present).
    poolOwner?: BakerId;
    // Accrued transaction fees for pool.
    transactionFees: Amount;
    // Accrued baking rewards for pool.
    bakerReward: Amount;
    // Accrued finalization rewards for pool.
    finalizationReward: Amount;
}

export interface BlockSpecialEventAccountAmount {
    // The key type
    account: Base58String;
    // The value type
    amount: Amount;
}

export function specialEventAffectedAccounts(
    event:
        | BlockSpecialEventBlockAccrueReward
        | BlockSpecialEventPaydayPoolReward
): never[];
export function specialEventAffectedAccounts(
    event: BlockSpecialEvent
): Base58String[];
export function specialEventAffectedAccounts(
    event: BlockSpecialEvent
): Base58String[] {
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
            if (event.baker === event.foundationAccount) {
                return [event.baker];
            }
            return [event.baker, event.foundationAccount];
        }
        default:
            return [];
    }
}
