import { AccountAddress } from './types/accountAddress';
import { GtuAmount } from './types/gtuAmount';
import { DataBlob } from './types/DataBlob';
import { TransactionExpiry } from './types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from './types/moduleReference';

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

export interface ExchangeRate {
    numerator: bigint;
    denominator: bigint;
}

export interface TransactionFeeDistribution {
    baker: RewardFraction;
    gasAccount: RewardFraction;
}

export interface MintDistribution {
    mintPerSlot: number;
    bakingReward: RewardFraction;
    finalizationReward: RewardFraction;
}

export interface GasRewards {
    baker: RewardFraction;
    finalizationProof: RewardFraction;
    accountCreation: RewardFraction;
    chainUpdate: RewardFraction;
}

export interface RewardParameters {
    transactionFeeDistribution: TransactionFeeDistribution;
    mintDistribution: MintDistribution;
    gASRewards: GasRewards;
}

export interface ChainParameters {
    electionDifficulty: number;
    euroPerEnergy: ExchangeRate;
    microGTUPerEuro: ExchangeRate;
    accountCreationLimit: number;
    bakerCooldownEpochs: bigint;
    minimumThresholdForBaking: bigint;
    rewardParameters: RewardParameters;
    foundationAccountIndex: bigint;
}

export interface Authorization {
    threshold: number;
    authorizedKeys: number[];
}

export interface Authorizations {
    emergency: Authorization;
    microGTUPerEuro: Authorization;
    euroPerEnergy: Authorization;
    transactionFeeDistribution: Authorization;
    foundationAccount: Authorization;
    mintDistribution: Authorization;
    protocol: Authorization;
    paramGASRewards: Authorization;
    bakerStakeThreshold: Authorization;
    electionDifficulty: Authorization;
    addAnonymityRevoker: Authorization;
    addIdentityProvider: Authorization;
    keys: VerifyKey[];
}

export interface KeysWithThreshold {
    keys: VerifyKey[];
    threshold: number;
}

export interface Keys {
    rootKeys: KeysWithThreshold;
    level1Keys: KeysWithThreshold;
    level2Keys: Authorizations;
}

export interface UpdateQueueQueue {
    effectiveTime: Date;
    // TODO Update the type of update to a generic update transaction when
    // update types have been added.
    // Information about the actual update.
    update: unknown;
}

export interface UpdateQueue {
    nextSequenceNumber: bigint;
    queue: UpdateQueueQueue;
}

interface UpdateQueues {
    microGTUPerEuro: UpdateQueue;
    euroPerEnergy: UpdateQueue;
    transactionFeeDistribution: UpdateQueue;
    foundationAccount: UpdateQueue;
    electionDifficulty: UpdateQueue;
    mintDistribution: UpdateQueue;
    protocol: UpdateQueue;
    gasRewards: UpdateQueue;
    bakerStakeThreshold: UpdateQueue;
    addAnonymityRevoker: UpdateQueue;
    addIdentityProvider: UpdateQueue;
    rootKeys: UpdateQueue;
    level1Keys: UpdateQueue;
    level2Keys: UpdateQueue;
}

export interface Updates {
    chainParameters: ChainParameters;
    keys: Keys;
    updateQueues: UpdateQueues;
}

export interface BlockSummary {
    finalizationData: FinalizationData;
    transactionSummaries: TransactionSummary[];
    updates: Updates;
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
    currentEraGenesisBlock: string;
    lastFinalizedBlock: string;

    epochDuration: bigint;
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

export interface BakerReduceStakePendingChange {
    change: 'ReduceStake';
    newStake: bigint;
    epoch: bigint;
}

export interface BakerRemovalPendingChange {
    change: 'RemoveBaker';
    epoch: bigint;
}

export type BakerPendingChange =
    | BakerReduceStakePendingChange
    | BakerRemovalPendingChange;

export interface AccountBakerDetails {
    restakeEarnings: boolean;
    bakerId: bigint;
    bakerAggregationVerifyKey: string;
    bakerElectionVerifyKey: string;
    bakerSignatureVerifyKey: string;
    stakedAmount: bigint;
    pendingChange?: BakerPendingChange;
}

export interface AccountInfo {
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

    accountBaker?: AccountBakerDetails;
}

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
