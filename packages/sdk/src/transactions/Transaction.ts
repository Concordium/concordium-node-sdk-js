import {
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionInput,
    AccountTransactionType,
    ConfigureBakerHandler,
    ConfigureBakerPayload,
    ConfigureDelegationHandler,
    ConfigureDelegationPayload,
    DeployModuleHandler,
    DeployModulePayload,
    InitContractHandler,
    InitContractInput,
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
    UpdateContractHandler,
    UpdateContractInput,
    UpdateContractPayload,
    UpdateCredentialsHandler,
    UpdateCredentialsPayload,
    sha256,
} from '../index.js';
import { DataBlob, Energy, TransactionExpiry } from '../types/index.js';
import { TransferWithMemo } from './Payload.ts';
import { AccountTransactionV0, Payload } from './index.js';

// --- Core types ---

/**
 * Transaction header type alias for account transaction metadata.
 */
export type Header = AccountTransactionHeader & {
    /** a base energy amount, this amount excludes transaction size and signature costs */
    executionEnergyAmount: Energy.Type;
    /** The number of signatures the transaction can hold. If `undefined`, this will be defined at the time of signing. */
    numSignatures?: bigint;
};

type Transaction<P extends Payload.Type = Payload.Type> = {
    /**
     * The transaction input header.
     */
    header: Header;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    payload: P;
};

/**
 * Describes an account transaction in its unprocessed form, i.e. defining the input required
 * to create a transaction which can be signed
 */
export type Type = Transaction;

// --- Transaction construction ---

class TransactionBuilder<P extends Payload.Type = Payload.Type> implements Transaction<P> {
    private _header: Header;

    constructor(
        header: Header,
        public readonly payload: P
    ) {
        this._header = header;
    }

    public get header(): Readonly<Header> {
        return this._header;
    }

    public multiSig(numSignatures: number | bigint): this {
        this._header.numSignatures = BigInt(numSignatures);
        return this;
    }
}

/**
 * Base metadata input with optional expiry field.
 */
export type Metadata = Omit<MakeOptional<Header, 'expiry'>, 'executionEnergyAmount'>;

/**
 * Dynamic `Transaction` creation based on the given transaction `type`.
 * If the transaction type is known, use the specialized creation functions per transaction type
 * instead.
 *
 * @param type - transaction type
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
    payload: AccountTransactionInput
): TransactionBuilder {
    switch (type) {
        case AccountTransactionType.Transfer:
            return transfer(metadata, payload as SimpleTransferPayload);
        case AccountTransactionType.TransferWithMemo:
            return transfer(metadata, payload as SimpleTransferWithMemoPayload);
        case AccountTransactionType.DeployModule:
            return deployModule(metadata, payload as DeployModulePayload);
        case AccountTransactionType.InitContract:
            const { maxContractExecutionEnergy: initEnergy, ...initPayload } = payload as InitContractInput;
            return initContract(metadata, initPayload, initEnergy);
        case AccountTransactionType.Update:
            const { maxContractExecutionEnergy: updateEnergy, ...updatePayload } = payload as UpdateContractInput;
            return updateContract(metadata, updatePayload, updateEnergy);
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
            throw new Error('The provided type is not supported: ' + type);
    }
}

/**
 * Crates a {@linkcode Transaction} builder object from the legacy `AccountTransaction` format.
 *
 * @param transaction - The {@linkcode AccountTransaction} to convert.
 * @returns a corresonding transaction builder object.
 */
export function fromLegacyAccountTransaction({ type, header, payload }: AccountTransaction): TransactionBuilder {
    return create(type, header, payload);
}

/**
 * Creates a simple transfer transaction
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @returns a transfer transaction
 */
export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferPayload | Payload.Transfer
): TransactionBuilder<Payload.Transfer>;

/**
 * Creates a transfer transaction with a memo.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @param memo the transfer memo to include
 * @returns a transfer with memo transaction
 */
export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferPayload,
    memo: DataBlob
): TransactionBuilder<Payload.TransferWithMemo>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferWithMemoPayload
): TransactionBuilder<Payload.TransferWithMemo>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: Payload.TransferWithMemo
): TransactionBuilder<Payload.TransferWithMemo>;

export function transfer(
    metadata: Metadata,
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload | Payload.Transfer | Payload.TransferWithMemo,
    memo?: DataBlob
): TransactionBuilder<Payload.Transfer> | TransactionBuilder<Payload.TransferWithMemo> {
    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const header = {
        sender: sender,
        nonce: nonce,
        expiry: expiry,
    };

    if (payload instanceof Payload.Transfer) {
        const handler = new SimpleTransferHandler();
        return new TransactionBuilder<Payload.Transfer>(
            { ...header, executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
            payload
        );
    } else if (payload instanceof Payload.TransferWithMemo) {
        const handler = new SimpleTransferWithMemoHandler();
        return new TransactionBuilder<TransferWithMemo>(
            { ...header, executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
            payload
        );
    }

    // a little hacky, but at this point, the we don't care if the memo is defined or not, as the
    // Payload.transfer fuction will take care of the different cases here
    return transfer(metadata, Payload.transfer(payload, memo as any));
}

/**
 * Creates a transaction to update account credentials.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the credentials update payload
 * @returns an update credentials transaction
 */
export function updateCredentials(
    metadata: Metadata,
    payload: UpdateCredentialsPayload | Payload.UpdateCredentials
): TransactionBuilder<Payload.UpdateCredentials> {
    if (!(payload instanceof Payload.UpdateCredentials))
        return updateCredentials(metadata, Payload.updateCredentials(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new UpdateCredentialsHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload.value)),
        },
        payload
    );
}

/**
 * Creates a transaction to configure a validator (baker).
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the validator configuration payload
 * @returns a configure baker transaction
 */
export function configureValidator(
    metadata: Metadata,
    payload: ConfigureBakerPayload | Payload.ConfigureValidator
): TransactionBuilder<Payload.ConfigureValidator> {
    if (!(payload instanceof Payload.ConfigureValidator))
        return configureValidator(metadata, Payload.configureValidator(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new ConfigureBakerHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload.value)),
        },
        payload
    );
}

/**
 * Creates a transaction to configure account delegation.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the delegation configuration payload
 * @returns a configure delegation transaction
 */
export function configureDelegation(
    metadata: Metadata,
    payload: ConfigureDelegationPayload | Payload.ConfigureDelegation
): TransactionBuilder<Payload.ConfigureDelegation> {
    if (!(payload instanceof Payload.ConfigureDelegation))
        return configureDelegation(metadata, Payload.configureDelegation(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new ConfigureDelegationHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        payload
    );
}

/**
 * Creates a transaction to update token parameters on chain.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the token update payload
 * @returns a token update transaction
 */
export function tokenUpdate(
    metadata: Metadata,
    payload: TokenUpdatePayload | Payload.TokenUpdate
): TransactionBuilder<Payload.TokenUpdate> {
    if (!(payload instanceof Payload.TokenUpdate)) return tokenUpdate(metadata, Payload.tokenUpdate(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new TokenUpdateHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload.value)),
        },
        payload
    );
}

/**
 * Creates a transaction to deploy a smart contract module.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the module deployment payload containing the wasm module
 * @returns a deploy module transaction
 */
export function deployModule(
    metadata: Metadata,
    payload: DeployModulePayload | Payload.DeployModule
): TransactionBuilder<Payload.DeployModule> {
    if (!(payload instanceof Payload.DeployModule)) return deployModule(metadata, Payload.deployModule(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new DeployModuleHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload.value)),
        },
        payload
    );
}

/**
 * Creates a transaction to register arbitrary data on chain.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the data registration payload
 * @returns a register data transaction
 */
export function registerData(
    metadata: Metadata,
    payload: RegisterDataPayload | Payload.RegisterData
): TransactionBuilder<Payload.RegisterData> {
    if (!(payload instanceof Payload.RegisterData)) return registerData(metadata, Payload.registerData(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new RegisterDataHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        payload
    );
}

/**
 * Creates a transaction to initialize a smart contract instance.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the contract initialization payload with specified execution energy limit
 * @param maxContractExecutionEnergy the maximum amount of energy to spend on initializing the contract instance
 *
 * @returns an init contract transaction
 */
export function initContract(
    metadata: Metadata,
    payload: InitContractPayload | Payload.InitContract,
    maxContractExecutionEnergy: Energy.Type
): TransactionBuilder<Payload.InitContract> {
    if (!(payload instanceof Payload.InitContract))
        return initContract(metadata, Payload.initContract(payload), maxContractExecutionEnergy);

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new InitContractHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(
                handler.getBaseEnergyCost({ ...payload.value, maxContractExecutionEnergy })
            ),
        },
        payload
    );
}

/**
 * Creates a transaction to invoke an existing smart contract.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the contract update payload specifying the contract and receive function with specified execution energy limit
 * @param maxContractExecutionEnergy the maximum amount of energy to spend on updating the contract instance
 *
 * @returns an update contract transaction
 */
export function updateContract(
    metadata: Metadata,
    payload: UpdateContractPayload | Payload.UpdateContract,
    maxContractExecutionEnergy: Energy.Type
): TransactionBuilder<Payload.UpdateContract> {
    if (!(payload instanceof Payload.UpdateContract))
        return updateContract(metadata, Payload.updateContract(payload), maxContractExecutionEnergy);

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new UpdateContractHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(
                handler.getBaseEnergyCost({ ...payload.value, maxContractExecutionEnergy })
            ),
        },
        payload
    );
}

// TODO: factor in v1 transaction
export function getEnergyCost({
    header: { numSignatures = 1n, executionEnergyAmount },
    payload,
}: Transaction): Energy.Type {
    return AccountTransactionV0.calculateEnergyCost(BigInt(numSignatures), payload, executionEnergyAmount);
}

// --- Transaction signing ---

/**
 * A signed version 0 account transaction.
 */
// TODO: factor in v1 transaction
export type Signed = Readonly<AccountTransactionV0.Type>;

/**
 * Signs a transaction using the provided signer, calculating total energy cost and creating a version 0 signed transaction.
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer containing keys and signature logic
 * @returns a promise resolving to the signed transaction
 */
// TODO: factor in v1 transaction
export async function sign(transaction: Transaction, signer: AccountSigner): Promise<Signed> {
    const {
        expiry,
        sender,
        nonce,
        executionEnergyAmount,
        numSignatures = signer.getSignatureCount(),
    } = transaction.header;
    const energyAmount = AccountTransactionV0.calculateEnergyCost(
        numSignatures,
        transaction.payload,
        executionEnergyAmount
    );

    const header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize: Payload.sizeOf(transaction.payload),
        energyAmount,
    };
    const unsigned: AccountTransactionV0.Unsigned = {
        version: 0,
        header,
        payload: transaction.payload,
    };
    return await AccountTransactionV0.sign(unsigned, signer);
}

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 * @param signedTransaction the transaction to hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header, type and payload
 */
export function getAccountTransactionHash(signedTransaction: Signed): Uint8Array {
    const serializedAccountTransaction = AccountTransactionV0.serialize(signedTransaction);
    return sha256([serializedAccountTransaction]);
}

export function serializeBlockItem(signedTransaction: Signed): Uint8Array {
    return AccountTransactionV0.serializeBlockItem(signedTransaction);
}
