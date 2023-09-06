import {
    AccountAddress,
    AccountSigner,
    AccountTransactionType,
    CcdAmount,
    ConcordiumGRPCClient,
    ContractTransactionMetadata,
    HexString,
    InitContractPayload,
    TransactionExpiry,
    VersionedModuleSource,
    getContractUpdateDefaultExpiryDate,
    signTransaction,
} from '.';
import { checkParameterLength } from './contractHelpers';
import { ModuleReference } from './types/moduleReference';
import { Buffer } from 'buffer/';

/**
 * An update transaction without header.
 */
export type ContractInitTransaction = {
    /** The type of the transaction, which will always be of type {@link AccountTransactionType.InitContract} */
    type: AccountTransactionType.InitContract;
    /** The payload of the transaction, which will always be of type {@link InitContractPayload} */
    payload: InitContractPayload;
};

/**
 * Type representing a smart contract module deployed on chain.
 *
 * @template C - Union of contract names in the smart contract module.
 */
export class DeployedModule<C extends string = string> {
    /** Private constructor to enforce creating objects using a static method. */
    private constructor(
        /** The gRPC connection used by this object */
        public grpcClient: ConcordiumGRPCClient,
        /** The reference for this module */
        public moduleReference: ModuleReference
    ) {}

    /**
     * Create a new `GenericModule` instance for interacting with a smart contract module on chain.
     * This function ensures the module is already deployed on chain otherwise produces an error.
     *
     * @template C - Union of contract names in the smart contract module.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
     * @param {ModuleReference} moduleReference - The reference of the deployed smart contract module.
     *
     * @throws If failing to communicate with the concordium node or module reference does not correspond to a module on chain.
     *
     * @returns {DeployedModule<C>}
     */
    public static async create<C extends string = string>(
        grpcClient: ConcordiumGRPCClient,
        moduleReference: ModuleReference
    ): Promise<DeployedModule<C>> {
        const mod = new DeployedModule<C>(grpcClient, moduleReference);
        await mod.checkOnChain();
        return mod;
    }

    /**
     * Create a new `GenericModule` instance for interacting with a smart contract module on chain.
     * The caller must ensure that the smart contract module is already deployed on chain.
     *
     * @template C - Union of contract names in the smart contract module.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
     * @param {ModuleReference} moduleReference - The reference of the deployed smart contract module.
     *
     * @returns {DeployedModule<C>}
     */
    public static createUnchecked<C extends string = string>(
        grpcClient: ConcordiumGRPCClient,
        moduleReference: ModuleReference
    ): DeployedModule<C> {
        return new DeployedModule<C>(grpcClient, moduleReference);
    }

    /**
     * Check if this module is deployed to the chain.
     *
     * @param {string} [blockHash] Hash of the block to check information at. When not provided the last finalized block is used.
     *
     * @throws {RpcError} If failing to communicate with the concordium node or module is not deployed on chain.
     */
    public async checkOnChain(blockHash?: string): Promise<void> {
        await this.getModuleSource(blockHash);
    }

    /**
     * Get the module source of the deployed smart contract module.
     *
     * @param {string} [blockHash] Hash of the block to check information at. When not provided the last finalized block is used.
     *
     * @throws {RpcError} If failing to communicate with the concordium node or module not found.
     * @returns {VersionedModuleSource} Module source of the deployed smart contract module.
     */
    public getModuleSource(blockHash?: string): Promise<VersionedModuleSource> {
        return this.grpcClient.getModuleSource(this.moduleReference, blockHash);
    }

    /**
     * Creates and sends transaction for initializing a smart contract `contractName` with parameter `input`.
     *
     * @template T - The type of the input.
     *
     * @param {string} contractName - The name of the smart contract to instantiate (this is without the `init_` prefix).
     * @param {Function} serializeInput - A function to serialize the `input` to bytes.
     * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
     * @param {T} input - Input for for contract function.
     * @param {AccountSigner} signer - An object to use for signing the transaction.
     *
     * @throws If the query could not be invoked successfully.
     *
     * @returns {HexString} The transaction hash of the update transaction
     */
    public async createAndSendInitTransaction<T>(
        contractName: C,
        serializeInput: (input: T) => Buffer,
        metadata: ContractTransactionMetadata,
        input: T,
        signer: AccountSigner
    ): Promise<HexString> {
        const parameter = serializeInput(input);
        checkParameterLength(parameter);
        const payload: InitContractPayload = {
            moduleRef: this.moduleReference,
            amount: new CcdAmount(metadata.amount ?? 0n),
            initName: `init_${contractName}`,
            maxContractExecutionEnergy: metadata.energy,
            param: parameter,
        };
        const sender = new AccountAddress(metadata.senderAddress);
        const { nonce } = await this.grpcClient.getNextAccountNonce(sender);
        const header = {
            expiry: new TransactionExpiry(
                metadata.expiry ?? getContractUpdateDefaultExpiryDate()
            ),
            nonce: nonce,
            sender,
        };
        const transaction = {
            type: AccountTransactionType.InitContract,
            header,
            payload,
        };
        const signature = await signTransaction(transaction, signer);
        return this.grpcClient.sendAccountTransaction(transaction, signature);
    }
}
