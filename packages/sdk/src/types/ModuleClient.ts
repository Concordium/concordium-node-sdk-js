import { ContractTransactionMetadata } from '../GenericContract.js';
import { ConcordiumGRPCClient } from '../grpc/index.js';
import { AccountSigner, signTransaction } from '../signHelpers.js';
import { AccountTransactionType, InitContractPayload, VersionedModuleSource } from '../types.js';
import * as BlockHash from './BlockHash.js';
import * as CcdAmount from './CcdAmount.js';
import * as ContractName from './ContractName.js';
import * as ModuleReference from './ModuleReference.js';
import * as Parameter from './Parameter.js';
import * as TransactionExpiry from './TransactionExpiry.js';
import * as TransactionHash from './TransactionHash.js';

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
 * Internal class representing a smart contract module deployed on chain.
 *
 * The public type for this {@link ModuleClient} is exported separately to ensure
 * the constructor is only available from within this module.
 */
class ModuleClient {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __nominal = true;
    constructor(
        /** The gRPC connection used by this object */
        public readonly grpcClient: ConcordiumGRPCClient,
        /** The reference for this module */
        public readonly moduleReference: ModuleReference.Type
    ) {}
}

/**
 * Type representing a smart contract module deployed on chain.
 */
export type Type = ModuleClient;
export function instanceOf(value: unknown): value is ModuleClient {
    return value instanceof ModuleClient;
}

/**
 * Create a new `GenericModule` instance for interacting with a smart contract module on chain.
 * The caller must ensure that the smart contract module is already deployed on chain.
 *
 * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
 * @param {ModuleReference} moduleReference - The reference of the deployed smart contract module.
 *
 * @returns {ModuleClient}
 */
export function createUnchecked(grpcClient: ConcordiumGRPCClient, moduleReference: ModuleReference.Type): ModuleClient {
    return new ModuleClient(grpcClient, moduleReference);
}

/**
 * Create a new `GenericModule` instance for interacting with a smart contract module on chain.
 * This function ensures the module is already deployed on chain otherwise produces an error.
 *
 * @param {ConcordiumGRPCClient} grpcClient - The GRPC client for accessing a node.
 * @param {ModuleReference} moduleReference - The reference of the deployed smart contract module.
 *
 * @throws If failing to communicate with the concordium node or module reference does not correspond to a module on chain.
 *
 * @returns {ModuleClient}
 */
export async function create(
    grpcClient: ConcordiumGRPCClient,
    moduleReference: ModuleReference.Type
): Promise<ModuleClient> {
    const mod = new ModuleClient(grpcClient, moduleReference);
    await checkOnChain(mod);
    return mod;
}

/**
 * Check if this module is deployed to the chain.
 *
 * @param {ModuleClient} moduleClient The client for a smart contract module on chain.
 * @param {BlockHash.Type} [blockHash] Hash of the block to check information at. When not provided the last finalized block is used.
 *
 * @throws {RpcError} If failing to communicate with the concordium node or module is not deployed on chain.
 * @returns {boolean} Indicating whether the module is deployed on chain.
 */
export async function checkOnChain(moduleClient: ModuleClient, blockHash?: BlockHash.Type): Promise<void> {
    await getModuleSource(moduleClient, blockHash);
}

/**
 * Get the module source of the deployed smart contract module.
 *
 * @param {ModuleClient} moduleClient The client for a smart contract module on chain.
 * @param {BlockHash.Type} [blockHash] Hash of the block to check information at. When not provided the last finalized block is used.
 *
 * @throws {RpcError} If failing to communicate with the concordium node or module not found.
 * @returns {VersionedModuleSource} Module source of the deployed smart contract module.
 */
export function getModuleSource(
    moduleClient: ModuleClient,
    blockHash?: BlockHash.Type
): Promise<VersionedModuleSource> {
    return moduleClient.grpcClient.getModuleSource(moduleClient.moduleReference, blockHash);
}

/**
 * Creates and sends transaction for initializing a smart contract `contractName` with parameter `input`.
 *
 * @param {ModuleClient} moduleClient The client for a smart contract module on chain.
 * @param {ContractName.Type} contractName - The name of the smart contract to instantiate (this is without the `init_` prefix).
 * @param {ContractTransactionMetadata} metadata - Metadata to be used for the transaction (with defaults).
 * @param {Parameter.Type} parameter - Input for for contract function.
 * @param {AccountSigner} signer - An object to use for signing the transaction.
 *
 * @throws If the query could not be invoked successfully.
 *
 * @returns {TransactionHash.Type} The transaction hash of the update transaction.
 */
export async function createAndSendInitTransaction(
    moduleClient: ModuleClient,
    contractName: ContractName.Type,
    metadata: ContractTransactionMetadata,
    parameter: Parameter.Type,
    signer: AccountSigner
): Promise<TransactionHash.Type> {
    const payload: InitContractPayload = {
        moduleRef: moduleClient.moduleReference,
        amount: metadata.amount ?? CcdAmount.zero(),
        initName: contractName,
        maxContractExecutionEnergy: metadata.energy,
        param: parameter,
    };
    const { nonce } = await moduleClient.grpcClient.getNextAccountNonce(metadata.senderAddress);
    const header = {
        expiry: metadata.expiry ?? TransactionExpiry.futureMinutes(5),
        nonce: nonce,
        sender: metadata.senderAddress,
    };
    const transaction = {
        type: AccountTransactionType.InitContract,
        header,
        payload,
    };
    const signature = await signTransaction(transaction, signer);
    return moduleClient.grpcClient.sendAccountTransaction(transaction, signature);
}
