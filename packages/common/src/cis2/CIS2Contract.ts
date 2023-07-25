import { Buffer } from 'buffer/';
import { stringify } from 'json-bigint';

import { ContractAddress, HexString, InvokeContractResult } from '../types';
import { ConcordiumGRPCClient } from '../GRPCClient';
import { AccountSigner } from '../signHelpers';
import {
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
    serializeCIS2UpdateOperators,
} from './util';
import type { CIS2 } from './util';
import { AccountAddress } from '../types/accountAddress';
import { CIS0, cis0Supports } from '../cis0';
import { getContractName } from '../contractHelpers';
import { GenericContract, GenericContractDryRun } from '../GenericContract';
import { makeDynamicFunction } from '../util';

const getInvoker = (address: CIS2.Address): ContractAddress | AccountAddress =>
    isContractAddress(address) ? address : new AccountAddress(address);

/**
 * Contains methods for performing dry-run invocations of update instructions on CIS-2 smart contracts.
 */
class CIS2DryRun extends GenericContractDryRun {
    /**
     * Performs a dry-run invocation of "transfer" on a corresponding {@link CIS2Contract} instance
     *
     * @param {CIS2.Address} sender - Address of the sender of the transfer.
     * @param {CIS2.Transfer | CIS2.Transfer[]} transfer(s) - The transfer object(s).
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public transfer(
        sender: CIS2.Address,
        transfer: CIS2.Transfer,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    public transfer(
        sender: CIS2.Address,
        transfers: CIS2.Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    public transfer(
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
    public updateOperator(
        owner: CIS2.Address,
        update: CIS2.UpdateOperator,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    public updateOperator(
        owner: CIS2.Address,
        updates: CIS2.UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    public updateOperator(
        owner: CIS2.Address,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            'updateOperator',
            getInvoker(owner),
            serializeCIS2UpdateOperators,
            updates,
            blockHash
        );
    }
}

/**
 * Contains methods for performing operations on CIS-2 smart contracts.
 */
export class CIS2Contract extends GenericContract<
    CIS2DryRun,
    'transfer' | 'updateOperator'
> {
    public schemas: Record<'transfer' | 'updateOperator', string> = {
        /** Base64 encoded schema for CIS-2.transfer parameter */
        transfer:
            'EAEUAAUAAAAIAAAAdG9rZW5faWQdAAYAAABhbW91bnQbJQAAAAQAAABmcm9tFQIAAAAHAAAAQWNjb3VudAEBAAAACwgAAABDb250cmFjdAEBAAAADAIAAAB0bxUCAAAABwAAAEFjY291bnQBAQAAAAsIAAAAQ29udHJhY3QBAgAAAAwWAQQAAABkYXRhHQE',
        /** Base64 encoded schema for CIS-2.updateOperator parameter */
        updateOperator:
            'EAEUAAIAAAAGAAAAdXBkYXRlFQIAAAAGAAAAUmVtb3ZlAgMAAABBZGQCCAAAAG9wZXJhdG9yFQIAAAAHAAAAQWNjb3VudAEBAAAACwgAAABDb250cmFjdAEBAAAADA',
    };
    protected makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress,
        contractName: string
    ): CIS2DryRun {
        return new CIS2DryRun(grpcClient, contractAddress, contractName);
    }
    /**
     * Creates a new `CIS2Contract` instance by querying the node for the necessary information through the supplied `grpcClient`.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The client used for contract invocations and updates.
     * @param {ContractAddress} contractAddress - Address of the contract instance.
     *
     * @throws If `InstanceInfo` could not be received for the contract, if the contract does not support the CIS-2 standard,
     * or if the contract name could not be parsed from the information received from the node.
     */
    public static async create(
        grpcClient: ConcordiumGRPCClient,
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
     *
     * @throws If the transaction could not be created successfully.
     *
     * @returns {CIS2.UpdateTransaction} An object containing the parts of the transaction needed for submission.
     */
    public createTransfer(
        metadata: CIS2.CreateTransactionMetadata,
        transfer: CIS2.Transfer
    ): CIS2.UpdateTransaction;
    /**
     * Creates a CIS-2 "transfer" update transaction containing a list transfers.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.Transfer[]} transfers - A list of transfer objects, each specifying the details of a transfer.
     *
     * @throws If the transaction could not be created successfully.
     *
     * @returns {CIS2.UpdateTransaction} An object containing the parts of the transaction needed for submission.
     */
    public createTransfer(
        metadata: CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer[]
    ): CIS2.UpdateTransaction;
    public createTransfer(
        metadata: CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[]
    ): CIS2.UpdateTransaction;
    public createTransfer(
        metadata: CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[]
    ): CIS2.UpdateTransaction {
        return this.createUpdateTransaction(
            'transfer',
            serializeCIS2Transfers,
            formatCIS2Transfer,
            metadata,
            transfers
        );
    }
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
    public transfer(
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
    public transfer(
        metadata: CIS2.TransactionMetadata,
        transfers: CIS2.Transfer[],
        signer: AccountSigner
    ): Promise<HexString>;
    public transfer(
        metadata: CIS2.TransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[],
        signer: AccountSigner
    ): Promise<HexString> {
        const transaction = this.createTransfer(metadata, transfers);
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Creates a CIS-2 "operatorOf" update transaction containing a single operator update instruction.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.UpdateOperator} update - The update instruction object specifying the details of the update.
     *
     * @throws If the transaction could not be created successfully.
     *
     * @returns {CIS2.UpdateTransaction} An object containing the parts of the transaction needed for submission.
     */
    public createUpdateOperator(
        metadata: CIS2.CreateTransactionMetadata,
        update: CIS2.UpdateOperator
    ): CIS2.UpdateTransaction;
    /**
     * Creates a CIS-2 "operatorOf" update transaction containing a list of operator update instructions.
     * This is particularly useful if you need the parts required for a wallet to submit the transaction.
     *
     * @param {CIS2.CreateTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS2.UpdateOperator[]} updates - A list of update instruction objects, each specifying the details of an update.
     *
     * @throws If the transaction could not be created successfully.
     *
     * @returns {CIS2.UpdateTransaction} An object containing the parts of the transaction needed for submission.
     */
    public createUpdateOperator(
        metadata: CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator[]
    ): CIS2.UpdateTransaction;
    public createUpdateOperator(
        metadata: CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[]
    ): CIS2.UpdateTransaction;
    public createUpdateOperator(
        metadata: CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[]
    ): CIS2.UpdateTransaction {
        return this.createUpdateTransaction(
            'updateOperator',
            serializeCIS2UpdateOperators,
            formatCIS2UpdateOperator,
            metadata,
            updates
        );
    }

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
    public updateOperator(
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
    public updateOperator(
        metadata: CIS2.TransactionMetadata,
        updates: CIS2.UpdateOperator[],
        signer: AccountSigner
    ): Promise<HexString>;
    public updateOperator(
        metadata: CIS2.TransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[],
        signer: AccountSigner
    ): Promise<HexString> {
        const transaction = this.createUpdateOperator(metadata, updates);
        return this.sendUpdateTransaction(transaction, metadata, signer);
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
    public balanceOf(
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
    public balanceOf(
        queries: CIS2.BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint[]>;
    public async balanceOf(
        queries: CIS2.BalanceOfQuery | CIS2.BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint | bigint[]> {
        return this.invokeViewDynamic(
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
    public operatorOf(
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
    public operatorOf(
        queries: CIS2.OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean[]>;
    public operatorOf(
        queries: CIS2.OperatorOfQuery | CIS2.OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean | boolean[]> {
        return this.invokeViewDynamic(
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
    public tokenMetadata(
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
    public tokenMetadata(
        tokenIds: HexString[],
        blockHash?: HexString
    ): Promise<CIS2.MetadataUrl[]>;
    public tokenMetadata(
        tokenIds: HexString | HexString[],
        blockHash?: HexString
    ): Promise<CIS2.MetadataUrl | CIS2.MetadataUrl[]> {
        return this.invokeViewDynamic(
            'tokenMetadata',
            serializeCIS2TokenIds,
            deserializeCIS2TokenMetadataResponse,
            tokenIds,
            blockHash
        );
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
    private async invokeViewDynamic<T, R>(
        entrypoint: string,
        serializer: (input: T[]) => Buffer,
        deserializer: (value: HexString) => R[],
        input: T | T[],
        blockHash?: HexString
    ): Promise<R | R[]> {
        const values = await this.invokeView(
            entrypoint,
            makeDynamicFunction(serializer),
            deserializer,
            input,
            blockHash
        );

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
