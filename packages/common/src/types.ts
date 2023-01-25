import { AccountAddress } from './types/accountAddress';
import { CredentialRegistrationId } from './types/CredentialRegistrationId';
import { CcdAmount } from './types/ccdAmount';
import { DataBlob } from './types/DataBlob';
import { TransactionExpiry } from './types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from './types/moduleReference';
import { RejectReason } from './types/rejectReason';
import {
    ContractTraceEvent,
    MemoEvent,
    TransactionEvent,
    TransferredEvent,
} from './types/transactionEvent';

export type HexString = string;
export type Base58String = string;
export type DigitString = string;

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
    rejectReason: RejectReason;
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

interface GenericTransactionSummary extends BaseTransactionSummary {
    type: GenericTransactionSummaryType;
    result: EventResult;
}

interface TransferWithMemoEventResult {
    outcome: 'success';
    events: [TransferredEvent, MemoEvent];
}

export interface TransferWithMemoTransactionSummary
    extends BaseTransactionSummary {
    type: TransferWithMemoSummaryType;
    result: TransferWithMemoEventResult;
}

export type TransactionSummary =
    | GenericTransactionSummary
    | TransferWithMemoTransactionSummary;

export function instanceOfTransferWithMemoTransactionSummary(
    object: TransactionSummary
): object is TransferWithMemoTransactionSummary {
    return (
        object.type !== undefined && object.type.contents === 'transferWithMemo'
    );
}

export interface TransactionStatus {
    status: TransactionStatusEnum;
    outcomes?: Record<string, TransactionSummary>;
}

export interface PartyInfo {
    bakerId: bigint;
    weight: bigint;
    signed: boolean;
}

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

export interface GasRewards {
    baker: number;
    finalizationProof: number;
    accountCreation: number;
    chainUpdate: number;
}

export interface RewardParametersCommon {
    transactionFeeDistribution: TransactionFeeDistribution;
    gASRewards: GasRewards;
}

/**
 * Used from protocol version 1-3
 */
export interface RewardParametersV0 extends RewardParametersCommon {
    mintDistribution: MintDistributionV0;
}

/**
 * Used from protocol version 4
 */
export interface RewardParametersV1 extends RewardParametersCommon {
    mintDistribution: MintDistributionV1;
}

export type RewardParameters = RewardParametersV0 | RewardParametersV1;

export interface CooldownParametersV0 {
    bakerCooldownEpochs: Epoch;
}

export interface CooldownParametersV1 {
    poolOwnerCooldown: DurationSeconds;
    delegatorCooldown: DurationSeconds;
}

export interface PoolParametersV0 {
    minimumThresholdForBaking: Amount;
}

export interface PoolParametersV1 {
    passiveFinalizationCommission: number;
    passiveBakingCommission: number;
    passiveTransactionCommission: number;
    finalizationCommissionRange: InclusiveRange<number>;
    bakingCommissionRange: InclusiveRange<number>;
    transactionCommissionRange: InclusiveRange<number>;
    minimumEquityCapital: Amount;
    capitalBound: number;
    leverageBound: Ratio;
}

export interface TimeParametersV1 {
    /**
     * In epochs
     */
    rewardPeriodLength: Epoch;
    mintPerPayday: number;
}

export interface ChainParametersCommon {
    electionDifficulty: number;
    euroPerEnergy: ExchangeRate;
    microGTUPerEuro: ExchangeRate;
    accountCreationLimit: number;
    foundationAccountIndex?: bigint;
    foundationAccount?: string;
}

/**
 * Used from protocol version 1-3
 */
export interface ChainParametersV0
    extends ChainParametersCommon,
        CooldownParametersV0,
        PoolParametersV0 {
    rewardParameters: RewardParametersV0;
}

/**
 * Used from protocol version 4
 */
export interface ChainParametersV1
    extends ChainParametersCommon,
        CooldownParametersV1,
        PoolParametersV1,
        TimeParametersV1 {
    rewardParameters: RewardParametersV1;
}

export type ChainParameters = ChainParametersV0 | ChainParametersV1;

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
    queue: UpdateQueueQueue;
}

interface UpdateQueuesCommon {
    microGTUPerEuro: UpdateQueue;
    euroPerEnergy: UpdateQueue;
    transactionFeeDistribution: UpdateQueue;
    foundationAccount: UpdateQueue;
    electionDifficulty: UpdateQueue;
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
    bakerStakeThreshold: UpdateQueue;
}

/**
 * Used from protocol version 4
 */
export interface UpdateQueuesV1 extends UpdateQueuesCommon {
    cooldownParameters: UpdateQueue;
    timeParameters: UpdateQueue;
    poolParameters: UpdateQueue;
}

export type UpdateQueues = UpdateQueuesV0 | UpdateQueuesV1;

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
 */
export interface UpdatesV0 extends UpdatesCommon {
    chainParameters: ChainParametersV0;
    updateQueues: UpdateQueuesV0;
    keys: KeysV0;
}

/**
 * Used from protocol version 4
 */
export interface UpdatesV1 extends UpdatesCommon {
    chainParameters: ChainParametersV1;
    updateQueues: UpdateQueuesV1;
    keys: KeysV1;
}

export type Updates = UpdatesV0 | UpdatesV1;

interface BlockSummaryCommon {
    protocolVersion?: bigint;
    finalizationData: FinalizationData;
    transactionSummaries: TransactionSummary[];
}

/**
 * Used from protocol version 1-3
 */
export interface BlockSummaryV0 extends BlockSummaryCommon {
    updates: UpdatesV0;
}

/**
 * Used from protocol version 4
 */
export interface BlockSummaryV1 extends BlockSummaryCommon {
    updates: UpdatesV1;
    protocolVersion: bigint;
}

export type BlockSummary = BlockSummaryV0 | BlockSummaryV1;

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
    currentEraGenesisBlock: string;
    lastFinalizedBlock: string;

    /**
     * In milliseconds
     */
    epochDuration: bigint;
    /**
     * In milliseconds
     */
    slotDuration: bigint;
    bestBlockHeight: bigint;
    lastFinalizedBlockHeight: bigint;

    finalizationCount: bigint;
    blocksVerifiedCount: bigint;
    blocksReceivedCount: bigint;

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
    currentEraGenesisTime: Date;
    blockLastReceivedTime?: Date;
    blockLastArrivedTime?: Date;
    lastFinalizedTime?: Date;

    genesisIndex: number;

    protocolVersion: bigint;
}

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
    amount: bigint;
}

export interface ReleaseScheduleWithTransactions extends ReleaseSchedule {
    transactions: string[];
}

export interface AccountReleaseSchedule {
    total: bigint;
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
    verifyKey: string;
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

export interface BakerPoolInfo {
    openStatus: OpenStatusText;
    metadataUrl: string;
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
    url: string;
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
    TransferWithScheduleWithMemo = 24,
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
    | ConfigureDelegationPayload;

export interface AccountTransaction {
    type: AccountTransactionType;
    header: AccountTransactionHeader;
    payload: AccountTransactionPayload;
}

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
    /** Token amount in microCCD (10^-6 GTU). */
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
    timestamp: bigint;
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
