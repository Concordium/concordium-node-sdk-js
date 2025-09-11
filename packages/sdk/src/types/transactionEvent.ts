import type { Upward } from '../grpc/index.js';
import type * as PLT from '../plt/index.js';
import type {
    Address,
    BakerId,
    DelegatorId,
    EventDelegationTarget,
    HexString,
    ModuleRef,
    OpenStatusText,
    ReleaseSchedule,
} from '../types.js';
import type * as AccountAddress from './AccountAddress.js';
import type * as CcdAmount from './CcdAmount.js';
import type * as ContractAddress from './ContractAddress.js';
import type * as ContractEvent from './ContractEvent.js';
import type * as InitName from './InitName.js';
import type * as Parameter from './Parameter.js';
import type * as ReceiveName from './ReceiveName.js';
import type { UpdateInstructionPayload } from './chainUpdate.js';

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
    BakerDelegationRemoved = 'BakerDelegationRemoved',
    BakerSuspended = 'BakerSuspended',
    BakerResumed = 'BakerResumed',
    DelegationStakeIncreased = 'DelegationStakeIncreased',
    DelegationStakeDecreased = 'DelegationStakeDecreased',
    DelegationSetRestakeEarnings = 'DelegationSetRestakeEarnings',
    DelegationSetDelegationTarget = 'DelegationSetDelegationTarget',
    DelegationAdded = 'DelegationAdded',
    DelegationRemoved = 'DelegationRemoved',
    DelegationBakerRemoved = 'DelegationBakerRemoved',
    TransferMemo = 'TransferMemo',
    Transferred = 'Transferred',
    Interrupted = 'Interrupted',
    Resumed = 'Resumed',
    Updated = 'Updated',
    Upgraded = 'Upgraded',
    TokenModuleEvent = 'TokenModuleEvent',
    TokenTransfer = 'TokenTransfer',
    TokenMint = 'TokenMint',
    TokenBurn = 'TokenBurn',
}

export type TransactionEvent =
    | AccountTransferredEvent
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
    | UpdateEnqueuedEvent
    | DelegationEvent
    | BakerEvent
    | TokenEvent;

// Contract Events

export interface InterruptedEvent {
    tag: TransactionEventTag.Interrupted;
    address: ContractAddress.Type;
    events: ContractEvent.Type[];
}

export interface ResumedEvent {
    tag: TransactionEventTag.Resumed;
    address: ContractAddress.Type;
    success: boolean;
}

export interface UpdatedEvent {
    tag: TransactionEventTag.Updated;
    address: ContractAddress.Type;
    instigator: Address;
    amount: CcdAmount.Type;
    contractVersion: number;
    message: Parameter.Type;
    receiveName: ReceiveName.Type;
    events: ContractEvent.Type[];
}

export interface TransferredEvent {
    tag: TransactionEventTag.Transferred;
    amount: CcdAmount.Type;
    to: AccountAddress.Type;
    from: ContractAddress.Type;
}

export interface UpgradedEvent {
    tag: TransactionEventTag.Upgraded;
    address: ContractAddress.Type;
    from: ModuleRef;
    to: ModuleRef;
}

// Transaction Events

export interface DataRegisteredEvent {
    tag: TransactionEventTag.DataRegistered;
    data: HexString;
}

export interface ContractInitializedEvent {
    tag: TransactionEventTag.ContractInitialized;
    address: ContractAddress.Type;
    amount: CcdAmount.Type;
    initName: InitName.Type;
    events: HexString[];
    contractVersion: number;
    ref: ModuleRef;
}

export interface ModuleDeployedEvent {
    tag: TransactionEventTag.ModuleDeployed;
    contents: ModuleRef;
}

// Account and transfer Events

export interface AccountTransferredEvent {
    tag: TransactionEventTag.Transferred;
    amount: CcdAmount.Type;
    to: AccountAddress.Type;
}

export interface TransferredWithScheduleEvent {
    tag: TransactionEventTag.TransferredWithSchedule;
    to: AccountAddress.Type;
    amount: ReleaseSchedule[];
}

export interface MemoEvent {
    tag: TransactionEventTag.TransferMemo;
    memo: HexString;
}

export interface AccountCreatedEvent {
    tag: TransactionEventTag.AccountCreated;
    account: AccountAddress.Type;
}

export interface AmountAddedByDecryptionEvent {
    tag: TransactionEventTag.AmountAddedByDecryption;
    account: AccountAddress.Type;
    amount: CcdAmount.Type;
}

export interface EncryptedSelfAmountAddedEvent {
    tag: TransactionEventTag.EncryptedSelfAmountAdded;
    account: AccountAddress.Type;
    amount: CcdAmount.Type;
    newAmount: string;
}

export interface EncryptedAmountsRemovedEvent {
    tag: TransactionEventTag.EncryptedAmountsRemoved;
    account: AccountAddress.Type;
    inputAmount: HexString;
    newAmount: HexString;
    upToIndex: number;
}

export interface NewEncryptedAmountEvent {
    tag: TransactionEventTag.NewEncryptedAmount;
    account: AccountAddress.Type;
    newIndex: number;
    encryptedAmount: HexString;
}

export interface CredentialDeployedEvent {
    tag: TransactionEventTag.CredentialDeployed;
    regid: HexString;
    account: AccountAddress.Type;
}

export interface CredentialKeysUpdatedEvent {
    tag: TransactionEventTag.CredentialKeysUpdated;
    credId: HexString;
}

export interface CredentialsUpdatedEvent {
    tag: TransactionEventTag.CredentialsUpdated;
    account: AccountAddress.Type;
    newCredIds: HexString[];
    removedCredIds: HexString[];
    newThreshold: number;
}

// Delegation Events

export interface DelegatorEvent {
    tag: TransactionEventTag.DelegationAdded | TransactionEventTag.DelegationRemoved;
    delegatorId: DelegatorId;
    account: AccountAddress.Type;
}

export interface DelegationSetDelegationTargetEvent {
    tag: TransactionEventTag.DelegationSetDelegationTarget;
    delegatorId: DelegatorId;
    account: AccountAddress.Type;
    delegationTarget: EventDelegationTarget;
}

export interface DelegationSetRestakeEarningsEvent {
    tag: TransactionEventTag.DelegationSetRestakeEarnings;
    delegatorId: DelegatorId;
    account: AccountAddress.Type;
    restakeEarnings: boolean;
}

export interface DelegationStakeChangedEvent {
    tag: TransactionEventTag.DelegationStakeDecreased | TransactionEventTag.DelegationStakeIncreased;
    delegatorId: DelegatorId;
    account: AccountAddress.Type;
    newStake: CcdAmount.Type;
}

export interface DelegationBakerRemovedEvent {
    tag: TransactionEventTag.DelegationBakerRemoved;
    bakerId: BakerId;
}

// Baker Events

export interface BakerAddedEvent {
    tag: TransactionEventTag.BakerAdded;
    bakerId: BakerId;
    account: AccountAddress.Type;
    signKey: string;
    electionKey: string;
    aggregationKey: string;
    stake: CcdAmount.Type;
    restakeEarnings: boolean;
}

export interface BakerRemovedEvent {
    tag: TransactionEventTag.BakerRemoved;
    bakerId: BakerId;
    account: AccountAddress.Type;
}

export interface BakerStakeChangedEvent {
    tag: TransactionEventTag.BakerStakeIncreased | TransactionEventTag.BakerStakeDecreased;
    bakerId: BakerId;
    account: AccountAddress.Type;
    newStake: CcdAmount.Type;
}

export interface BakerSetRestakeEarningsEvent {
    tag: TransactionEventTag.BakerSetRestakeEarnings;
    bakerId: BakerId;
    account: AccountAddress.Type;
    restakeEarnings: boolean;
}

export interface BakerKeysUpdatedEvent {
    tag: TransactionEventTag.BakerKeysUpdated;
    bakerId: BakerId;
    account: AccountAddress.Type;
    signKey: HexString;
    electionKey: HexString;
    aggregationKey: HexString;
}

export interface BakerSetOpenStatusEvent {
    tag: TransactionEventTag.BakerSetOpenStatus;
    bakerId: BakerId;
    account: AccountAddress.Type;
    /**
     * The status of validator pool
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    openStatus: Upward<OpenStatusText>;
}

export interface BakerSetMetadataURLEvent {
    tag: TransactionEventTag.BakerSetMetadataURL;
    bakerId: BakerId;
    account: AccountAddress.Type;
    metadataURL: string;
}

export interface BakerSetFinalizationRewardCommissionEvent {
    tag: TransactionEventTag.BakerSetFinalizationRewardCommission;
    bakerId: BakerId;
    account: AccountAddress.Type;
    finalizationRewardCommission: number;
}

export interface BakerSetBakingRewardCommissionEvent {
    tag: TransactionEventTag.BakerSetBakingRewardCommission;
    bakerId: BakerId;
    account: AccountAddress.Type;
    bakingRewardCommission: number;
}

export interface BakerSetTransactionFeeCommissionEvent {
    tag: TransactionEventTag.BakerSetTransactionFeeCommission;
    bakerId: BakerId;
    account: AccountAddress.Type;
    transactionFeeCommission: number;
}

export interface BakerDelegationRemovedEvent {
    tag: TransactionEventTag.BakerDelegationRemoved;
    delegatorId: DelegatorId;
}

export interface BakerSuspendedEvent {
    tag: TransactionEventTag.BakerSuspended;
    bakerId: BakerId;
}

export interface BakerResumedEvent {
    tag: TransactionEventTag.BakerResumed;
    bakerId: BakerId;
}

export interface UpdateEnqueuedEvent {
    tag: TransactionEventTag.UpdateEnqueued;
    effectiveTime: number;
    /**
     * The payload of the enqueued update.
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    payload: Upward<UpdateInstructionPayload>;
}

/**
 * Token (PLT) event with CBOR encoded details.
 */
export type EncodedTokenModuleEvent = {
    /** The type of the event */
    tag: TransactionEventTag.TokenModuleEvent;
    /** The token ID of the token the event originates from */
    tokenId: PLT.TokenId.Type;
    /** The type of the event emitted by the token module. */
    type: string;
    /** Additional details about the event (CBOR encoded). */
    details: PLT.Cbor.Type;
};

/**
 * Token (PLT) transfer event.
 */
export type TokenTransferEvent = {
    /** The type of the event */
    tag: TransactionEventTag.TokenTransfer;
    /** The token ID of the token the event originates from */
    tokenId: PLT.TokenId.Type;
    /**
     * The token holder sending the tokens.
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    from: Upward<PLT.TokenHolder.Type>;
    /**
     * The token holder receiving the tokens.
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    to: Upward<PLT.TokenHolder.Type>;
    /** The amount of tokens transferred. */
    amount: PLT.TokenAmount.Type;
    /** An optional memo associated with the transfer. */
    memo?: PLT.CborMemo.Type;
};

/**
 * Token (PLT) mint event.
 */
export type TokenMintEvent = {
    /** The type of the event */
    tag: TransactionEventTag.TokenMint;
    /** The token ID of the token the event originates from */
    tokenId: PLT.TokenId.Type;
    /**
     * The token holder whose supply is updated.
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    target: Upward<PLT.TokenHolder.Type>;
    /** The amount by which the token supply is updated. */
    amount: PLT.TokenAmount.Type;
};

/**
 * Token (PLT) burn event.
 */
export type TokenBurnEvent = {
    /** The type of the event */
    tag: TransactionEventTag.TokenBurn;
    /** The token ID of the token the event originates from */
    tokenId: PLT.TokenId.Type;
    /**
     * The token holder whose supply is updated.
     *
     * **Please note**, this can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    target: Upward<PLT.TokenHolder.Type>;
    /** The amount by which the token supply is updated. */
    amount: PLT.TokenAmount.Type;
};

export type TokenEvent = EncodedTokenModuleEvent | TokenTransferEvent | TokenMintEvent | TokenBurnEvent;
export type ContractTraceEvent = ResumedEvent | InterruptedEvent | UpdatedEvent | UpgradedEvent | TransferredEvent;
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
    | BakerKeysUpdatedEvent
    | BakerDelegationRemovedEvent
    | BakerSuspendedEvent
    | BakerResumedEvent;
export type DelegationEvent =
    | DelegatorEvent
    | DelegationSetDelegationTargetEvent
    | DelegationSetRestakeEarningsEvent
    | DelegationStakeChangedEvent
    | DelegationBakerRemovedEvent;
