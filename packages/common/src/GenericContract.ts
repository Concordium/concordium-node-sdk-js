import { Buffer } from 'buffer/';
import { stringify } from 'json-bigint';

import { checkParameterLength } from './contractHelpers';
import { ConcordiumGRPCClient } from './GRPCClient';
import { AccountSigner, signTransaction } from './signHelpers';
import {
    AccountTransactionType,
    Base58String,
    Base64String,
    ContractAddress,
    HexString,
    InvokeContractResult,
    SmartContractTypeValues,
    UpdateContractPayload,
} from './types';
import { AccountAddress } from './types/accountAddress';
import { CcdAmount } from './types/ccdAmount';
import { TransactionExpiry } from './types/transactionExpiry';

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
    energy: bigint;
};

/**
 * Metadata necessary for creating a {@link UpdateTransaction}
 */
export type CreateContractTransactionMetadata = Pick<
    ContractTransactionMetadata,
    'amount' | 'energy'
>;

/**
 * An update transaction without header. This is useful for sending through a wallet, which supplies the header information.
 */
export type ContractUpdateTransaction = {
    /** The type of the transaction, which will always be of type {@link AccountTransactionType.Update} */
    type: AccountTransactionType.Update;
    /** The payload of the transaction, which will always be of type {@link UpdateContractPayload} */
    payload: UpdateContractPayload;
    parameter: {
        /** Hex encoded parameter for the update */
        hex: HexString;
        /** JSON representation of the parameter to be used with the corresponding contract schema */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json: SmartContractTypeValues;
    };
    schema: {
        /** Base64 encoded schema for the parameter type */
        value: Base64String;
        /** Type of the schema. This is always of type "parameter" */
        type: 'parameter';
    };
};

export function getDefaultExpiryDate(): Date {
    const future5Minutes = Date.now() + 5 * 60 * 1000;
    return new Date(future5Minutes);
}

export const getInvoker = (
    address: Base58String | ContractAddress
): ContractAddress | AccountAddress =>
    typeof address !== 'string' ? address : new AccountAddress(address);

export class GenericContractDryRun {
    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress,
        protected contractName: string
    ) {}

    /**
     * Helper function for invoking a contract function.
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {ContractAddress | AccountAddress} invoker - The address of the invoker.
     * @param {Function} serializer - A function for serializing the input to bytes.
     * @param {T} input - Input for for contract function.
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    protected invokeMethod<T>(
        entrypoint: string,
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

export abstract class GenericContract<
    D extends GenericContractDryRun,
    E extends string
> {
    private dryRunInstance: D;
    public abstract schemas: Record<E, Base64String>;

    constructor(
        protected grpcClient: ConcordiumGRPCClient,
        protected contractAddress: ContractAddress,
        protected contractName: string
    ) {
        this.dryRunInstance = this.makeDryRunInstance(
            grpcClient,
            contractAddress,
            contractName
        );
    }

    protected abstract makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress,
        contractName: string
    ): D;

    /**
     * A dry-run instance, providing access to methods for performing dry-run invocations of update instructions.
     */
    public get dryRun(): D {
        return this.dryRunInstance;
    }

    /**
     * Helper function for sending update transactions.
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializer - A function to serialize the `input` to bytes.
     * @param {Function} jsonFormatter - A function to format the `input` as JSON format serializable by the contract schema.
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T} input - Input for for contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    protected createUpdateTransaction<T>(
        entrypoint: E,
        serializer: (input: T) => Buffer,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jsonFormatter: (input: T) => any,
        { amount = 0n, energy }: CreateContractTransactionMetadata,
        input: T
    ): ContractUpdateTransaction {
        const parameter = serializer(input);
        checkParameterLength(parameter);

        const jsonParameter = jsonFormatter(input);
        const payload: UpdateContractPayload = {
            amount: new CcdAmount(amount),
            address: this.contractAddress,
            receiveName: `${this.contractName}.${entrypoint}`,
            maxContractExecutionEnergy: energy,
            message: parameter,
        };

        return {
            type: AccountTransactionType.Update,
            payload,
            parameter: {
                hex: parameter.toString('hex'),
                json: jsonParameter,
            },
            schema: {
                value: this.schemas[entrypoint],
                type: 'parameter',
            },
        };
    }

    /**
     * Helper function for sending update transactions.
     *
     * @param {CIS2.UpdateTransaction} transaction - The transaction to send.
     * @param {CIS2.TransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
     * @param {AccountSigner} signer - An object to use for signing the transaction.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    protected async sendUpdateTransaction(
        { type, payload }: ContractUpdateTransaction,
        {
            senderAddress,
            expiry = getDefaultExpiryDate(),
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
            type,
            header,
            payload,
        };
        const signature = await signTransaction(transaction, signer);
        return this.grpcClient.sendAccountTransaction(transaction, signature);
    }

    /**
     * Helper function for invoking a contract view function.
     *
     * @param {string} entrypoint - The name of the view function to invoke.
     * @param {Function} serializer - A function to serialize the `input` to bytes.
     * @param {Function} deserializer - A function to deserialize the value returned from the view invocation.
     * @param {T | T[]} input - Input for for contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    protected async invokeView<T, R>(
        entrypoint: string,
        serializer: (input: T) => Buffer,
        deserializer: (value: HexString) => R,
        input: T,
        blockHash?: HexString
    ): Promise<R> {
        const parameter = serializer(input);
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

        const value = deserializer(response.returnValue);
        return value;
    }
}
