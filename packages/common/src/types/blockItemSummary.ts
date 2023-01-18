import {
    AmountAddedByDecryptionEvent,
    BakerAddedEvent,
    BakerEvent,
    BakerKeysUpdatedEvent,
    BakerRemovedEvent,
    BakerSetRestakeEarningsEvent,
    BakerStakeChangedEvent,
    ContractInitializedEvent,
    ContractTraceEvent,
    CredentialKeysUpdatedEvent,
    CredentialsUpdatedEvent,
    DataRegisteredEvent,
    DelegationEvent,
    EncryptedAmountsRemovedEvent,
    EncryptedSelfAmountAddedEvent,
    MemoEvent,
    ModuleDeployedEvent,
    NewEncryptedAmountEvent,
    TransferredEvent,
    TransferredWithScheduleEvent,
} from './transactionEvent';
import { UpdateInstructionPayload } from './chainUpdate';
import {
    HexString,
    TransactionSummaryType,
    TransactionStatusEnum,
} from '../types';
import { RejectReason } from './rejectReason';

export interface BaseBlockItemSummary {
    index: bigint;
    energyCost: bigint;
    hash: HexString;
}

export interface BaseAccountTransactionSummary extends BaseBlockItemSummary {
    type: TransactionSummaryType.AccountTransaction;
    cost: bigint;
    sender: string;
}

export enum TransactionKindString {
    DeployModule = 'deployModule',
    InitContract = 'initContract',
    Update = 'update',
    Transfer = 'transfer',
    AddBaker = 'addBaker',
    RemoveBaker = 'removeBaker',
    UpdateBakerStake = 'updateBakerStake',
    UpdateBakerRestakeEarnings = 'updateBakerRestakeEarnings',
    UpdateBakerKeys = 'updateBakerKeys',
    UpdateCredentialKeys = 'updateCredentialKeys',
    BakingReward = 'bakingReward',
    BlockReward = 'blockReward',
    FinalizationReward = 'finalizationReward',
    EncryptedAmountTransfer = 'encryptedAmountTransfer',
    TransferToEncrypted = 'transferToEncrypted',
    TransferToPublic = 'transferToPublic',
    TransferWithSchedule = 'transferWithSchedule',
    UpdateCredentials = 'updateCredentials',
    RegisterData = 'registerData',
    TransferWithMemo = 'transferWithMemo',
    EncryptedAmountTransferWithMemo = 'encryptedAmountTransferWithMemo',
    TransferWithScheduleAndMemo = 'transferWithScheduleAndMemo',
    ConfigureBaker = 'configureBaker',
    ConfigureDelegation = 'configureDelegation',
    StakingReward = 'paydayAccountReward',
}

export interface TransferSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.Transfer;
    events: [TransferredEvent];
}

export interface TransferWithMemoSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.TransferWithMemo;
    events: [TransferredEvent, MemoEvent];
}

export interface TransferWithScheduleSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.TransferWithSchedule;
    events: [TransferredWithScheduleEvent];
}

export interface TransferWithScheduleAndMemoSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.TransferWithScheduleAndMemo;
    events: [TransferredWithScheduleEvent, MemoEvent];
}

export interface EncryptedAmountTransferSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.EncryptedAmountTransfer;
    events: [EncryptedAmountsRemovedEvent, NewEncryptedAmountEvent];
}

export interface EncryptedAmountTransferWithMemoSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.EncryptedAmountTransferWithMemo;
    events: [EncryptedAmountsRemovedEvent, NewEncryptedAmountEvent, MemoEvent];
}

export interface ModueDeployedSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.DeployModule;
    events: [ModuleDeployedEvent];
}

export interface InitContractSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.InitContract;
    events: [ContractInitializedEvent];
}

export interface UpdateContractSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.Update;
    events: ContractTraceEvent[];
}

export interface DataRegisteredSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.RegisterData;
    events: [DataRegisteredEvent];
}

export interface TransferToPublicSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.TransferToPublic;
    events: [EncryptedAmountsRemovedEvent, AmountAddedByDecryptionEvent];
}

export interface TransferToEncryptedSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.TransferToEncrypted;
    events: [EncryptedSelfAmountAddedEvent];
}

export interface AddBakerSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.AddBaker;
    events: [BakerAddedEvent];
}

export interface RemoveBakerSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.RemoveBaker;
    events: [BakerRemovedEvent];
}

export interface UpdateBakerKeysSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.UpdateBakerKeys;
    events: [BakerKeysUpdatedEvent];
}

export interface UpdateBakerStakeSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.UpdateBakerStake;
    events: [BakerStakeChangedEvent];
}

export interface UpdateBakerRestakeEarningsSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.UpdateBakerRestakeEarnings;
    events: [BakerSetRestakeEarningsEvent];
}

export interface ConfigureBakerSummary extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.ConfigureBaker;
    events: BakerEvent[];
}

export interface ConfigureDelegationSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.ConfigureDelegation;
    events: DelegationEvent[];
}

export interface UpdateCredentialKeysSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.UpdateCredentialKeys;
    events: [CredentialKeysUpdatedEvent];
}

export interface UpdateCredentialsSummary
    extends BaseAccountTransactionSummary {
    transactionType: TransactionKindString.UpdateCredentials;
    events: [CredentialsUpdatedEvent];
}
export interface FailedTransactionSummary
    extends BaseAccountTransactionSummary {
    failedTransactionType: TransactionKindString;
    rejectReason: RejectReason;
}

export type AccountTransactionSummary =
    | TransferSummary
    | TransferWithMemoSummary
    | TransferWithScheduleSummary
    | TransferWithScheduleAndMemoSummary
    | EncryptedAmountTransferSummary
    | EncryptedAmountTransferWithMemoSummary
    | DataRegisteredSummary
    | TransferToPublicSummary
    | TransferToEncryptedSummary
    | ModueDeployedSummary
    | InitContractSummary
    | UpdateContractSummary
    | FailedTransactionSummary
    | AddBakerSummary
    | RemoveBakerSummary
    | UpdateBakerKeysSummary
    | UpdateBakerStakeSummary
    | UpdateBakerRestakeEarningsSummary
    | ConfigureBakerSummary
    | ConfigureDelegationSummary
    | UpdateCredentialKeysSummary
    | UpdateCredentialsSummary;

export interface AccountCreationSummary {
    type: TransactionSummaryType.AccountCreation;
    credentialType: 'initial' | 'normal';
    address: string;
    regId: string;
}

export interface UpdateSummary extends BaseBlockItemSummary {
    type: TransactionSummaryType.UpdateTransaction;
    effectiveTime: bigint;
    payload: UpdateInstructionPayload;
}

export type BlockItemSummary =
    | AccountTransactionSummary
    | AccountCreationSummary
    | UpdateSummary;

export interface BlockItemSummaryInBlock {
    blockHash: string;
    summary: BlockItemSummary;
}

export interface PendingBlockItem {
    status: TransactionStatusEnum.Received;
}

export interface CommittedBlockItem {
    status: TransactionStatusEnum.Committed;
    outcomes: BlockItemSummaryInBlock[];
}

export interface FinalizedBlockItem {
    status: TransactionStatusEnum.Finalized;
    outcome: BlockItemSummaryInBlock;
}

export type BlockItemStatus =
    | CommittedBlockItem
    | FinalizedBlockItem
    | PendingBlockItem;
