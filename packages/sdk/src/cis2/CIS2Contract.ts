import { stringify } from 'json-bigint';

import { CISContract, ContractDryRun } from '../GenericContract.js';
import { CIS0, cis0Supports } from '../cis0.js';
import { ensureMatchesInput } from '../deserializationHelpers.js';
import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { AccountSigner } from '../signHelpers.js';
import type { HexString, InvokeContractResult } from '../types.js';
import * as BlockHash from '../types/BlockHash.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as ContractName from '../types/ContractName.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as TransactionHash from '../types/TransactionHash.js';
import { makeDynamicFunction } from '../util.js';
import {
    CIS2,
    deserializeCIS2BalanceOfResponse,
    deserializeCIS2OperatorOfResponse,
    deserializeCIS2TokenMetadataResponse,
    formatCIS2Transfer,
    formatCIS2UpdateOperator,
    serializeCIS2BalanceOfQueries,
    serializeCIS2OperatorOfQueries,
    serializeCIS2TokenIds,
    serializeCIS2Transfers,
    serializeCIS2UpdateOperators,
} from './util.js';

type Views = 'balanceOf' | 'operatorOf' | 'tokenMetadata';
type Updates = 'transfer' | 'updateOperator';

/**
 * Contains methods for performing dry-run invocations of update instructions on CIS-2 smart contracts.
 */
class CIS2DryRun extends ContractDryRun<Updates> {
    /**
     * Performs a dry-run invocation of "transfer" on a corresponding {@link CIS2Contract} instance
     *
     * @param {CIS2.Address} sender - Address of the sender of the transfer.
     * @param {CIS2.Transfer | CIS2.Transfer[]} transfer(s) - The transfer object(s).
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public transfer(
        sender: CIS2.Address,
        transfer: CIS2.Transfer,
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult>;
    public transfer(
        sender: CIS2.Address,
        transfers: CIS2.Transfer[],
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult>;
    public transfer(
        sender: CIS2.Address,
        transfers: CIS2.Transfer | CIS2.Transfer[],
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const serialize = makeDynamicFunction(serializeCIS2Transfers);
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('transfer'),
            sender,
            serialize,
            transfers,
            blockHash
        );
    }

    /**
     * Performs a dry-run invocation of "updateOperator" on a corresponding {@link CIS2Contract} instance
     *
     * @param {CIS2.Address} owner - Address of the owner of the address to perform the update on.
     * @param {CIS2.UpdateOperator | CIS2.UpdateOperator[]} update(s) - The update object(s).
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public updateOperator(
        owner: CIS2.Address,
        update: CIS2.UpdateOperator,
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult>;
    public updateOperator(
        owner: CIS2.Address,
        updates: CIS2.UpdateOperator[],
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult>;
    public updateOperator(
        owner: CIS2.Address,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[],
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        const serialize = makeDynamicFunction(serializeCIS2UpdateOperators);
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('updateOperator'),
            owner,
            serialize,
            updates,
            blockHash
        );
    }
}

/**
 * Contains methods for performing operations on CIS-2 smart contracts.
 */
export class CIS2Contract extends CISContract<Updates, Views, CIS2DryRun> {
    public schema: Record<'transfer' | 'updateOperator', string> = {
        /** Base64 encoded schema for CIS-2.transfer parameter */
        transfer:
            'EAEUAAUAAAAIAAAAdG9rZW5faWQdAAYAAABhbW91bnQbJQAAAAQAAABmcm9tFQIAAAAHAAAAQWNjb3VudAEBAAAACwgAAABDb250cmFjdAEBAAAADAIAAAB0bxUCAAAABwAAAEFjY291bnQBAQAAAAsIAAAAQ29udHJhY3QBAgAAAAwWAQQAAABkYXRhHQE',
        /** Base64 encoded schema for CIS-2.updateOperator parameter */
        updateOperator:
            'EAEUAAIAAAAGAAAAdXBkYXRlFQIAAAAGAAAAUmVtb3ZlAgMAAABBZGQCCAAAAG9wZXJhdG9yFQIAAAAHAAAAQWNjb3VudAEBAAAACwgAAABDb250cmFjdAEBAAAADA',
    };
    protected makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type,
        contractName: ContractName.Type
    ): CIS2DryRun {
        return new CIS2DryRun(grpcClient, contractAddress, contractName);
    }

    /**
     * Creates a new `CIS2Contract` instance by querying the node for the necessary information through the supplied `grpcClient`.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The client used for contract invocations and updates.
     * @param {ContractAddress.Type} contractAddress - Address of the contract instance.
     *
     * @throws If `InstanceInfo` could not be received for the contract, if the contract does not support the CIS-2 standard,
     * or if the contract name could not be parsed from the information received from the node.
     */
    public static async create(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type
    ): Promise<CIS2Contract> {
        const contractName = await super.getContractName(grpcClient, contractAddress);

        const result = await cis0Supports(grpcClient, contractAddress, 'CIS-2');
        if (result?.type !== CIS0.SupportType.Support) {
            throw new Error(
                `The CIS-2 standard is not supported by the contract at address ${stringify(contractAddress)}`
            );
        }

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
    ): CIS2.UpdateTransaction<CIS2.TransferParamJson[]>;
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
    ): CIS2.UpdateTransaction<CIS2.TransferParamJson[]>;
    public createTransfer(
        metadata: CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[]
    ): CIS2.UpdateTransaction<CIS2.TransferParamJson[]>;
    public createTransfer(
        metadata: CIS2.CreateTransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[]
    ): CIS2.UpdateTransaction<CIS2.TransferParamJson[]> {
        const serialize = makeDynamicFunction(serializeCIS2Transfers);
        const format = makeDynamicFunction((us: CIS2.Transfer[]) => us.map(formatCIS2Transfer));

        return this.createUpdateTransaction(
            EntrypointName.fromStringUnchecked('transfer'),
            serialize,
            metadata,
            transfers,
            format
        ) as CIS2.UpdateTransaction<CIS2.TransferParamJson[]>;
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
     * @returns {Promise<TransactionHash.Type>} The transaction hash of the update transaction
     */
    public transfer(
        metadata: CIS2.TransactionMetadata,
        transfer: CIS2.Transfer,
        signer: AccountSigner
    ): Promise<TransactionHash.Type>;
    /**
     * Sends a CIS-2 "transfer" update transaction containing a list transfers.
     *
     * @param {CIS2.TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2.Transfer[]} transfers - A list of transfer objects, each specifying the details of a transfer.
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {Promise<TransactionHash.Type>} The transaction hash of the update transaction
     */
    public transfer(
        metadata: CIS2.TransactionMetadata,
        transfers: CIS2.Transfer[],
        signer: AccountSigner
    ): Promise<TransactionHash.Type>;
    public transfer(
        metadata: CIS2.TransactionMetadata,
        transfers: CIS2.Transfer | CIS2.Transfer[],
        signer: AccountSigner
    ): Promise<TransactionHash.Type> {
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
    ): CIS2.UpdateTransaction<CIS2.UpdateOperatorParamJson[]>;
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
    ): CIS2.UpdateTransaction<CIS2.UpdateOperatorParamJson[]>;
    public createUpdateOperator(
        metadata: CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[]
    ): CIS2.UpdateTransaction<CIS2.UpdateOperatorParamJson[]>;
    public createUpdateOperator(
        metadata: CIS2.CreateTransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[]
    ): CIS2.UpdateTransaction<CIS2.UpdateOperatorParamJson[]> {
        const serialize = makeDynamicFunction(serializeCIS2UpdateOperators);
        const format = makeDynamicFunction((us: CIS2.UpdateOperator[]) => us.map(formatCIS2UpdateOperator));

        return this.createUpdateTransaction(
            EntrypointName.fromStringUnchecked('updateOperator'),
            serialize,
            metadata,
            updates,
            format
        ) as CIS2.UpdateTransaction<CIS2.UpdateOperatorParamJson[]>;
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
     * @returns {Promise<TransactionHash.Type>} The transaction hash of the update transaction
     */
    public updateOperator(
        metadata: CIS2.TransactionMetadata,
        update: CIS2.UpdateOperator,
        signer: AccountSigner
    ): Promise<TransactionHash.Type>;
    /**
     * Sends a CIS-2 "operatorOf" update transaction containing a list of operator update instructions.
     *
     * @param {CIS2.TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2.UpdateOperator[]} updates - A list of update instruction objects, each specifying the details of an update.
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     *
     * @throws If the update could not be invoked successfully.
     *
     * @returns {Promise<TransactionHash.Type>} The transaction hash of the update transaction
     */
    public updateOperator(
        metadata: CIS2.TransactionMetadata,
        updates: CIS2.UpdateOperator[],
        signer: AccountSigner
    ): Promise<TransactionHash.Type>;
    public updateOperator(
        metadata: CIS2.TransactionMetadata,
        updates: CIS2.UpdateOperator | CIS2.UpdateOperator[],
        signer: AccountSigner
    ): Promise<TransactionHash.Type> {
        const transaction = this.createUpdateOperator(metadata, updates);
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Invokes CIS-2 "balanceOf" with a single query.
     *
     * @param {CIS2.BalanceOfQuery} query - The query object specifying the details of the query.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {bigint} The balance corresponding to the query.
     */
    public balanceOf(query: CIS2.BalanceOfQuery, blockHash?: BlockHash.Type): Promise<bigint>;
    /**
     * Invokes CIS-2 "balanceOf" with a list of queries.
     *
     * @param {CIS2.BalanceOfQuery[]} queries - A list of query objects, each specifying the details of a query.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {bigint[]} A list of balances corresponding to and ordered by the list of queries.
     */
    public balanceOf(queries: CIS2.BalanceOfQuery[], blockHash?: BlockHash.Type): Promise<bigint[]>;
    public async balanceOf(
        queries: CIS2.BalanceOfQuery | CIS2.BalanceOfQuery[],
        blockHash?: BlockHash.Type
    ): Promise<bigint | bigint[]> {
        const serialize = makeDynamicFunction(serializeCIS2BalanceOfQueries);
        const deserialize = ensureMatchesInput(queries, deserializeCIS2BalanceOfResponse);
        return this.invokeView(
            EntrypointName.fromStringUnchecked('balanceOf'),
            serialize,
            deserialize,
            queries,
            blockHash
        );
    }

    /**
     * Invokes CIS-2 "operatorOf" with a single query.
     *
     * @param {CIS2.OperatorOfQuery} query - The query object specifying the details of the query.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {boolean} Whether the specified address is an operator of the specified owner.
     */
    public operatorOf(query: CIS2.OperatorOfQuery, blockHash?: BlockHash.Type): Promise<boolean>;
    /**
     * Invokes CIS-2 "operatorOf" with a list of queries.
     *
     * @param {CIS2.OperatorOfQuery[]} queries - A list of query objects, each specifying the details of a query.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {boolean[]} As list of boolean results, each detailing whether the specified address is an operator of the specified owner for the corresponding query.
     * The list is ordered by the corresponding query.
     */
    public operatorOf(queries: CIS2.OperatorOfQuery[], blockHash?: BlockHash.Type): Promise<boolean[]>;
    public operatorOf(
        queries: CIS2.OperatorOfQuery | CIS2.OperatorOfQuery[],
        blockHash?: BlockHash.Type
    ): Promise<boolean | boolean[]> {
        const serialize = makeDynamicFunction(serializeCIS2OperatorOfQueries);
        const deserialize = ensureMatchesInput(queries, deserializeCIS2OperatorOfResponse);
        return this.invokeView(
            EntrypointName.fromStringUnchecked('operatorOf'),
            serialize,
            deserialize,
            queries,
            blockHash
        );
    }

    /**
     * Invokes CIS-2 "tokenMetadata" with a single token ID.
     *
     * @param {HexString} tokenId - The ID of the token to get the metadata URL for.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {CIS2.MetadataUrl} An object containing the URL of the token metadata.
     */
    public tokenMetadata(tokenId: HexString, blockHash?: BlockHash.Type): Promise<CIS2.MetadataUrl>;
    /**
     * Invokes CIS-2 "tokenMetadata" with a list of token ID's.
     *
     * @param {HexString[]} tokenIds - A list of ID's of the tokens to get metadata URL's for.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {CIS2.MetadataUrl[]} A list of objects containing URL's for token metadata for the corresponding token.
     * The list is ordered by the token ID's given by `tokenIds` input parameter.
     */
    public tokenMetadata(tokenIds: HexString[], blockHash?: BlockHash.Type): Promise<CIS2.MetadataUrl[]>;
    public tokenMetadata(
        tokenIds: HexString | HexString[],
        blockHash?: BlockHash.Type
    ): Promise<CIS2.MetadataUrl | CIS2.MetadataUrl[]> {
        const serialize = makeDynamicFunction(serializeCIS2TokenIds);
        const deserialize = ensureMatchesInput(tokenIds, deserializeCIS2TokenMetadataResponse);
        return this.invokeView(
            EntrypointName.fromStringUnchecked('tokenMetadata'),
            serialize,
            deserialize,
            tokenIds,
            blockHash
        );
    }
}
