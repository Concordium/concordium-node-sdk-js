/**
 * @module Common GRPC-Client
 */

import { AccountAddress } from './types/accountAddress';
import { CredentialRegistrationId } from './types/CredentialRegistrationId';
import { CcdAmount } from './types/ccdAmount';
import { DataBlob } from './types/DataBlob';
import { TransactionExpiry } from './types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from './types/moduleReference';
import { RejectReason, RejectReasonV1 } from './types/rejectReason';
import {
    ContractTraceEvent,
    MemoEvent,
    TransactionEvent,
    TransferredEvent,
} from './types/transactionEvent';

export * from './types/NodeInfo';
export * from './types/PeerInfo';
export * from './types/blockItemSummary';
export * from './types/chainUpdate';
export * from './types/rejectReason';
export * from './types/transactionEvent';
export * from './types/BlockSpecialEvents';
export * from './types/errors';

export type HexString = string;
export type Base58String = string;
export type Base64String = string;
export type DigitString = string;
export type UrlString = string;
export type IpAddressString = string;
export type JsonString = string;

export type ModuleRef = HexString;

/** A number of milliseconds */
export type Duration = bigint;
/** Unix timestamp in milliseconds */
export type Timestamp = bigint;
/** A consensus round */
export type Round = bigint;
/** An amount of energy */
export type Energy = bigint;

/**
 * Returns a union of all keys of type T with values matching type V.
 */
export type KeysMatching<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Versioned<T> {
    v: number;
    value: T;
}

export enum AttributesKeys {
    firstName,
    lastName,
    sex,
    dob,
    countryOfResidence,
    nationality,
    idDocType,
    idDocNo,
    idDocIssuer,
    idDocIssuedAt,
    idDocExpiresAt,
    nationalIdNo,
    taxIdNo,
}

export type Attributes = {
    [P in keyof typeof AttributesKeys]: string;
};
export type AttributeKey = keyof Attributes;

export enum AttributeKeyString {
    firstName = 'firstName',
    lastName = 'lastName',
    sex = 'sex',
    dob = 'dob',
    countryOfResidence = 'countryOfResidence',
    nationality = 'nationality',
    idDocType = 'idDocType',
    idDocNo = 'idDocNo',
    idDocIssuer = 'idDocIssuer',
    idDocIssuedAt = 'idDocIssuedAt',
    idDocExpiresAt = 'idDocExpiresAt',
    nationalIdNo = 'nationalIdNo',
    taxIdNo = 'taxIdNo',
}

export enum Sex {
    NotKnown = '0',
    Male = '1',
    Female = '2',
    NA = '9',
}

export enum IdDocType {
    NA = '0',
    Passport = '1',
    NationalIdCard = '2',
    DriversLicense = '3',
    ImmigrationCard = '4',
}

export enum TransactionStatusEnum {
    Received = 'received',
    Finalized = 'finalized',
    Committed = 'committed',
}

export interface AddressAccount {
    type: 'AddressAccount';
    address: Base58String;
}

export interface ContractAddress {
    index: bigint;
    subindex: bigint;
}

export type AccountIdentifierInput =
    | AccountAddress
    | CredentialRegistrationId
    | bigint;

export type Address =
    | {
          type: 'AddressContract';
          address: ContractAddress;
      }
    | AddressAccount;

interface RejectedEventResult {
    outcome: 'reject';
    rejectReason: RejectReasonV1;
}

interface SuccessfulEventResult {
    outcome: 'success';
    events: TransactionEvent[];
}

export type EventResult =
    | SuccessfulEventResult
    | TransferWithMemoEventResult
    | RejectedEventResult;

export enum TransactionSummaryType {
    AccountTransaction = 'accountTransaction',
    CredentialDeploymentTransaction = 'credentialDeploymentTransaction',
    AccountCreation = 'accountCreation',
    UpdateTransaction = 'updateTransaction',
}

interface BaseTransactionSummaryType {
    type: TransactionSummaryType;
}

export interface TransferWithMemoSummaryType
    extends BaseTransactionSummaryType {
    contents: 'transferWithMemo';
}

export interface GenericTransactionSummaryType
    extends BaseTransactionSummaryType {
    contents: string;
}

export interface BaseTransactionSummary {
    sender?: string;
    hash: string;

    cost: bigint;
    energyCost: bigint;
    index: bigint;
}

/**
 * @deprecated This is type for describing return types from the V1 gRPC client, which has been deprecated
 */
interface GenericTransactionSummary extends BaseTransactionSummary {
    type: GenericTransactionSummaryType;
    result: EventResult;
}

/**
 * @deprecated This is type for describing return types from the V1 gRPC client, which has been deprecated
 */
interface TransferWithMemoEventResult {
    outcome: 'success';
    events: [TransferredEvent, MemoEvent];
}

/**
 * @deprecated This is type for describing return types from the V1 gRPC client, which has been deprecated
 */
export interface TransferWithMemoTransactionSummary
    extends BaseTransactionSummary {
    type: TransferWithMemoSummaryType;
    result: TransferWithMemoEventResult;
}

/**
 * @deprecated This is helper intented for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export type TransactionSummary =
    | GenericTransactionSummary
    | TransferWithMemoTransactionSummary;

/**
 * @deprecated This is helper for type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export function instanceOfTransferWithMemoTransactionSummary(
    object: TransactionSummary
): object is TransferWithMemoTransactionSummary {
    return (
        object.type !== undefined && object.type.contents === 'transferWithMemo'
    );
}

/**
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface TransactionStatus {
    status: TransactionStatusEnum;
    outcomes?: Record<string, TransactionSummary>;
}

/**
 * @deprecated This is type describing return types from the V1 gRPC client, which has been deprecated
 */
export interface PartyInfo {
    bakerId: bigint;
    weight: bigint;
    signed: boolean;
}

/**
 * @deprecated This is type describing return types from the V1 gRPC client, which has been deprecated
 */
export interface FinalizationData {
    finalizationIndex: bigint;
    finalizationDelay: bigint;
    finalizationBlockPointer: string;
    finalizers: PartyInfo[];
}

export interface Ratio {
    numerator: bigint;
    denominator: bigint;
}

export type ExchangeRate = Ratio;

export interface InclusiveRange<N extends number> {
    min: N;
    max: N;
}

export type DurationSeconds = bigint;
/** Index of an epoch, or number of epochs. */
export type Epoch = bigint;

export interface TransactionFeeDistribution {
    baker: number;
    gasAccount: number;
}

export interface MintRate {
    mantissa: number;
    exponent: number;
}

interface MintDistributionCommon {
    bakingReward: number;
    finalizationReward: number;
}

export interface MintDistributionV0 extends MintDistributionCommon {
    mintPerSlot: number;
}

export type MintDistributionV1 = MintDistributionCommon;

export type MintDistribution = MintDistributionV0 | MintDistributionV1;

/** Common gas rewards properties across all protocol versions */
export interface GasRewardsCommon {
    /** The fractional amount paid to the baker */
    baker: number;
    /** The fractional amount paid for an account creation */
    accountCreation: number;
    /** The fractional amount paid for a chain update */
    chainUpdate: number;
}

/** Gas rewards properties for protocol version 1-5 ({@link ChainParametersV0} and {@link ChainParametersV1}). */
export interface GasRewardsV0 extends GasRewardsCommon {
    /** The fractional amount paid for including a finalization proof */
    finalizationProof: number;
}

/** Gas rewards properties from protocol version 6 ({@link ChainParametersV2}). */
export type GasRewardsV1 = GasRewardsCommon;

/** Common reward parameters used across all protocol versions */
export interface RewardParametersCommon {
    /** The current transaction fee distribution */
    transactionFeeDistribution: TransactionFeeDistribution;
}

/** Reward parameters used from protocol version 1-3 ({@link ChainParametersV0}). */
export interface RewardParametersV0 extends RewardParametersCommon {
    /** The current mint distribution */
    mintDistribution: MintDistributionV0;
    /** The current gas rewards parameters */
    gASRewards: GasRewardsV0;
}

/** Reward parameters used in protocol versions 4 and 5 ({@link ChainParametersV1}). */
export interface RewardParametersV1 extends RewardParametersCommon {
    /** The current mint distribution */
    mintDistribution: MintDistributionV1;
    /** The current gas rewards parameters */
    gASRewards: GasRewardsV0;
}

/** Reward parameters used from protocol version 6 ({@link ChainParametersV2}). */
export interface RewardParametersV2 extends RewardParametersCommon {
    /** The current mint distribution */
    mintDistribution: MintDistributionV1;
    /** The current gas rewards parameters */
    gASRewards: GasRewardsV1;
}

/** Cooldown parameters used from protocol version 1-3 */
export interface CooldownParametersV0 {
    /** The baker cooldown period in {@link Epoch} epochs */
    bakerCooldownEpochs: Epoch;
}

/** Cooldown parameters used from protocol version 4 */
export interface CooldownParametersV1 {
    /** The pool owner (baker) cooldown period in seconds */
    poolOwnerCooldown: DurationSeconds;
    /** The delegator cooldown period in seconds */
    delegatorCooldown: DurationSeconds;
}

/** Pool parameters used from protocol version 1-3 */
export interface PoolParametersV0 {
    /** The minimum threshold to stake to become a baker. */
    minimumThresholdForBaking: Amount;
}

/** Pool parameters used from protocol version 4 */
export interface PoolParametersV1 {
    /** Fraction of finalization rewards charged by the passive delegation. */
    passiveFinalizationCommission: number;
    /** Fraction of baking rewards charged by the passive delegation.*/
    passiveBakingCommission: number;
    /* Fraction of transaction rewards charged by the L-pool.*/
    passiveTransactionCommission: number;
    /** Fraction of finalization rewards charged by the pool owner. */
    finalizationCommissionRange: InclusiveRange<number>;
    /** Fraction of baking rewards charged by the pool owner. */
    bakingCommissionRange: InclusiveRange<number>;
    /** Fraction of transaction rewards charged by the pool owner. */
    transactionCommissionRange: InclusiveRange<number>;
    /** Minimum equity capital required for a new baker.*/
    minimumEquityCapital: Amount;
    /**
     * Maximum fraction of the total staked capital of that a new baker can
     * have.
     */
    capitalBound: number;
    /**
     * The maximum leverage that a baker can have as a ratio of total stake
     * to equity capital.
     */
    leverageBound: Ratio;
}

/**
 * Time parameters used from protocol version 4
 * These consist of the reward period length and the mint rate per payday. These are coupled as
 * a change to either affects the overall rate of minting.
 */
export interface TimeParametersV1 {
    /** The length of a reward period, in {@link Epoch} epochs. */
    rewardPeriodLength: Epoch;
    /** The rate at which CCD is minted per payday. */
    mintPerPayday: number;
}

/** Parameters that determine timeouts in the consensus protocol used from protocol version 6. */
export interface TimeoutParameters {
    /** The base value for triggering a timeout, in milliseconds. */
    timeoutBase: Duration;
    /** Factor for increasing the timeout. Must be greater than 1. */
    timeoutIncrease: Ratio;
    /** Factor for decreasing the timeout. Must be between 0 and 1. */
    timeoutDecrease: Ratio;
}

/** Consensus parameters, used from protocol version 6 */
export interface ConsensusParameters {
    /** Minimum time interval between blocks. */
    minBlockTime: Duration;
    /** Maximum energy allowed per block. */
    blockEnergyLimit: Energy;
}

/**
 * Finalization committee parameters, used from protocol version 6
 */
export interface FinalizationCommitteeParameters {
    /** The minimum size of a finalization committee before `finalizerRelativeStakeThreshold` takes effect. */
    minimumFinalizers: number;
    /** The maximum size of a finalization committee. */
    maximumFinalizers: number;
    /**
     * The threshold for determining the stake required for being eligible the finalization committee.
     * The amount is given by `total stake in pools * finalizerRelativeStakeThreshold`.
     * Subsequently, this will alwas be a number between 0 and 1.
     */
    finalizerRelativeStakeThreshold: number;
}

/** Common chain parameters across all protocol versions */
export interface ChainParametersCommon {
    /** Rate of euros per energy */
    euroPerEnergy: ExchangeRate;
    /** Rate of micro CCD per euro */
    microGTUPerEuro: ExchangeRate;
    /** Limit for the number of account creations in a block */
    accountCreationLimit: number;
    /** The chain foundation account */
    foundationAccount: Base58String;
    /** The chain foundation account index */
    foundationAccountIndex?: bigint;
}

/** Chain parameters used from protocol version 1-3 */
export type ChainParametersV0 = ChainParametersCommon &
    CooldownParametersV0 &
    PoolParametersV0 & {
        /** The election difficulty for consensus lottery */
        electionDifficulty: number;
        /** The election difficulty for consensus lottery */
        rewardParameters: RewardParametersV0;
    };

/** Chain parameters used in protocol versions 4 and 5 */
export type ChainParametersV1 = ChainParametersCommon &
    CooldownParametersV1 &
    TimeParametersV1 &
    PoolParametersV1 & {
        /** The election difficulty for consensus lottery */
        electionDifficulty: number;
        /** The election difficulty for consensus lottery */
        rewardParameters: RewardParametersV1;
    };

/** Chain parameters used from protocol version 6 */
export type ChainParametersV2 = ChainParametersCommon &
    CooldownParametersV1 &
    TimeParametersV1 &
    PoolParametersV1 &
    FinalizationCommitteeParameters &
    TimeoutParameters &
    ConsensusParameters & {
        /** The election difficulty for consensus lottery */
        rewardParameters: RewardParametersV2;
    };

/** Union of all chain parameters across all protocol versions */
export type ChainParameters =
    | ChainParametersV0
    | ChainParametersV1
    | ChainParametersV2;

export interface Authorization {
    threshold: number;
    authorizedKeys: number[];
}

interface AuthorizationsCommon {
    emergency: Authorization;
    microGTUPerEuro: Authorization;
    euroPerEnergy: Authorization;
    transactionFeeDistribution: Authorization;
    foundationAccount: Authorization;
    mintDistribution: Authorization;
    protocol: Authorization;
    paramGASRewards: Authorization;
    /**
     * For protocol version 3 and earlier, this controls the authorization of the bakerStakeThreshold update.
     */
    poolParameters: Authorization;
    /**
     * For protocol version 6 and later, this controls the authorization of consensus related updates.
     */
    electionDifficulty: Authorization;
    addAnonymityRevoker: Authorization;
    addIdentityProvider: Authorization;
    keys: VerifyKey[];
}

/**
 * Used from protocol version 1-3
 */
export type AuthorizationsV0 = AuthorizationsCommon;

/**
 * Used from protocol version 4
 */
export interface AuthorizationsV1 extends AuthorizationsCommon {
    cooldownParameters: Authorization;
    timeParameters: Authorization;
}

export type Authorizations = AuthorizationsV0 | AuthorizationsV1;

export interface KeysWithThreshold {
    keys: VerifyKey[];
    threshold: number;
}

interface KeysCommon {
    rootKeys: KeysWithThreshold;
    level1Keys: KeysWithThreshold;
}

/**
 * Used from protocol version 1-3
 */
export interface KeysV0 extends KeysCommon {
    level2Keys: AuthorizationsV0;
}

/**
 * Used from protocol version 4
 */
export interface KeysV1 extends KeysCommon {
    level2Keys: AuthorizationsV1;
}

export type Keys = KeysV0 | KeysV1;

export interface UpdateQueueQueue {
    effectiveTime: Date;
    // TODO Update the type of update to a generic update transaction when
    // update types have been added.
    /** Information about the actual update. */
    update: unknown;
}

export interface UpdateQueue {
    nextSequenceNumber: bigint;
    queue: UpdateQueueQueue[];
}

interface UpdateQueuesCommon {
    microGTUPerEuro: UpdateQueue;
    euroPerEnergy: UpdateQueue;
    transactionFeeDistribution: UpdateQueue;
    foundationAccount: UpdateQueue;
    mintDistribution: UpdateQueue;
    protocol: UpdateQueue;
    gasRewards: UpdateQueue;
    addAnonymityRevoker: UpdateQueue;
    addIdentityProvider: UpdateQueue;
    rootKeys: UpdateQueue;
    level1Keys: UpdateQueue;
    level2Keys: UpdateQueue;
}

/**
 * Used from protocol version 1-3
 */
export interface UpdateQueuesV0 extends UpdateQueuesCommon {
    electionDifficulty: UpdateQueue;
    bakerStakeThreshold: UpdateQueue;
}

/**
 * Used in protocol version 4 and 5
 */
export interface UpdateQueuesV1 extends UpdateQueuesCommon {
    electionDifficulty: UpdateQueue;
    cooldownParameters: UpdateQueue;
    timeParameters: UpdateQueue;
    poolParameters: UpdateQueue;
}

/**
 * Used from protocol version 6
 */
export interface UpdateQueuesV2 extends UpdateQueuesV1 {
    consensus2TimingParameters: UpdateQueue;
}

export type UpdateQueues = UpdateQueuesV0 | UpdateQueuesV1 | UpdateQueuesV2;

interface ProtocolUpdate {
    message: string;
    specificationUrl: string;
    specificationHash: string;
    specificationAuxiliaryData: string;
}

interface UpdatesCommon {
    protocolUpdate: ProtocolUpdate | undefined;
}

/**
 * Used from protocol version 1-3
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface UpdatesV0 extends UpdatesCommon {
    chainParameters: ChainParametersV0;
    updateQueues: UpdateQueuesV0;
    keys: KeysV0;
}

/**
 * Used in protocol version 4 and 5
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface UpdatesV1 extends UpdatesCommon {
    chainParameters: ChainParametersV1;
    updateQueues: UpdateQueuesV1;
    keys: KeysV1;
}

/**
 * Used from protocol version 6
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface UpdatesV2 extends UpdatesCommon {
    chainParameters: ChainParametersV2;
    updateQueues: UpdateQueuesV2;
    keys: KeysV1;
}

/**
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export type Updates = UpdatesV0 | UpdatesV1 | UpdatesV2;

/**
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
interface BlockSummaryCommon {
    protocolVersion?: bigint;
    finalizationData: FinalizationData;
    transactionSummaries: TransactionSummary[];
}

/**
 * Used from protocol version 1-3
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface BlockSummaryV0 extends BlockSummaryCommon {
    updates: UpdatesV0;
}

/**
 * Used in protocol version 4 and 5
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface BlockSummaryV1 extends BlockSummaryCommon {
    updates: UpdatesV1;
    protocolVersion: bigint;
}

/**
 * Used from protocol version 6
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface BlockSummaryV2 extends BlockSummaryCommon {
    updates: UpdatesV2;
    protocolVersion: bigint;
}

/**
 * @deprecated This is type describing return types from the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export type BlockSummary = BlockSummaryV0 | BlockSummaryV1 | BlockSummaryV2;

interface RewardStatusCommon {
    protocolVersion?: bigint;
    totalAmount: Amount;
    totalEncryptedAmount: Amount;
    bakingRewardAccount: Amount;
    finalizationRewardAccount: Amount;
    gasAccount: Amount;
}

export type RewardStatusV0 = RewardStatusCommon;

export interface RewardStatusV1 extends RewardStatusCommon {
    foundationTransactionRewards: Amount;
    nextPaydayTime: Date;
    nextPaydayMintRate: MintRate;
    totalStakedCapital: Amount;
    protocolVersion: bigint;
}

export type RewardStatus = RewardStatusV0 | RewardStatusV1;
export type TokenomicsInfo = RewardStatus;

/** Common properties for block info across all protocol versions */
export interface BlockInfoCommon {
    /**
     * Hash of parent block. For the initial genesis block (i.e. not re-genesis)
     * this will be the hash of the block itself
     */
    blockParent: HexString;
    /** Hash of block */
    blockHash: HexString;
    /** Hash of block state */
    blockStateHash: HexString;
    /** Hash of last finalized block when this block was baked */
    blockLastFinalized: HexString;

    /** The absolute height of this (i.e. relative to the initial genesis block) */
    blockHeight: bigint;
    /** The baker ID of the baker for this block. Not available for a genesis block */
    blockBaker?: BakerId;

    /** The time the block was verified */
    blockArriveTime: Date;
    /** The time the block was received */
    blockReceiveTime: Date;
    /** The time of the slot in which the block was baked */
    blockSlotTime: Date;

    /** Whether the block is finalized */
    finalized: boolean;

    /** The number of transactions in the block */
    transactionCount: bigint;
    /** The total byte size of all transactions in the block */
    transactionsSize: bigint;
    /** The energy cost of the transactions in the block */
    transactionEnergyCost: Energy;

    /**
     * The genesis index for the block. This counst the number of protocol updates that have
     * preceeded this block, and defines the era of the block.
     */
    genesisIndex: number;
    /** The height of this block relative to the (re)genesis block of its era */
    eraBlockHeight: number;
    /** The protocol version the block belongs to */
    protocolVersion: bigint;
}

/** Block info used for protocol version 1-5 */
export interface BlockInfoV0 extends BlockInfoCommon {
    /** The slot number in which the block was baked. */
    blockSlot: bigint;
}

/** Block info used from protocol version 6 */
export interface BlockInfoV1 extends BlockInfoCommon {
    /** The block round */
    round: Round;
    /** The block epoch */
    epoch: Epoch;
}

/** Union of all block info versions */
export type BlockInfo = BlockInfoV0 | BlockInfoV1;

export interface CommonBlockInfo {
    hash: HexString;
    height: bigint;
}

export type ArrivedBlockInfo = CommonBlockInfo;
export type FinalizedBlockInfo = CommonBlockInfo;

export type AbsoluteBlocksAtHeightRequest = bigint;
export interface RelativeBlocksAtHeightRequest {
    genesisIndex: number;
    height: bigint;
    restrict: boolean;
}

export type BlocksAtHeightRequest =
    | AbsoluteBlocksAtHeightRequest
    | RelativeBlocksAtHeightRequest;

/** Common properties for  consensus status types used across all protocol versions */
export interface ConsensusStatusCommon {
    /** Hash of the current best block */
    bestBlock: HexString;
    /** Hash of the initial genesis block */
    genesisBlock: HexString;
    /** Hash of the genesis block of the current era, i.e. since the last protocol update. */
    currentEraGenesisBlock: HexString;
    /** Hash of the last finalized block */
    lastFinalizedBlock: HexString;

    /** Current epoch duration, in milliseconds */
    epochDuration: Duration;
    /** Absolute height of the best block */
    bestBlockHeight: bigint;
    /** Absolute height of the last finalized block */
    lastFinalizedBlockHeight: bigint;

    /** Number of finalizations */
    finalizationCount: bigint;
    /** Total number of blocks received and verified */
    blocksVerifiedCount: bigint;
    /** Total number of blocks received */
    blocksReceivedCount: bigint;

    /** Exponential moving average latency between a block's slot time and its arrival. */
    blockArriveLatencyEMA: number;
    /** Standard deviation of exponential moving average latency between a block's slot time and its arrival. */
    blockArriveLatencyEMSD: number;

    /** Exponential moving average latency between a block's slot time and received time. */
    blockReceiveLatencyEMA: number;
    /** Standard deviation of exponential moving average latency between a block's slot time and received time. */
    blockReceiveLatencyEMSD: number;

    /** Exponential moving average number of transactions per block. */
    transactionsPerBlockEMA: number;
    /** Standard deviation of exponential moving average number of transactions per block. */
    transactionsPerBlockEMSD: number;

    /** Exponential moving average time between receiving blocks. */
    blockReceivePeriodEMA?: number;
    /** Standard deviation of exponential moving average time between receiving blocks. */
    blockReceivePeriodEMSD?: number;

    /** Exponential moving average time between block arrivals. */
    blockArrivePeriodEMA?: number;
    /** Standard deviation of exponential moving average time between block arrivals. */
    blockArrivePeriodEMSD?: number;

    /** Exponential moving average time between finalizations. */
    finalizationPeriodEMA?: number;
    /** Standard deviation of exponential moving average time between finalizations. */
    finalizationPeriodEMSD?: number;

    /** Time of the (original) genesis block. */
    genesisTime: Date;
    /** Time when the current era started. */
    currentEraGenesisTime: Date;
    /** The last time a block was received. */
    blockLastReceivedTime?: Date;
    /** The last time a block was verified (added to the tree). */
    blockLastArrivedTime?: Date;
    /** Time of last verified finalization. */
    lastFinalizedTime?: Date;

    /**
     * The number of chain restarts via a protocol update. A completed
     * protocol update instruction might not change the protocol version
     * specified in the previous field, but it always increments the genesis
     * index.
     */
    genesisIndex: number;

    /** Currently active protocol version. */
    protocolVersion: bigint;
}

/** Consensus status used for protocol version 1-5 */
export interface ConsensusStatusV0 extends ConsensusStatusCommon {
    /** (Current) slot duration in milliseconds */
    slotDuration: Duration;
}

export interface ConcordiumBftStatus {
    /** Current duration before a round times out, in milliseconds */
    currentTimeoutDuration: Duration;
    /** Current round */
    currentRound: Round;
    /** Current epoch */
    currentEpoch: Epoch;
    /**
     * The first block in the epoch with timestamp at least this is considered to be
     * the trigger block for the epoch transition.
     */
    triggerBlockTime: Date;
}

/** Consensus status used from protocol version 6 */
export type ConsensusStatusV1 = ConsensusStatusCommon & {
    concordiumBFTStatus: ConcordiumBftStatus;
};

/** Union of consensus status types used across all protocol versions */
export type ConsensusStatus = ConsensusStatusV0 | ConsensusStatusV1;

export interface CryptographicParameters {
    onChainCommitmentKey: string;
    bulletproofGenerators: string;
    genesisString: string;
}

export interface NextAccountNonce {
    nonce: bigint;
    allFinal: boolean;
}

export interface ReleaseSchedule {
    timestamp: Date;
    amount: Amount;
}

export interface ReleaseScheduleWithTransactions extends ReleaseSchedule {
    transactions: string[];
}

export interface AccountReleaseSchedule {
    total: Amount;
    schedule: ReleaseScheduleWithTransactions[];
}

export interface AccountEncryptedAmount {
    selfAmount: string;
    startIndex: bigint;
    incomingAmounts: string[];
    numAggregated?: number;
    aggregatedAmount?: string;
}

export interface VerifyKey {
    schemeId: string;
    verifyKey: HexString;
}

export interface KeyPair {
    signKey: HexString;
    verifyKey: HexString;
}

export interface CredentialPublicKeys {
    keys: Record<number, VerifyKey>;
    threshold: number;
}

export interface CredentialKeys {
    keys: Record<number, KeyPair>;
    threshold: number;
}

export interface AccountKeys {
    keys: Record<number, CredentialKeys>;
    threshold: number;
}

export type SimpleAccountKeys = Record<number, Record<number, HexString>>;

export interface WithAccountKeys {
    accountKeys: AccountKeys;
}

export interface WalletExportFormat {
    type: string;
    v: number;
    environment: string;
    value: {
        accountKeys: AccountKeys;
        address: Base58String;
        credentials: Record<number, HexString>;
    };
}

/**
 * Parses a wallet export file into a WalletExportFormat. The wallet export
 * file is exported from a concordium wallet.
 */
export function parseWallet(walletString: JsonString): WalletExportFormat {
    const wallet = JSON.parse(walletString);
    console.log(typeof wallet.type);
    if (typeof wallet.type !== 'string') {
        throw Error(
            'Expected field "type" to be of type "string" but was of type "' +
                typeof wallet.type +
                '"'
        );
    }
    if (typeof wallet.v !== 'number') {
        throw Error(
            'Expected field "v" to be of type "number" but was of type "' +
                typeof wallet.v +
                '"'
        );
    }
    if (typeof wallet.environment !== 'string') {
        throw Error(
            'Expected field "environment" to be of type "string" but was of type "' +
                typeof wallet.environment +
                '"'
        );
    }
    if (typeof wallet.value.address !== 'string') {
        throw Error(
            'Expected field "value.address" to be of type "string" but was of type "' +
                typeof wallet.value.address +
                '"'
        );
    }
    if (wallet.value.accountKeys === undefined) {
        throw Error(
            'Expected field "value.accountKeys" to be defined, but was not'
        );
    }
    if (wallet.value.credentials === undefined) {
        throw Error(
            'Expected field "value.credentials" to be defined, but was not'
        );
    }
    return wallet;
}

export interface ChainArData {
    encIdCredPubShare: string;
}

export interface Policy {
    validTo: string; // "YYYYMM"
    createdAt: string; // "YYYYMM"
    revealedAttributes: Record<AttributeKey, string>;
}

interface SharedCredentialDeploymentValues {
    ipIdentity: number;
    credentialPublicKeys: CredentialPublicKeys;
    policy: Policy;
}

export interface CredentialDeploymentValues
    extends SharedCredentialDeploymentValues {
    credId: string;
    revocationThreshold: number;
    arData: Record<string, ChainArData>;
    commitments: CredentialDeploymentCommitments;
}

export interface InitialCredentialDeploymentValues
    extends SharedCredentialDeploymentValues {
    regId: string;
}

export interface CredentialDeploymentCommitments {
    cmmPrf: string;
    cmmCredCounter: string;
    cmmIdCredSecSharingCoeff: string[];
    cmmAttributes: Record<AttributeKey, string>;
    cmmMaxAccounts: string;
}

export interface NormalAccountCredential {
    type: 'normal';
    contents: CredentialDeploymentValues;
}

export interface InitialAccountCredential {
    type: 'initial';
    contents: InitialCredentialDeploymentValues;
}

export enum StakePendingChangeType {
    ReduceStake = 'ReduceStake',
    RemoveStakeV0 = 'RemoveBaker',
    RemoveStakeV1 = 'RemoveStake',
}

interface StakePendingChangeV0Common {
    epoch: bigint;
}

interface StakePendingChangeV1Common {
    effectiveTime: Date;
}

interface ReduceStakePendingChangeCommon {
    newStake: bigint;
}

export interface ReduceStakePendingChangeV0
    extends ReduceStakePendingChangeCommon,
        StakePendingChangeV0Common {
    change: StakePendingChangeType.ReduceStake;
}

export interface ReduceStakePendingChangeV1
    extends ReduceStakePendingChangeCommon,
        StakePendingChangeV1Common {
    change: StakePendingChangeType.ReduceStake;
}

export type ReduceStakePendingChange =
    | ReduceStakePendingChangeV0
    | ReduceStakePendingChangeV1;

export interface RemovalPendingChangeV0 extends StakePendingChangeV0Common {
    change: StakePendingChangeType.RemoveStakeV0;
}

export interface RemovalPendingChangeV1 extends StakePendingChangeV1Common {
    change: StakePendingChangeType.RemoveStakeV1;
}

export type RemovalPendingChange =
    | RemovalPendingChangeV0
    | RemovalPendingChangeV1;

export type StakePendingChangeV0 =
    | ReduceStakePendingChangeV0
    | RemovalPendingChangeV0;

export type StakePendingChangeV1 =
    | ReduceStakePendingChangeV1
    | RemovalPendingChangeV1;

export type StakePendingChange = StakePendingChangeV0 | StakePendingChangeV1;

export enum OpenStatus {
    OpenForAll = 0,
    ClosedForNew = 1,
    ClosedForAll = 2,
}

/**
 * How the node translates OpenStatus to JSON.
 */
export enum OpenStatusText {
    OpenForAll = 'openForAll',
    ClosedForNew = 'closedForNew',
    ClosedForAll = 'closedForAll',
}

export type Amount = bigint;
export type BakerId = bigint;
// TODO: Change this to bigint when GrpcV1 is removed.
export type DelegatorId = number;

export interface BakerPoolInfo {
    openStatus: OpenStatusText;
    metadataUrl: UrlString;
    commissionRates: CommissionRates;
}

export interface CommissionRates {
    transactionCommission: number;
    bakingCommission: number;
    finalizationCommission: number;
}

export interface CurrentPaydayBakerPoolStatus {
    blocksBaked: bigint;
    finalizationLive: boolean;
    transactionFeesEarned: Amount;
    effectiveStake: Amount;
    lotteryPower: number;
    bakerEquityCapital: Amount;
    delegatedCapital: Amount;
}

export enum BakerPoolPendingChangeType {
    ReduceBakerCapital = 'ReduceBakerCapital',
    RemovePool = 'RemovePool',
    NoChange = 'NoChange',
}

type BakerPoolPendingChangeWrapper<
    T extends keyof typeof BakerPoolPendingChangeType,
    S extends Record<string, any>
> = S & {
    pendingChangeType: T;
};

export interface BakerPoolPendingChangeReduceBakerCapitalDetails {
    bakerEquityCapital: Amount;
    effectiveTime: Date;
}

export type BakerPoolPendingChangeReduceBakerCapital =
    BakerPoolPendingChangeWrapper<
        BakerPoolPendingChangeType.ReduceBakerCapital,
        BakerPoolPendingChangeReduceBakerCapitalDetails
    >;

export interface BakerPoolPendingChangeRemovePoolDetails {
    effectiveTime: Date;
}

export type BakerPoolPendingChangeRemovePool = BakerPoolPendingChangeWrapper<
    BakerPoolPendingChangeType.RemovePool,
    BakerPoolPendingChangeRemovePoolDetails
>;

export type BakerPoolPendingChangeNoChange = BakerPoolPendingChangeWrapper<
    BakerPoolPendingChangeType.NoChange,
    // eslint-disable-next-line @typescript-eslint/ban-types
    {}
>;

export type BakerPoolPendingChange =
    | BakerPoolPendingChangeReduceBakerCapital
    | BakerPoolPendingChangeRemovePool
    | BakerPoolPendingChangeNoChange;

export enum PoolStatusType {
    BakerPool = 'BakerPool',
    PassiveDelegation = 'PassiveDelegation',
}

type PoolStatusWrapper<T extends keyof typeof PoolStatusType, S> = S & {
    poolType: T;
};

export interface BakerPoolStatusDetails {
    bakerId: BakerId;
    bakerAddress: Base58String;
    bakerEquityCapital: Amount;
    delegatedCapital: Amount;
    delegatedCapitalCap: Amount;
    poolInfo: BakerPoolInfo;
    bakerStakePendingChange: BakerPoolPendingChange;
    currentPaydayStatus: CurrentPaydayBakerPoolStatus | null;
    allPoolTotalCapital: Amount;
}

export type BakerPoolStatus = PoolStatusWrapper<
    PoolStatusType.BakerPool,
    BakerPoolStatusDetails
>;

export interface PassiveDelegationStatusDetails {
    delegatedCapital: Amount;
    commissionRates: CommissionRates;
    currentPaydayTransactionFeesEarned: Amount;
    currentPaydayDelegatedCapital: Amount;
    allPoolTotalCapital: Amount;
}

export type PassiveDelegationStatus = PoolStatusWrapper<
    PoolStatusType.PassiveDelegation,
    PassiveDelegationStatusDetails
>;

export type PoolStatus = BakerPoolStatus | PassiveDelegationStatus;

export enum DelegationTargetType {
    PassiveDelegation = 'Passive',
    Baker = 'Baker',
}

export interface DelegationTargetPassiveDelegation {
    delegateType: DelegationTargetType.PassiveDelegation;
}

export interface DelegationTargetBaker {
    delegateType: DelegationTargetType.Baker;
    bakerId: BakerId;
}
export type EventDelegationTarget =
    | {
          delegateType: DelegationTargetType.Baker;
          bakerId: number;
      }
    | DelegationTargetPassiveDelegation;

export type DelegationTarget =
    | DelegationTargetPassiveDelegation
    | DelegationTargetBaker;

interface AccountBakerDetailsCommon {
    restakeEarnings: boolean;
    bakerId: BakerId;
    bakerAggregationVerifyKey: string;
    bakerElectionVerifyKey: string;
    bakerSignatureVerifyKey: string;
    stakedAmount: bigint;
    pendingChange?: StakePendingChange;
}

export type AccountBakerDetailsV0 = AccountBakerDetailsCommon;

export interface AccountBakerDetailsV1 extends AccountBakerDetailsCommon {
    bakerPoolInfo: BakerPoolInfo;
}

export type AccountBakerDetails = AccountBakerDetailsV0 | AccountBakerDetailsV1;

export interface AccountDelegationDetails {
    restakeEarnings: boolean;
    stakedAmount: bigint;
    delegationTarget: DelegationTarget;
    pendingChange?: StakePendingChangeV1;
}

export type AccountCredential = Versioned<
    InitialAccountCredential | NormalAccountCredential
>;

interface AccountInfoCommon {
    accountAddress: Base58String;
    accountNonce: bigint;
    accountAmount: bigint;
    accountIndex: bigint;

    accountThreshold: number;

    accountEncryptionKey: string;
    accountEncryptedAmount: AccountEncryptedAmount;

    accountReleaseSchedule: AccountReleaseSchedule;

    accountCredentials: Record<number, AccountCredential>;
}

export type AccountInfoSimple = AccountInfoCommon;

export interface AccountInfoBakerV0 extends AccountInfoCommon {
    accountBaker: AccountBakerDetailsV0;
}

/** Protocol version 4 and later. */
export interface AccountInfoBakerV1 extends AccountInfoCommon {
    accountBaker: AccountBakerDetailsV1;
}

export type AccountInfoBaker = AccountInfoBakerV0 | AccountInfoBakerV1;

/** Protocol version 4 and later. */
export interface AccountInfoDelegator extends AccountInfoCommon {
    accountDelegation: AccountDelegationDetails;
}

export type AccountInfo =
    | AccountInfoSimple
    | AccountInfoBaker
    | AccountInfoDelegator;

export interface Description {
    name: string;
    url: UrlString;
    description: string;
}

export interface IpInfo {
    ipIdentity: number;
    ipDescription: Description;
    ipVerifyKey: string;
    ipCdiVerifyKey: string;
}

export interface ArInfo {
    arIdentity: number;
    arDescription: Description;
    arPublicKey: string;
}

interface DelegatorInfoCommon {
    account: Base58String;
    stake: Amount;
}
export interface DelegatorInfo extends DelegatorInfoCommon {
    pendingChange?: StakePendingChange;
}

export type DelegatorRewardPeriodInfo = DelegatorInfoCommon;

export interface Branch {
    blockHash: HexString;
    children: Branch[];
}

export interface BakerElectionInfo {
    baker: BakerId;
    account: Base58String;
    lotteryPower: number;
}

/** Common properties for election info across all protocol versions */
export interface ElectionInfoCommon {
    electionNonce: HexString;
    bakerElectionInfo: BakerElectionInfo[];
}

/** Election info used for protocol version 1-5 */
export interface ElectionInfoV0 extends ElectionInfoCommon {
    electionDifficulty: number;
}

/** Election info used from protocol version 6 */
export type ElectionInfoV1 = ElectionInfoCommon;

/**
 * Union of different versions of election info across all protocol versions.
 * Contains information related to baker election for a particular block
 */
export type ElectionInfo = ElectionInfoV0 | ElectionInfoV1;

export interface NextUpdateSequenceNumbers {
    rootKeys: bigint;
    level1Keys: bigint;
    level2Keys: bigint;
    protocol: bigint;
    electionDifficulty: bigint;
    euroPerEnergy: bigint;
    microCcdPerEuro: bigint;
    foundationAccount: bigint;
    mintDistribution: bigint;
    transactionFeeDistribution: bigint;
    gasRewards: bigint;
    poolParameters: bigint;
    addAnonymityRevoker: bigint;
    addIdentityProvider: bigint;
    cooldownParameters: bigint;
    timeParameters: bigint;
    timeoutParameters: bigint;
    minBlockTime: bigint;
    blockEnergyLimit: bigint;
    finalizationCommiteeParameters: bigint;
}

export type BlockFinalizationSummary =
    | BlockFinalizationSummary_None
    | BlockFinalizationSummary_Record;

export interface BlockFinalizationSummary_None {
    tag: 'none';
}

export interface BlockFinalizationSummary_Record {
    tag: 'record';
    record: FinalizationSummary;
}

export interface FinalizationSummary {
    block: HexString;
    index: bigint;
    delay: bigint;
    finalizers: FinalizationSummaryParty[];
}

export interface FinalizationSummaryParty {
    baker: BakerId;
    weight: bigint;
    signed: boolean;
}

export enum BlockItemKind {
    AccountTransactionKind = 0,
    CredentialDeploymentKind = 1,
    UpdateInstructionKind = 2,
}

/**
 * The different types of account transactions. The number value
 * is important as it is part of the serialization of a particular
 * transaction.
 */
export enum AccountTransactionType {
    DeployModule = 0,
    InitContract = 1,
    Update = 2,
    Transfer = 3,
    AddBaker = 4,
    RemoveBaker = 5,
    UpdateBakerStake = 6,
    UpdateBakerRestakeEarnings = 7,
    UpdateBakerKeys = 8,
    UpdateCredentialKeys = 13,
    EncryptedAmountTransfer = 16,
    TransferToEncrypted = 17,
    TransferToPublic = 18,
    TransferWithSchedule = 19,
    UpdateCredentials = 20,
    RegisterData = 21,
    TransferWithMemo = 22,
    EncryptedAmountTransferWithMemo = 23,
    TransferWithScheduleAndMemo = 24,
    ConfigureBaker = 25,
    ConfigureDelegation = 26,
}

export function isAccountTransactionType(
    candidate: number
): candidate is AccountTransactionType {
    return candidate in AccountTransactionType;
}

export interface DeployModulePayload {
    /** Version of the wasm module. This should only be supplied if wasm module is not already versioned. */
    version?: number;

    /** Wasm module to be deployed */
    source: Buffer;
}

export interface VersionedModuleSource {
    version: 0 | 1;
    source: Buffer;
}

export interface InitContractPayload {
    /** µCCD amount to transfer */
    amount: CcdAmount;

    /** Hash of the module on chain */
    moduleRef: ModuleReference;

    /** Name of the contract */
    initName: string;

    /** Parameters for the init function */
    param: Buffer;

    /** The amount of energy that can be used for contract execution.
    The base energy amount for transaction verification will be added to this cost.*/
    maxContractExecutionEnergy: bigint;
}

export interface UpdateContractPayload {
    /** µCCD amount to transfer */
    amount: CcdAmount;

    /** Address of contract instance consisting of an index and a subindex */
    address: ContractAddress;

    /** Name of receive function including <contractName>. prefix */
    receiveName: string;

    /** Parameters for the update function */
    message: Buffer;

    /** The amount of energy that can be used for contract execution.
    The base energy amount for transaction verification will be added to this cost.*/
    maxContractExecutionEnergy: bigint;
}

export interface AccountTransactionHeader {
    /** account address that is source of this transaction */
    sender: AccountAddress;

    /**
     * the nonce for the transaction, usually acquired by
     * getting the next account nonce from the node
     */
    nonce: bigint;

    /** expiration of the transaction */
    expiry: TransactionExpiry;
}

export interface SimpleTransferPayload {
    /** µCCD amount to transfer */
    amount: CcdAmount;

    /** the recipient of the transfer */
    toAddress: AccountAddress;
}

export interface SimpleTransferWithMemoPayload extends SimpleTransferPayload {
    /** The byte representation of the memo of the transaction  */
    memo: DataBlob;
}

export interface RegisterDataPayload {
    /** The byte representation of the data to be registered  */
    data: DataBlob;
}

export interface IndexedCredentialDeploymentInfo {
    /** the index of the credential, has to fit in 1 byte */
    index: number;

    /** the credential signed by the credential owner */
    cdi: CredentialDeploymentInfo;
}

export interface UpdateCredentialsPayload {
    /** the credentials to be added to the account */
    newCredentials: IndexedCredentialDeploymentInfo[];

    /** the ids of the credentials to be removed */
    removeCredentialIds: string[];

    /** the new credential threshold required to sign transactions */
    threshold: number;

    /**
     * the current number of credentials on the account. This
     * is required to be able to calculate the energy cost, but
     * is not part of the actual transaction.
     */
    currentNumberOfCredentials: bigint;
}

export interface PublicBakerKeys {
    signatureVerifyKey: HexString;
    electionVerifyKey: HexString;
    aggregationVerifyKey: HexString;
}

export interface PrivateBakerKeys {
    aggregationSignKey: HexString;
    signatureSignKey: HexString;
    electionPrivateKey: HexString;
}

export interface BakerKeyProofs {
    proofAggregation: HexString;
    proofSig: HexString;
    proofElection: HexString;
}

export type BakerKeysWithProofs = PublicBakerKeys & BakerKeyProofs;

export type GenerateBakerKeysOutput = PublicBakerKeys &
    PrivateBakerKeys &
    BakerKeyProofs;

export interface ConfigureBakerPayload {
    /* stake to bake. if set to 0, this removes the account as a baker */
    stake?: CcdAmount;
    /* should earnings from baking be added to staked amount  */
    restakeEarnings?: boolean;
    openForDelegation?: OpenStatus;
    keys?: BakerKeysWithProofs;
    metadataUrl?: UrlString;
    transactionFeeCommission?: number;
    bakingRewardCommission?: number;
    finalizationRewardCommission?: number;
}

export interface ConfigureDelegationPayload {
    /* stake to delegate. if set to 0, this removes the account as a delegator */
    stake?: CcdAmount;
    /* should earnings from delegation be added to staked amount  */
    restakeEarnings?: boolean;
    /* determines if the account should use passive delegation, or which specific baker to delegate to  */
    delegationTarget?: DelegationTarget;
}

export type AccountTransactionPayload =
    | SimpleTransferPayload
    | SimpleTransferWithMemoPayload
    | RegisterDataPayload
    | DeployModulePayload
    | InitContractPayload
    | UpdateContractPayload
    | UpdateCredentialsPayload
    | ConfigureBakerPayload
    | ConfigureDelegationPayload;

export interface AccountTransaction {
    type: AccountTransactionType;
    header: AccountTransactionHeader;
    payload: AccountTransactionPayload;
}

/**
 * @deprecated This type was for serialization code, which has been moved to rust-bindings
 */
export enum ParameterType {
    /** Nothing. */
    Unit = 0,
    /** Boolean (`true` or `false`). */
    Bool,
    /** Unsigned 8-bit integer. */
    U8,
    /** Unsigned 16-bit integer. */
    U16,
    /** Unsigned 32-bit integer. */
    U32,
    /** Unsigned 64-bit integer. */
    U64,
    /** Signed 8-bit integer. */
    I8,
    /** Signed 16-bit integer. */
    I16,
    /** Signed 32-bit integer. */
    I32,
    /** Signed 64-bit integer. */
    I64,
    /** Token amount in microCCD (10^-6 CCD). */
    Amount,
    /** Sender account address. */
    AccountAddress,
    /** Address of the contract instance consisting of an index and a subindex. */
    ContractAddress,
    /** Unsigned 64-bit integer storing milliseconds since UNIX epoch and representing a timestamp. */
    Timestamp,
    /** Unsigned 64-bit integer storing milliseconds and representing a duration. */
    Duration,
    /** Tuple. */
    Pair,
    /** Variable size list. */
    List,
    /** Unordered collection of unique elements. */
    Set,
    /** Unordered map from keys to values.  */
    Map,
    /** Fixed size array. */
    Array,
    /** Struct. */
    Struct,
    /** Enum. */
    Enum,
    /** List of bytes representing a string. */
    String,
    /** Unsigned 128-bit integer. */
    U128,
    /** Signed 128-bit integer. */
    I128,
    /** Name of the contract. */
    ContractName,
    /** Receive function name. */
    ReceiveName,
    /** LEB128 encoding of an unsigned integer */
    ULeb128,
    /** LEB128 encoding of a signed integer */
    ILeb128,
    /** Variable size list of bytes */
    ByteList,
    /** Fixed size list of bytes */
    ByteArray,
}

export interface InstanceInfoCommon {
    version: number;
    amount: CcdAmount;
    sourceModule: ModuleReference;
    owner: AccountAddress;
    methods: string[];
    name: string;
}

export interface InstanceInfoV0 extends InstanceInfoCommon {
    version: 0;
    model: Buffer;
}

export interface InstanceInfoV1 extends InstanceInfoCommon {
    version: 1;
}

export type InstanceInfo = InstanceInfoV0 | InstanceInfoV1;

export const isInstanceInfoV1 = (info: InstanceInfo): info is InstanceInfoV1 =>
    info.version === 1;

export const isInstanceInfoV0 = (info: InstanceInfo): info is InstanceInfoV0 =>
    info.version === undefined || info.version === 0;

export type CredentialSignature = Record<number, string>;
export type AccountTransactionSignature = Record<number, CredentialSignature>;

export interface InstanceInfoSerializedCommon {
    version?: number;
    amount: string;
    sourceModule: string;
    owner: string;
    methods: string[];
    name: string;
}

export interface InstanceInfoSerializedV0 extends InstanceInfoSerializedCommon {
    version?: 0;
    model: string;
}

export interface InstanceInfoSerializedV1 extends InstanceInfoSerializedCommon {
    version: 1;
}

export type InstanceInfoSerialized =
    | InstanceInfoSerializedV0
    | InstanceInfoSerializedV1;

export interface InstanceStateKVPair {
    key: HexString;
    value: HexString;
}

export interface ContractContext {
    invoker?: ContractAddress | AccountAddress;
    contract: ContractAddress;
    amount?: CcdAmount;
    method: string;
    parameter?: Buffer;
    energy?: bigint;
}

/**
 * Format of invoker expected by the node for the invokeContract entrypoint.
 * @deprecated This is type used by the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export type Invoker =
    | {
          type: 'AddressContract';
          address: {
              index: DigitString;
              subindex: DigitString;
          };
      }
    | {
          type: 'AddressAccount';
          address: Base58String;
      }
    | null;

/**
 * Takes an accountAddress or ContractAddress and transforms it into the specific format used for
 * InvokeContract's invoker parameter.
 * @deprecated This is helper intented for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export function buildInvoker(
    invoker?: AccountAddress | ContractAddress
): Invoker {
    if (!invoker) {
        return null;
    } else if ((invoker as AccountAddress).address) {
        return {
            type: 'AddressAccount',
            address: (invoker as AccountAddress).address,
        };
    } else if ((invoker as ContractAddress).index !== undefined) {
        const invokerContract = invoker as ContractAddress;
        return {
            type: 'AddressContract',
            address: {
                subindex: invokerContract.subindex.toString(),
                index: invokerContract.index.toString(),
            },
        };
    } else {
        throw new Error('Unexpected input to build invoker');
    }
}

export interface InvokeContractSuccessResult {
    tag: 'success';
    usedEnergy: bigint;
    events: ContractTraceEvent[];
    returnValue?: string;
}

export interface InvokeContractFailedResult {
    tag: 'failure';
    usedEnergy: bigint;
    reason: RejectReason;
}

/**
 * @deprecated This is type for describing return types for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export interface InvokeContractFailedResultV1 {
    tag: 'failure';
    usedEnergy: bigint;
    reason: RejectReasonV1;
}

export type InvokeContractResult =
    | InvokeContractSuccessResult
    | InvokeContractFailedResult;

/**
 * @deprecated This is helper intented for the JSON-RPC client and the V1 gRPC client, both of which have been deprecated
 */
export type InvokeContractResultV1 =
    | InvokeContractSuccessResult
    | InvokeContractFailedResultV1;

export interface CredentialDeploymentDetails {
    expiry: TransactionExpiry;
    unsignedCdi: UnsignedCredentialDeploymentInformation;
}

export interface IdOwnershipProofs {
    challenge: string;
    commitments: string;
    credCounterLessThanMaxAccounts: string;
    proofIdCredPub: Record<string, string>;
    proofIpSig: string;
    proofRegId: string;
    sig: string;
}

export interface UnsignedCredentialDeploymentInformation
    extends CredentialDeploymentValues {
    proofs: IdOwnershipProofs;
}

type AttributesRandomness = Record<AttributeKey, string>;

export interface CommitmentsRandomness {
    idCredSecRand: string;
    prfRand: string;
    credCounterRand: string;
    maxAccountsRand: string;
    attributesRand: AttributesRandomness;
}

interface CdiRandomness {
    randomness: CommitmentsRandomness;
}

// TODO Should we rename this, As it is not actually the transaction that is sent to the node. (Note that this would be a breaking change)
export type CredentialDeploymentTransaction = CredentialDeploymentDetails &
    CdiRandomness;
/** Internal type used when building credentials */
export type UnsignedCdiWithRandomness = {
    unsignedCdi: UnsignedCredentialDeploymentInformation;
} & CdiRandomness;

export interface CredentialDeploymentInfo extends CredentialDeploymentValues {
    proofs: string;
}

export interface SignedCredentialDeploymentDetails {
    expiry: TransactionExpiry;
    cdi: CredentialDeploymentInfo;
}

export type TypedCredentialDeployment =
    | {
          type: 'normal';
          contents: CredentialDeploymentInfo;
      }
    | {
          type: 'initial';
          contents: InitialCredentialDeploymentValues & { sig: string };
      };

export interface IdentityProvider {
    arsInfos: Record<number, ArInfo>;
    ipInfo: IpInfo;
}

export interface IdentityInput {
    identityProvider: IdentityProvider;
    identityObject: any;
    prfKey: string;
    idCredSecret: string;
    randomness: string;
}

export enum ContractVersion {
    V0 = 0,
    V1 = 1,
}

export enum SchemaVersion {
    V0 = 0, // Used by version 0 smart contracts.
    V1 = 1, // Used by version 1 smart contracts.
    V2 = 2, // Used by version 1 smart contracts.
}

export type IpArData = {
    encPrfKeyShare: string;
    proofComEncEq: string;
};

export interface IdObjectRequestV1 {
    idCredPub: string;
    choiceArData: {
        arIdentities: number[];
        threshold: number;
    };
    ipArData: Record<string, IpArData>;
    idCredSecCommitment: string;
    prfKeyCommitmentWithIP: string;
    prfKeySharingCoeffCommitments: string[];
    proofsOfKnowledge: string;
}

export interface IdRecoveryRequest {
    idCredPub: string;
    timestamp: Timestamp;
    proof: string;
}

export interface AttributeList {
    validTo: string; // "YYYYMM"
    createdAt: string; // "YYYYMM"
    maxAccounts: number;
    chosenAttributes: Record<AttributeKey, string>;
}

export type IdentityObjectV1 = {
    preIdentityObject: IdObjectRequestV1;
    attributeList: AttributeList;
    signature: string;
};

export type Network = 'Testnet' | 'Mainnet';

export type SmartContractTypeValues =
    | { [key: string]: SmartContractTypeValues }
    | SmartContractTypeValues[]
    | number
    | string
    | boolean;
