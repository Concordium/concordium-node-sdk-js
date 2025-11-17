import {
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionInput,
    AccountTransactionType,
    Base58String,
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
import { AccountAddress, DataBlob, Energy, SequenceNumber, TransactionExpiry } from '../types/index.js';
import { AccountTransactionV0, Payload } from './index.js';

// --- Core types ---

type HeaderJSON = {
    sender: Base58String;
    nonce: bigint;
    expiry: number;
    executionEnergyAmount: bigint;
    numSignatures?: number;
};

/**
 * Transaction header for the intermediary state of account transactions, i.e. prior to being signing.
 */
export type Header = AccountTransactionHeader & {
    /** a base energy amount, this amount excludes transaction size and signature costs */
    executionEnergyAmount: Energy.Type;
    /** The number of signatures the transaction can hold. If `undefined`, this will be defined at the time of signing. */
    numSignatures?: bigint;
};

function headerToJSON(header: Header): HeaderJSON {
    const json: HeaderJSON = {
        sender: header.sender.toJSON(),
        nonce: header.nonce.toJSON(),
        expiry: header.expiry.toJSON(),
        executionEnergyAmount: header.executionEnergyAmount.value,
    };

    if (header.numSignatures !== undefined) {
        json.numSignatures = Number(header.numSignatures);
    }
    return json;
}

function headerFromJSON(json: HeaderJSON): Header {
    return header(
        AccountAddress.fromJSON(json.sender),
        SequenceNumber.fromJSON(json.nonce),
        TransactionExpiry.fromJSON(json.expiry),
        Energy.create(json.executionEnergyAmount),
        json.numSignatures === undefined ? undefined : BigInt(json.numSignatures)
    );
}

/**
 * Creates a transaction header.
 *
 * @param sender the account address of the sender
 * @param nonce the account nonce
 * @param expiry the transaction expiry
 * @param executionEnergyAmount the base energy amount for transaction execution
 * @param numSignatures optional number of signatures
 *
 * @returns a transaction header
 */
export function header(
    sender: AccountAddress.Type,
    nonce: SequenceNumber.Type,
    expiry: TransactionExpiry.Type,
    executionEnergyAmount: Energy.Type,
    numSignatures?: bigint
): Header {
    return { sender, nonce, expiry, executionEnergyAmount, numSignatures };
}

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
export type Type<P extends Payload.Type = Payload.Type> = Transaction<P>;

// --- Transaction construction ---

class TransactionBuilder<P extends Payload.Type = Payload.Type> implements Transaction<P> {
    constructor(
        public readonly header: Header,
        public readonly payload: P
    ) {}

    public multiSig(numSignatures: number | bigint): this {
        this.header.numSignatures = BigInt(numSignatures);
        return this;
    }

    public toJSON() {
        return toJSON(this);
    }
}

/**
 * Creates a transaction builder from an existing transaction.
 * @param transaction the transaction to wrap
 * @returns a transaction builder
 */
export function builder<P extends Payload.Type = Payload.Type>(transaction: Transaction<P>): TransactionBuilder<P> {
    return new TransactionBuilder(transaction.header, transaction.payload);
}

/**
 * Converts a transaction to its intermediary JSON serializable representation.
 * @param header the transaction header
 * @param payload the transaction payload
 * @returns the JSON representation
 */
export function toJSON({ header, payload }: Transaction) {
    return { header: headerToJSON(header), payload: Payload.toJSON(payload) };
}

/**
 * Converts an intermediary JSON serializable representation created with {@linkcode toJSON} to a transaction.
 * @param json the JSON to convert
 * @returns the transaction
 */
export function fromJSON(json: ReturnType<typeof toJSON>): Transaction {
    return { header: headerFromJSON(json.header), payload: Payload.fromJSON(json.payload) };
}

/**
 * Base metadata input with optional expiry field.
 */
export type Metadata = MakeOptional<AccountTransactionHeader, 'expiry'>;

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
 * Converts a {@linkcode Transaction} to the legacy format.
 *
 * @param transaction - the transaction details to convert
 * @returns the legacy {@linkcode AccountTransaction} format
 */
export function toLegacyAccountTransaction(transaction: Transaction): AccountTransaction {
    const {
        header: { numSignatures, executionEnergyAmount, ...header },
        payload: { type, ...payload },
    } = transaction;

    switch (type) {
        case AccountTransactionType.InitContract:
        case AccountTransactionType.Update:
            return {
                header,
                type,
                payload: { ...payload, maxContractExecutionEnergy: executionEnergyAmount },
            } as AccountTransaction<
                AccountTransactionType.Update | AccountTransactionType.InitContract,
                InitContractInput | UpdateContractInput
            >;
        default:
            return { header, type, payload } as AccountTransaction<
                Exclude<AccountTransactionType, AccountTransactionType.Update | AccountTransactionType.InitContract>,
                Exclude<AccountTransactionInput, InitContractInput | UpdateContractInput>
            >;
    }
}

const isPayloadWithType = <P extends Payload.Type>(payload: P | Omit<P, 'type'>): payload is P =>
    (payload as P).type !== undefined;

const isWithMemo = (
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload
): payload is SimpleTransferWithMemoPayload => (payload as SimpleTransferWithMemoPayload).memo !== undefined;

/**
 * Creates a transfer transaction
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @returns a transfer transaction
 */
export function transfer(
    metadata: Metadata,
    payload: SimpleTransferPayload | Payload.Transfer
): TransactionBuilder<Payload.Transfer>;

/**
 * Creates a transfer transaction with memo
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount and memo
 * @returns a transfer with memo transaction
 */
export function transfer(
    metadata: Metadata,
    payload: SimpleTransferWithMemoPayload | Payload.TransferWithMemo
): TransactionBuilder<Payload.TransferWithMemo>;

/**
 * Creates a transfer transaction with a memo.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the transfer payload containing recipient and amount
 * @param memo the transfer memo to include
 * @returns a transfer with memo transaction
 */
export function transfer(
    metadata: Metadata,
    payload: SimpleTransferPayload,
    memo: DataBlob
): TransactionBuilder<Payload.TransferWithMemo>;

export function transfer(
    metadata: Metadata,
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload | Payload.Transfer | Payload.TransferWithMemo,
    memo?: DataBlob
): TransactionBuilder<Payload.Transfer> | TransactionBuilder<Payload.TransferWithMemo> {
    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;

    if (!isPayloadWithType(payload)) {
        // a little hacky, but at this point, the we don't care if the memo is defined or not, as the
        // Payload.transfer fuction will take care of the different cases here
        return transfer(metadata, Payload.transfer(payload, memo as any));
    }

    if (isWithMemo(payload)) {
        const handler = new SimpleTransferWithMemoHandler();
        return new TransactionBuilder<Payload.TransferWithMemo>(
            header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost())),
            payload
        );
    }

    const handler = new SimpleTransferHandler();
    return new TransactionBuilder<Payload.Transfer>(
        header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost())),
        payload
    );
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
    if (!isPayloadWithType(payload)) return updateCredentials(metadata, Payload.updateCredentials(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new UpdateCredentialsHandler();
    return new TransactionBuilder(
        header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost(payload))),
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
    if (!isPayloadWithType(payload)) return configureValidator(metadata, Payload.configureValidator(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new ConfigureBakerHandler();
    return new TransactionBuilder(
        header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost(payload))),
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
    if (!isPayloadWithType(payload)) return configureDelegation(metadata, Payload.configureDelegation(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new ConfigureDelegationHandler();
    return new TransactionBuilder(header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost())), payload);
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
    if (!isPayloadWithType(payload)) return tokenUpdate(metadata, Payload.tokenUpdate(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new TokenUpdateHandler();
    return new TransactionBuilder(
        header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost(payload))),
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
    if (!isPayloadWithType(payload)) return deployModule(metadata, Payload.deployModule(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new DeployModuleHandler();
    return new TransactionBuilder(
        header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost(payload))),
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
    if (!isPayloadWithType(payload)) return registerData(metadata, Payload.registerData(payload));

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new RegisterDataHandler();
    return new TransactionBuilder(header(sender, nonce, expiry, Energy.create(handler.getBaseEnergyCost())), payload);
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
    if (!isPayloadWithType(payload))
        return initContract(metadata, Payload.initContract(payload), maxContractExecutionEnergy);

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new InitContractHandler();
    return new TransactionBuilder(
        header(
            sender,
            nonce,
            expiry,
            Energy.create(handler.getBaseEnergyCost({ ...payload, maxContractExecutionEnergy }))
        ),
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
    if (!isPayloadWithType(payload))
        return updateContract(metadata, Payload.updateContract(payload), maxContractExecutionEnergy);

    const { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) } = metadata;
    const handler = new UpdateContractHandler();
    return new TransactionBuilder(
        header(
            sender,
            nonce,
            expiry,
            Energy.create(handler.getBaseEnergyCost({ ...payload, maxContractExecutionEnergy }))
        ),
        payload
    );
}

// TODO: factor in v1 transaction
/**
 * Calculates the total energy cost for a transaction including signature and size costs.
 * @param header the transaction header with execution energy and number of signatures
 * @param payload the transaction payload
 * @returns the total energy cost
 */
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
export type Signed = AccountTransactionV0.Type;

/**
 * Signs a transaction using the provided signer, calculating total energy cost and creating a version 0 signed transaction.
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer containing keys and signature logic
 * @returns a promise resolving to the signed transaction
 */
// TODO: factor in v1 transaction
export async function sign(transaction: Transaction, signer: AccountSigner): Promise<Signed> {
    const { expiry, sender, nonce, numSignatures = signer.getSignatureCount() } = transaction.header;

    const energyAmount = getEnergyCost({ ...transaction, header: { ...transaction.header, numSignatures } });
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
    return Uint8Array.from(sha256([serializedAccountTransaction]));
}

/**
 * Serializes a signed transaction as a block item for submission to the chain.
 * @param signedTransaction the signed transaction to serialize
 * @returns the serialized block item as a byte array
 */
export function serializeBlockItem(signedTransaction: Signed): Uint8Array {
    return AccountTransactionV0.serializeBlockItem(signedTransaction);
}
