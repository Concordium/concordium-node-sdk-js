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

/**
 * Type predicate for {@link InitContractSummary}.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {boolean} whether summary is of type `InitContractSummary`.
 */
export const isInitContractSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary & InitContractSummary =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    summary.transactionType === TransactionKindString.InitContract;

/**
 * Type predicate for {@link UpdateContractSummary}.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {boolean} whether summary is of type `UpdateContractSummary`.
 */
export const isUpdateContractSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary & UpdateContractSummary =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    summary.transactionType === TransactionKindString.Update;

/**
 * Type predicate for transfer-like transactions.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {boolean} whether summary is of type `TransferSummary` or `TransferWithMemoSummary`.
 */
export const isTransferLikeSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary &
    (TransferSummary | TransferWithMemoSummary) =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    (summary.transactionType === TransactionKindString.Transfer ||
        summary.transactionType === TransactionKindString.TransferWithMemo);

/**
 * Type predicate for transfer-with-schedule-like transactions.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {boolean} whether summary is of type `TransferWithScheduleSummary` or `TransferWithScheduleAndMemoSummary`.
 */
export const isTransferWithScheduleLikeSummary = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary &
    (TransferWithScheduleSummary | TransferWithScheduleAndMemoSummary) =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    (summary.transactionType === TransactionKindString.TransferWithSchedule ||
        summary.transactionType ===
            TransactionKindString.TransferWithScheduleAndMemo);

/**
 * Type predicate for {@link FailedTransactionSummary}.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {boolean} whether transaction was rejected.
 */
export const isRejectTransaction = (
    summary: BlockItemSummary
): summary is BaseAccountTransactionSummary & FailedTransactionSummary =>
    summary.type === TransactionSummaryType.AccountTransaction &&
    summary.transactionType === TransactionKindString.Failed;
/**
 * Helper function to determine whether a transaction was successful (inverse of {@link isRejectTransaction}).
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {boolean} whether transaction was successful.
 */
export const isSuccessTransaction = (summary: BlockItemSummary): boolean =>
    !isRejectTransaction(summary);

/**
 * Gets the {@link RejectReason} for rejected transction.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {RejectReason | undfined} Reject reason if `summary` is a rejected transaction. Otherwise returns undefined.
 */
export function getTransactionRejectReason<T extends FailedTransactionSummary>(
    summary: T
): RejectReason;
export function getTransactionRejectReason(
    summary: AccountCreationSummary | UpdateSummary
): undefined;
export function getTransactionRejectReason(
    summary: Exclude<AccountTransactionSummary, FailedTransactionSummary>
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

const isEqualContract =
    (a: ContractAddress) =>
    (b: ContractAddress): boolean =>
        a.index === b.index && a.subindex === b.subindex;

/**
 * Gets a list of {@link ContractAddress} contract addresses affected by the transaction.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {ContractAddress[]} List of contract addresses affected by the transaction.
 */
export function affectedContracts<
    T extends InitContractSummary | UpdateContractSummary
>(summary: T): ContractAddress[];
export function affectedContracts(
    summary: Exclude<
        AccountTransactionSummary,
        InitContractSummary | UpdateContractSummary
    >
): never[];
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

/**
 * Gets the receiver account of a transaction, if the transaction is a transfer transaction (excluding encrypted transfers).
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {Base58String | undefined} The receiver account for transfer transactions. Otherwise returns undefined.
 */
export function getReceiverAccount<
    T extends
        | TransferSummary
        | TransferWithMemoSummary
        | TransferWithScheduleSummary
        | TransferWithScheduleAndMemoSummary
>(summary: T): Base58String;
export function getReceiverAccount(
    summary: Exclude<
        AccountTransactionSummary,
        | TransferSummary
        | TransferWithMemoSummary
        | TransferWithScheduleSummary
        | TransferWithScheduleAndMemoSummary
    >
): undefined;
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

/**
 * Gets a list of {@link Base58String} account addresses affected by the transaction.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {Base58String[]} List of account addresses affected by the transaction.
 */
export function affectedAccounts(
    summary: AccountTransactionSummary
): Base58String[];
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
            return summary.events.reduce(
                (addresses: Base58String[], event) => {
                    if (
                        event.tag === TransactionEventTag.Transferred &&
                        event.to.type === 'AddressAccount' &&
                        !addresses.includes(event.to.address)
                    ) {
                        return [...addresses, event.to.address];
                    }
                    return addresses;
                },
                [summary.sender]
            );
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

/**
 * Gets a list of update logs, each consisting of a {@link ContractAddress} and a list of {@link HexString} events.
 * The list will be empty for any transaction type but {@link UpdateContractSummary} contract updates.
 *
 * @param {BlockItemSummary} summary - The block item summary to check.
 *
 * @returns {SummaryContractUpdateLog[]} List of update logs corresponding to the transaction.
 */
export function getSummaryContractUpdateLogs<T extends UpdateContractSummary>(
    summary: T
): SummaryContractUpdateLog[];
export function getSummaryContractUpdateLogs(
    summary: AccountCreationSummary | UpdateSummary
): never[];
export function getSummaryContractUpdateLogs(
    summary: Exclude<AccountTransactionSummary, UpdateContractSummary>
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
