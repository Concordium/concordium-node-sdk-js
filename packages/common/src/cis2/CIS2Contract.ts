import { Buffer } from 'buffer/';
import {
    AccountTransactionType,
    ContractAddress,
    HexString,
    InvokeContractResult,
    UpdateContractPayload,
} from '../types';
import ConcordiumNodeClient from '../GRPCClient';
import { AccountSigner, signTransaction } from '../signHelpers';
import {
    serializeCIS2OperatorUpdates,
    serializeCIS2Transfers,
    serializeCIS2BalanceOfQueries,
    deserializeCIS2BalanceOfResponse,
    isContractAddress,
    serializeCIS2TokenIds,
    deserializeCIS2TokenMetadataResponse,
    serializeCIS2OperatorOfQueries,
    deserializeCIS2OperatorOfResponse,
    formatCIS2UpdateOperator,
    formatCIS2Transfer,
} from './util';
import type { CIS2 } from './util';
import { AccountAddress } from '../types/accountAddress';
import { CcdAmount } from '../types/ccdAmount';
import { TransactionExpiry } from '../types/transactionExpiry';
import { stringify } from 'json-bigint';
import { CIS0, cis0Supports } from '../cis0';
import { checkParameterLength, getContractName } from '../contractHelpers';
import { makeDynamicFunction } from '../util';

const schemas = {
    /** Base64 encoded schema for CIS-2.transfer parameter */
    transfer:
        'EAEUAAUAAAAIAAAAdG9rZW5faWQdAAYAAABhbW91bnQbJQAAAAQAAABmcm9tFQIAAAAHAAAAQWNjb3VudAEBAAAACwgAAABDb250cmFjdAEBAAAADAIAAAB0bxUCAAAABwAAAEFjY291bnQBAQAAAAsIAAAAQ29udHJhY3QBAgAAAAwWAQQAAABkYXRhHQE',
    /** Base64 encoded schema for CIS-2.updateOperator parameter */
    updateOperator:
        'EAEUAAIAAAAGAAAAdXBkYXRlFQIAAAAGAAAAUmVtb3ZlAgMAAABBZGQCCAAAAG9wZXJhdG9yFQIAAAAHAAAAQWNjb3VudAEBAAAACwgAAABDb250cmFjdAEBAAAADA',
};

const getInvoker = (address: CIS2.Address): ContractAddress | AccountAddress =>
    isContractAddress(address) ? address : new AccountAddress(address);

const getDefaultExpiryDate = (): Date => {
    const future5Minutes = Date.now() + 5 * 60 * 1000;
    return new Date(future5Minutes);
};

/**
 * Contains methods for performing dry-run invocations of update instructions on CIS-2 smart contracts.
 */
class CIS2DryRun {
    constructor(
        private grpcClient: ConcordiumNodeClient,
        private contractAddress: ContractAddress,
        private contractName: string
    ) {}

    /**
     * Performs a dry-run invocation of "transfer" on a corresponding {@link CIS2Contract} instance
     *
     * @param {CIS2.Address} sender - Address of the sender of the transfer.
     * @param {CIS2.Transfer | CIS2.Transfer[]} transfer(s) - The transfer object(s).
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    transfer(
        sender: CIS2.Address,
        transfer: CIS2.Transfer,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    transfer(
        sender: CIS2.Address,
        transfers: CIS2.Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    transfer(
        sender: CIS2.Address,
        transfers: CIS2.Transfer | CIS2.Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'transfer',
            getInvoker(sender),
            serializeCIS2Transfers,
            transfers,
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "updateOperator" on a corresponding {@link CIS2Contract} instance
     *
     * @param {CIS2.Address} owner - Address of the owner of the address to perform the update on.
     * @param {CIS2.UpdateOperator | CIS2.UpdateOperator[]} update(s) - The update object(s).
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    updateOperator(
        owner: CIS2.Address,
        update: CIS2.UpdateOperator,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    updateOperator(
        owner: CIS2.Address,
        updates: CIS2.UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    updateOperator(
        owner: CIS2.Address,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'updateOperator',
            getInvoker(owner),
            serializeCIS2OperatorUpdates,
            updates,
            blockHash
        );
    }

    /**
     * Helper function for invoking a contract function.
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {ContractAddress | AccountAddress} invoker - The address of the invoker.
     * @param {Function} serializer - A function for serializing the input to bytes.
     * @param {T | T[]} input - Input for for contract function.
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    private invokeMethod<T>(
        entrypoint: string,
        invoker: ContractAddress | AccountAddress,
        serializer: (input: T[]) => Buffer,
        input: T | T[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        const parameter = makeDynamicFunction(serializer)(input);
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

/**
 * Contains methods for performing operations on CIS-2 smart contracts.
 */
export class CIS2Contract {
    private dryRunInstance: CIS2DryRun;

    constructor(
        private grpcClient: ConcordiumNodeClient,
        private contractAddress: ContractAddress,
        private contractName: string
    ) {
        this.dryRunInstance = new CIS2DryRun(
            grpcClient,
            contractAddress,
            contractName
        );
    }

    /**
     * Creates a new `CIS2Contract` instance by querying the node for the necessary information through the supplied `grpcClient`.
     *
     * @param {ConcordiumNodeClient} grpcClient - The client used for contract invocations and updates.
     * @param {ContractAddress} contractAddress - Address of the contract instance.
     *
     * @throws If `InstanceInfo` could not be received for the contract, if the contract does not support the CIS-2 standard,
     * or if the contract name could not be parsed from the information received from the node.
     */
    static async create(
        grpcClient: ConcordiumNodeClient,
        contractAddress: ContractAddress
    ): Promise<CIS2Contract> {
        const instanceInfo = await grpcClient.getInstanceInfo(contractAddress);

        if (instanceInfo === undefined) {
            throw new Error(
                `Could not get contract instance info for contract at address ${stringify(
                    contractAddress
                )}`
            );
        }

        const result = await cis0Supports(grpcClient, contractAddress, 'CIS-2');

        if (result?.type !== CIS0.SupportType.Support) {
            throw new Error(
                `The CIS-2 standard is not supported by the contract at address ${stringify(
                    contractAddress
                )}`
            );
        }

        const contractName = getContractName(instanceInfo);
        return new CIS2Contract(grpcClient, contractAddress, contractName);
    }

    /**
     * Creates a CIS-2 "transfer" update transaction containing a single transfer.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.Transfer} transfer - The transfer object specifying the details of the transfer.
     * @param {Function} signer - Function to be used for signing and sending the transaction.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {R} A type corresponding to the return type of the supplied `signer` param.
     */
    transfer<R>(
        metadata: CIS2.CreateTransactionMetadata,
        transfer: CIS2.Transfer,
        signer: CIS2.ProcessTransactionFunction<R>
    ): R;
    /**
     * Creates a CIS-2 "transfer" update transaction containing a list transfers.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.Transfer[]} transfers - A list of transfer objects, each specifying the details of a transfer.
     * @param {Function} signer - Function to be used for signing and sending the transaction.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {R} A type corresponding to the return type of the supplied `signer` param.
     */
    transfer<R>(
        metadata: CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer[],
        signer: CIS2.ProcessTransactionFunction<R>
    ): R;
    /**
     * Sends a CIS-2 "transfer" update transaction containing a single transfer.
     *
     * @param {CIS2.TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2.Transfer} transfer - The transfer object specifying the details of the transfer.
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {Promise<HexString>} The transaction hash of the update transaction
     */
    transfer(
        metadata: CIS2.TransactionMetadata,
        transfer: CIS2.Transfer,
        signer: AccountSigner
    ): Promise<HexString>;
    /**
     * Sends a CIS-2 "transfer" update transaction containing a list transfers.
     *
     * @param {CIS2.TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2.Transfer[]} transfers - A list of transfer objects, each specifying the details of a transfer.
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {Promise<HexString>} The transaction hash of the update transaction
     */
    transfer(
        metadata: CIS2.TransactionMetadata,
        transfers: CIS2.Transfer[],
        signer: AccountSigner
    ): Promise<HexString>;
    transfer<R>(
        metadata: CIS2.TransactionMetadata | CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[],
        signer: AccountSigner | CIS2.ProcessTransactionFunction<R>
    ): R | Promise<HexString> {
        const transaction = this.createUpdateTransaction(
            'transfer',
            serializeCIS2Transfers,
            formatCIS2Transfer,
            metadata,
            transfers
        );

        if (typeof signer === 'function') {
            return signer(transaction);
        }

        return this.sendUpdateTransaction(
            transaction,
            metadata as CIS2.TransactionMetadata,
            signer
        );
    }

    /**
     * Creates a CIS-2 "operatorOf" update transaction containing a single operator update instruction.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.UpdateOperator} update - The update instruction object specifying the details of the update.
     * @param {Function} signer - Function to be used for signing and sending the transaction.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {R} A type corresponding to the return type of the supplied `signer` param.
     */
    updateOperator<R>(
        metadata: CIS2.CreateTransactionMetadata,
        update: CIS2.UpdateOperator,
        signer: CIS2.ProcessTransactionFunction<R>
    ): R;
    /**
     * Creates a CIS-2 "operatorOf" update transaction containing a list of operator update instructions.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.UpdateOperator[]} updates - A list of update instruction objects, each specifying the details of an update.
     * @param {Function} signer - Function to be used for signing and sending the transaction.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {R} A type corresponding to the return type of the supplied `signer` param.
     */
    updateOperator<R>(
        metadata: CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator[],
        signer: CIS2.ProcessTransactionFunction<R>
    ): R;
    /**
     * Sends a CIS-2 "operatorOf" update transaction containing a single operator update instruction.
     *
     * @param {CIS2.TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2.UpdateOperator} update - The update instruction object specifying the details of the update.
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {Promise<HexString>} The transaction hash of the update transaction
     */
    updateOperator(
        metadata: CIS2.TransactionMetadata,
        update: CIS2.UpdateOperator,
        signer: AccountSigner
    ): Promise<HexString>;
    /**
     * Sends a CIS-2 "operatorOf" update transaction containing a list of operator update instructions.
     *
     * @param {CIS2.TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2.UpdateOperator[]} updates - A list of update instruction objects, each specifying the details of an update.
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {Promise<HexString>} The transaction hash of the update transaction
     */
    updateOperator(
        metadata: CIS2.TransactionMetadata,
        updates: CIS2.UpdateOperator[],
        signer: AccountSigner
    ): Promise<HexString>;
    updateOperator<R>(
        metadata: CIS2.TransactionMetadata | CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[],
        signer: AccountSigner | CIS2.ProcessTransactionFunction<R>
    ): R | Promise<HexString> {
        const transaction = this.createUpdateTransaction(
            'updateOperator',
            serializeCIS2OperatorUpdates,
            formatCIS2UpdateOperator,
            metadata,
            updates
        );

        if (typeof signer === 'function') {
            return signer(transaction);
        }

        return this.sendUpdateTransaction(
            transaction,
            metadata as CIS2.TransactionMetadata,
            signer
        );
    }

    /**
     * Invokes CIS-2 "balanceOf" with a single query.
     *
     * @param {CIS2.BalanceOfQuery} query - The query object specifying the details of the query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {bigint} The balance corresponding to the query.
     */
    balanceOf(
        query: CIS2.BalanceOfQuery,
        blockHash?: HexString
    ): Promise<bigint>;
    /**
     * Invokes CIS-2 "balanceOf" with a list of queries.
     *
     * @param {CIS2.BalanceOfQuery[]} queries - A list of query objects, each specifying the details of a query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {bigint[]} A list of balances corresponding to and ordered by the list of queries.
     */
    balanceOf(
        queries: CIS2.BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint[]>;
    async balanceOf(
        queries: CIS2.BalanceOfQuery | CIS2.BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint | bigint[]> {
        return this.invokeView(
            'balanceOf',
            serializeCIS2BalanceOfQueries,
            deserializeCIS2BalanceOfResponse,
            queries,
            blockHash
        );
    }

    /**
     * Invokes CIS-2 "operatorOf" with a single query.
     *
     * @param {CIS2.OperatorOfQuery} query - The query object specifying the details of the query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {boolean} Whether the specified address is an operator of the specified owner.
     */
    operatorOf(
        query: CIS2.OperatorOfQuery,
        blockHash?: HexString
    ): Promise<boolean>;
    /**
     * Invokes CIS-2 "operatorOf" with a list of queries.
     *
     * @param {CIS2.OperatorOfQuery[]} queries - A list of query objects, each specifying the details of a query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {boolean[]} As list of boolean results, each detailing whether the specified address is an operator of the specified owner for the corresponding query.
     * The list is ordered by the corresponding query.
     */
    operatorOf(
        queries: CIS2.OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean[]>;
    operatorOf(
        queries: CIS2.OperatorOfQuery | CIS2.OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean | boolean[]> {
        return this.invokeView(
            'operatorOf',
            serializeCIS2OperatorOfQueries,
            deserializeCIS2OperatorOfResponse,
            queries,
            blockHash
        );
    }

    /**
     * Invokes CIS-2 "tokenMetadata" with a single token ID.
     *
     * @param {HexString} tokenId - The ID of the token to get the metadata URL for.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {CIS2.MetadataUrl} An object containing the URL of the token metadata.
     */
    tokenMetadata(
        tokenId: HexString,
        blockHash?: HexString
    ): Promise<CIS2.MetadataUrl>;
    /**
     * Invokes CIS-2 "tokenMetadata" with a list of token ID's.
     *
     * @param {HexString[]} tokenIds - A list of ID's of the tokens to get metadata URL's for.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {CIS2.MetadataUrl[]} A list of objects containing URL's for token metadata for the corresponding token.
     * The list is ordered by the token ID's given by `tokenIds` input parameter.
     */
    tokenMetadata(
        tokenIds: HexString[],
        blockHash?: HexString
    ): Promise<CIS2.MetadataUrl[]>;
    tokenMetadata(
        tokenIds: HexString | HexString[],
        blockHash?: HexString
    ): Promise<CIS2.MetadataUrl | CIS2.MetadataUrl[]> {
        return this.invokeView(
            'tokenMetadata',
            serializeCIS2TokenIds,
            deserializeCIS2TokenMetadataResponse,
            tokenIds,
            blockHash
        );
    }

    /**
     * A dry-run instance, providing access to methods for performing dry-run invocations of update instructions.
     */
    get dryRun(): CIS2DryRun {
        return this.dryRunInstance;
    }

    /**
     * Helper function for sending update transactions.
     *
     * @param {string} entrypoint - The name of the receive function to invoke.
     * @param {Function} serializer - A function to serialize the `input` to bytes.
     * @param {Function} jsonFormatter - A function to format the `input` as JSON format serializable by the contract schema.
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata to be used for the transaction creation (with defaults).
     * @param {T | T[]} input - Input for the contract function.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    private createUpdateTransaction<T>(
        entrypoint: keyof typeof schemas,
        serializer: (input: T[]) => Buffer,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jsonFormatter: (input: T) => any,
        { amount = 0n, energy }: CIS2.CreateTransactionMetadata,
        input: T | T[]
    ): CIS2.UpdateTransaction {
        const parameter = makeDynamicFunction(serializer)(input);
        checkParameterLength(parameter);

        const jsonParameter = Array.isArray(input)
            ? input.map(jsonFormatter)
            : [jsonFormatter(input)];
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
                value: schemas[entrypoint],
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
    private async sendUpdateTransaction(
        { type, payload }: CIS2.UpdateTransaction,
        {
            senderAddress,
            expiry = getDefaultExpiryDate(),
        }: CIS2.TransactionMetadata,
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
    private async invokeView<T, R>(
        entrypoint: string,
        serializer: (input: T[]) => Buffer,
        deserializer: (value: HexString) => R[],
        input: T | T[],
        blockHash?: HexString
    ): Promise<R | R[]> {
        const parameter = makeDynamicFunction(serializer)(input);
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

        const values = deserializer(response.returnValue);
        const isListInput = Array.isArray(input);
        const expectedValuesLength = isListInput ? input.length : 1;

        if (values.length !== expectedValuesLength) {
            throw new Error(
                'Mismatch between length of queries in request and values in response.'
            );
        }

        if (isListInput) {
            return values;
        } else {
            return values[0];
        }
    }
}
