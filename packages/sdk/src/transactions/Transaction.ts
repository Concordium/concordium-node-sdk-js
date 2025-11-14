import {
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionPayload,
    AccountTransactionType,
    ConfigureBakerPayload,
    ConfigureDelegationPayload,
    DeployModulePayload,
    InitContractPayload,
    MakeOptional,
    RegisterDataPayload,
    SimpleTransferHandler,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TokenUpdatePayload,
    UpdateContractPayload,
    UpdateCredentialsPayload,
} from '../index.js';
import { Energy, TransactionExpiry } from '../types/index.js';
import { AccountTransactionV0 } from './index.js';

type GenPayload<T extends AccountTransactionType, P extends AccountTransactionPayload> = {
    /**
     * The transaction type to execute
     */
    type: T;
    /**
     * The transaction payload corresponding to the `type` declared
     */
    payload: P;
};

export type Transfer = GenPayload<AccountTransactionType.Transfer, SimpleTransferPayload>;
export type TransferWithMemo = GenPayload<AccountTransactionType.TransferWithMemo, SimpleTransferWithMemoPayload>;
export type RegisterData = GenPayload<AccountTransactionType.RegisterData, RegisterDataPayload>;
export type UpdateCredentials = GenPayload<AccountTransactionType.UpdateCredentials, UpdateCredentialsPayload>;
export type ConfigureValidator = GenPayload<AccountTransactionType.ConfigureBaker, ConfigureBakerPayload>;
export type ConfigureDelegation = GenPayload<AccountTransactionType.ConfigureDelegation, ConfigureDelegationPayload>;
export type TokenUpdate = GenPayload<AccountTransactionType.TokenUpdate, TokenUpdatePayload>;
export type DeployModule = GenPayload<AccountTransactionType.DeployModule, DeployModulePayload>;
export type InitContract = GenPayload<AccountTransactionType.InitContract, InitContractPayload>;
export type UpdateContract = GenPayload<AccountTransactionType.Update, UpdateContractPayload>;

export type Header = AccountTransactionHeader;

type MetadataInput = MakeOptional<Header, 'expiry'>;

export type NormalMetadata = Omit<MetadataInput, 'executionEnergyAmount'>;
export type ContractMetadata = MetadataInput;

type Transaction<
    T extends AccountTransactionType = AccountTransactionType,
    P extends AccountTransactionPayload = AccountTransactionPayload,
> = AccountTransaction<T, P>;

export type Type<
    T extends AccountTransactionType = AccountTransactionType,
    P extends AccountTransactionPayload = AccountTransactionPayload,
> = Transaction<T, P>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: SimpleTransferPayload
): Transaction<AccountTransactionType.Transfer, SimpleTransferPayload> {
    const handler = new SimpleTransferHandler();
    return {
        type: AccountTransactionType.Transfer,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        payload: payload,
    };
}

export function initContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: UpdateContractPayload,
    maxExecutionEnergy: Energy.Type
): Transaction<AccountTransactionType.Update, UpdateContractPayload> {
    if (maxExecutionEnergy === undefined) {
        throw new Error('UpdateContractHandler requires the givenEnergy parameter to be provided.');
    }

    return {
        type: AccountTransactionType.Update,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: maxExecutionEnergy,
        },
        payload: payload,
    };
}

// TODO: extend to include v1 transactions when added
export function sign(transaction: Transaction, signer: AccountSigner): AccountTransactionV0.Type {}
