import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionType,
    ContractAddress,
    HexString,
    InvokeContractResult,
    UpdateContractPayload,
} from '../types';
import ConcordiumNodeClient from '../GRPCClient';
import { AccountSigner, signTransaction } from '../signHelpers';
import {
    CIS2TransactionMetadata,
    CIS2Transfer,
    CIS2UpdateOperator,
    serializeCIS2OperatorUpdates,
    serializeCIS2Transfers,
    makeSerializeDynamic,
    CIS2BalanceOfQuery,
    serializeCIS2BalanceOfQueries,
    deserializeCIS2BalanceOfResponse,
    Address,
    isContractAddress,
    getPrintableContractAddress,
    serializeCIS2TokenIds,
    deserializeCIS2TokenMetadataResponse,
    CIS2MetadataUrl,
    CIS2OperatorOfQuery,
    serializeCIS2OperatorOfQueries,
    deserializeCIS2OperatorOfResponse,
} from './util';
import { AccountAddress } from '../types/accountAddress';
import { CcdAmount } from '../types/ccdAmount';
import { TransactionExpiry } from '../types/transactionExpiry';

const getInvoker = (address: Address): ContractAddress | AccountAddress =>
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
     * @param {Address} sender - Address of the sender of the transfer.
     * @param {CIS2Transfer | CIS2Transfer[]} transfer(s) - The transfer object(s).
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    transfer(
        sender: Address,
        transfer: CIS2Transfer,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    transfer(
        sender: Address,
        transfers: CIS2Transfer[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    transfer(
        sender: Address,
        transfers: CIS2Transfer | CIS2Transfer[],
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
     * @param {Address} owner - Address of the owner of the address to perform the update on.
     * @param {CIS2UpdateOperator | CIS2UpdateOperator[]} update(s) - The update object(s).
     * @param {HexString} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} the contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    updateOperator(
        owner: Address,
        update: CIS2UpdateOperator,
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    updateOperator(
        owner: Address,
        updates: CIS2UpdateOperator[],
        blockHash?: HexString
    ): Promise<InvokeContractResult>;
    updateOperator(
        owner: Address,
        updates: CIS2UpdateOperator | CIS2UpdateOperator[],
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
        const parameter = makeSerializeDynamic(serializer)(input);
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
     */
    static async create(
        grpcClient: ConcordiumNodeClient,
        contractAddress: ContractAddress
    ): Promise<CIS2Contract> {
        const instanceInfo = await grpcClient.getInstanceInfo(contractAddress);

        if (instanceInfo === undefined) {
            throw new Error(
                `Could not get contract instance info for contract at address ${JSON.stringify(
                    getPrintableContractAddress(contractAddress)
                )}`
            );
        }

        const contractName = instanceInfo.name.substring(5);
        return new CIS2Contract(grpcClient, contractAddress, contractName);
    }

    /**
     * Sends a CIS-2 "transfer" update transaction containing a single transfer.
     *
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     * @param {CIS2TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2Transfer} transfer - The transfer object specifying the details of the transfer.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    transfer(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        transfer: CIS2Transfer
    ): Promise<HexString>;
    /**
     * Sends a CIS-2 "transfer" update transaction containing a list transfers.
     *
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     * @param {CIS2TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2Transfer[]} transfers - A list of transfer objects, each specifying the details of a transfer.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    transfer(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        transfers: CIS2Transfer[]
    ): Promise<HexString>;
    transfer(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        transfers: CIS2Transfer | CIS2Transfer[]
    ): Promise<HexString> {
        return this.sendUpdateTransaction(
            'transfer',
            serializeCIS2Transfers,
            signer,
            metadata,
            transfers
        );
    }

    /**
     * Sends a CIS-2 "operatorOf" update transaction containing a single operator update instruction.
     *
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     * @param {CIS2TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2UpdateOperator} update - The update instruction object specifying the details of the update.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    updateOperator(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        update: CIS2UpdateOperator
    ): Promise<HexString>;
    /**
     * Sends a CIS-2 "operatorOf" update transaction containing a list of operator update instructions.
     *
     * @param {AccountSigner} signer - To be used for signing the transaction sent to the node.
     * @param {CIS2TransactionMetadata} metadata - Metadata needed for the transaction.
     * @param {CIS2UpdateOperator[]} updates - A list of update instruction objects, each specifying the details of an update.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    updateOperator(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        updates: CIS2UpdateOperator[]
    ): Promise<HexString>;
    updateOperator(
        signer: AccountSigner,
        metadata: CIS2TransactionMetadata,
        updates: CIS2UpdateOperator | CIS2UpdateOperator[]
    ): Promise<HexString> {
        return this.sendUpdateTransaction(
            'updateOperator',
            serializeCIS2OperatorUpdates,
            signer,
            metadata,
            updates
        );
    }

    /**
     * Invokes CIS-2 "balanceOf" with a single query.
     *
     * @param {CIS2BalanceOfQuery} query - The query object specifying the details of the query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @returns {bigint} The balance corresponding to the query.
     */
    balanceOf(
        query: CIS2BalanceOfQuery,
        blockHash?: HexString
    ): Promise<bigint>;
    /**
     * Invokes CIS-2 "balanceOf" with a list of queries.
     *
     * @param {CIS2BalanceOfQuery[]} queries - A list of query objects, each specifying the details of a query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @returns {bigint[]} A list of balances corresponding to and ordered by the list of queries.
     */
    balanceOf(
        queries: CIS2BalanceOfQuery[],
        blockHash?: HexString
    ): Promise<bigint[]>;
    async balanceOf(
        queries: CIS2BalanceOfQuery | CIS2BalanceOfQuery[],
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
     * @param {CIS2OperatorOfQuery} query - The query object specifying the details of the query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @returns {boolean} Whether the specified address is an operator of the specified owner.
     */
    operatorOf(
        query: CIS2OperatorOfQuery,
        blockHash?: HexString
    ): Promise<boolean>;
    /**
     * Invokes CIS-2 "operatorOf" with a list of queries.
     *
     * @param {CIS2OperatorOfQuery[]} queries - A list of query objects, each specifying the details of a query.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @returns {boolean[]} As list of boolean results, each detailing whether the specified address is an operator of the specified owner for the corresponding query.
     * The list is ordered by the corresponding query.
     */
    operatorOf(
        queries: CIS2OperatorOfQuery[],
        blockHash?: HexString
    ): Promise<boolean[]>;
    operatorOf(
        queries: CIS2OperatorOfQuery | CIS2OperatorOfQuery[],
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
     * @returns {CIS2MetadataUrl} An object containing the URL of the token metadata.
     */
    tokenMetadata(
        tokenId: HexString,
        blockHash?: HexString
    ): Promise<CIS2MetadataUrl>;
    /**
     * Invokes CIS-2 "tokenMetadata" with a list of token ID's.
     *
     * @param {HexString[]} tokenIds - A list of ID's of the tokens to get metadata URL's for.
     * @param {HexString} [blockHash] - The hash of the block to perform the query at. Defaults to the latest finalized block.
     *
     * @returns {CIS2MetadataUrl[]} A list of objects containing URL's for token metadata for the corresponding token.
     * The list is ordered by the token ID's given by `tokenIds` input parameter.
     */
    tokenMetadata(
        tokenIds: HexString[],
        blockHash?: HexString
    ): Promise<CIS2MetadataUrl[]>;
    tokenMetadata(
        tokenIds: HexString | HexString[],
        blockHash?: HexString
    ): Promise<CIS2MetadataUrl | CIS2MetadataUrl[]> {
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
     * @param {AccountSigner} signer - An object to use for signing the transaction.
     * @param {CIS2TransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
     * @param {T | T[]} input - Input for for contract function.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    private async sendUpdateTransaction<T>(
        entrypoint: string,
        serializer: (input: T[]) => Buffer,
        signer: AccountSigner,
        {
            amount = 0n,
            senderAddress,
            nonce,
            energy,
            expiry = getDefaultExpiryDate(),
        }: CIS2TransactionMetadata,
        input: T | T[]
    ): Promise<HexString> {
        const parameter = makeSerializeDynamic(serializer)(input);
        const payload: UpdateContractPayload = {
            amount: new CcdAmount(amount),
            address: this.contractAddress,
            receiveName: `${this.contractName}.${entrypoint}`,
            maxContractExecutionEnergy: energy,
            message: parameter,
        };
        const transaction: AccountTransaction = {
            type: AccountTransactionType.Update,
            header: {
                expiry: new TransactionExpiry(expiry),
                nonce,
                sender: new AccountAddress(senderAddress),
            },
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
     * @returns {HexString} The transaction hash of the update transaction
     */
    private async invokeView<T, R>(
        entrypoint: string,
        serializer: (input: T[]) => Buffer,
        deserializer: (value: HexString) => R[],
        input: T | T[],
        blockHash?: HexString
    ): Promise<R | R[]> {
        const parameter = makeSerializeDynamic(serializer)(input);
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
                `Failed to invoke view ${entrypoint} for contract at ${JSON.stringify(
                    this.contractAddress
                )}`
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
