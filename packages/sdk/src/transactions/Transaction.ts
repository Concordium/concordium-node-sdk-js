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
} from '../index.js';
import * as JSONBig from '../json-bigint.js';
import { AccountAddress, DataBlob, Energy, SequenceNumber, TransactionExpiry } from '../types/index.js';
import { countSignatures, isDefined, orUndefined } from '../util.js';
import { AccountTransactionV0, AccountTransactionV1, Payload } from './index.js';

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
    sponsor?: SponsorDetails;
};

type SponsorDetails = {
    account: AccountAddress.Type;
    /** The number of signatures the transaction can hold. */
    numSignatures: bigint;
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

type Initial<P extends Payload.Type = Payload.Type> = Builder<P> & {
    /**
     * The transaction input header of the initial transaction stage, i.e. without metadata.
     */
    readonly header: Pick<Header, 'executionEnergyAmount'>;
};

type SignableAPI<P extends Payload.Type> = {
    /**
     * Adds metadata (sender, nonce, expiry) to the transaction, making it signable.
     *
     * @template T - the transaction builder type
     * @param metadata - transaction metadata including sender, nonce, and optionally expiry
     *
     * @returns a signable transaction with metadata attached
     * @throws if transaction metadata already exists.
     */
    addMetadata<T extends Transaction<P>>(this: T, metadata: Metadata): Signable<P, T>;
    /**
     * Attempts to convert a builder to a signable configured builder. This is useful in case type information is lost
     * during (de)serialization.
     *
     * @example
     * const tx = Transaction.transfer(...).addMetadata(...);
     * const json = Transaction.fromJSON(Transaction.toJSON(t));
     * const rebuilt = builder(json).signable();
     *
     * @template T - the transaction builder type
     * @returns a _signable_ transaction builder if the transaction is properly configured to be signable. Otherwise
     * returns `undefined`.
     */
    signable<T extends Transaction<P>>(this: T): Signable<P, T> | undefined;
};

type Signable<P extends Payload.Type = Payload.Type, T extends Transaction<P> = Transaction<P>> = Omit<
    T,
    keyof SignableAPI<P> | 'header'
> & {
    /**
     * The transaction input header of the pre-signed transaction stage, i.e. with metadata.
     */
    readonly header: MakeRequired<T['header'], keyof Metadata>;
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

type MultiSigAPI<P extends Payload.Type> = {
    /**
     * Configures the transaction for multi-signature by specifying the number of signatures required.
     *
     * @template T - the transaction builder type
     * @param numSignaturesSender - the number of signatures required from the `sender` to authorize this transaction
     *
     * @returns a multi-sig transaction with the signature count configured
     * @throws if number of sender signatures have already been added.
     */
    addMultiSig<T extends Transaction<P>>(this: T, numSignaturesSender: number | bigint): MultiSig<P, T>;
    /**
     * Attempts to convert a builder to a multi-sig configured builder. This is useful in case type information is lost
     * during (de)serialization.
     *
     * @example
     * const tx = Transaction.transfer(...).addMultiSig(4);
     * const json = Transaction.fromJSON(Transaction.toJSON(t));
     * const rebuilt = builder(json).multiSig();
     *
     * @template T - the transaction builder type
     * @returns a multi-sig transaction builder if the transaction is properly configured for multi-sig. Otherwise
     * returns `undefined`.
     */
    multiSig<T extends Transaction<P>>(this: T): MultiSig<P, T> | undefined;
};

type MultiSig<P extends Payload.Type = Payload.Type, T extends Transaction<P> = Transaction<P>> = Omit<
    T,
    keyof MultiSigAPI<P> | 'header'
> & {
    /**
     * The transaction input header of the multi-sig transaction stage, i.e. with the number of signatures
     * defined.
     */
    readonly header: MakeRequired<T['header'], 'numSignatures'>;
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

type SponsorableAPI<P extends Payload.Type> = {
    /**
     * Configures the transaction for sponsorring by specifying the sponsor account.
     *
     * @template T - the transaction builder type
     * @param account - the sponsor account to use for sponsorring the transaction.
     * @param [numSignaturesSponsor] - the number of signatures required to authorize this transaction. Defaults to `1` for if not specified.
     *
     * @returns a sponsorred transaction
     * @throws if sponsor details already exits.
     */
    addSponsor<T extends Transaction<P>>(
        this: T,
        account: AccountAddress.Type,
        numSignaturesSponsor?: number | bigint
    ): Sponsorable<P, T>;
    /**
     * Attempts to convert a builder to a multi-sig configured builder. This is useful in case type information is lost
     * during (de)serialization.
     *
     * @example
     * const tx = Transaction.transfer(...).addMultiSig(4);
     * const json = Transaction.fromJSON(Transaction.toJSON(t));
     * const rebuilt = builder(json).multiSig();
     *
     * @template T - the transaction builder type
     * @returns a multi-sig transaction builder if the transaction is properly configured for multi-sig. Otherwise
     * returns `undefined`.
     */
    sponsorable<T extends Transaction<P>>(this: T): Sponsorable<P, T> | undefined;
};

type Sponsorable<P extends Payload.Type = Payload.Type, T extends Transaction<P> = Transaction<P>> = Omit<
    T,
    keyof SponsorableAPI<P> | keyof MultiSigAPI<P> | 'header'
> & {
    /**
     * The transaction input header of the sponsorable transaction stage, i.e. with the sponsor details and
     * the number of signatures defined.
     */
    readonly header: MakeRequired<T['header'], 'sponsor' | 'numSignatures'>;
};

type Builder<P extends Payload.Type> = Readonly<Transaction<P>> &
    SignableAPI<P> &
    MultiSigAPI<P> &
    SponsorableAPI<P> & {
        /**
         * Build the transaction to it's pre-finalized stage.
         */
        build(this: Signable<P>): PreFinalized<P>;
        /**
         * Serializes the transaction to JSON format.
         *
         * @returns the JSON representation of the transaction
         */
        toJSON(): JSON;
    };

/**
 * Type predicate checking if the transaction is a _signable_ transaction.
 *
 * @template P extends Payload.Type
 * @param transaction - the transaction to check
 * @returns whether the transaction is a _signable transaction
 */
export function isSponsorable<P extends Payload.Type>(transaction: Transaction<P>): transaction is Sponsorable<P> {
    const {
        header: { numSignatures },
    } = transaction as Sponsorable<P>;
    return isDefined(numSignatures) && numSignatures > 1n;
}

class TransactionBuilder<P extends Payload.Type = Payload.Type> implements Builder<P> {
    constructor(
        public readonly header: Header,
        public readonly payload: P
    ) {}

    public addMetadata<T extends Transaction<P>>(
        this: T,
        { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata
    ): Signable<P, T> {
        if ([this.header.sender, this.header.nonce, this.header.expiry].every(isDefined))
            throw new Error('Number of transaction metadata has already been specified.');

        this.header.sender = sender;
        this.header.nonce = nonce;
        this.header.expiry = expiry;

        return this as Signable<P, T>;
    }

    public signable<T extends Transaction<P>>(this: T): Signable<P, T> | undefined {
        if (isSignable(this)) {
            return this as Signable<P, T>;
        }
    }

    public addMultiSig<T extends Transaction<P>>(this: T, numSignaturesSender: number | bigint): MultiSig<P, T> {
        if (this.header.numSignatures !== undefined)
            throw new Error('Number of transaction sender signatures has already been specified.');

        this.header.numSignatures = BigInt(numSignaturesSender);
        return this as MultiSig<P, T>;
    }

    public multiSig<T extends Transaction<P>>(this: T): MultiSig<P, T> | undefined {
        if (isMultiSig(this)) {
            return this as MultiSig<P, T>;
        }
    }

    public addSponsor<T extends Transaction<P>>(
        this: T,
        account: AccountAddress.Type,
        numSignaturesSponsor: number | bigint = 1
    ): Sponsorable<P, T> {
        if (this.header.sponsor !== undefined)
            throw new Error('Number of transaction sponsor details have already been specified.');

        this.header.numSignatures = this.header.numSignatures ?? 1n;
        this.header.sponsor = { account, numSignatures: BigInt(numSignaturesSponsor) };

        return this as Sponsorable<P, T>;
    }

    public sponsorable<T extends Transaction<P>>(this: T): Sponsorable<P, T> | undefined {
        if (isSponsorable(this)) {
            return this as Sponsorable<P, T>;
        }
    }

    build(this: Signable<P, Transaction<P>>): PreFinalized<P> {
        const {
            header: { numSignatures = 1n },
            payload,
        } = this;
        const header = { ...this.header, numSignatures };

        if (isSponsorable(this)) {
            return { preVersion: 1, header, payload, signatures: { sender: {} } };
        }
        return { preVersion: 0, header, payload, signature: {} };
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

/**
 * Calculates the total energy cost for a transaction including signature and size costs.
 * @param header the transaction header with execution energy and number of signatures. If the number of signatures is
 * `undefined`, it defaults to `1`.
 * @param payload the transaction payload
 *
 * @returns the total energy cost */
export function getEnergyCost({
    header: { numSignatures = 1n, executionEnergyAmount, sponsor },
    payload,
}: Transaction): Energy.Type {
    switch (true) {
        case isDefined(sponsor):
            const numSigs = numSignatures + (sponsor?.numSignatures ?? 0n);
            const config = { sponsor: isDefined(sponsor) };
            return AccountTransactionV1.calculateEnergyCost(numSigs, payload, executionEnergyAmount, config);
    }
    return AccountTransactionV0.calculateEnergyCost(numSignatures, payload, executionEnergyAmount);
}

// --- Transaction signing/finalization ---

type Unsigned = AccountTransactionV0.Unsigned | AccountTransactionV1.Unsigned;

function toUnsigned(transaction: PreV1): AccountTransactionV1.Unsigned;
function toUnsigned(transaction: PreV0): AccountTransactionV0.Unsigned;
function toUnsigned(transaction: PreFinalized): Unsigned;

function toUnsigned(transaction: PreFinalized): Unsigned {
    const { expiry, sender, nonce, numSignatures = 1n } = transaction.header;
    const energyAmount = getEnergyCost({ ...transaction, header: { ...transaction.header, numSignatures } });

    if (transaction.preVersion === 1) {
        const v1Header: AccountTransactionV1.Header = {
            expiry,
            sender,
            nonce,
            payloadSize: Payload.sizeOf(transaction.payload),
            energyAmount,
            sponsor: transaction.header.sponsor?.account,
        };
        return {
            version: 1,
            header: v1Header,
            payload: transaction.payload,
        };
    }

    const v0Header: AccountTransactionV0.Header = {
        expiry,
        sender,
        nonce,
        payloadSize: Payload.sizeOf(transaction.payload),
        energyAmount,
    };
    return {
        version: 0,
        header: v0Header,
        payload: transaction.payload,
    };
}

type PreFinalized<P extends Payload.Type = Payload.Type> = PreV0<P> | PreV1<P>;

type PreV0<P extends Payload.Type = Payload.Type> = {
    preVersion: 0;
    /**
     * The transaction input header of the v0 pre-finalized transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    readonly header: Required<Pick<Header, 'sender' | 'nonce' | 'expiry' | 'executionEnergyAmount' | 'numSignatures'>>;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    readonly payload: P;
    /**
     * The map of signatures for the credentials associated with the account.
     */
    readonly signature: AccountTransactionSignature;
};

type PreV1<P extends Payload.Type = Payload.Type> = {
    preVersion: 1;
    /**
     * The transaction input header of the v1 pre-finalized transaction stage, i.e. with everything required to finalize the
     * transaction.
     */
    readonly header: MakeRequired<Header, keyof PreV0['header']>;
    /**
     * The transaction payload, defining the transaction type and type specific data.
     */
    readonly payload: P;
    /**
     * The signatures for both `sender` and `sponsor`.
     */
    readonly signatures: AccountTransactionV1.Signatures;
};

function validateSignatureAmount(
    signature: AccountTransactionSignature,
    numAllowed: bigint,
    role: 'sender' | 'sponsor' = 'sender'
): void {
    const sigs = countSignatures(signature);
    if (sigs > numAllowed)
        throw new Error(
            `Too many ${role} signatures added to the transaction. Counted ${sigs}, but transaction specifies ${numAllowed} allowed number of signatures.`
        );
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
export function addSignature<P extends Payload.Type = Payload.Type>(
    transaction: PreFinalized<P>,
    signature: AccountTransactionSignature
): PreFinalized<P> {
    switch (transaction.preVersion) {
        case 0: {
            const signed: PreV0<P> = {
                ...transaction,
                signature,
            };

            return mergeSignatures(transaction, signed);
        }
        case 1: {
            const signed: PreV1<P> = {
                ...transaction,
                signatures: { sender: signature },
            };

            return mergeSignatures(transaction, signed);
        }
    }
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
export async function sign<P extends Payload.Type = Payload.Type>(
    transaction: PreFinalized<P>,
    signer: AccountSigner
): Promise<PreFinalized<P>> {
    let signature: AccountTransactionSignature;
    switch (transaction.preVersion) {
        case 0: {
            signature = await AccountTransactionV0.createSignature(toUnsigned(transaction), signer);
            break;
        }
        case 1: {
            signature = await AccountTransactionV1.createSignature(toUnsigned(transaction), signer);
            break;
        }
    }

    return addSignature(transaction, signature);
}

function mergeSignature(a: AccountTransactionSignature, b: AccountTransactionSignature): AccountTransactionSignature;
function mergeSignature(
    a: AccountTransactionSignature | undefined,
    b: AccountTransactionSignature | undefined
): AccountTransactionSignature | undefined;

function mergeSignature(
    a: AccountTransactionSignature | undefined,
    b: AccountTransactionSignature | undefined
): AccountTransactionSignature | undefined {
    if (a === undefined) return b;
    if (b === undefined) return a;

    const signature: AccountTransactionSignature = {};
    // First, we copy all the signatures from `a`.
    for (const credIndex in a) {
        signature[credIndex] = { ...a[credIndex] };
    }

    for (const credIndex in b) {
        if (signature[credIndex] === undefined) {
            // If signatures don't exist for this credential index, we copy everything and move on.
            signature[credIndex] = { ...b[credIndex] };
            continue;
        }

        // Otherwise, check all key indices of the credential signature
        for (const keyIndex in b[credIndex]) {
            const sig = signature[credIndex][keyIndex];
            if (sig !== undefined)
                throw new Error(`Duplicate signature found for credential index ${credIndex} at key index ${keyIndex}`);

            // Copy the signature found, as it does not already exist
            signature[credIndex][keyIndex] = b[credIndex][keyIndex];
        }
    }

    return signature;
}

/**
 * Merges signatures from two pre-finalized transactions into a single transaction.
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
export function mergeSignatures<P extends Payload.Type, T extends PreFinalized<P> = PreFinalized<P>>(a: T, b: T): T {
    if (a.preVersion !== b.preVersion) throw new Error('"a" is incompatible with "b"');

    switch (a.preVersion) {
        case 0: {
            const signature: AccountTransactionSignature = mergeSignature(a.signature, (b as PreV0).signature);
            validateSignatureAmount(signature, a.header.numSignatures);
            return { ...a, signature: signature };
        }
        case 1: {
            const bv1 = b as PreV1;
            const sender = mergeSignature(a.signatures.sender, bv1.signatures.sender);
            const sponsor = mergeSignature(a.signatures.sponsor, bv1.signatures.sponsor);

            validateSignatureAmount(sender, a.header.numSignatures);
            validateSignatureAmount(sponsor ?? {}, a.header.sponsor?.numSignatures ?? 0n);

            return { ...a, signatures: { sender, sponsor } };
        }
    }
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

/**
 * A finalized account transaction, which is ready for submission.
 */
export type Finalized = AccountTransactionV0.Type | AccountTransactionV1.Type;

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
export async function signAndFinalize(transaction: PreFinalized, signer: AccountSigner): Promise<Finalized> {
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
export function finalize(transaction: PreFinalized): Finalized {
    switch (transaction.preVersion) {
        case 0:
            return AccountTransactionV0.create(toUnsigned(transaction), transaction.signature);
        case 1:
            return AccountTransactionV1.create(toUnsigned(transaction), transaction.signatures);
    }
}

/**
 * Gets the transaction hash that is used to look up the status of a transaction.
 * @param transaction the transaction to hash
 * @returns the sha256 hash of the serialized block item kind, signatures, header, type and payload
 */
export function getAccountTransactionHash(transaction: Finalized): Uint8Array {
    switch (transaction.version) {
        case 0:
            return AccountTransactionV0.getAccountTransactionHash(transaction);
        case 1:
            return AccountTransactionV1.getAccountTransactionHash(transaction);
    }
}

/**
 * Serializes a signed transaction as a block item for submission to the chain.
 * @param transaction the signed transaction to serialize
 * @returns the serialized block item as a byte array
 */
export function serializeBlockItem(transaction: Finalized): Uint8Array {
    switch (transaction.version) {
        case 0:
            return AccountTransactionV0.serializeBlockItem(transaction);
        case 1:
            return AccountTransactionV1.serializeBlockItem(transaction);
    }
}
