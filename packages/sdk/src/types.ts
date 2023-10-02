/**
 * @module Common GRPC-Client
 */

import * as AccountAddress from './types/AccountAddress.js';
import * as ContractAddress from './types/ContractAddress.js';
import * as Duration from './types/Duration.js';
import * as Timestamp from './types/Timestamp.js';
import * as Energy from './types/Energy.js';
import type * as BlockHash from './types/BlockHash.js';
import * as CredentialRegistrationId from './types/CredentialRegistrationId.js';
import * as Parameter from './types/Parameter.js';
import type * as InitName from './types/InitName.js';
import type * as ContractName from './types/ContractName.js';
import type * as ReceiveName from './types/ReceiveName.js';
import type * as SequenceNumber from './types/SequenceNumber.js';
import type * as ReturnValue from './types/ReturnValue.js';
import { CcdAmount } from './types/ccdAmount.js';
import { DataBlob } from './types/DataBlob.js';
import { TransactionExpiry } from './types/transactionExpiry.js';
import { ModuleReference } from './types/moduleReference.js';
import { RejectReason } from './types/rejectReason.js';
import { ContractTraceEvent } from './types/transactionEvent.js';

export * from './types/NodeInfo.js';
export * from './types/PeerInfo.js';
export * from './types/blockItemSummary.js';
export * from './types/chainUpdate.js';
export * from './types/rejectReason.js';
export * from './types/transactionEvent.js';
export * from './types/BlockSpecialEvents.js';
export * from './types/errors.js';

export type HexString = string;
export type Base58String = string;
export type Base64String = string;
export type DigitString = string;
export type UrlString = string;
export type IpAddressString = string;
export type JsonString = string;

export type ModuleRef = HexString;

/** A consensus round */
export type Round = bigint;

/**
 * Makes keys of type optional
 *
 * @example
 * type PartiallyOptionalProps = MakeOptional<{test: string; another: number;}, 'another'>; // {test: string; another?: number;}
 */
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
    Partial<Pick<T, K>>;

/** Makes keys of type required (i.e. non-optional) */
export type MakeRequired<T, K extends keyof T> = Required<Pick<T, K>> &
    Omit<T, K>;
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
    address: AccountAddress.Type;
}

export type AccountIdentifierInput =
    | AccountAddress.Type
    | CredentialRegistrationId.Type
    | bigint;

export type Address =
    | {
          type: 'AddressContract';
          address: ContractAddress.Type;
      }
    | AddressAccount;

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
    energyCost: Energy.Type;
    index: bigint;
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
    version: 0;
    mintPerSlot: number;
}

export interface MintDistributionV1 extends MintDistributionCommon {
    version: 1;
}

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
    version: 0;
    /** The fractional amount paid for including a finalization proof */
    finalizationProof: number;
}

/** Gas rewards properties from protocol version 6 ({@link ChainParametersV2}). */
export interface GasRewardsV1 extends GasRewardsCommon {
    version: 1;
}

/** Common reward parameters used across all protocol versions */
export interface RewardParametersCommon {
    /** The current transaction fee distribution */
    transactionFeeDistribution: TransactionFeeDistribution;
}

/** Reward parameters used from protocol version 1-3 ({@link ChainParametersV0}). */
export interface RewardParametersV0 extends RewardParametersCommon {
    version: 0;
    /** The current mint distribution */
    mintDistribution: MintDistributionV0;
    /** The current gas rewards parameters */
    gASRewards: GasRewardsV0;
}

/** Reward parameters used in protocol versions 4 and 5 ({@link ChainParametersV1}). */
export interface RewardParametersV1 extends RewardParametersCommon {
    version: 1;
    /** The current mint distribution */
    mintDistribution: MintDistributionV1;
    /** The current gas rewards parameters */
    gASRewards: GasRewardsV0;
}

/** Reward parameters used from protocol version 6 ({@link ChainParametersV2}). */
export interface RewardParametersV2 extends RewardParametersCommon {
    version: 2;
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
    timeoutBase: Duration.Type;
    /** Factor for increasing the timeout. Must be greater than 1. */
    timeoutIncrease: Ratio;
    /** Factor for decreasing the timeout. Must be between 0 and 1. */
    timeoutDecrease: Ratio;
}

/** Consensus parameters, used from protocol version 6 */
export interface ConsensusParameters {
    /** Minimum time interval between blocks. */
    minBlockTime: Duration.Type;
    /** Maximum energy allowed per block. */
    blockEnergyLimit: Energy.Type;
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
    foundationAccount: AccountAddress.Type;
    /** Keys allowed to do level1 updates */
    level1Keys: KeysWithThreshold;
    /** Keys allowed to do root updates */
    rootKeys: KeysWithThreshold;
}

/** Chain parameters used from protocol version 1-3 */
export type ChainParametersV0 = ChainParametersCommon &
    CooldownParametersV0 &
    PoolParametersV0 & {
        version: 0;
        /** The election difficulty for consensus lottery */
        electionDifficulty: number;
        /** The election difficulty for consensus lottery */
        rewardParameters: RewardParametersV0;
        /** Keys allowed to do parameter updates */
        level2Keys: AuthorizationsV0;
    };

/** Chain parameters used in protocol versions 4 and 5 */
export type ChainParametersV1 = ChainParametersCommon &
    CooldownParametersV1 &
    TimeParametersV1 &
    PoolParametersV1 & {
        version: 1;
        /** The election difficulty for consensus lottery */
        electionDifficulty: number;
        /** The election difficulty for consensus lottery */
        rewardParameters: RewardParametersV1;
        /** Keys allowed to do parameter updates */
        level2Keys: AuthorizationsV1;
    };

/** Chain parameters used from protocol version 6 */
export type ChainParametersV2 = ChainParametersCommon &
    CooldownParametersV1 &
    TimeParametersV1 &
    PoolParametersV1 &
    FinalizationCommitteeParameters &
    TimeoutParameters &
    ConsensusParameters & {
        version: 2;
        /** The election difficulty for consensus lottery */
        rewardParameters: RewardParametersV2;
        /** Keys allowed to do parameter updates */
        level2Keys: AuthorizationsV1;
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
export interface AuthorizationsV0 extends AuthorizationsCommon {
    version: 0;
}

/**
 * Used from protocol version 4
 */
export interface AuthorizationsV1 extends AuthorizationsCommon {
    version: 1;
    cooldownParameters: Authorization;
    timeParameters: Authorization;
}

export type Authorizations = AuthorizationsV0 | AuthorizationsV1;

export interface KeysWithThreshold {
    keys: VerifyKey[];
    threshold: number;
}

interface RewardStatusCommon {
    protocolVersion?: bigint;
    totalAmount: Amount;
    totalEncryptedAmount: Amount;
    bakingRewardAccount: Amount;
    finalizationRewardAccount: Amount;
    gasAccount: Amount;
}

export interface RewardStatusV0 extends RewardStatusCommon {
    version: 0;
}

export interface RewardStatusV1 extends RewardStatusCommon {
    version: 1;
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
    blockParent: BlockHash.Type;
    /** Hash of block */
    blockHash: BlockHash.Type;
    /** Hash of block state */
    blockStateHash: HexString;
    /** Hash of last finalized block when this block was baked */
    blockLastFinalized: BlockHash.Type;

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
    transactionEnergyCost: Energy.Type;

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
    version: 0;
    /** The slot number in which the block was baked. */
    blockSlot: bigint;
}

/** Block info used from protocol version 6 */
export interface BlockInfoV1 extends BlockInfoCommon {
    version: 1;
    /** The block round */
    round: Round;
    /** The block epoch */
    epoch: Epoch;
}

/** Union of all block info versions */
export type BlockInfo = BlockInfoV0 | BlockInfoV1;

export interface CommonBlockInfo {
    hash: BlockHash.Type;
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
    bestBlock: BlockHash.Type;
    /** Hash of the initial genesis block */
    genesisBlock: BlockHash.Type;
    /** Hash of the genesis block of the current era, i.e. since the last protocol update. */
    currentEraGenesisBlock: BlockHash.Type;
    /** Hash of the last finalized block */
    lastFinalizedBlock: BlockHash.Type;

    /** Current epoch duration, in milliseconds */
    epochDuration: Duration.Type;
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
    version: 0;
    /** (Current) slot duration in milliseconds */
    slotDuration: Duration.Type;
}

export interface ConcordiumBftStatus {
    /** Current duration before a round times out, in milliseconds */
    currentTimeoutDuration: Duration.Type;
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
    version: 1;
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
    nonce: SequenceNumber.Type;
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

export interface CredentialPublicKeys {
    keys: Record<number, VerifyKey>;
    threshold: number;
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
    RemoveStake = 'RemoveStake',
}

interface StakePendingChangeCommon {
    effectiveTime: Date;
}

export interface ReduceStakePendingChange extends StakePendingChangeCommon {
    change: StakePendingChangeType.ReduceStake;
    newStake: bigint;
}

export interface RemovalPendingChange extends StakePendingChangeCommon {
    change: StakePendingChangeType.RemoveStake;
}

export type StakePendingChange =
    | ReduceStakePendingChange
    | RemovalPendingChange;

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
export type DelegatorId = bigint;

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
    bakerAddress: AccountAddress.Type;
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

/** Protocol version 1-3. */
export interface AccountBakerDetailsV0 extends AccountBakerDetailsCommon {
    version: 0;
}

/** Protocol version 4 and later. */
export interface AccountBakerDetailsV1 extends AccountBakerDetailsCommon {
    version: 1;
    bakerPoolInfo: BakerPoolInfo;
}

export type AccountBakerDetails = AccountBakerDetailsV0 | AccountBakerDetailsV1;

export interface AccountDelegationDetails {
    restakeEarnings: boolean;
    stakedAmount: bigint;
    delegationTarget: DelegationTarget;
    pendingChange?: StakePendingChange;
}

export type AccountCredential = Versioned<
    InitialAccountCredential | NormalAccountCredential
>;

export enum AccountInfoType {
    Simple = 'simple',
    Baker = 'baker',
    Delegator = 'delegator',
}

interface AccountInfoCommon {
    accountAddress: AccountAddress.Type;
    accountNonce: SequenceNumber.Type;
    accountAmount: bigint;
    accountIndex: bigint;
    accountThreshold: number;
    accountEncryptionKey: string;
    accountEncryptedAmount: AccountEncryptedAmount;
    accountReleaseSchedule: AccountReleaseSchedule;
    accountCredentials: Record<number, AccountCredential>;
}

export interface AccountInfoSimple extends AccountInfoCommon {
    type: AccountInfoType.Simple;
}

export interface AccountInfoBaker extends AccountInfoCommon {
    type: AccountInfoType.Baker;
    accountBaker: AccountBakerDetails;
}

/** Protocol version 4 and later. */
export interface AccountInfoDelegator extends AccountInfoCommon {
    type: AccountInfoType.Delegator;
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
    account: AccountAddress.Type;
    stake: Amount;
}
export interface DelegatorInfo extends DelegatorInfoCommon {
    pendingChange?: StakePendingChange;
}

export type DelegatorRewardPeriodInfo = DelegatorInfoCommon;

export interface Branch {
    blockHash: BlockHash.Type;
    children: Branch[];
}

export interface BakerElectionInfo {
    baker: BakerId;
    account: AccountAddress.Type;
    lotteryPower: number;
}

/** Common properties for election info across all protocol versions */
export interface ElectionInfoCommon {
    electionNonce: HexString;
    bakerElectionInfo: BakerElectionInfo[];
}

/** Election info used for protocol version 1-5 */
export interface ElectionInfoV0 extends ElectionInfoCommon {
    version: 0;
    electionDifficulty: number;
}

/** Election info used from protocol version 6 */
export interface ElectionInfoV1 extends ElectionInfoCommon {
    version: 1;
}

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
    block: BlockHash.Type;
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
    source: Uint8Array;
}

export interface VersionedModuleSource {
    version: 0 | 1;
    source: Uint8Array;
}

export interface InitContractPayload {
    /** µCCD amount to transfer */
    amount: CcdAmount;

    /** Hash of the module on chain */
    moduleRef: ModuleReference;

    /** Name of the contract */
    initName: ContractName.Type;

    /** Parameters for the init function */
    param: Parameter.Type;

    /** The amount of energy that can be used for contract execution.
    The base energy amount for transaction verification will be added to this cost.*/
    maxContractExecutionEnergy: Energy.Type;
}

export interface UpdateContractPayload {
    /** µCCD amount to transfer */
    amount: CcdAmount;

    /** Address of contract instance consisting of an index and a subindex */
    address: ContractAddress.Type;

    /** Name of receive function including <contractName>. prefix */
    receiveName: ReceiveName.Type;

    /** Parameters for the update function */
    message: Parameter.Type;

    /** The amount of energy that can be used for contract execution.
    The base energy amount for transaction verification will be added to this cost.*/
    maxContractExecutionEnergy: Energy.Type;
}

export interface AccountTransactionHeader {
    /** account address that is source of this transaction */
    sender: AccountAddress.Type;

    /**
     * the nonce for the transaction, usually acquired by
     * getting the next account nonce from the node
     */
    nonce: SequenceNumber.Type;

    /** expiration of the transaction */
    expiry: TransactionExpiry;
}

export interface SimpleTransferPayload {
    /** µCCD amount to transfer */
    amount: CcdAmount;

    /** the recipient of the transfer */
    toAddress: AccountAddress.Type;
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

export interface InstanceInfoCommon {
    /** Version of the smart contract module. */
    version: number;
    /** Total balance of CCD hold by this instance. */
    amount: CcdAmount;
    /** Module reference of the current module being used by this instance. */
    sourceModule: ModuleReference;
    /** Account used to instantiate this smart contract instance. */
    owner: AccountAddress.Type;
    /** List of receive functions currently exposed by this smart contract. These are of the form '<contractName>.<entrypointName>'. */
    methods: ReceiveName.Type[];
    /** Name of the smart contract. This is of the form 'init_<contractName>'. */
    name: InitName.Type;
}

export interface InstanceInfoV0 extends InstanceInfoCommon {
    version: 0;
    model: ArrayBuffer;
}

export interface InstanceInfoV1 extends InstanceInfoCommon {
    version: 1;
}

export type InstanceInfo = InstanceInfoV0 | InstanceInfoV1;

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
    invoker?: ContractAddress.Type | AccountAddress.Type;
    contract: ContractAddress.Type;
    amount?: CcdAmount;
    method: ReceiveName.Type;
    parameter?: Parameter.Type;
    energy?: Energy.Type;
}

export interface InvokeContractSuccessResult {
    tag: 'success';
    usedEnergy: Energy.Type;
    events: ContractTraceEvent[];
    returnValue?: ReturnValue.Type;
}

export interface InvokeContractFailedResult {
    tag: 'failure';
    usedEnergy: Energy.Type;
    reason: RejectReason;
    returnValue?: ReturnValue.Type;
}

export type InvokeContractResult =
    | InvokeContractSuccessResult
    | InvokeContractFailedResult;

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
    timestamp: Timestamp.Type;
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

export type HealthCheckResponse =
    | {
          isHealthy: true;
      }
    | {
          isHealthy: false;
          message?: string;
      };