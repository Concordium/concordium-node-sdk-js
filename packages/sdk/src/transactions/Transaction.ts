import {
    AccountSigner,
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionInput,
    AccountTransactionSignature,
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
    MakeRequired,
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
import * as JSONBig from '../json-bigint.js';
import { AccountAddress, DataBlob, Energy, SequenceNumber, TransactionExpiry } from '../types/index.js';
import { countSignatures, isDefined, orUndefined } from '../util.js';
import { AccountTransactionV0, Payload } from './index.js';

// --- Core types ---

type HeaderJSON = {
    sender?: Base58String;
    nonce?: bigint;
    expiry?: number;
    executionEnergyAmount: bigint;
    numSignatures?: number;
};

/**
 * Transaction header for the intermediary state of account transactions, i.e. prior to being signing.
 */
export type Header = Partial<Metadata> & {
    /** a base energy amount, this amount excludes transaction size and signature costs */
    executionEnergyAmount: Energy.Type;
    /** The number of signatures the transaction can hold. If `undefined`, this will be defined at the time of signing. */
    numSignatures?: bigint;
};

function headerToJSON(header: Header): HeaderJSON {
    const json: HeaderJSON = {
        sender: header.sender?.toJSON(),
        nonce: header.nonce?.toJSON(),
        expiry: header.expiry?.toJSON(),
        executionEnergyAmount: header.executionEnergyAmount.value,
    };

    if (header.numSignatures !== undefined) {
        json.numSignatures = Number(header.numSignatures);
    }
    return json;
}

function headerFromJSON(json: HeaderJSON): Header {
    return {
        sender: orUndefined(AccountAddress.fromJSON)(json.sender),
        nonce: orUndefined(SequenceNumber.fromJSON)(json.nonce),
        expiry: orUndefined(TransactionExpiry.fromJSON)(json.expiry),
        executionEnergyAmount: Energy.create(json.executionEnergyAmount),
        numSignatures: orUndefined(BigInt)(json.numSignatures),
    };
}

type Transaction<P extends Payload.Type = Payload.Type> = {
    /**
     * The transaction input header.
     */
    readonly header: Header;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    readonly payload: P;
};

/**
 * Describes an account transaction in its unprocessed form, i.e. defining the input required
 * to create a transaction which can be signed
 */
export type Type<P extends Payload.Type = Payload.Type> = Transaction<P>;

export type JSON = {
    header: HeaderJSON;
    payload: Payload.JSON;
};

// --- Transaction construction ---

/**
 * Base metadata input with optional expiry field.
 */
export type Metadata = MakeOptional<AccountTransactionHeader, 'expiry'>;

type Builder<P extends Payload.Type> = Readonly<Transaction<P>> & {
    addMetadata<T extends Transaction<P>>(this: T, metadata: Metadata): Signable<P, T>;
    multiSig<T extends Transaction<P>>(this: T, numSignatures: number | bigint): MultiSig<P, T>;

    toJSON(): JSON;
};

type Initial<P extends Payload.Type = Payload.Type> = Builder<P> & {
    /**
     * The transaction input header of the initial transaction stage, i.e. without metadata.
     */
    readonly header: Pick<Header, 'executionEnergyAmount'>;
};

type Signable<P extends Payload.Type = Payload.Type, T extends Transaction<P> = Transaction<P>> = Omit<
    T,
    'addMetadata'
> & {
    /**
     * The transaction input header of the pre-signed transaction stage, i.e. with metadata.
     */
    readonly header: MakeRequired<Header, keyof Metadata>;
};

/**
 * Type predicate checking if the transaction is a _signable_ transaction.
 *
 * @template P extends Payload.Type
 * @param transaction - the transaction to check
 * @returns whether the transaction is a _signable transaction
 */
export function isSignable<P extends Payload.Type>(transaction: Transaction<P>): transaction is Signable<P> {
    const {
        header: { nonce, expiry, sender, executionEnergyAmount },
    } = transaction as Signable<P>;
    return isDefined(nonce) && isDefined(expiry) && isDefined(sender) && isDefined(executionEnergyAmount);
}

type MultiSig<P extends Payload.Type = Payload.Type, T extends Transaction<P> = Transaction<P>> = Omit<
    T,
    'multiSig'
> & {
    /**
     * The transaction input header of the multi-sig transaction stage, i.e. with the number of signatures
     * defined.
     */
    readonly header: MakeRequired<Header, 'numSignatures'>;
};

/**
 * Type predicate checking if the transaction is a _signable_ transaction.
 *
 * @template P extends Payload.Type
 * @param transaction - the transaction to check
 * @returns whether the transaction is a _signable transaction
 */
export function isMultiSig<P extends Payload.Type>(transaction: Transaction<P>): transaction is MultiSig<P> {
    const {
        header: { numSignatures },
    } = transaction as MultiSig<P>;
    return isDefined(numSignatures) && numSignatures > 1n;
}

type FullBuilder<P extends Payload.Type> = Builder<P>;

class TransactionBuilder<P extends Payload.Type = Payload.Type> implements FullBuilder<P> {
    constructor(
        public readonly header: Header,
        public readonly payload: P
    ) {}

    public addMetadata<T extends Transaction<P>>(
        this: T,
        { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata
    ): Signable<P, T> {
        this.header.sender = sender;
        this.header.nonce = nonce;
        this.header.expiry = expiry;
        return this as Signable<P, T>;
    }

    public multiSig<T extends Transaction<P>>(this: T, numSignatures: number | bigint): MultiSig<P, T> {
        this.header.numSignatures = BigInt(numSignatures);
        return this as MultiSig<P, T>;
    }

    public toJSON(): JSON {
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
 * Dynamic `Transaction` creation based on the given transaction `type`.
 *
 * NOTE: this does _not_ check the payload structure, and thus assumes that the `type` and `payload`
 * given actually match. If the transaction type is known, use the specialized creation functions
 * per transaction type instead.
 *
 * @param type - transaction type
 * @param payload - a transaction payload matching the transaction type.
 *
 * @returns The corresponding transaction
 *
 * @throws if transaction type is not currently supported.
 * @throws if transaction cannot be created due to mismatch between `type` and `payload`.
 */
export function create(type: AccountTransactionType, payload: AccountTransactionInput): Initial {
    switch (type) {
        case AccountTransactionType.Transfer:
            return transfer(payload as SimpleTransferPayload);
        case AccountTransactionType.TransferWithMemo:
            return transfer(payload as SimpleTransferWithMemoPayload);
        case AccountTransactionType.DeployModule:
            return deployModule(payload as DeployModulePayload);
        case AccountTransactionType.InitContract:
            const { maxContractExecutionEnergy: initEnergy, ...initPayload } = payload as InitContractInput;
            return initContract(initPayload, initEnergy);
        case AccountTransactionType.Update:
            const { maxContractExecutionEnergy: updateEnergy, ...updatePayload } = payload as UpdateContractInput;
            return updateContract(updatePayload, updateEnergy);
        case AccountTransactionType.UpdateCredentials:
            return updateCredentials(payload as UpdateCredentialsPayload);
        case AccountTransactionType.RegisterData:
            return registerData(payload as RegisterDataPayload);
        case AccountTransactionType.ConfigureDelegation:
            return configureDelegation(payload as ConfigureDelegationPayload);
        case AccountTransactionType.ConfigureBaker:
            return configureValidator(payload as ConfigureBakerPayload);
        case AccountTransactionType.TokenUpdate:
            return tokenUpdate(payload as TokenUpdatePayload);
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
export function fromLegacyAccountTransaction({ type, header, payload }: AccountTransaction): Signable {
    return create(type, payload).addMetadata(header);
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
 * Creates a transfer transaction with memo
 * @param payload the transfer payload containing recipient and amount and memo
 * @returns a transfer with memo transaction
 */
export function transfer(
    payload: SimpleTransferWithMemoPayload | Payload.TransferWithMemo
): Initial<Payload.TransferWithMemo>;

/**
 * Creates a transfer transaction with a memo.
 * @param payload the transfer payload containing recipient and amount
 * @param memo the transfer memo to include
 * @returns a transfer with memo transaction
 */
export function transfer(payload: SimpleTransferPayload, memo: DataBlob): Initial<Payload.TransferWithMemo>;

/**
 * Creates a transfer transaction
 * @param payload the transfer payload containing recipient and amount
 * @returns a transfer transaction
 */
export function transfer(payload: SimpleTransferPayload | Payload.Transfer): Initial<Payload.Transfer>;

export function transfer(
    payload: SimpleTransferPayload | SimpleTransferWithMemoPayload | Payload.Transfer | Payload.TransferWithMemo,
    memo?: DataBlob
): Initial<Payload.Transfer> | Initial<Payload.TransferWithMemo> {
    if (!isPayloadWithType(payload)) {
        // a little hacky, but at this point, the we don't care if the memo is defined or not, as the
        // Payload.transfer fuction will take care of the different cases here
        return transfer(Payload.transfer(payload, memo as any));
    }

    if (isWithMemo(payload)) {
        const handler = new SimpleTransferWithMemoHandler();
        return new TransactionBuilder<Payload.TransferWithMemo>(
            { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
            payload
        );
    }

    const handler = new SimpleTransferHandler();
    return new TransactionBuilder<Payload.Transfer>(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
        payload
    );
}

/**
 * Creates a transaction to update account credentials.
 * @param payload the credentials update payload
 * @returns an update credentials transaction
 */
export function updateCredentials(
    payload: UpdateCredentialsPayload | Payload.UpdateCredentials
): Initial<Payload.UpdateCredentials> {
    if (!isPayloadWithType(payload)) return updateCredentials(Payload.updateCredentials(payload));

    const handler = new UpdateCredentialsHandler();
    return new TransactionBuilder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) },
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
    payload: ConfigureBakerPayload | Payload.ConfigureValidator
): Initial<Payload.ConfigureValidator> {
    if (!isPayloadWithType(payload)) return configureValidator(Payload.configureValidator(payload));

    const handler = new ConfigureBakerHandler();
    return new TransactionBuilder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) },
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
    payload: ConfigureDelegationPayload | Payload.ConfigureDelegation
): Initial<Payload.ConfigureDelegation> {
    if (!isPayloadWithType(payload)) return configureDelegation(Payload.configureDelegation(payload));

    const handler = new ConfigureDelegationHandler();
    return new TransactionBuilder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) }, payload);
}

/**
 * Creates a transaction to update token parameters on chain.
 * @param payload the token update payload
 * @returns a token update transaction
 */
export function tokenUpdate(payload: TokenUpdatePayload | Payload.TokenUpdate): Initial<Payload.TokenUpdate> {
    if (!isPayloadWithType(payload)) return tokenUpdate(Payload.tokenUpdate(payload));

    const handler = new TokenUpdateHandler();
    return new TransactionBuilder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) },
        payload
    );
}

/**
 * Creates a transaction to deploy a smart contract module.
 * @param metadata transaction metadata including sender, nonce, and optional expiry (defaults to 5 minutes)
 * @param payload the module deployment payload containing the wasm module
 * @returns a deploy module transaction
 */
export function deployModule(payload: DeployModulePayload | Payload.DeployModule): Initial<Payload.DeployModule> {
    if (!isPayloadWithType(payload)) return deployModule(Payload.deployModule(payload));

    const handler = new DeployModuleHandler();
    return new TransactionBuilder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) },
        payload
    );
}

/**
 * Creates a transaction to register arbitrary data on chain.
 * @param payload the data registration payload
 * @returns a register data transaction
 */
export function registerData(payload: RegisterDataPayload | Payload.RegisterData): Initial<Payload.RegisterData> {
    if (!isPayloadWithType(payload)) return registerData(Payload.registerData(payload));

    const handler = new RegisterDataHandler();
    return new TransactionBuilder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) }, payload);
}

/**
 * Creates a transaction to initialize a smart contract instance.
 * @param payload the contract initialization payload with specified execution energy limit
 * @param maxContractExecutionEnergy the maximum amount of energy to spend on initializing the contract instance
 *
 * @returns an init contract transaction
 */
export function initContract(
    payload: InitContractPayload | Payload.InitContract,
    maxContractExecutionEnergy: Energy.Type
): Initial<Payload.InitContract> {
    if (!isPayloadWithType(payload)) return initContract(Payload.initContract(payload), maxContractExecutionEnergy);

    const handler = new InitContractHandler();
    return new TransactionBuilder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ ...payload, maxContractExecutionEnergy })) },
        payload
    );
}

/**
 * Creates a transaction to invoke an existing smart contract.
 * @param payload the contract update payload specifying the contract and receive function with specified execution energy limit
 * @param maxContractExecutionEnergy the maximum amount of energy to spend on updating the contract instance
 *
 * @returns an update contract transaction
 */
export function updateContract(
    payload: UpdateContractPayload | Payload.UpdateContract,
    maxContractExecutionEnergy: Energy.Type
): Initial<Payload.UpdateContract> {
    if (!isPayloadWithType(payload)) return updateContract(Payload.updateContract(payload), maxContractExecutionEnergy);

    const handler = new UpdateContractHandler();
    return new TransactionBuilder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ ...payload, maxContractExecutionEnergy })) },
        payload
    );
}

// TODO: factor in v1 transaction
/**
 * Calculates the total energy cost for a transaction including signature and size costs.
 * @param header the transaction header with execution energy and number of signatures. If the number of signatures is
 * `undefined`, it defaults to `1`.
 * @param payload the transaction payload
 *
 * @returns the total energy cost */
export function getEnergyCost({
    header: { numSignatures = 1n, executionEnergyAmount },
    payload,
}: Transaction): Energy.Type {
    return AccountTransactionV0.calculateEnergyCost(BigInt(numSignatures), payload, executionEnergyAmount);
}

type Unsigned = AccountTransactionV0.Unsigned;

function toUnsigned(transaction: Signable): Unsigned {
    const { expiry, sender, nonce, numSignatures = 1n } = transaction.header;

    const energyAmount = getEnergyCost({ ...transaction, header: { ...transaction.header, numSignatures } });
    const header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize: Payload.sizeOf(transaction.payload),
        energyAmount,
    };
    return {
        version: 0,
        header,
        payload: transaction.payload,
    };
}

type Signed<P extends Payload.Type = Payload.Type> = Signable<P> & {
    /**
     * The transaction input header of the signed transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    readonly header: Readonly<Required<Header>>;
    /**
     * The map of signatures for the credentials associated with the account.
     */
    readonly signature: AccountTransactionSignature;
};

/**
 * Type predicate checking if the transaction is a _signed_ transaction.
 *
 * @template P extends Payload.Type
 * @param transaction - the transaction to check
 * @returns whether the transaction is a _signed_ transaction
 */
export function isSigned<P extends Payload.Type>(transaction: Transaction<P>): transaction is Signed<P> {
    const { signature: signatures } = transaction as Signed<P>;
    return signatures !== undefined && countSignatures(signatures) > 0n;
}

/**
 * Adds a pre-computed signature to a signable transaction.
 *
 * @template P - the payload type
 * @template T - the signable transaction type
 *
 * @param transaction - the signable transaction to add a signature to
 * @param signature - the account transaction signature to add
 *
 * @returns the signed transaction with the signature attached
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export function addSignature<P extends Payload.Type = Payload.Type, T extends Signable<P> = Signable<P>>(
    transaction: T,
    signature: AccountTransactionSignature
): T & Signed<P> {
    const mapped: T & Omit<Signed<P>, 'signature'> = {
        ...transaction,
        header: { ...transaction.header, numSignatures: transaction.header.numSignatures ?? 1n },
    };
    const signed: T & Signed<P> = {
        ...mapped,
        signature,
    };

    const includedSigs = countSignatures(signed.signature);
    if (includedSigs > signed.header.numSignatures)
        throw new Error(
            `Too many signatures added to the transaction. Counted ${includedSigs}, but transaction specifies ${signed.header.numSignatures} allowed number of signatures.`
        );

    return signed;
}

/**
 * Signs a signable transaction using the provided account signer.
 *
 * @template P - the payload type
 * @template T - the signable transaction type
 *
 * @param transaction - the signable transaction to sign
 * @param signer - the account signer to use for signing
 *
 * @returns a promise that resolves to the signed transaction
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export async function sign<P extends Payload.Type = Payload.Type, T extends Signable<P> = Signable<P>>(
    transaction: T,
    signer: AccountSigner
): Promise<T & Signed<P>> {
    const mapped: T & Omit<Signed<P>, 'signature'> = {
        ...transaction,
        header: { ...transaction.header, numSignatures: transaction.header.numSignatures ?? 1n },
    };
    const unsigned = toUnsigned(mapped);
    const signature = await AccountTransactionV0.createSignature(unsigned, signer);
    return addSignature(mapped, signature);
}

/**
 * Merges signatures from two signed transactions into a single transaction.
 * Used for multi-signature scenarios where multiple parties sign the same transaction.
 *
 * @template P - the payload type
 * @template T - the signed transaction type
 *
 * @param a - the first signed transaction
 * @param b - the second signed transaction
 *
 * @returns a new transaction containing all signatures from both transactions
 * @throws Error if duplicate signatures are found for the same credential and key index
 * @throws Error if the number of signatures exceeds the allowed number specified in the transaction header
 */
export function mergeSignatures<P extends Payload.Type, T extends Signed<P> = Signed<P>>(a: T, b: T): T {
    const signature: AccountTransactionSignature = {};
    // First, we copy all the signatures from `a`.
    for (const credIndex in a.signature) {
        signature[credIndex] = { ...a.signature[credIndex] };
    }

    for (const credIndex in b.signature) {
        if (signature[credIndex] === undefined) {
            // If signatures don't exist for this credential index, we copy everything and move on.
            signature[credIndex] = { ...b.signature[credIndex] };
            continue;
        }

        // Otherwise, check all key indices of the credential signature
        for (const keyIndex in b.signature[credIndex]) {
            const sig = signature[credIndex][keyIndex];
            if (sig !== undefined)
                throw new Error(`Duplicate signature found for credential index ${credIndex} at key index ${keyIndex}`);

            // Copy the signature found, as it does not already exist
            signature[credIndex][keyIndex] = b.signature[credIndex][keyIndex];
        }
    }

    const includedSigs = countSignatures(signature);
    if (includedSigs > a.header.numSignatures)
        throw new Error(
            `Too many signatures added to the transaction. Counted ${includedSigs}, but transaction specifies ${a.header.numSignatures} allowed number of signatures.`
        );

    return { ...a, signature: signature };
}

/**
 * Converts a transaction to its intermediary JSON serializable representation.
 *
 * @param header the transaction header
 * @param payload the transaction payload
 * @returns the JSON representation
 */
export function toJSON(transaction: Transaction): JSON {
    return { header: headerToJSON(transaction.header), payload: Payload.toJSON(transaction.payload) };
}

/**
 * Converts a {@linkcode Transaction} to a JSON string.
 *
 * @param transaction - the transaction to convert
 * @returns the JSON string
 */
export function toJSONString(transaction: Transaction): string {
    return JSONBig.stringify(toJSON(transaction));
}

/**
 * Converts an intermediary JSON serializable representation created with {@linkcode toJSON} to a transaction.
 * @param json the JSON to convert
 * @returns the transaction
 */
export function fromJSON(json: JSON): Transaction {
    return { header: headerFromJSON(json.header), payload: Payload.fromJSON(json.payload) };
}

/**
 * Converts a JSON string transaction representation to a {@linkcode Transaction}.
 *
 * @param jsonString - the json string to convert
 *
 * @returns the parsed transaction
 */
export function fromJSONString(jsonString: string): Transaction {
    return fromJSON(JSONBig.parse(jsonString));
}

// --- Transaction signing ---

/**
 * A finalized account transaction, which is ready for submission.
 */
// TODO: factor in v1 transaction
export type Finalized = AccountTransactionV0.Type;
export type FinalizedJSON = AccountTransactionV0.JSON;

/**
 * Signs a transaction using the provided signer, calculating total energy cost and creating a _finalized transaction.
 *
 * This is the same as doing `Transaction.finalize(await Transaction.sign(transaction))`
 *
 * @param transaction the unsigned transaction to sign
 * @param signer the account signer containing keys and signature logic
 *
 * @returns a promise resolving to the signed transaction
 * @throws if too many signatures are included in the transaction
 */
// TODO: factor in v1 transaction
export async function signAndFinalize(transaction: Signable, signer: AccountSigner): Promise<Finalized> {
    const signed = await sign(transaction, signer);
    return finalize(signed);
}

/**
 * Finalizes a _signed_ transaction, creating a _finalized_ transaction which is ready for submission.
 *
 * @param transaction the signed transaction
 *
 * @returns a corresponding _finalized_ transaction
 * @throws if too many signatures are included in the transaction
 */
// TODO: factor in v1 transaction
export function finalize(transaction: Signed): Finalized {
    const includedSigs = countSignatures(transaction.signature);
    if (includedSigs > transaction.header.numSignatures)
        throw new Error(
            `Too many signatures added to the transaction. Counted ${includedSigs}, but transaction specifies ${transaction.header.numSignatures} allowed number of signatures.`
        );

    return AccountTransactionV0.create(toUnsigned(transaction), transaction.signature);
}

/**
 * Converts a _signed_ transaction to its intermediary JSON serializable representation.
 *
 * @param header the transaction header
 * @param payload the transaction payload
 * @returns the JSON representation
 */
export function finalizedToJSON(transaction: Finalized): FinalizedJSON {
    return AccountTransactionV0.toJSON(transaction);
}

/**
 * Converts a {@linkcode Finalized} to a JSON string.
 *
 * @param transaction - the transaction to convert
 * @returns the JSON string
 */
export function finalizedToJSONString(transaction: Finalized): string {
    return JSONBig.stringify(finalizedToJSON(transaction));
}

/**
 * Converts an intermediary JSON serializable representation created with {@linkcode finalizedToJSON} to a _finalized_ transaction.
 * @param json the JSON to convert
 * @returns the finalized transaction
 */
export function finalizedFromJSON(json: FinalizedJSON): Finalized {
    return AccountTransactionV0.fromJSON(json);
}

/**
 * Converts a JSON string _finalized_ transaction representation to a {@linkcode Finalized}.
 *
 * @param jsonString - the json string to convert
 *
 * @returns the parsed finalized transaction
 */
export function finalizedFromJSONString(jsonString: string): Finalized {
    return finalizedFromJSON(JSONBig.parse(jsonString));
}

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 * @param signedTransaction the transaction to hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header, type and payload
 */
export function getAccountTransactionHash(signedTransaction: Finalized): Uint8Array {
    const serializedAccountTransaction = AccountTransactionV0.serialize(signedTransaction);
    return Uint8Array.from(sha256([serializedAccountTransaction]));
}

/**
 * Serializes a signed transaction as a block item for submission to the chain.
 * @param signedTransaction the signed transaction to serialize
 * @returns the serialized block item as a byte array
 */
export function serializeBlockItem(signedTransaction: Finalized): Uint8Array {
    return AccountTransactionV0.serializeBlockItem(signedTransaction);
}
