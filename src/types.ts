import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from './types/gtuAmount';
import { DataBlob } from './types/DataBlob';
import { TransactionExpiry } from './types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from './types/moduleReference';

/**
 * Returns a union of all keys of type T with values matching type V.
 */
export type KeysMatching<T, V> = {
    [K in keyof T]-?: T[K] extends V ? K : never;
}[keyof T];

/**
 * A reward fraction with a resolution of 1/100000, i.e. the
 * denominator is implicitly 100000, and the interface therefore
 * only contains the numerator value which can be in the interval
 * [1, 100000].
 */
export type RewardFraction = number;

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

export enum TransactionStatusEnum {
    Received = 'received',
    Finalized = 'finalized',
    Committed = 'committed',
}

export interface AddressAccount {
    type: 'AddressAccount';
    address: string;
}

export interface TransactionEvent {
    tag:
        | 'ModuleDeployed'
        | 'ContractInitialized'
        | 'AccountCreated'
        | 'CredentialDeployed'
        | 'BakerAdded'
        | 'BakerRemoved'
        | 'BakerStakeIncreased'
        | 'BakerStakeDecreased'
        | 'BakerSetRestakeEarnings'
        | 'BakerKeysUpdated'
        | 'CredentialKeysUpdated'
        | 'NewEncryptedAmount'
        | 'EncryptedAmountsRemoved'
        | 'AmountAddedByDecryption'
        | 'EncryptedSelfAmountAdded'
        | 'UpdateEnqueued'
        | 'TransferredWithSchedule'
        | 'CredentialsUpdated'
        | 'DataRegistered';
}

export interface ContractAddress {
    index: bigint;
    subindex: bigint;
}

export interface UpdatedEvent {
    tag: 'Updated';
    address: ContractAddress;
    instigator: AddressAccount;
    amount: bigint;
    message: string;
    receiveName: string;
    events: [string];
}

export interface TransferredEvent {
    tag: 'Transferred';
    amount: bigint;
    to: AddressAccount;
    from: AddressAccount;
}

export interface TransferredWithScheduleEvent {
    tag: 'TransferredWithSchedule';
    to: AddressAccount;
    from: AddressAccount;
    amount: ReleaseSchedule[];
}

export interface MemoEvent {
    tag: 'TransferMemo';
    memo: string;
}

/**
 * An enum containing all the possible reject reasons that can be
 * received from a node as a response to a transaction submission.
 *
 * This should be kept in sync with the list of reject reasons
 * found here: https://github.com/Concordium/concordium-base/blob/main/haskell-src/Concordium/Types/Execution.hs
 */
export enum RejectReasonTag {
    ModuleNotWF = 'ModuleNotWF',
    ModuleHashAlreadyExists = 'ModuleHashAlreadyExists',
    InvalidAccountReference = 'InvalidAccountReference',
    InvalidInitMethod = 'InvalidInitMethod',
    InvalidReceiveMethod = 'InvalidReceiveMethod',
    InvalidModuleReference = 'InvalidModuleReference',
    InvalidContractAddress = 'InvalidContractAddress',
    RuntimeFailure = 'RuntimeFailure',
    AmountTooLarge = 'AmountTooLarge',
    SerializationFailure = 'SerializationFailure',
    OutOfEnergy = 'OutOfEnergy',
    RejectedInit = 'RejectedInit',
    RejectedReceive = 'RejectedReceive',
    NonExistentRewardAccount = 'NonExistentRewardAccount',
    InvalidProof = 'InvalidProof',
    AlreadyABaker = 'AlreadyABaker',
    NotABaker = 'NotABaker',
    InsufficientBalanceForBakerStake = 'InsufficientBalanceForBakerStake',
    StakeUnderMinimumThresholdForBaking = 'StakeUnderMinimumThresholdForBaking',
    BakerInCooldown = 'BakerInCooldown',
    DuplicateAggregationKey = 'DuplicateAggregationKey',
    NonExistentCredentialID = 'NonExistentCredentialID',
    KeyIndexAlreadyInUse = 'KeyIndexAlreadyInUse',
    InvalidAccountThreshold = 'InvalidAccountThreshold',
    InvalidCredentialKeySignThreshold = 'InvalidCredentialKeySignThreshold',
    InvalidEncryptedAmountTransferProof = 'InvalidEncryptedAmountTransferProof',
    InvalidTransferToPublicProof = 'InvalidTransferToPublicProof',
    EncryptedAmountSelfTransfer = 'EncryptedAmountSelfTransfer',
    InvalidIndexOnEncryptedTransfer = 'InvalidIndexOnEncryptedTransfer',
    ZeroScheduledAmount = 'ZeroScheduledAmount',
    NonIncreasingSchedule = 'NonIncreasingSchedule',
    FirstScheduledReleaseExpired = 'FirstScheduledReleaseExpired',
    ScheduledSelfTransfer = 'ScheduledSelfTransfer',
    InvalidCredentials = 'InvalidCredentials',
    DuplicateCredIDs = 'DuplicateCredIDs',
    NonExistentCredIDs = 'NonExistentCredIDs',
    RemoveFirstCredential = 'RemoveFirstCredential',
    CredentialHolderDidNotSign = 'CredentialHolderDidNotSign',
    NotAllowedMultipleCredentials = 'NotAllowedMultipleCredentials',
    NotAllowedToReceiveEncrypted = 'NotAllowedToReceiveEncrypted',
    NotAllowedToHandleEncrypted = 'NotAllowedToHandleEncrypted',
}

export interface RejectReason {
    tag: RejectReasonTag;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contents: any;
}

interface RejectedEventResult {
    outcome: 'reject';
    rejectReason: RejectReason;
}

interface SuccessfulEventResult {
    outcome: 'success';
    events: (
        | TransactionEvent
        | TransferredEvent
        | UpdatedEvent
        | MemoEvent
        | TransferredWithScheduleEvent
    )[];
}

export type EventResult =
    | SuccessfulEventResult
    | TransferWithMemoEventResult
    | RejectedEventResult;

interface BaseTransactionSummaryType {
    type:
        | 'accountTransaction'
        | 'credentialDeploymentTransaction'
        | 'updateTransaction';
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
    baker: RewardFraction;
    gasAccount: RewardFraction;
}

interface MintDistributionCommon {
    bakingReward: RewardFraction;
    finalizationReward: RewardFraction;
}

export interface MintRate {
    mantissa: number;
    exponent: number;
}

export interface MintDistributionV0 extends MintDistributionCommon {
    mintPerSlot: number;
}

export type MintDistributionV1 = MintDistributionCommon;

export type MintDistribution = MintDistributionV0 | MintDistributionV1;

export interface GasRewards {
    baker: RewardFraction;
    finalizationProof: RewardFraction;
    accountCreation: RewardFraction;
    chainUpdate: RewardFraction;
}

interface RewardParametersCommon {
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
    finalizationCommissionLPool: RewardFraction;
    bakingCommissionLPool: RewardFraction;
    transactionCommissionLPool: RewardFraction;
    finalizationCommissionRange: InclusiveRange<RewardFraction>;
    bakingCommissionRange: InclusiveRange<RewardFraction>;
    transactionCommissionRange: InclusiveRange<RewardFraction>;
    minimumEquityCapital: Amount;
    capitalBound: RewardFraction;
    leverageBound: Ratio;
}

export interface TimeParametersV1 {
    /**
     * In epochs
     */
    rewardPeriodLength: Epoch;
    mintPerPayday: number;
}

interface ChainParametersCommon {
    electionDifficulty: number;
    euroPerEnergy: ExchangeRate;
    microGTUPerEuro: ExchangeRate;
    accountCreationLimit: number;
    foundationAccountIndex: bigint;
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
     * From protocol version 4 and later, these control the configuration of poolParamenters.
     */
    bakerStakeThreshold: Authorization;
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
    numAggregated: number;
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

export interface ReduceStakePendingChange {
    change: 'ReduceStake';
    newStake: bigint;
    epoch: bigint;
}

export interface RemovalPendingChange {
    change: 'RemoveStake';
    epoch: bigint;
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

export interface BakerPoolInfo {
    openStatus: OpenStatusText;
    metadataUrl: string;
    commissionRates: CommissionRates;
}

export interface CommissionRates {
    transactionCommission: RewardFraction;
    bakingCommission: RewardFraction;
    finalizationCommission: RewardFraction;
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
    LPool = 'LPool',
}

type PoolStatusWrapper<T extends keyof typeof PoolStatusType, S> = S & {
    poolType: T;
};

export interface BakerPoolStatusDetails {
    bakerId: BakerId;
    bakerAddress: string;
    bakerEquityCapital: Amount;
    delegatedCapital: Amount;
    delegatedCapitalCap: Amount;
    poolInfo: BakerPoolInfo;
    bakerStakePendingChange: BakerPoolPendingChange;
    currentPaydayStatus?: CurrentPaydayBakerPoolStatus;
}

export type BakerPoolStatus = PoolStatusWrapper<
    PoolStatusType.BakerPool,
    BakerPoolStatusDetails
>;

export interface LPoolStatusDetails {
    delegatedCapital: Amount;
    commissionRates: CommissionRates;
    currentPaydayTransactionFeesEarned: Amount;
    currentPaydayDelegatedCapital: Amount;
}

export type LPoolStatus = PoolStatusWrapper<
    PoolStatusType.LPool,
    LPoolStatusDetails
>;

export type PoolStatus = BakerPoolStatus | LPoolStatus;

export enum DelegationTargetType {
    LPool = 'L-Pool',
    Baker = 'Baker',
}

export interface DelegationTargetLPool {
    delegateType: DelegationTargetType.LPool;
}

export interface DelegationTargetBaker {
    delegateType: DelegationTargetType.Baker;
    bakerId: BakerId;
}

export type DelegationTarget = DelegationTargetLPool | DelegationTargetBaker;

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
    pendingChange?: StakePendingChange;
}

interface AccountInfoCommon {
    accountNonce: bigint;
    accountAmount: bigint;
    accountIndex: bigint;

    accountThreshold: number;

    accountEncryptionKey: string;
    accountEncryptedAmount: AccountEncryptedAmount;

    accountReleaseSchedule: AccountReleaseSchedule;

    accountCredentials: Record<
        number,
        Versioned<InitialAccountCredential | NormalAccountCredential>
    >;
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
    InitializeSmartContractInstance = 1,
    UpdateSmartContractInstance = 2,
    SimpleTransfer = 3,
    AddBaker = 4,
    RemoveBaker = 5,
    UpdateBakerStake = 6,
    UpdateBakerRestakeEarnings = 7,
    UpdateBakerKeys = 8,
    UpdateCredentialKeys = 13,
    EncryptedTransfer = 16,
    TransferToEncrypted = 17,
    TransferToPublic = 18,
    TransferWithSchedule = 19,
    UpdateCredentials = 20,
    RegisterData = 21,
    SimpleTransferWithMemo = 22,
    EncryptedTransferWithMemo = 23,
    TransferWithScheduleWithMemo = 24,
}

export interface DeployModulePayload {
    /** Version of the wasm module which is 0 currently the only one supported */
    version: number;

    /** Wasm module to be deployed */
    content: Buffer;
}

export interface InitContractPayload {
    /** µGTU amount to transfer */
    amount: GtuAmount;

    /** Hash of the module on chain */
    moduleRef: ModuleReference;

    /** Name of the contract */
    contractName: string;

    /** Parameters for the init function */
    parameter: Buffer;

    /** The amount of energy that can be used for contract execution.
    The base energy amount for transaction verification will be added to this cost.*/
    maxContractExecutionEnergy: bigint;
}

export interface UpdateContractPayload {
    /** µGTU amount to transfer */
    amount: GtuAmount;

    /** Address of contract instance consisting of an index and a subindex */
    contractAddress: ContractAddress;

    /** Name of receive function including <contractName>. prefix */
    receiveName: string;

    /** Parameters for the update function */
    parameter: Buffer;

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
    /** µGTU amount to transfer */
    amount: GtuAmount;

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

export type AccountTransactionPayload =
    | SimpleTransferPayload
    | SimpleTransferWithMemoPayload
    | RegisterDataPayload
    | DeployModulePayload
    | InitContractPayload
    | UpdateContractPayload
    | UpdateCredentialsPayload;

export interface AccountTransaction {
    type: AccountTransactionType;
    header: AccountTransactionHeader;
    payload: AccountTransactionPayload;
}

export enum Type {
    Unit = 'Unit',
    Bool = 'Bool',
    U8 = 'U8',
    u16 = 'U16',
    U32 = 'U32',
    U64 = 'U64',
    U128 = 'U128',
    I8 = 'I8',
    I16 = 'I16',
    I32 = 'I32',
    I64 = 'I64',
    I128 = 'I128',
    Amount = 'Amount',
    AccountAddress = 'AccountAddress',
    ContractAddress = 'ContractAddress',
    Timestamp = 'Timestamp',
    Duration = 'Duration',
    Pair = 'Pair',
    List = 'List',
    Set = 'Set',
    Map = 'Map',
    Array = 'Array',
    Struct = 'Struct',
    Enum = 'Enum(List (String, Fields))',
    String = 'String(SizeLength)',
    ContractName = 'ContractName(SizeLength)',
    ReceiveName = 'ReceiveName(SizeLength)',
}

export interface InstanceInfo {
    amount: GtuAmount;
    sourceModule: ModuleReference;
    owner: AccountAddress;
    methods: string[];
    name: string;
    model: Buffer;
}

export type CredentialSignature = Record<number, string>;
export type AccountTransactionSignature = Record<number, CredentialSignature>;

export interface InstanceInfoSerialized {
    amount: string;
    sourceModule: string;
    owner: string;
    methods: string[];
    name: string;
    model: string;
}

export interface CredentialDeploymentTransaction {
    expiry: TransactionExpiry;
    unsignedCdi: UnsignedCredentialDeploymentInformation;
    randomness: CommitmentsRandomness;
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

export interface UnsignedCdiWithRandomness {
    unsignedCdi: UnsignedCredentialDeploymentInformation;
    randomness: CommitmentsRandomness;
}

export interface CredentialDeploymentInfo extends CredentialDeploymentValues {
    proofs: string;
}

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
