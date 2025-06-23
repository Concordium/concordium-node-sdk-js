import { Buffer } from 'buffer/index.js';
import { stringify } from 'json-bigint';

import { ConcordiumGRPCClient } from './grpc/GRPCClient.js';
import { AccountSigner, signTransaction } from './signHelpers.js';
import {
    AccountTransactionType,
    Base64String,
    HexString,
    InstanceInfo,
    InvokeContractResult,
    MakeOptional,
    SmartContractTypeValues,
    UpdateContractPayload,
} from './types.js';
import * as AccountAddress from './types/AccountAddress.js';
import * as BlockHash from './types/BlockHash.js';
import * as CcdAmount from './types/CcdAmount.js';
import * as ContractAddress from './types/ContractAddress.js';
import * as ContractName from './types/ContractName.js';
import * as Energy from './types/Energy.js';
import * as EntrypointName from './types/EntrypointName.js';
import * as ModuleReference from './types/ModuleReference.js';
import * as Parameter from './types/Parameter.js';
import * as ReceiveName from './types/ReceiveName.js';
import * as ReturnValue from './types/ReturnValue.js';
import * as TransactionExpiry from './types/TransactionExpiry.js';
import * as TransactionHash from './types/TransactionHash.js';

/**
 * Metadata necessary for smart contract transactions
 */
export type ContractTransactionMetadata = {
    /** Amount to include in the transaction. Defaults to 0 */
    amount?: CcdAmount.Type;
    /** The sender address of the transaction */
    senderAddress: AccountAddress.Type;
    /** Expiry date of the transaction. Defaults to 5 minutes in the future */
    expiry?: TransactionExpiry.Type;
    /** Max energy to be used for the transaction */
    energy: Energy.Type;
};

/**
 * Metadata necessary for invocating a smart contract.
 */
export type ContractInvokeMetadata = {
    /** Amount to include in the transaction. Defaults to 0 */
    amount?: CcdAmount.Type;
    /**
     * Invoker of the contract.
     * If this is not supplied then the contract will be invoked by an account with address 0,
     * no credentials and sufficient amount of CCD to cover the transfer amount.
     * If given, the relevant address (either account or contract) must exist in the blockstate.
     */
    invoker?: ContractAddress.Type | AccountAddress.Type;
    /** Max energy to be used for the transaction, if not provided the max energy is used. */
    energy?: Energy.Type;
};

/**
 * Metadata necessary for creating a {@link UpdateTransaction}
 */
export type CreateContractTransactionMetadata = Pick<ContractTransactionMetadata, 'amount' | 'energy'>;

/**
 * Holds either a contract module schema, or the schema for a single parameters of a contract entrypoint
 */
export type ContractSchema = {
    /** Base64 encoded schema for the parameter type */
    value: Base64String;
    /** Type of the schema */
    type: 'parameter' | 'module';
};

/**
 * An update transaction without header.
 */
export type ContractUpdateTransaction = {
    /** The type of the transaction, which will always be of type {@link AccountTransactionType.Update} */
    type: AccountTransactionType.Update;
    /** The payload of the transaction, which will always be of type {@link UpdateContractPayload} */
    payload: UpdateContractPayload;
};

/**
 * An update transaction without header, including schema information.
 * This is useful for sending through a wallet, which supplies the header information.
 *
 * @template J - The type of the parameter formatted as JSON compatible with the corresponding contract schema
 */
export type ContractUpdateTransactionWithSchema<J extends SmartContractTypeValues = SmartContractTypeValues> =
    ContractUpdateTransaction & {
        /** Parameter of the update */
        parameter: {
            /** Hex encoded parameter for the update */
            hex: HexString;
            /** JSON representation of the parameter to be used with the corresponding contract schema */
            json: J;
        };
        /** The schema needed to serialize the parameter */
        schema: ContractSchema;
    };

/**
 * Default expiry date used for contract update transactions.
 */
export function getContractUpdateDefaultExpiryDate(): TransactionExpiry.Type {
    return TransactionExpiry.futureMinutes(5);
}

/**
 * Defines methods for performing dry-run invocations of updates on a Contract with entrypoints `E`
 *
 * @template E - union of entrypoints
 */
export class ContractDryRun<E extends string = string> {
    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress.Type,
        protected contractName: ContractName.Type
    ) {}

    /**
     * Performs a dry-run of a contract entrypoint invocation.
     * Useful for getting an indication of the result of an invocation of the entrypoint (e.g. getting a cost estimate).
     *
     * @template T - The type of the input given
     *
     * @param {EntrypointName.Type} entrypoint - The name of the receive function to invoke.
     * @param {ContractInvokeMetadata | ContractAddress | AccountAddress.Type} metaOrInvoker - Metadata for contract invocation of the address of the invoker.
     * @param {Function} serializer - A function for serializing the input to bytes.
     * @param {T} input - Input for for contract function.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public invokeMethod<T>(
        entrypoint: EntrypointName.Type<E>,
        metaOrInvoker: ContractInvokeMetadata | ContractAddress.Type | AccountAddress.Type,
        serializer: (input: T) => ArrayBuffer,
        input: T,
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const parameter = Parameter.fromBuffer(serializer(input));
        const meta =
            AccountAddress.instanceOf(metaOrInvoker) || ContractAddress.instanceOf(metaOrInvoker)
                ? { invoker: metaOrInvoker }
                : metaOrInvoker;
        return this.grpcClient.invokeContract(
            {
                ...meta,
                contract: this.contractAddress,
                parameter,
                method: ReceiveName.create(this.contractName, entrypoint),
            },
            blockHash
        );
    }
}

/** Options for checking contract instance information on chain. */
export type ContractCheckOnChainOptions = {
    /**
     * Hash of the block to check the information at.
     * When not provided the last finalized block is used.
     */
    blockHash?: BlockHash.Type;
    /**
     * The expected module reference to be used by the contract instance.
     * When not provided no check is done against the module reference.
     */
    moduleReference?: ModuleReference.Type;
};

/**
 * Either a module schema, or a `Record` of parameter schemas per entrypoint `E`
 *
 * @template E - union of entrypoints
 */
export type Schema<E extends string = string> = Base64String | Record<E, Base64String>;

/**
 * Base class for interacting with arbitrary contracts. Public version is {@link Contract}.
 *
 * @template E - union of update entrypoints
 * @template V - union of view entrypoints
 */
class ContractBase<E extends string = string, V extends string = string> {
    /** The dry-run instance, accessible through {@link ContractBase.dryRun} */
    protected dryRunInstance: ContractDryRun<E>;

    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress.Type,
        protected contractName: ContractName.Type,
        protected schema?: Schema<E>
    ) {
        this.dryRunInstance = new ContractDryRun(grpcClient, contractAddress, contractName);
    }

    /**
     * Helper function for getting the {@link InstanceInfo} of a contract
     *
     * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
     * @param {ContractAddress.Type} contractAddress - The address of the contract.
     *
     * @throws if the {@link InstanceInfo} of the contract could not be found.
     *
     * @returns {InstanceInfo} the instance info.
     */
    protected static async getInstanceInfo(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type
    ): Promise<InstanceInfo> {
        try {
            return await grpcClient.getInstanceInfo(contractAddress);
        } catch (e) {
            throw new Error(
                `Could not get contract instance info for contract at address ${ContractAddress.toString(
                    contractAddress
                )}: ${(e as Error).message ?? e}`
            );
        }
    }

    /**
     * Helper function for getting the name of a contract
     *
     * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
     * @param {ContractAddress.Type} contractAddress - The address of the contract.
     *
     * @throws if the {@link InstanceInfo} of the contract could not be found.
     *
     * @returns {ContractName.Type} the name of the contract.
     */
    protected static async getContractName(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type
    ): Promise<ContractName.Type> {
        const instanceInfo = await this.getInstanceInfo(grpcClient, contractAddress);
        return ContractName.fromInitName(instanceInfo.name);
    }

    /**
     * Get information on this smart contract instance.
     *
     * @param {BlockHash.Type} [blockHash] Hash of the block to check information at. When not provided the last finalized block is used.

     * @throws if the {@link InstanceInfo} of the contract could not be found.

     * @returns {InstanceInfo} The instance info.
     */
    public async getInstanceInfo(blockHash?: BlockHash.Type): Promise<InstanceInfo> {
        return this.grpcClient.getInstanceInfo(this.contractAddress, blockHash);
    }

    /**
     * Check if the smart contract instance exists on the blockchain and whether it uses a matching contract name.
     * Optionally a module reference can be provided to check if the contract instance uses this module.
     *
     * @param {ContractCheckOnChainOptions} [options] Options for checking information on chain.
     *
     * @throws {RpcError} If failing to communicate with the concordium node or if the instance does not exist on chain or fails the checks.
     */
    public async checkOnChain(options: ContractCheckOnChainOptions = {}): Promise<void> {
        const info = await this.getInstanceInfo(options.blockHash);
        const contractNameOnChain = ContractName.fromInitName(info.name);

        if (!ContractName.equals(contractNameOnChain, this.contractName)) {
            throw new Error(
                `Instance ${ContractAddress.toString(this.contractAddress)} has contract name '${
                    contractNameOnChain.value
                }' on chain. The client expected: '${this.contractName.value}'.`
            );
        }

        if (
            options.moduleReference !== undefined &&
            info.sourceModule.moduleRef !== options.moduleReference.moduleRef
        ) {
            throw new Error(
                `Instance ${ContractAddress.toString(this.contractAddress)} uses module with reference '${
                    info.sourceModule.moduleRef
                }' expected '${options.moduleReference.moduleRef}'`
            );
        }
    }

    /**
     * A dry-run instance, providing access to methods for performing dry-run invocations of update instructions.
     */
    public get dryRun(): ContractDryRun<E> {
        return this.dryRunInstance;
    }

    /**
     * Creates a {@link ContractUpdateTransactionWithSchema} contract update transaction, holding the necessary parts to sign/submit to the chain.
     *
     * @template T - The type of the input
     *
     * @param {EntrypointName.Type} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {ContractUpdateTransaction} Details necesary for submitting the contract update transaction.
     */
    public createUpdateTransaction<T>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        metadata: CreateContractTransactionMetadata,
        input: T
    ): ContractUpdateTransaction;

    /**
     * Creates a {@link ContractUpdateTransactionWithSchema} contract update transaction, holding the necessary parts to sign/submit to the chain.
     *
     * @template T - The type of the input
     * @template J - The type of the input formatted as JSON compatible with the corresponding contract schema
     *
     * @param {EntrypointName.Type} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     * @param {Function} inputJsonFormatter - A function to format the `input` as JSON format serializable by the contract schema.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {ContractUpdateTransactionWithSchema} Details necessary for submitting the contract update transaction (with JSON to be serialized with corresponding schema)
     */
    public createUpdateTransaction<T, J extends SmartContractTypeValues>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        metadata: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter: (input: T) => J
    ): MakeOptional<ContractUpdateTransactionWithSchema<J>, 'schema'>;
    public createUpdateTransaction<T, J extends SmartContractTypeValues>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        { amount = CcdAmount.zero(), energy }: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter?: (input: T) => J
    ): ContractUpdateTransaction | MakeOptional<ContractUpdateTransactionWithSchema<J>, 'schema'> {
        const parameter = Parameter.fromBuffer(serializeInput(input));

        const payload: UpdateContractPayload = {
            amount,
            address: this.contractAddress,
            receiveName: ReceiveName.create(this.contractName, entrypoint),
            maxContractExecutionEnergy: energy,
            message: parameter,
        };
        const transaction: ContractUpdateTransaction = {
            type: AccountTransactionType.Update,
            payload,
        };

        if (inputJsonFormatter === undefined) {
            return transaction;
        }

        const jsonParameter = inputJsonFormatter(input);

        let schema: ContractSchema | undefined;
        if (typeof this.schema === 'string') {
            schema = {
                value: this.schema,
                type: 'module',
            };
        } else if (this.schema?.[EntrypointName.toString(entrypoint)] !== undefined) {
            schema = {
                value: this.schema[EntrypointName.toString(entrypoint)],
                type: 'parameter',
            };
        }

        return {
            ...transaction,
            parameter: {
                hex: Parameter.toHexString(parameter),
                json: jsonParameter,
            },
            schema,
        };
    }

    /**
     * Submits a {@link ContractUpdateTransaction} contract update transaction.
     *
     * @param {ContractUpdateTransaction} transactionBase - The details of the transaction to send.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
     * @param {AccountSigner} signer - An object to use for signing the transaction.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {TransactionHash.Type} The transaction hash of the update transaction
     */
    protected async sendUpdateTransaction(
        transactionBase: ContractUpdateTransaction,
        { senderAddress, expiry = getContractUpdateDefaultExpiryDate() }: ContractTransactionMetadata,
        signer: AccountSigner
    ): Promise<TransactionHash.Type> {
        const { nonce } = await this.grpcClient.getNextAccountNonce(senderAddress);
        const header = {
            expiry,
            nonce: nonce,
            sender: senderAddress,
        };
        const transaction = {
            ...transactionBase,
            header,
        };
        const signature = await signTransaction(transaction, signer);
        return this.grpcClient.sendAccountTransaction(transaction, signature);
    }

    /**
     * Creates and sends a contract update transaction with parameter `input` to `entrypoint`.
     *
     * @template T - The type of the input
     *
     * @param {EntrypointName.Type} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {CIS2.TransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
     * @param {T} input - Input for for contract function.
     * @param {AccountSigner} signer - An object to use for signing the transaction.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {TransactionHash.Type} The transaction hash of the update transaction
     */
    public async createAndSendUpdateTransaction<T>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        metadata: ContractTransactionMetadata,
        input: T,
        signer: AccountSigner
    ): Promise<TransactionHash.Type> {
        const transactionBase = this.createUpdateTransaction(entrypoint, serializeInput, metadata, input);
        return this.sendUpdateTransaction(transactionBase, metadata, signer);
    }

    /**
     * Invokes `entrypoint` view function on contract.
     *
     * @template T - The type of the input
     * @template R - The type the invocation response should be deserialized into.
     *
     * @param {EntrypointName.Type} entrypoint - The name of the view function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {Function} deserializeResponse - A function to deserialize the value returned from the view invocation.
     * @param {T | T[]} input - Input for for contract function.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {R} The transaction hash of the update transaction
     */
    public async invokeView<T, R>(
        entrypoint: EntrypointName.Type<V>,
        serializeInput: (input: T) => ArrayBuffer,
        deserializeResponse: (value: HexString) => R,
        input: T,
        blockHash?: BlockHash.Type
    ): Promise<R> {
        const parameter = Parameter.fromBuffer(serializeInput(input));

        const response = await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                method: ReceiveName.create(this.contractName, entrypoint),
            },
            blockHash
        );
        if (response === undefined || response.tag === 'failure' || response.returnValue === undefined) {
            throw new Error(
                `Failed to invoke view ${entrypoint} for contract at ${ContractAddress.toString(this.contractAddress)}${
                    response.tag === 'failure' && ` with error ${stringify(response.reason)}`
                }`
            );
        }

        return deserializeResponse(ReturnValue.toHexString(response.returnValue));
    }
}

/**
 * Base class for interacting with arbitrary contracts. Public version is {@link Contract}.
 *
 * @template E - union of update entrypoints
 * @template V - union of view entrypoints
 */
export class Contract<E extends string = string, V extends string = string> extends ContractBase<E, V> {
    /**
     * Creates a new `Contract` instance by querying the node for the necessary information through the supplied `grpcClient`.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The client used for contract invocations and updates.
     * @param {ContractAddress} contractAddress - Address of the contract instance.
     * @param {Schema} [schema] - The schema of the contract, either defined as parameter schemas per entrypoint `E` or as a single module schema.
     * If no schema is defined, an attempt to get an embedded schema from the contract is made.
     *
     * @throws If `InstanceInfo` could not be received for the contract,
     *
     * or if the contract name could not be parsed from the information received from the node.
     */
    public static async create<E extends string = string, V extends string = string>(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type,
        schema?: Schema<E>
    ): Promise<Contract<E, V>> {
        const instanceInfo = await super.getInstanceInfo(grpcClient, contractAddress);
        // No reason to run checks, since this is from chain.
        const contractName = ContractName.fromInitName(instanceInfo.name);

        let mSchema: string | undefined;
        if (!schema) {
            try {
                const raw = await grpcClient.getEmbeddedSchema(instanceInfo.sourceModule);
                if (raw) {
                    const encoded = Buffer.from(raw.buffer).toString('base64');
                    if (encoded) {
                        mSchema = encoded;
                    }
                }
            } catch {
                // Do nothing.
            }
        }

        return new Contract(grpcClient, contractAddress, contractName, schema ?? mSchema);
    }
}

/**
 * Abstract class for defining "clients" for enabling users to seemlessly interact with
 * contracts adhering to standards (i.e. CIS contracts)
 *
 * @template E - union of update entrypoints
 * @template V - union of view entrypoints
 * @template D - {@link ContractDryRun} extension
 */
export abstract class CISContract<E extends string, V extends string, D extends ContractDryRun<E>> extends ContractBase<
    E,
    V
> {
    /** Parameter schema for each entrypoint `E` */
    protected abstract override schema: Record<E, Base64String>;
    /** The dry-run instance accessible through the {@link CISContract.dryRun} `dryRun` getter */
    protected override dryRunInstance: D;

    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress.Type,
        protected contractName: ContractName.Type
    ) {
        super(grpcClient, contractAddress, contractName);

        this.dryRunInstance = this.makeDryRunInstance(grpcClient, contractAddress, contractName);
    }

    /**
     * Function for creating the {@CISContract.dryRunInstance}.
     */
    protected abstract makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type,
        contractName: ContractName.Type
    ): D;

    /**
     * A dry-run instance, providing access to methods for performing dry-run invocations of update instructions.
     */
    public override get dryRun(): D {
        return this.dryRunInstance;
    }

    /**
     * Creates a {@link ContractUpdateTransactionWithSchema} contract update transaction, holding the necessary parts to sign/submit to the chain.
     *
     * @param {EntrypointName.Type} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {ContractUpdateTransaction} The transaction hash of the update transaction
     */
    public createUpdateTransaction<T>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        metadata: CreateContractTransactionMetadata,
        input: T
    ): ContractUpdateTransaction;

    /**
     * Creates a {@link ContractUpdateTransactionWithSchema} contract update transaction, holding the necessary parts to sign/submit to the chain.
     *
     * @param {EntrypointName.Type} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     * @param {Function} inputJsonFormatter - A function to format the `input` as JSON format serializable by the contract schema.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {ContractUpdateTransactionWithSchema} The transaction hash of the update transaction
     */
    public createUpdateTransaction<T, J extends SmartContractTypeValues>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        metadata: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter: (input: T) => J
    ): ContractUpdateTransactionWithSchema<J>;
    public override createUpdateTransaction<T, J extends SmartContractTypeValues>(
        entrypoint: EntrypointName.Type<E>,
        serializeInput: (input: T) => ArrayBuffer,
        metadata: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter?: (input: T) => J
    ): ContractUpdateTransaction | ContractUpdateTransactionWithSchema<J> {
        if (inputJsonFormatter === undefined) {
            return super.createUpdateTransaction(entrypoint, serializeInput, metadata, input);
        }

        const transaction = super.createUpdateTransaction(
            entrypoint,
            serializeInput,
            metadata,
            input,
            inputJsonFormatter
        );

        if (transaction.schema === undefined) {
            throw new Error(`Could not find schema for entrypoint ${entrypoint}`);
        }

        return transaction;
    }
}
