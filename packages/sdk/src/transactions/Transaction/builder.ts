import {
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
    UpdateCredentialsInput,
    UpdateCredentialsPayload,
} from '../../index.js';
import * as JSONBig from '../../json-bigint.js';
import { AccountAddress, DataBlob, Energy, TransactionExpiry } from '../../types/index.js';
import { assertIn, isDefined } from '../../util.js';
import { AccountTransactionV0, AccountTransactionV1, Payload } from '../index.js';
import { Header, HeaderJSON, headerFromJSON, headerToJSON } from './shared.js';
import { type Signable, SignableJSON, SignableV0, SignableV1, isSignable, signableToJSON } from './signable.js';

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

export type Type<P extends Payload.Type = Payload.Type> = Transaction<P>;

export type BuilderJSON = {
    header: HeaderJSON;
    payload: Payload.JSON;
};

export type JSON = BuilderJSON | SignableJSON;

// --- Transaction construction ---

/**
 * Base metadata input with optional expiry field.
 */
export type Metadata = MakeOptional<AccountTransactionHeader, 'expiry'>;

type Initial<P extends Payload.Type = Payload.Type> = BuilderAPI<P> & {
    /**
     * The transaction input header of the initial transaction stage, i.e. without metadata.
     */
    readonly header: Pick<Header, 'executionEnergyAmount'>;
};

type ConfiguredAPI<P extends Payload.Type> = {
    /**
     * Adds metadata (sender, nonce, expiry) to the transaction, making it configured and ready to be signed.
     *
     * @template T - the transaction builder type
     * @param metadata - transaction metadata including sender, nonce, and optionally expiry
     *
     * @returns a signable transaction with metadata attached
     * @throws if transaction metadata already exists.
     */
    addMetadata<T extends Transaction<P>>(this: T, metadata: Metadata): Configured<P, T>;
    /**
     * Attempts to convert a builder to a _configured_ builder. This is useful in case type information is lost
     * during (de)serialization.
     *
     * @example
     * const tx = Transaction.transfer(...).addMetadata(...);
     * const json = Transaction.fromJSON(Transaction.toJSON(t));
     * const rebuilt = builder(json).configured();
     *
     * @template T - the transaction builder type
     * @returns a _configured transaction builder if the transaction is properly configured to be buildable. Otherwise
     * returns `undefined`.
     */
    configured<T extends Transaction<P>>(this: T): Configured<P, T> | undefined;
};

type Configured<P extends Payload.Type = Payload.Type, T extends Transaction<P> = Transaction<P>> = Omit<
    T,
    keyof ConfiguredAPI<P> | 'header'
> & {
    /**
     * The transaction input header of the pre-signed transaction stage, i.e. with metadata.
     */
    readonly header: MakeRequired<T['header'], keyof Metadata>;
};

/**
 * Type predicate checking if the transaction is a _configured_ transaction.
 *
 * @template P extends Payload.Type
 * @param transaction - the transaction to check
 * @returns whether the transaction is a _configured_ transaction
 */
export function isConfigured<P extends Payload.Type>(transaction: Transaction<P>): transaction is Configured<P> {
    const {
        header: { nonce, expiry, sender, executionEnergyAmount },
    } = transaction as Configured<P>;
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
     * NOTE: this can be used from protocol version 10.
     *
     * @template T - the transaction builder type
     * @param account - the sponsor account to use for sponsorring the transaction.
     * @param [numSignaturesSponsor] - the number of signatures required to authorize this transaction. Defaults to `1` for if not specified.
     *
     * @returns a sponsorable transaction
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

/**
 * Describes an account transaction in its unprocessed form, i.e. defining the input required
 * to create a transaction which can be signed
 */
type BuilderAPI<P extends Payload.Type = Payload.Type> = Readonly<Transaction<P>> &
    ConfiguredAPI<P> &
    MultiSigAPI<P> &
    SponsorableAPI<P> & {
        /**
         * Build the transaction to it's pre-finalized stage.
         */
        build(this: Sponsorable<P> & Configured<P>): SignableV1<P>;
        build(this: Configured<P>): Signable<P>;
        /**
         * Serializes the transaction to JSON format.
         *
         * @returns the JSON representation of the transaction
         */
        toJSON(): BuilderJSON;
    };

/**
 * Type predicate checking if the transaction is a _signable_ transaction.
 *
 * @template P extends Payload.Type
 * @param transaction - the transaction to check
 * @returns whether the transaction is a _signable transaction
 */
export function isSponsorable<P extends Payload.Type>(transaction: Transaction<P>): transaction is Sponsorable<P> {
    return 'sponsor' in transaction.header && isDefined(transaction.header.sponsor);
}

/**
 * Describes an account transaction in its unprocessed form, i.e. defining the input required
 * to create a transaction which can be signed
 */
export class Builder<P extends Payload.Type = Payload.Type> implements BuilderAPI<P> {
    constructor(
        public readonly header: Header,
        public readonly payload: P
    ) {}

    public addMetadata<T extends Transaction<P>>(
        this: T,
        { sender, nonce, expiry = TransactionExpiry.futureMinutes(5) }: Metadata
    ): Configured<P, T> {
        if ([this.header.sender, this.header.nonce, this.header.expiry].every(isDefined))
            throw new Error('Number of transaction metadata has already been specified.');

        this.header.sender = sender;
        this.header.nonce = nonce;
        this.header.expiry = expiry;

        return this as Configured<P, T>;
    }

    public configured<T extends Transaction<P>>(this: T): Configured<P, T> | undefined {
        if (isConfigured(this)) {
            return this as Configured<P, T>;
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

    /**
     * Build the transaction to it's pre-finalized stage.
     */
    public build(this: Sponsorable<P> & Configured<P>): SignableV1<P>;
    public build(this: Configured<P>): SignableV0<P>;
    public build(this: Configured<P>): Signable<P> {
        const {
            header: { numSignatures = 1n },
            payload,
        } = this;
        const header = { ...this.header, numSignatures };

        if (isSponsorable(this)) {
            return { version: 1, header, payload, signatures: { sender: {} } };
        }
        return { version: 0, header, payload, signature: {} };
    }

    /**
     * Serializes the transaction to JSON format.
     *
     * @returns the JSON representation of the transaction
     */
    public toJSON(): BuilderJSON {
        return toJSON(this);
    }
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
            const { currentNumberOfCredentials, ...credPayload } = payload as UpdateCredentialsInput;
            return updateCredentials(credPayload, currentNumberOfCredentials);
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
export function fromLegacyAccountTransaction({ type, header, payload }: AccountTransaction): Configured {
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
        return new Builder<Payload.TransferWithMemo>(
            { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) },
            payload
        );
    }

    const handler = new SimpleTransferHandler();
    return new Builder<Payload.Transfer>(
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
    payload: UpdateCredentialsPayload | Payload.UpdateCredentials,
    currentNumberOfCredentials: bigint
): Initial<Payload.UpdateCredentials> {
    //TODO: double check with Soren here, isn't current number of credentials actually a total that we get from chain?
    if (!isPayloadWithType(payload))
        return updateCredentials(Payload.updateCredentials(payload), currentNumberOfCredentials);

    const handler = new UpdateCredentialsHandler();
    return new Builder(
        { executionEnergyAmount: Energy.create(handler.getBaseEnergyCost({ ...payload, currentNumberOfCredentials })) },
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
    return new Builder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) }, payload);
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
    return new Builder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) }, payload);
}

/**
 * Creates a transaction to update token parameters on chain.
 * @param payload the token update payload
 * @returns a token update transaction
 */
export function tokenUpdate(payload: TokenUpdatePayload | Payload.TokenUpdate): Initial<Payload.TokenUpdate> {
    if (!isPayloadWithType(payload)) return tokenUpdate(Payload.tokenUpdate(payload));

    const handler = new TokenUpdateHandler();
    return new Builder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) }, payload);
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
    return new Builder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost(payload)) }, payload);
}

/**
 * Creates a transaction to register arbitrary data on chain.
 * @param payload the data registration payload
 * @returns a register data transaction
 */
export function registerData(payload: RegisterDataPayload | Payload.RegisterData): Initial<Payload.RegisterData> {
    if (!isPayloadWithType(payload)) return registerData(Payload.registerData(payload));

    const handler = new RegisterDataHandler();
    return new Builder({ executionEnergyAmount: Energy.create(handler.getBaseEnergyCost()) }, payload);
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
    return new Builder(
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
    return new Builder(
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

export function builderFromJSON(json: unknown): BuilderAPI {
    assertIn<BuilderJSON>(json, 'header');
    assertIn<BuilderJSON>(json, 'payload');

    const header = headerFromJSON(json.header);
    const payload = Payload.fromJSON(json.payload);
    return new Builder(header, payload);
}

/**
 * Converts a transaction to its intermediary JSON serializable representation.
 *
 * @param header the transaction header
 * @param payload the transaction payload
 * @returns the JSON representation
 */
export function toJSON(transaction: BuilderAPI): BuilderJSON;
export function toJSON(transaction: Signable): SignableJSON;
export function toJSON(transaction: Transaction): SignableJSON;

export function toJSON(transaction: Transaction): JSON {
    if (isSignable(transaction)) {
        return signableToJSON(transaction);
    }
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
 * Converts a JSON string transaction representation to a {@linkcode Transaction}.
 *
 * @param jsonString - the json string to convert
 * @param fromJSON - a function to convert the intermediary value parsed.
 *
 * @returns the parsed transaction
 *
 * @example
 * const builder = Transaction.fromJSONString(jsonString, Transaction.builderFromJSON);
 */
export function fromJSONString<R extends Transaction>(jsonString: string, fromJSON: (json: unknown) => R): R {
    return fromJSON(JSONBig.parse(jsonString));
}
