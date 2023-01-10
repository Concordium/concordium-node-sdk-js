import type {
    ContractAddress,
    AddressAccount,
    ReleaseSchedule,
} from '../types';
import type { UpdateInstructionPayload } from './chainUpdate';

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
}

export type TransactionEvent =
    | TransferredEvent
    | UpdatedEvent
    | ResumedEvent
    | InterruptedEvent
    | MemoEvent
    | TransferredWithScheduleEvent
    | AmountEvent
    | AccountCreatedEvent
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
    events: string[];
}

export interface ResumedEvent {
    tag: TransactionEventTag.Resumed;
    address: ContractAddress;
    success: boolean;
}

export interface UpdatedEvent {
    tag: TransactionEventTag.Updated;
    address: ContractAddress;
    instigator: AddressAccount;
    amount: bigint;
    message: string;
    receiveName: string;
    events: string[];
}

export interface DataRegisteredEvent {
    tag: TransactionEventTag.DataRegistered;
    data: string;
}

export interface ContractInitializedEvent {
    tag: TransactionEventTag.ContractInitialized;
    address: ContractAddress;
    amount: bigint;
    contractName: string;
    events: string[];
}

export interface ModuleDeployedEvent {
    tag: TransactionEventTag.ModuleDeployed;
    contents: string;
}

// Account and transfer Events

export interface TransferredEvent {
    tag: TransactionEventTag.Transferred;
    amount: bigint;
    to: AddressAccount;
    from: AddressAccount;
}

export interface TransferredWithScheduleEvent {
    tag: TransactionEventTag.TransferredWithSchedule;
    to: AddressAccount;
    from: AddressAccount;
    amount: ReleaseSchedule[];
}

export interface MemoEvent {
    tag: TransactionEventTag.TransferMemo;
    memo: string;
}

export interface AmountEvent {
    tag:
        | TransactionEventTag.AmountAddedByDecryption
        | TransactionEventTag.EncryptedSelfAmountAdded;
    account: string;
    amount: bigint;
}

export interface AccountCreatedEvent {
    tag: TransactionEventTag.AccountCreated;
    account: string;
}

export interface EncryptedAmountsRemovedEvent {
    tag: TransactionEventTag.EncryptedAmountsRemoved;
    account: string;
    inputAmount: string;
    newAmount: string;
    upToindex: number;
}

export interface NewEncryptedAmountEvent {
    tag: TransactionEventTag.NewEncryptedAmount;
    account: string;
    newIndex: number;
    encryptedAmount: string;
}

export interface CredentialDeployedEvent {
    tag: TransactionEventTag.CredentialDeployed;
    regid: string;
    account: string;
}

export interface CredentialKeysUpdatedEvent {
    tag: TransactionEventTag.CredentialKeysUpdated;
    credId: string;
}

export interface CredentialsUpdatedEvent {
    tag: TransactionEventTag.CredentialsUpdated;
    account: string;
    newCredIds: string[];
    removedCredIDs: string[];
    newThreshold: number;
}

// Delegation Events

export interface DelegatorEvent {
    tag:
        | TransactionEventTag.DelegationAdded
        | TransactionEventTag.DelegationRemoved;
    delegatorId: number;
    account: string;
}

export interface DelegationSetDelegationTargetEvent {
    tag: TransactionEventTag.DelegationSetDelegationTarget;
    delegatorId: number;
    account: string;
    delegationTarget: number;
}

export interface DelegationSetRestakeEarningsEvent {
    tag: TransactionEventTag.DelegationSetRestakeEarnings;
    delegatorId: number;
    account: string;
    restakeEarnings: boolean;
}

export interface DelegationStakeChangedEvent {
    tag:
        | TransactionEventTag.DelegationStakeDecreased
        | TransactionEventTag.DelegationStakeIncreased;
    delegatorId: number;
    account: string;
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
    account: string;
}

export interface BakerStakeChangedEvent {
    tag:
        | TransactionEventTag.BakerStakeIncreased
        | TransactionEventTag.BakerStakeDecreased;
    bakerId: number;
    account: string;
    newStake: bigint;
}

export interface BakerSetRestakeEarningsEvent {
    tag: TransactionEventTag.BakerSetRestakeEarnings;
    bakerId: number;
    account: string;
    restakeEarnings: boolean;
}

export interface BakerKeysUpdatedEvent {
    tag: TransactionEventTag.BakerKeysUpdated;
    bakerId: number;
    account: string;
    signKey: string;
    electionKey: string;
    aggregationKey: string;
}

export interface BakerSetOpenStatusEvent {
    tag: TransactionEventTag.BakerSetOpenStatus;
    bakerId: number;
    account: string;
    openStatus: string;
}

export interface BakerSetMetadataURLEvent {
    tag: TransactionEventTag.BakerSetMetadataURL;
    bakerId: number;
    account: string;
    metadataURL: string;
}

export interface BakerSetFinalizationRewardCommissionEvent {
    tag: TransactionEventTag.BakerSetFinalizationRewardCommission;
    bakerId: number;
    account: string;
    finalizationRewardCommission: string;
}

export interface BakerSetBakingRewardCommissionEvent {
    tag: TransactionEventTag.BakerSetBakingRewardCommission;
    bakerId: number;
    account: string;
    bakingRewardCommission: string;
}

export interface BakerSetTransactionFeeCommissionEvent {
    tag: TransactionEventTag.BakerSetTransactionFeeCommission;
    bakerId: number;
    account: string;
    transactionFeeCommission: string;
}

export interface UpdateEnqueuedEvent {
    tag: TransactionEventTag.UpdateEnqueued;
    effectiveTime: string;
    payload: UpdateInstructionPayload;
}
