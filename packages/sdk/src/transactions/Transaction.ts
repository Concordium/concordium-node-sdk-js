import {
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionPayload,
    AccountTransactionType,
    ConfigureBakerHandler,
    ConfigureBakerPayload,
    ConfigureDelegationHandler,
    ConfigureDelegationPayload,
    DeployModuleHandler,
    DeployModulePayload,
    InitContractPayload,
    MakeOptional,
    RegisterDataHandler,
    RegisterDataPayload,
    SimpleTransferHandler,
    SimpleTransferPayload,
    SimpleTransferWithMemoHandler,
    SimpleTransferWithMemoPayload,
    TokenUpdateHandler,
    TokenUpdatePayload,
    UpdateContractPayload,
    UpdateCredentialsHandler,
    UpdateCredentialsPayload,
    serializeAccountTransactionPayload,
} from '../index.js';
import { type DataBlob, Energy, TransactionExpiry } from '../types/index.js';
import { AccountTransactionV0 } from './index.js';

// --- Core types ---

export type Header = AccountTransactionHeader;

type Transaction<
    T extends AccountTransactionType = AccountTransactionType,
    P extends AccountTransactionPayload = AccountTransactionPayload,
> = AccountTransaction<T, P>;

export type Type<
    T extends AccountTransactionType = AccountTransactionType,
    P extends AccountTransactionPayload = AccountTransactionPayload,
> = Transaction<T, P>;

// --- Transaction construction ---

type MetadataInput = MakeOptional<Header, 'expiry'>;

export type NormalMetadata = Omit<MetadataInput, 'executionEnergyAmount'>;
export type ContractMetadata = MetadataInput;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: SimpleTransferPayload
): Transaction<AccountTransactionType.Transfer, SimpleTransferPayload>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: SimpleTransferPayload,
    memo: DataBlob
): Transaction<AccountTransactionType.TransferWithMemo, SimpleTransferWithMemoPayload>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: SimpleTransferPayload,
    memo?: DataBlob
):
    | Transaction<AccountTransactionType.Transfer, SimpleTransferPayload>
    | Transaction<AccountTransactionType.TransferWithMemo, SimpleTransferWithMemoPayload> {
    const header = {
        sender: sender,
        nonce: nonce,
        expiry: expiry,
    };

    if (memo === undefined) {
        const handler = new SimpleTransferHandler();
        return {
            type: AccountTransactionType.Transfer,
            header: { ...header, executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
            payload,
        };
    }

    const handler = new SimpleTransferWithMemoHandler();
    return {
        type: AccountTransactionType.TransferWithMemo,
        header: { ...header, executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
        payload: { ...payload, memo },
    };
}

export function updateCredentials(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: UpdateCredentialsPayload
): Transaction<AccountTransactionType.UpdateCredentials, UpdateCredentialsPayload> {
    const handler = new UpdateCredentialsHandler();
    return {
        type: AccountTransactionType.UpdateCredentials,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        payload,
    };
}

export function configureValidator(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: ConfigureBakerPayload
): Transaction<AccountTransactionType.ConfigureBaker, ConfigureBakerPayload> {
    const handler = new ConfigureBakerHandler();
    return {
        type: AccountTransactionType.ConfigureBaker,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        payload,
    };
}

export function configureDelegation(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: ConfigureDelegationPayload
): Transaction<AccountTransactionType.ConfigureDelegation, ConfigureDelegationPayload> {
    const handler = new ConfigureDelegationHandler();
    return {
        type: AccountTransactionType.ConfigureDelegation,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        payload,
    };
}

export function tokenUpdate(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: TokenUpdatePayload
): Transaction<AccountTransactionType.TokenUpdate, TokenUpdatePayload> {
    const handler = new TokenUpdateHandler();
    return {
        type: AccountTransactionType.TokenUpdate,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        payload,
    };
}

export function deployModule(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: DeployModulePayload
): Transaction<AccountTransactionType.DeployModule, DeployModulePayload> {
    const handler = new DeployModuleHandler();
    return {
        type: AccountTransactionType.DeployModule,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        payload,
    };
}

export function registerData(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: NormalMetadata,
    payload: RegisterDataPayload
): Transaction<AccountTransactionType.RegisterData, RegisterDataPayload> {
    const handler = new RegisterDataHandler();
    return {
        type: AccountTransactionType.RegisterData,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        payload,
    };
}

export function initContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5), executionEnergyAmount }: ContractMetadata,
    payload: InitContractPayload
): Transaction<AccountTransactionType.InitContract, InitContractPayload> {
    return {
        type: AccountTransactionType.InitContract,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount,
        },
        payload,
    };
}

export function updateContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5), executionEnergyAmount }: ContractMetadata,
    payload: UpdateContractPayload
): Transaction<AccountTransactionType.Update, UpdateContractPayload> {
    return {
        type: AccountTransactionType.Update,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount,
        },
        payload: payload,
    };
}

// --- Transaction signing ---

export type Signed = Readonly<AccountTransactionV0.Type>;

// TODO: extend to include v1 transactions when added
export async function sign(transaction: Transaction, signer: AccountSigner): Promise<Signed> {
    const { expiry, sender, nonce, executionEnergyAmount } = transaction.header;
    const payloadSize = serializeAccountTransactionPayload(transaction).length;
    const energyAmount = AccountTransactionV0.calculateEnergyCost(
        signer.getSignatureCount(),
        payloadSize,
        executionEnergyAmount
    );

    const header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize,
        energyAmount,
    };
    const unsigned: AccountTransactionV0.Unsigned = {
        header,
        type: transaction.type,
        payload: transaction.payload,
    };
    return await AccountTransactionV0.sign(unsigned, signer);
}
