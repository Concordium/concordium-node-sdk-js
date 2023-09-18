import { Buffer } from 'buffer/';
import { stringify } from 'json-bigint';

import {
    checkParameterLength,
    getContractName,
    getContractNameFromInit,
} from './contractHelpers';
import { ConcordiumGRPCClient } from './grpc/GRPCClient';
import { AccountSigner, signTransaction } from './signHelpers';
import {
    AccountTransactionType,
    Base58String,
    Base64String,
    ContractAddress,
    Energy,
    HexString,
    InstanceInfo,
    InvokeContractResult,
    MakeOptional,
    SmartContractTypeValues,
    UpdateContractPayload,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { CcdAmount } from './types/ccdAmount';
import { TransactionExpiry } from './types/transactionExpiry';
import { ModuleReference } from './types/moduleReference';
import * as BlockHash from './types/BlockHash';

/**
 * Metadata necessary for smart contract transactions
 */
export type ContractTransactionMetadata = {
    /** Amount (in microCCD) to include in the transaction. Defaults to 0n */
    amount?: bigint;
    /** The sender address of the transaction */
    senderAddress: HexString;
    /** Expiry date of the transaction. Defaults to 5 minutes in the future */
    expiry?: Date;
    /** Max energy to be used for the transaction */
    energy: Energy;
};

/**
 * Metadata necessary for creating a {@link UpdateTransaction}
 */
export type CreateContractTransactionMetadata = Pick<
    ContractTransactionMetadata,
    'amount' | 'energy'
>;

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
export type ContractUpdateTransactionWithSchema<
    J extends SmartContractTypeValues = SmartContractTypeValues
> = ContractUpdateTransaction & {
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
export function getContractUpdateDefaultExpiryDate(): Date {
    const future5Minutes = Date.now() + 5 * 60 * 1000;
    return new Date(future5Minutes);
}

/**
 * Converts an address (either contract address or account address in its base58 form) to a contract update "invoker"
 */
export const getInvoker = (
    address: Base58String | ContractAddress
): ContractAddress | AccountAddress =>
    typeof address !== 'string' ? address : new AccountAddress(address);

/**
 * Defines methods for performing dry-run invocations of updates on a Contract with entrypoints `E`
 *
 * @template E - union of entrypoints
 */
export class ContractDryRun<E extends string = string> {
    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress,
        protected contractName: string
    ) {}

    /**
     * Performs a dry-run of a contract entrypoint invocation.
     * Useful for getting an indication of the result of an invocation of the entrypoint (e.g. getting a cost estimate).
     *
     * @template T - The type of the input given
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {ContractAddress | AccountAddress} invoker - The address of the invoker.
     * @param {Function} serializer - A function for serializing the input to bytes.
     * @param {T} input - Input for for contract function.
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public invokeMethod<T>(
        entrypoint: E,
        invoker: ContractAddress | AccountAddress,
        serializer: (input: T) => Buffer,
        input: T,
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const parameter = serializer(input);
        checkParameterLength(parameter);

        return this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                invoker,
                method: `${this.contractName}.${entrypoint}`,
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
    moduleReference?: ModuleReference;
};

/**
 * Either a module schema, or a `Record` of parameter schemas per entrypoint `E`
 *
 * @template E - union of entrypoints
 */
export type Schema<E extends string = string> =
    | Base64String
    | Record<E, Base64String>;

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
        protected contractAddress: ContractAddress,
        protected contractName: string,
        protected schema?: Schema<E>
    ) {
        this.dryRunInstance = new ContractDryRun(
            grpcClient,
            contractAddress,
            contractName
        );
    }

    /**
     * Helper function for getting the {@link InstanceInfo} of a contract
     *
     * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
     * @param {ContractAddress} contractAddress - The address of the contract.
     *
     * @throws if the {@link InstanceInfo} of the contract could not be found.
     *
     * @returns {InstanceInfo} the instance info.
     */
    protected static async getInstanceInfo(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress
    ): Promise<InstanceInfo> {
        try {
            return await grpcClient.getInstanceInfo(contractAddress);
        } catch (e) {
            throw new Error(
                `Could not get contract instance info for contract at address ${stringify(
                    contractAddress
                )}: ${(e as Error).message ?? e}`
            );
        }
    }

    /**
     * Helper function for getting the name of a contract
     *
     * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
     * @param {ContractAddress} contractAddress - The address of the contract.
     *
     * @throws if the {@link InstanceInfo} of the contract could not be found.
     *
     * @returns {string} the name of the contract.
     */
    protected static async getContractName(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress
    ): Promise<string> {
        const instanceInfo = await this.getInstanceInfo(
            grpcClient,
            contractAddress
        );
        return getContractName(instanceInfo);
    }

    /**
     * Get information on this smart contract instance.
     *
     * @param {BlockHash.Type} [blockHash] Hash of the block to check information at. When not provided the last finalized block is used.

     * @throws if the {@link InstanceInfo} of the contract could not be found.

     * @returns {InstanceInfo} The instance info.
     */
    public async getInstanceInfo(
        blockHash?: BlockHash.Type
    ): Promise<InstanceInfo> {
        const blockHashHex =
            blockHash === undefined
                ? undefined
                : BlockHash.toHexString(blockHash);
        return this.grpcClient.getInstanceInfo(
            this.contractAddress,
            blockHashHex
        );
    }

    /**
     * Check if the smart contract instance exists on the blockchain and whether it uses a matching contract name.
     * Optionally a module reference can be provided to check if the contract instance uses this module.
     *
     * @param {ContractCheckOnChainOptions} [options] Options for checking information on chain.
     *
     * @throws {RpcError} If failing to communicate with the concordium node or if the instance does not exist on chain or fails the checks.
     */
    public async checkOnChain(
        options: ContractCheckOnChainOptions = {}
    ): Promise<void> {
        const info = await this.getInstanceInfo(options.blockHash);

        const contractNameOnChain = getContractNameFromInit(info.name);
        if (contractNameOnChain !== this.contractName) {
            throw new Error(
                `Instance ${this.contractAddress} have contract name '${contractNameOnChain}' on chain. The client expected: '${this.contractName}'.`
            );
        }

        if (
            options.moduleReference !== undefined &&
            info.sourceModule.moduleRef !== options.moduleReference.moduleRef
        ) {
            throw new Error(
                `Instance ${this.contractAddress} uses module with reference '${info.sourceModule.moduleRef}' expected '${options.moduleReference.moduleRef}'`
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
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {ContractUpdateTransaction} Details necesary for submitting the contract update transaction.
     */
    public createUpdateTransaction<T>(
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        metadata: CreateContractTransactionMetadata,
        input: T
    ): ContractUpdateTransaction;

    /**
     * Creates a {@link ContractUpdateTransactionWithSchema} contract update transaction, holding the necessary parts to sign/submit to the chain.
     *
     * @template T - The type of the input
     * @template J - The type of the input formatted as JSON compatible with the corresponding contract schema
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
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
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        metadata: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter: (input: T) => J
    ): MakeOptional<ContractUpdateTransactionWithSchema<J>, 'schema'>;
    public createUpdateTransaction<T, J extends SmartContractTypeValues>(
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        { amount = 0n, energy }: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter?: (input: T) => J
    ):
        | ContractUpdateTransaction
        | MakeOptional<ContractUpdateTransactionWithSchema<J>, 'schema'> {
        const parameter = serializeInput(input);
        checkParameterLength(parameter);

        const payload: UpdateContractPayload = {
            amount: new CcdAmount(amount),
            address: this.contractAddress,
            receiveName: `${this.contractName}.${entrypoint}`,
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
        } else if (this.schema?.[entrypoint] !== undefined) {
            schema = {
                value: this.schema[entrypoint],
                type: 'parameter',
            };
        }

        return {
            ...transaction,
            parameter: {
                hex: parameter.toString('hex'),
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
     * @returns {HexString} The transaction hash of the update transaction
     */
    protected async sendUpdateTransaction(
        transactionBase: ContractUpdateTransaction,
        {
            senderAddress,
            expiry = getContractUpdateDefaultExpiryDate(),
        }: ContractTransactionMetadata,
        signer: AccountSigner
    ): Promise<HexString> {
        const sender = new AccountAddress(senderAddress);
        const { nonce } = await this.grpcClient.getNextAccountNonce(sender);
        const header = {
            expiry: new TransactionExpiry(expiry),
            nonce: nonce,
            sender,
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
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {CIS2.TransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
     * @param {T} input - Input for for contract function.
     * @param {AccountSigner} signer - An object to use for signing the transaction.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    public async createAndSendUpdateTransaction<T>(
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        metadata: ContractTransactionMetadata,
        input: T,
        signer: AccountSigner
    ): Promise<HexString> {
        const transactionBase = this.createUpdateTransaction(
            entrypoint,
            serializeInput,
            metadata,
            input
        );
        return this.sendUpdateTransaction(transactionBase, metadata, signer);
    }

    /**
     * Invokes `entrypoint` view function on contract.
     *
     * @template T - The type of the input
     * @template R - The type the invocation response should be deserialized into.
     *
     * @param {string} entrypoint - The name of the view function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {Function} deserializeResponse - A function to deserialize the value returned from the view invocation.
     * @param {T | T[]} input - Input for for contract function.
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {R} The transaction hash of the update transaction
     */
    public async invokeView<T, R>(
        entrypoint: V,
        serializeInput: (input: T) => Buffer,
        deserializeResponse: (value: HexString) => R,
        input: T,
        blockHash?: HexString
    ): Promise<R> {
        const parameter = serializeInput(input);
        checkParameterLength(parameter);

        const response = await this.grpcClient.invokeContract(
            {
                contract: this.contractAddress,
                parameter,
                method: `${this.contractName}.${entrypoint}`,
            },
            blockHash
        );
        if (
            response === undefined ||
            response.tag === 'failure' ||
            response.returnValue === undefined
        ) {
            throw new Error(
                `Failed to invoke view ${entrypoint} for contract at ${stringify(
                    this.contractAddress
                )}${
                    response.tag === 'failure' &&
                    ` with error ${stringify(response.reason)}`
                }`
            );
        }

        return deserializeResponse(response.returnValue);
    }
}

/**
 * Base class for interacting with arbitrary contracts. Public version is {@link Contract}.
 *
 * @template E - union of update entrypoints
 * @template V - union of view entrypoints
 */
export class Contract<
    E extends string = string,
    V extends string = string
> extends ContractBase<E, V> {
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
    public static async create<
        E extends string = string,
        V extends string = string
    >(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress,
        schema?: Schema<E>
    ): Promise<Contract<E, V>> {
        const instanceInfo = await super.getInstanceInfo(
            grpcClient,
            contractAddress
        );
        const contractName = getContractName(instanceInfo);

        let mSchema: string | undefined;
        if (!schema) {
            try {
                const raw = await grpcClient.getEmbeddedSchema(
                    instanceInfo.sourceModule
                );
                const encoded = raw.toString('base64');

                if (encoded) {
                    mSchema = encoded;
                }
            } catch {
                // Do nothing.
            }
        }

        return new Contract(
            grpcClient,
            contractAddress,
            contractName,
            schema ?? mSchema
        );
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
export abstract class CISContract<
    E extends string,
    V extends string,
    D extends ContractDryRun<E>
> extends ContractBase<E, V> {
    /** Parameter schema for each entrypoint `E` */
    protected abstract override schema: Record<E, Base64String>;
    /** The dry-run instance accessible through the {@link CISContract.dryRun} `dryRun` getter */
    protected override dryRunInstance: D;

    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress,
        protected contractName: string
    ) {
        super(grpcClient, contractAddress, contractName);

        this.dryRunInstance = this.makeDryRunInstance(
            grpcClient,
            contractAddress,
            contractName
        );
    }

    /**
     * Function for creating the {@CISContract.dryRunInstance}.
     */
    protected abstract makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress,
        contractName: string
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
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {ContractUpdateTransaction} The transaction hash of the update transaction
     */
    public createUpdateTransaction<T>(
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        metadata: CreateContractTransactionMetadata,
        input: T
    ): ContractUpdateTransaction;

    /**
     * Creates a {@link ContractUpdateTransactionWithSchema} contract update transaction, holding the necessary parts to sign/submit to the chain.
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
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
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        metadata: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter: (input: T) => J
    ): ContractUpdateTransactionWithSchema<J>;
    public override createUpdateTransaction<
        T,
        J extends SmartContractTypeValues
    >(
        entrypoint: E,
        serializeInput: (input: T) => Buffer,
        metadata: CreateContractTransactionMetadata,
        input: T,
        inputJsonFormatter?: (input: T) => J
    ): ContractUpdateTransaction | ContractUpdateTransactionWithSchema<J> {
        if (inputJsonFormatter === undefined) {
            return super.createUpdateTransaction(
                entrypoint,
                serializeInput,
                metadata,
                input
            );
        }

        const transaction = super.createUpdateTransaction(
            entrypoint,
            serializeInput,
            metadata,
            input,
            inputJsonFormatter
        );

        if (transaction.schema === undefined) {
            throw new Error(
                `Could not find schema for entrypoint ${entrypoint}`
            );
        }

        return transaction;
    }
}
