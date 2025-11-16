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
    UpdateCredentialsHandler,
    UpdateCredentialsPayload,
    sha256,
} from '../index.js';
import { Energy, TransactionExpiry } from '../types/index.js';
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

type Transaction<P extends Payload.Type = Payload.Type> = { header: Header; payload: P };

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
 * Exported generic transaction type alias.
 */
export type Type = Transaction;

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
            return initContract(metadata, payload as InitContractInput);
        case AccountTransactionType.Update:
            return updateContract(metadata, payload as UpdateContractInput);
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

export function fromLegacyAccountTransaction({ type, header, payload }: AccountTransaction): TransactionBuilder {
    return create(type, header, payload);
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
): TransactionBuilder<Payload.Transfer>;

/**
 * Creates a transfer transaction with a memo.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @returns a transfer with memo transaction
 */
export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferWithMemoPayload
): TransactionBuilder<Payload.TransferWithMemo>;

export function transfer(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload
): TransactionBuilder<Payload.Transfer> | TransactionBuilder<Payload.TransferWithMemo> {
    const header = {
        sender: sender,
        nonce: nonce,
        expiry: expiry,
    };

    if (!isMemoPayload(payload)) {
        const handler = new SimpleTransferHandler();
        return new TransactionBuilder<Payload.Transfer>(
            { ...header, executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
            Payload.transfer(payload)
        );
    }

    const handler = new SimpleTransferWithMemoHandler();
    return new TransactionBuilder(
        { ...header, executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
        Payload.transfer(payload)
    );
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
): TransactionBuilder<Payload.UpdateCredentials> {
    const handler = new UpdateCredentialsHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        Payload.updateCredentials(payload)
    );
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
): TransactionBuilder<Payload.ConfigureValidator> {
    const handler = new ConfigureBakerHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        Payload.configureValidator(payload)
    );
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
): TransactionBuilder<Payload.ConfigureDelegation> {
    const handler = new ConfigureDelegationHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        Payload.configureDelegation(payload)
    );
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
): TransactionBuilder<Payload.TokenUpdate> {
    const handler = new TokenUpdateHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        Payload.tokenUpdate(payload)
    );
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
): TransactionBuilder<Payload.DeployModule> {
    const handler = new DeployModuleHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)),
        },
        Payload.deployModule(payload)
    );
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
): TransactionBuilder<Payload.RegisterData> {
    const handler = new RegisterDataHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()),
        },
        Payload.registerData(payload)
    );
}

/**
 * Creates a transaction to initialize a smart contract instance.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the contract initialization payload with specified execution energy limit
 * @returns an init contract transaction
 */
export function initContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    { maxContractExecutionEnergy, ...payload }: InitContractInput
): TransactionBuilder<Payload.InitContract> {
    const handler = new InitContractHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ ...payload, maxContractExecutionEnergy })),
        },
        Payload.initContract(payload)
    );
}

/**
 * Creates a transaction to invoke an existing smart contract.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the contract update payload specifying the contract and receive function with specified execution energy limit
 * @returns an update contract transaction
 */
export function updateContract(
    { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata,
    { maxContractExecutionEnergy, ...payload }: UpdateContractInput
): TransactionBuilder<Payload.UpdateContract> {
    const handler = new UpdateContractHandler();
    return new TransactionBuilder(
        {
            sender: sender,
            nonce: nonce,
            expiry: expiry,
            executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ ...payload, maxContractExecutionEnergy })),
        },
        Payload.updateContract(payload)
    );
}

// TODO: factor in v1 transaction
export function getEnergyCost({ header, payload }: Transaction, numSignatures: bigint | number = 1n): Energy.Type {
    const size = Payload.serialize(payload).length;
    return AccountTransactionV0.calculateEnergyCost(BigInt(numSignatures), BigInt(size), header.executionEnergyAmount);
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
    const payloadSize = Payload.serialize(transaction.payload).length;
    const energyAmount = AccountTransactionV0.calculateEnergyCost(numSignatures, payloadSize, executionEnergyAmount);

    const header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize,
        energyAmount,
    };
    const unsigned: AccountTransactionV0.Unsigned = {
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
