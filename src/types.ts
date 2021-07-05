/* eslint-disable @typescript-eslint/no-explicit-any */
enum TransactionStatusEnum {
    Received = "received",
    Finalized = "finalized",
    Committed = "committed",
}

interface EventResult {
    outcome: string;
    // TODO Resolve the types completely.
    events: any;
}

interface TransactionSummaryType {
    type:
        | "accountTransaction"
        | "credentialDeploymentTransaction"
        | "updateTransaction";
    // TODO: Figure out if contents is always just a string.
    contents: string;
}

export interface TransactionSummary {
    sender?: string;
    hash: string;

    cost: bigint;
    energyCost: bigint;
    index: bigint;

    type: TransactionSummaryType;

    result: EventResult;
}

export interface TransactionStatus {
    status: TransactionStatusEnum;
    outcomes?: Record<string, TransactionSummary>;
}

export interface BlockInfo {
    blockParent: string;
    blockHash: string;
    blockStateHash: string;
    blockLastFinalized: string;

    blockHeight: bigint;
    blockBaker: bigint;
    blockSlot: bigint;

    blockArriveTime: Date;
    blockReceiveTime: Date;
    blockSlotTime: Date;

    finalized: boolean;

    transactionCount: bigint;
    transactionsSize: bigint;
    transactionEnergyCost: bigint;
}

export interface ConsensusStatus {
    bestBlock: string;
    genesisBlock: string;
    lastFinalizedBlock: string;

    epochDuration: bigint;
    slotDuration: bigint;
    bestBlockHeight: bigint;

    finalizationCount: number;
    blocksVerifiedCount: number;
    blocksReceivedCount: number;

    blockArriveLatencyEMA: number;
    blockArriveLatencyEMSD: number;

    blockReceiveLatencyEMA: number;
    blockReceiveLatencyEMSD: number;

    transactionsPerBlockEMA: number;
    transactionsPerBlockEMSD: number;

    blockReceivePeriodEMA?: number;
    blockReceivePeriodEMSD?: number;

    blockArrivePeriodEMA?: number;
    blockArrivePeriodEMSD?: number;

    finalizationPeriodEMA?: number;
    finalizationPeriodEMSD?: number;

    genesisTime: Date;
    blockLastReceivedTime?: Date;
    blockLastArrivedTime?: Date;
    lastFinalizedTime?: Date;
}

export interface NextAccountNonce {
    nonce: bigint;
    allFinal: boolean;
}
