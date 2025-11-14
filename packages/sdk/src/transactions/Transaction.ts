import {
    AccountSigner,
    AccountTransaction,
    AccountTransactionEnergyPayload,
    AccountTransactionHeader,
    AccountTransactionPayload,
    AccountTransactionType,
    ConfigureBakerHandler,
    ConfigureBakerPayload,
    ConfigureDelegationHandler,
    ConfigureDelegationPayload,
    DeployModuleHandler,
    DeployModulePayload,
    InitContractHandler,
    InitContractPayload,
    InitContractPayloadWithEnergy,
    MakeOptional,
    RegisterDataHandler,
    RegisterDataPayload,
    SimpleTransferHandler,
    SimpleTransferPayload,
    SimpleTransferWithMemoHandler,
    SimpleTransferWithMemoPayload,
    TokenUpdateHandler,
    TokenUpdatePayload,
    UpdateContractHandler,
    UpdateContractPayload,
    UpdateContractPayloadWithEnergy,
    UpdateCredentialsHandler,
    UpdateCredentialsPayload,
    serializeAccountTransactionPayload,
} from '../index.js';
import { Energy, TransactionExpiry } from '../types/index.js';
import { AccountTransactionV0 } from './index.js';

// --- Core types ---

/**
 * Transaction header type alias for account transaction metadata.
 */
export type Header = AccountTransactionHeader;

/**
 * Generic transaction type with parameterized transaction type and payload.
 */
type Transaction<
    T extends AccountTransactionType = AccountTransactionType,
    P extends AccountTransactionPayload = AccountTransactionPayload,
> = AccountTransaction<T, P>;

/**
 * Exported generic transaction type alias.
 */
export type Type<
    T extends AccountTransactionType = AccountTransactionType,
    P extends AccountTransactionPayload = AccountTransactionPayload,
> = Transaction<T, P>;

// --- Transaction construction ---

/**
 * Base metadata input with optional expiry field.
 */
export type Metadata = Omit<MakeOptional<Header, 'expiry'>, 'executionEnergyAmount'>;

/**
 * Dynamic `Transaction` creation based on the given transaction `type`.
 * If the transaction type is known, use the specialized creation functions per transaction type
 * instead.
 *
 * @param type - the transaction type.
 * @param metadata - transaction metadata to put into the transaction header.
 * @param payload - a transaction payload matching the transaction type. If these do not match,
 * this will fail.
 *
 * @returns The corresponding transaction
 *
 * @throws if transaction type is not currently supported.
 * @throws if transaction cannot be created due to mismatch between `type` and `payload`.
 */
export function create(
    type: AccountTransactionType,
    metadata: Metadata,
    payload: AccountTransactionEnergyPayload
): Transaction {
    switch (type) {
        case AccountTransactionType.Transfer:
            return transfer(metadata, payload as SimpleTransferPayload);
        case AccountTransactionType.TransferWithMemo:
            return transfer(metadata, payload as SimpleTransferWithMemoPayload);
        case AccountTransactionType.DeployModule:
            return deployModule(metadata, payload as DeployModulePayload);
        case AccountTransactionType.InitContract:
            return initContract(metadata, payload as InitContractPayloadWithEnergy);
        case AccountTransactionType.Update:
            return updateContract(metadata, payload as UpdateContractPayloadWithEnergy);
        case AccountTransactionType.UpdateCredentials:
            return updateCredentials(metadata, payload as UpdateCredentialsPayload);
        case AccountTransactionType.RegisterData:
            return registerData(metadata, payload as RegisterDataPayload);
        case AccountTransactionType.ConfigureDelegation:
            return configureDelegation(metadata, payload as ConfigureDelegationPayload);
        case AccountTransactionType.ConfigureBaker:
            return configureValidator(metadata, payload as ConfigureBakerPayload);
        case AccountTransactionType.TokenUpdate:
            return tokenUpdate(metadata, payload as TokenUpdatePayload);
        default:
            throw new Error('The provided type does not have a handler: ' + type);
    }
}

const isMemoPayload = (
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload
): payload is SimpleTransferWithMemoPayload => (payload as SimpleTransferWithMemoPayload).memo !== undefined;

/**
 * Creates a simple transfer transaction
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @returns a transfer transaction
 */
export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferPayload
): Transaction<AccountTransactionType.Transfer, SimpleTransferPayload>;

/**
 * Creates a transfer transaction with a memo.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @returns a transfer with memo transaction
 */
export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferWithMemoPayload
): Transaction<AccountTransactionType.TransferWithMemo, SimpleTransferWithMemoPayload>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload
):
    | Transaction<AccountTransactionType.Transfer, SimpleTransferPayload>
    | Transaction<AccountTransactionType.TransferWithMemo, SimpleTransferWithMemoPayload> {
    const header = {
        sender: sender,
        nonce: nonce,
        expiry: expiry,
    };

    if (!isMemoPayload(payload)) {
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
        payload: { ...payload },
    };
}

/**
 * Creates a transaction to update account credentials.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the credentials update payload
 * @returns an update credentials transaction
 */
export function updateCredentials(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
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

/**
 * Creates a transaction to configure a validator (baker).
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the validator configuration payload
 * @returns a configure baker transaction
 */
export function configureValidator(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
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

/**
 * Creates a transaction to configure account delegation.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the delegation configuration payload
 * @returns a configure delegation transaction
 */
export function configureDelegation(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
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

/**
 * Creates a transaction to update token parameters on chain.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the token update payload
 * @returns a token update transaction
 */
export function tokenUpdate(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
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

/**
 * Creates a transaction to deploy a smart contract module.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the module deployment payload containing the wasm module
 * @returns a deploy module transaction
 */
export function deployModule(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
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

/**
 * Creates a transaction to register arbitrary data on chain.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the data registration payload
 * @returns a register data transaction
 */
export function registerData(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
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

/**
 * Creates a transaction to initialize a smart contract instance.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the contract initialization payload with specified execution energy limit
 * @returns an init contract transaction
 */
export function initContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    { maxContractExecutionEnergy, ...payload }: InitContractPayloadWithEnergy
): Transaction<AccountTransactionType.InitContract, InitContractPayload> {
    const handler = new InitContractHandler();
    return {
        type: AccountTransactionType.InitContract,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ maxContractExecutionEnergy, ...payload })),
        },
        payload,
    };
}

/**
 * Creates a transaction to invoke an existing smart contract.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the contract update payload specifying the contract and receive function with specified execution energy limit
 * @returns an update contract transaction
 */
export function updateContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    { maxContractExecutionEnergy, ...payload }: UpdateContractPayloadWithEnergy
): Transaction<AccountTransactionType.Update, UpdateContractPayload> {
    const handler = new UpdateContractHandler();
    return {
        type: AccountTransactionType.Update,
        header: {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ maxContractExecutionEnergy, ...payload })),
        },
        payload,
    };
}

export function serializePayload(payload: Omit<Transaction, 'header'>): Uint8Array {
    return serializeAccountTransactionPayload(payload);
}

// TODO: factor in v1 transaction
export function getEnergyCost({ header, ...payload }: Transaction, numSignatures: bigint | number = 1n): Energy.Type {
    const size = serializePayload(payload).length;
    return AccountTransactionV0.calculateEnergyCost(BigInt(numSignatures), BigInt(size), header.executionEnergyAmount);
}

// --- Transaction signing ---

/**
 * A signed version 0 account transaction.
 */
export type Signed = Readonly<AccountTransactionV0.Type>;

/**
 * Signs a transaction using the provided signer, calculating total energy cost and creating a version 0 signed transaction.
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer containing keys and signature logic
 * @returns a promise resolving to the signed transaction
 */
// TODO: factor in v1 transaction
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
