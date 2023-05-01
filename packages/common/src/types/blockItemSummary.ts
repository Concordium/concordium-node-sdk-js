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
    TransactionEventTag,
    TransferredWithScheduleEvent,
} from './transactionEvent';
import { UpdateInstructionPayload } from './chainUpdate';
import {
    HexString,
    TransactionSummaryType,
    TransactionStatusEnum,
    ContractAddress,
    Base58String,
} from '../types';
import { RejectReason } from './rejectReason';
import { isDefined } from '../serializationHelpers';

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

export const isInitContractSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary & InitContractSummary =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    summary.transactionType === TransactionKindString.InitContract;

export const isUpdateContractSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary & UpdateContractSummary =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    summary.transactionType === TransactionKindString.Update;

export const isTransferLikeSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary &
    (TransferSummary | TransferWithMemoSummary) =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    (summary.transactionType === TransactionKindString.Transfer ||
        summary.transactionType === TransactionKindString.TransferWithMemo);

export const isTransferWithScheduleLikeSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary &
    (TransferWithScheduleSummary | TransferWithScheduleAndMemoSummary) =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    (summary.transactionType === TransactionKindString.TransferWithSchedule ||
        summary.transactionType ===
            TransactionKindString.TransferWithScheduleAndMemo);

export const isSuccessTransaction = (summary: BlockItemSummary): boolean => {
    if (summary.type !== TransactionSummaryType.AccountTransaction) {
        return true;
    }

    return summary.transactionType !== TransactionKindString.Failed;
};

export function getTransactionRejectReason(
    summary: AccountCreationSummary | UpdateSummary
): undefined;
export function getTransactionRejectReason(
    summary: BlockItemSummary
): RejectReason | undefined;
export function getTransactionRejectReason(
    summary: BlockItemSummary
): RejectReason | undefined {
    if (!isRejectTransaction(summary)) {
        return undefined;
    }

    return summary.rejectReason;
}

export const isRejectTransaction = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary & FailedTransactionSummary =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    summary.transactionType === TransactionKindString.Failed;

const isEqualContract =
    (a: ContractAddress) =>
    (b: ContractAddress): boolean =>
        a.index === b.index && a.subindex === b.subindex;

export function affectedContracts(
    summary: AccountCreationSummary | UpdateSummary
): never[];
export function affectedContracts(summary: BlockItemSummary): ContractAddress[];
export function affectedContracts(
    summary: BlockItemSummary
): ContractAddress[] {
    if (summary.type !== TransactionSummaryType.AccountTransaction) {
        return [];
    }

    switch (summary.transactionType) {
        case TransactionKindString.InitContract: {
            return [summary.contractInitialized.address];
        }
        case TransactionKindString.Update: {
            return summary.events.reduce(
                (addresses: ContractAddress[], event) => {
                    if (
                        event.tag !== TransactionEventTag.Updated ||
                        addresses.some(isEqualContract(event.address))
                    ) {
                        return addresses;
                    }

                    return [...addresses, event.address];
                },
                []
            );
        }
        default: {
            return [];
        }
    }
}

export function getReceiverAccount(
    summary: AccountCreationSummary | UpdateSummary
): undefined;
export function getReceiverAccount(
    summary: BlockItemSummary
): Base58String | undefined;
export function getReceiverAccount(
    summary: BlockItemSummary
): Base58String | undefined {
    if (summary.type !== TransactionSummaryType.AccountTransaction) {
        return undefined;
    }

    switch (summary.transactionType) {
        case TransactionKindString.Transfer:
        case TransactionKindString.TransferWithMemo:
        case TransactionKindString.TransferWithScheduleAndMemo:
            return summary.transfer.to;
        case TransactionKindString.TransferWithSchedule:
            return summary.event.to;
    }
}

export function affectedAccounts(
    summary: AccountCreationSummary | UpdateSummary
): never[];
export function affectedAccounts(summary: BlockItemSummary): Base58String[];
export function affectedAccounts(summary: BlockItemSummary): Base58String[] {
    if (summary.type !== TransactionSummaryType.AccountTransaction) {
        return [];
    }

    switch (summary.transactionType) {
        case TransactionKindString.EncryptedAmountTransfer:
        case TransactionKindString.EncryptedAmountTransferWithMemo:
            return [summary.added.account, summary.removed.account];
        case TransactionKindString.TransferToEncrypted:
            return [summary.added.account];
        case TransactionKindString.TransferToPublic:
            return [summary.removed.account];
        case TransactionKindString.Update: {
            return summary.events.reduce((addresses: Base58String[], event) => {
                if (
                    event.tag === TransactionEventTag.Transferred &&
                    event.to.type === 'AddressAccount' &&
                    !addresses.includes(event.to.address)
                ) {
                    return [...addresses, event.to.address];
                }
                return addresses;
            }, []);
        }
        default: {
            const receiver = getReceiverAccount(summary);

            if (summary.sender === receiver || receiver === undefined) {
                return [summary.sender];
            }

            return [summary.sender, receiver];
        }
    }
}

export type SummaryContractUpdateLog = {
    address: ContractAddress;
    events: HexString[];
};

export function getSummaryContractUpdateLogs(
    summary: AccountCreationSummary | UpdateSummary
): never[];
export function getSummaryContractUpdateLogs(
    summary: BlockItemSummary
): SummaryContractUpdateLog[];
export function getSummaryContractUpdateLogs(
    summary: BlockItemSummary
): SummaryContractUpdateLog[] {
    if (
        summary.type !== TransactionSummaryType.AccountTransaction ||
        !isUpdateContractSummary(summary)
    ) {
        return [];
    }

    return summary.events
        .map((event) => {
            switch (event.tag) {
                case TransactionEventTag.Updated:
                case TransactionEventTag.Interrupted:
                    return { address: event.address, events: event.events };
                default:
                    return undefined;
            }
        })
        .filter(isDefined);
}
