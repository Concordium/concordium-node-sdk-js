import {
    AccountTransferredEvent,
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
    Failed = 'failed',
}

export interface TransferSummary {
    transactionType: TransactionKindString.Transfer;
    transfer: AccountTransferredEvent;
}

export interface TransferWithMemoSummary {
    transactionType: TransactionKindString.TransferWithMemo;
    transfer: AccountTransferredEvent;
    memo: MemoEvent;
}

export interface TransferWithScheduleSummary {
    transactionType: TransactionKindString.TransferWithSchedule;
    event: TransferredWithScheduleEvent;
}

export interface TransferWithScheduleAndMemoSummary {
    transactionType: TransactionKindString.TransferWithScheduleAndMemo;
    transfer: TransferredWithScheduleEvent;
    memo: MemoEvent;
}

export interface EncryptedAmountTransferSummary {
    transactionType: TransactionKindString.EncryptedAmountTransfer;
    removed: EncryptedAmountsRemovedEvent;
    added: NewEncryptedAmountEvent;
}

export interface EncryptedAmountTransferWithMemoSummary {
    transactionType: TransactionKindString.EncryptedAmountTransferWithMemo;
    removed: EncryptedAmountsRemovedEvent;
    added: NewEncryptedAmountEvent;
    memo: MemoEvent;
}

export interface ModuleDeployedSummary {
    transactionType: TransactionKindString.DeployModule;
    moduleDeployed: ModuleDeployedEvent;
}

export interface InitContractSummary {
    transactionType: TransactionKindString.InitContract;
    contractInitialized: ContractInitializedEvent;
}

export interface UpdateContractSummary {
    transactionType: TransactionKindString.Update;
    events: ContractTraceEvent[];
}

export interface DataRegisteredSummary {
    transactionType: TransactionKindString.RegisterData;
    dataRegistered: DataRegisteredEvent;
}

export interface TransferToPublicSummary {
    transactionType: TransactionKindString.TransferToPublic;
    removed: EncryptedAmountsRemovedEvent;
    added: AmountAddedByDecryptionEvent;
}

export interface TransferToEncryptedSummary {
    transactionType: TransactionKindString.TransferToEncrypted;
    added: EncryptedSelfAmountAddedEvent;
}

export interface AddBakerSummary {
    transactionType: TransactionKindString.AddBaker;
    bakerAdded: BakerAddedEvent;
}

export interface RemoveBakerSummary {
    transactionType: TransactionKindString.RemoveBaker;
    bakerRemoved: BakerRemovedEvent;
}

export interface UpdateBakerKeysSummary {
    transactionType: TransactionKindString.UpdateBakerKeys;
    bakerKeysUpdated: BakerKeysUpdatedEvent;
}

export interface UpdateBakerStakeSummary {
    transactionType: TransactionKindString.UpdateBakerStake;
    bakerStakeChanged: BakerStakeChangedEvent;
}

export interface UpdateBakerRestakeEarningsSummary {
    transactionType: TransactionKindString.UpdateBakerRestakeEarnings;
    bakerRestakeEarningsUpdated: BakerSetRestakeEarningsEvent;
}

export interface ConfigureBakerSummary {
    transactionType: TransactionKindString.ConfigureBaker;
    events: BakerEvent[];
}

export interface ConfigureDelegationSummary {
    transactionType: TransactionKindString.ConfigureDelegation;
    events: DelegationEvent[];
}

export interface UpdateCredentialKeysSummary {
    transactionType: TransactionKindString.UpdateCredentialKeys;
    keysUpdated: CredentialKeysUpdatedEvent;
}

export interface UpdateCredentialsSummary {
    transactionType: TransactionKindString.UpdateCredentials;
    credentialsUpdated: CredentialsUpdatedEvent;
}
export interface FailedTransactionSummary {
    transactionType: TransactionKindString.Failed;
    failedTransactionType?: TransactionKindString;
    rejectReason: RejectReason;
}

export type AccountTransactionSummary = BaseAccountTransactionSummary &
    (
        | TransferSummary
        | TransferWithMemoSummary
        | TransferWithScheduleSummary
        | TransferWithScheduleAndMemoSummary
        | EncryptedAmountTransferSummary
        | EncryptedAmountTransferWithMemoSummary
        | DataRegisteredSummary
        | TransferToPublicSummary
        | TransferToEncryptedSummary
        | ModuleDeployedSummary
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
        | UpdateCredentialsSummary
    );

export interface AccountCreationSummary extends BaseBlockItemSummary {
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
