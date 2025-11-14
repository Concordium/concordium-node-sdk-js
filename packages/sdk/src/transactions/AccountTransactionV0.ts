import {
    AccountTransactionPayload,
    AccountTransactionSignature,
    AccountTransactionType,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    DeployModulePayload,
    InitContractPayload,
    RegisterDataPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TokenUpdatePayload,
    UpdateContractPayload,
    UpdateCredentialsPayload,
} from '../types.js';
import { AccountAddress, Energy, SequenceNumber, TransactionExpiry } from '../types/index.js';

export type Header = {
    /** account address that is source of this transaction */
    sender: AccountAddress.Type;
    /**
     * the nonce for the transaction, usually acquired by
     * getting the next account nonce from the node
     */
    nonce: SequenceNumber.Type;
    /** expiration of the transaction */
    expiry: TransactionExpiry.Type;
    /**
     * The energy limit for the transaction, including energy spent on signature verification, parsing
     * the header, and transaction execution.
     */
    energyAmount: Energy.Type;
    /** payload size */
    payloadSize: number;
};

type GenTransaction<T extends AccountTransactionType, P extends AccountTransactionPayload> = {
    /**
     * The transaction header containing metadata for the transaction
     */
    header: Header;
    /**
     * The transaction type to execute
     */
    type: T;
    /**
     * The transaction payload corresponding to the `type` declared
     */
    payload: P;
    signatures: AccountTransactionSignature;
};

export type Transfer = GenTransaction<AccountTransactionType.Transfer, SimpleTransferPayload>;
export type TransferWithMemo = GenTransaction<AccountTransactionType.TransferWithMemo, SimpleTransferWithMemoPayload>;
export type RegisterData = GenTransaction<AccountTransactionType.RegisterData, RegisterDataPayload>;
export type UpdateCredentials = GenTransaction<AccountTransactionType.UpdateCredentials, UpdateCredentialsPayload>;
export type ConfigureValidator = GenTransaction<AccountTransactionType.ConfigureBaker, ConfigureBakerPayload>;
export type ConfigureDelegation = GenTransaction<
    AccountTransactionType.ConfigureDelegation,
    ConfigureDelegationPayload
>;
export type TokenUpdate = GenTransaction<AccountTransactionType.TokenUpdate, TokenUpdatePayload>;
export type DeployModule = GenTransaction<AccountTransactionType.DeployModule, DeployModulePayload>;
export type InitContract = GenTransaction<AccountTransactionType.InitContract, InitContractPayload>;
export type UpdateContract = GenTransaction<AccountTransactionType.Update, UpdateContractPayload>;

type Transaction =
    | Transfer
    | TransferWithMemo
    | RegisterData
    | UpdateCredentials
    | ConfigureValidator
    | ConfigureDelegation
    | TokenUpdate
    | DeployModule
    | InitContract
    | UpdateContract;

export type Type = Transaction;
