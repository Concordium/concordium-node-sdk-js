import type {
    OpenStatusText,
    ContractAddress,
    ReleaseSchedule,
    ContractVersion,
    Address,
    Base58String,
    HexString,
    EventDelegationTarget,
} from '../types';
import type { UpdateInstructionPayload } from './chainUpdate';
import { ModuleReference } from './moduleReference';

export enum TransactionEventTag {
    ModuleDeployed = 'ModuleDeployed',
    ContractInitialized = 'ContractInitialized',
    AccountCreated = 'AccountCreated',
    CredentialDeployed = 'CredentialDeployed',
    BakerAdded = 'BakerAdded',
    BakerRemoved = 'BakerRemoved',
    BakerStakeIncreased = 'BakerStakeIncreased',
    BakerStakeDecreased = 'BakerStakeDecreased',
    BakerSetRestakeEarnings = 'BakerSetRestakeEarnings',
    BakerKeysUpdated = 'BakerKeysUpdated',
    CredentialKeysUpdated = 'CredentialKeysUpdated',
    NewEncryptedAmount = 'NewEncryptedAmount',
    EncryptedAmountsRemoved = 'EncryptedAmountsRemoved',
    AmountAddedByDecryption = 'AmountAddedByDecryption',
    EncryptedSelfAmountAdded = 'EncryptedSelfAmountAdded',
    UpdateEnqueued = 'UpdateEnqueued',
    TransferredWithSchedule = 'TransferredWithSchedule',
    CredentialsUpdated = 'CredentialsUpdated',
    DataRegistered = 'DataRegistered',
    BakerSetOpenStatus = 'BakerSetOpenStatus',
    BakerSetMetadataURL = 'BakerSetMetadataURL',
    BakerSetTransactionFeeCommission = 'BakerSetTransactionFeeCommission',
    BakerSetBakingRewardCommission = 'BakerSetBakingRewardCommission',
    BakerSetFinalizationRewardCommission = 'BakerSetFinalizationRewardCommission',
    DelegationStakeIncreased = 'DelegationStakeIncreased',
    DelegationStakeDecreased = 'DelegationStakeDecreased',
    DelegationSetRestakeEarnings = 'DelegationSetRestakeEarnings',
    DelegationSetDelegationTarget = 'DelegationSetDelegationTarget',
    DelegationAdded = 'DelegationAdded',
    DelegationRemoved = 'DelegationRemoved',
    TransferMemo = 'TransferMemo',
    Transferred = 'Transferred',
    Interrupted = 'Interrupted',
    Resumed = 'Resumed',
    Updated = 'Updated',
    Upgraded = 'Upgraded',
}

export type TransactionEvent =
    | TransferredEvent
    | UpdatedEvent
    | ResumedEvent
    | InterruptedEvent
    | UpgradedEvent
    | MemoEvent
    | TransferredWithScheduleEvent
    | AccountCreatedEvent
    | AmountAddedByDecryptionEvent
    | EncryptedSelfAmountAddedEvent
    | NewEncryptedAmountEvent
    | EncryptedAmountsRemovedEvent
    | DataRegisteredEvent
    | ContractInitializedEvent
    | ModuleDeployedEvent
    | CredentialDeployedEvent
    | CredentialKeysUpdatedEvent
    | CredentialsUpdatedEvent
    | DelegatorEvent
    | DelegationSetDelegationTargetEvent
    | DelegationSetRestakeEarningsEvent
    | DelegationStakeChangedEvent
    | BakerAddedEvent
    | BakerRemovedEvent
    | BakerStakeChangedEvent
    | BakerSetRestakeEarningsEvent
    | BakerKeysUpdatedEvent
    | BakerSetOpenStatusEvent
    | BakerSetMetadataURLEvent
    | BakerSetFinalizationRewardCommissionEvent
    | BakerSetBakingRewardCommissionEvent
    | BakerSetTransactionFeeCommissionEvent
    | UpdateEnqueuedEvent;

// Contract Events

export interface InterruptedEvent {
    tag: TransactionEventTag.Interrupted;
    address: ContractAddress;
    events: HexString[];
}

export interface ResumedEvent {
    tag: TransactionEventTag.Resumed;
    address: ContractAddress;
    success: boolean;
}

export interface UpdatedEvent {
    tag: TransactionEventTag.Updated;
    address: ContractAddress;
    instigator: Address;
    amount: bigint;
    contractVersion: ContractVersion;
    message: HexString;
    receiveName: string;
    events: HexString[];
}

export interface UpgradedEvent {
    tag: TransactionEventTag.Upgraded;
    address: ContractAddress;
    from: ModuleReference;
    to: ModuleReference;
}

export interface DataRegisteredEvent {
    tag: TransactionEventTag.DataRegistered;
    data: HexString;
}

export interface ContractInitializedEvent {
    tag: TransactionEventTag.ContractInitialized;
    address: ContractAddress;
    amount: bigint;
    contractName: string;
    events: HexString[];
    contractVersion?: ContractVersion;
    originRef?: ModuleReference;
}

export interface ModuleDeployedEvent {
    tag: TransactionEventTag.ModuleDeployed;
    contents: ModuleReference;
}

// Account and transfer Events

export interface AccountTransferredEvent {
    tag: TransactionEventTag.Transferred;
    amount: bigint;
    to: Base58String;
}

export interface TransferredEvent {
    tag: TransactionEventTag.Transferred;
    amount: bigint;
    to: Address;
    from?: Address;
}

export interface TransferredWithScheduleEvent {
    tag: TransactionEventTag.TransferredWithSchedule;
    to: Base58String;
    from?: Base58String;
    amount: ReleaseSchedule[];
}

export interface MemoEvent {
    tag: TransactionEventTag.TransferMemo;
    memo: HexString;
}

export interface AccountCreatedEvent {
    tag: TransactionEventTag.AccountCreated;
    account: Base58String;
}

export interface AmountAddedByDecryptionEvent {
    tag: TransactionEventTag.AmountAddedByDecryption;
    account?: Base58String;
    amount: bigint;
}

export interface EncryptedSelfAmountAddedEvent {
    tag: TransactionEventTag.EncryptedSelfAmountAdded;
    account: Base58String;
    amount: bigint;
    newAmount: string;
}

export interface EncryptedAmountsRemovedEvent {
    tag: TransactionEventTag.EncryptedAmountsRemoved;
    account?: Base58String;
    inputAmount: HexString;
    newAmount: HexString;
    upToindex: number;
}

export interface NewEncryptedAmountEvent {
    tag: TransactionEventTag.NewEncryptedAmount;
    account: Base58String;
    newIndex: number;
    encryptedAmount: HexString;
}

export interface CredentialDeployedEvent {
    tag: TransactionEventTag.CredentialDeployed;
    regid: HexString;
    account: Base58String;
}

export interface CredentialKeysUpdatedEvent {
    tag: TransactionEventTag.CredentialKeysUpdated;
    credId: HexString;
}

export interface CredentialsUpdatedEvent {
    tag: TransactionEventTag.CredentialsUpdated;
    account?: Base58String;
    newCredIds: HexString[];
    removedCredIDs: HexString[];
    newThreshold: number;
}

// Delegation Events

export interface DelegatorEvent {
    tag:
        | TransactionEventTag.DelegationAdded
        | TransactionEventTag.DelegationRemoved;
    delegatorId: number;
    account?: Base58String;
}

export interface DelegationSetDelegationTargetEvent {
    tag: TransactionEventTag.DelegationSetDelegationTarget;
    delegatorId: number;
    account?: Base58String;
    delegationTarget: EventDelegationTarget;
}

export interface DelegationSetRestakeEarningsEvent {
    tag: TransactionEventTag.DelegationSetRestakeEarnings;
    delegatorId: number;
    account?: Base58String;
    restakeEarnings: boolean;
}

export interface DelegationStakeChangedEvent {
    tag:
        | TransactionEventTag.DelegationStakeDecreased
        | TransactionEventTag.DelegationStakeIncreased;
    delegatorId: number;
    account?: Base58String;
    newStake: bigint;
}

// Baker Events

export interface BakerAddedEvent {
    tag: TransactionEventTag.BakerAdded;
    bakerId: number;
    account: string;
    signKey: string;
    electionKey: string;
    aggregationKey: string;
    stake: bigint;
    restakeEarnings: boolean;
}

export interface BakerRemovedEvent {
    tag: TransactionEventTag.BakerRemoved;
    bakerId: number;
    account: Base58String;
}

export interface BakerStakeChangedEvent {
    tag:
        | TransactionEventTag.BakerStakeIncreased
        | TransactionEventTag.BakerStakeDecreased;
    bakerId: number;
    account: Base58String;
    newStake: bigint;
}

export interface BakerSetRestakeEarningsEvent {
    tag: TransactionEventTag.BakerSetRestakeEarnings;
    bakerId: number;
    account: Base58String;
    restakeEarnings: boolean;
}

export interface BakerKeysUpdatedEvent {
    tag: TransactionEventTag.BakerKeysUpdated;
    bakerId: number;
    account: Base58String;
    signKey: HexString;
    electionKey: HexString;
    aggregationKey: HexString;
}

export interface BakerSetOpenStatusEvent {
    tag: TransactionEventTag.BakerSetOpenStatus;
    bakerId: number;
    account: Base58String;
    openStatus: OpenStatusText;
}

export interface BakerSetMetadataURLEvent {
    tag: TransactionEventTag.BakerSetMetadataURL;
    bakerId: number;
    account: Base58String;
    metadataURL: string;
}

export interface BakerSetFinalizationRewardCommissionEvent {
    tag: TransactionEventTag.BakerSetFinalizationRewardCommission;
    bakerId: number;
    account: Base58String;
    finalizationRewardCommission: number;
}

export interface BakerSetBakingRewardCommissionEvent {
    tag: TransactionEventTag.BakerSetBakingRewardCommission;
    bakerId: number;
    account?: Base58String;
    bakingRewardCommission: number;
}

export interface BakerSetTransactionFeeCommissionEvent {
    tag: TransactionEventTag.BakerSetTransactionFeeCommission;
    bakerId: number;
    account: Base58String;
    transactionFeeCommission: number;
}

export interface UpdateEnqueuedEvent {
    tag: TransactionEventTag.UpdateEnqueued;
    effectiveTime: number;
    payload: UpdateInstructionPayload;
}

export type ContractTraceEvent =
    | ResumedEvent
    | InterruptedEvent
    | UpdatedEvent
    | UpgradedEvent
    | TransferredEvent;
export type BakerEvent =
    | BakerSetTransactionFeeCommissionEvent
    | BakerSetBakingRewardCommissionEvent
    | BakerSetFinalizationRewardCommissionEvent
    | BakerSetMetadataURLEvent
    | BakerSetOpenStatusEvent
    | BakerSetRestakeEarningsEvent
    | BakerStakeChangedEvent
    | BakerAddedEvent
    | BakerRemovedEvent
    | BakerKeysUpdatedEvent;
export type DelegationEvent =
    | DelegatorEvent
    | DelegationSetDelegationTargetEvent
    | DelegationSetRestakeEarningsEvent
    | DelegationStakeChangedEvent;
