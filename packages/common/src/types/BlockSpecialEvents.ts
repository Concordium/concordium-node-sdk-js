import { Amount, BakerId, Base58String } from '../types';

export type BlockSpecialEvent =
    | BlockSpecialEvent_BakingRewards
    | BlockSpecialEvent_Mint
    | BlockSpecialEvent_FinalizationRewards
    | BlockSpecialEvent_BlockReward
    | BlockSpecialEvent_PaydayFoundationReward
    | BlockSpecialEvent_PaydayAccountReward
    | BlockSpecialEvent_BlockAccrueReward
    | BlockSpecialEvent_PaydayPoolReward
    | BlockSpecialEvent_AccountAmount;

export interface BlockSpecialEvent_BakingRewards {
    tag: 'bakingRewards';
    // The amount awarded to each baker.
    bakingRewards: BlockSpecialEvent_AccountAmount[];
    // The remaining balance of the baker reward account.
    remainder: Amount;
}

export interface BlockSpecialEvent_Mint {
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

export interface BlockSpecialEvent_FinalizationRewards {
    tag: 'finalizationRewards';
    // The amount awarded to each finalizer.
    finalizationRewards?: BlockSpecialEvent_AccountAmount[];
    // The remaining balance of the finalization reward account.
    remainder?: Amount;
}

export interface BlockSpecialEvent_BlockReward {
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

export interface BlockSpecialEvent_PaydayFoundationReward {
    tag: 'paydayFoundationReward';
    // The account that got rewarded.
    foundationAccount: Base58String;
    // The transaction fee reward at payday to the account.
    developmentCharge: Amount;
}

export interface BlockSpecialEvent_PaydayAccountReward {
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

export interface BlockSpecialEvent_BlockAccrueReward {
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

export interface BlockSpecialEvent_PaydayPoolReward {
    tag: 'paydayPoolReward';
    // The pool owner (passive delegators when not present).
    poolOwner: BakerId;
    // Accrued transaction fees for pool.
    transactionFees: Amount;
    // Accrued baking rewards for pool.
    bakerReward: Amount;
    // Accrued finalization rewards for pool.
    finalizationReward: Amount;
}

export interface BlockSpecialEvent_AccountAmount {
    // The key type
    account: Base58String;
    // The value type
    amount: Amount;
}
