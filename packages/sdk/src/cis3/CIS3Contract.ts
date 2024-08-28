import {
    CISContract,
    ContractDryRun,
    ContractTransactionMetadata,
    ContractUpdateTransactionWithSchema,
    CreateContractTransactionMetadata,
} from '../GenericContract.js';
import { ensureMatchesInput } from '../deserializationHelpers.js';
import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';
import { AccountSigner } from '../signHelpers.js';
import { InvokeContractResult } from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as BlockHash from '../types/BlockHash.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as ContractName from '../types/ContractName.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as TransactionHash from '../types/TransactionHash.js';
import { makeDynamicFunction } from '../util.js';
import {
    CIS3,
    deserializeCIS3SupportsPermitResponse,
    formatCIS3PermitParam,
    serializeCIS3PermitParam,
    serializeCIS3SupportsPermitQueryParams,
} from './util.js';

type View = 'supportsPermit';
type Update = 'permit';

/**
 * Contains methods for performing dry-run invocations of update instructions on CIS3 smart contracts.
 */
class CIS3DryRun extends ContractDryRun<Update> {
    /**
     * Performs a dry-run invocation of the `permit` entrypoint.
     *
     * @param {AccountAddress.Type | ContractAddress.Type} sender - The address of the sender of the transaction.
     * @param {CIS3.PermitParam} params - The parameters for the `permit` entrypoint.
     * @param {BlockHash.Type} blockHash - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {InvokeContractResult} The contract invocation result, which includes whether or not the invocation succeeded along with the energy spent.
     */
    public permit(
        sender: AccountAddress.Type | ContractAddress.Type,
        params: CIS3.PermitParam,
        blockHash?: BlockHash.Type
    ): Promise<InvokeContractResult> {
        return this.invokeMethod(
            EntrypointName.fromStringUnchecked('permit'),
            sender,
            serializeCIS3PermitParam,
            params,
            blockHash
        );
    }
}

/**
 * Defines methods for interacting with CIS3 contracts.
 */
export class CIS3Contract extends CISContract<Update, View, CIS3DryRun> {
    /**
     * Parameter schema for the `permit` CIS3 entrypoint.
     */
    public schema: Record<Update, string> = {
        /** Parameter schema for `permit` entrypoint */
        permit: 'FAADAAAACQAAAHNpZ25hdHVyZRIAAhIAAhUBAAAABwAAAEVkMjU1MTkBAQAAAB5AAAAABgAAAHNpZ25lcgsHAAAAbWVzc2FnZRQABQAAABAAAABjb250cmFjdF9hZGRyZXNzDAUAAABub25jZQUJAAAAdGltZXN0YW1wDQsAAABlbnRyeV9wb2ludBYBBwAAAHBheWxvYWQQAQI=',
    };

    /**
     * Creates a new `CIS3Contract` instance by querying the node for the necessary information through the supplied `grpcClient`.
     *
     * @param {ConcordiumGRPCClient} grpcClient - The client used for contract invocations and updates.
     * @param {ContractAddress} contractAddress - Address of the contract instance.
     *
     * @throws If `InstanceInfo` could not be received for the contract,
     * or if the contract name could not be parsed from the information received from the node.
     */
    public static async create(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type
    ): Promise<CIS3Contract> {
        const contractName = await super.getContractName(grpcClient, contractAddress);
        return new CIS3Contract(grpcClient, contractAddress, contractName);
    }

    protected makeDryRunInstance(
        grpcClient: ConcordiumGRPCClient,
        contractAddress: ContractAddress.Type,
        contractName: ContractName.Type
    ): CIS3DryRun {
        return new CIS3DryRun(grpcClient, contractAddress, contractName);
    }

    /**
     * Creates a CIS3 `permit` update transaction.
     * This is a CIS3 sponsored transaction that allows a sponsor to send a transaction on behalf of a sponsoree.
     *
     * @param {CreateContractTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS3.PermitParam} params - The parameters for the `permit` entrypoint.
     *     Includes the signature of the sponsoree, the address of the sponsoree, and the signed message.
     *
     * @returns {ContractUpdateTransactionWithSchema} Transaction data for a `CIS3.permit` update.
     */
    public createPermit(
        metadata: CreateContractTransactionMetadata,
        params: CIS3.PermitParam
    ): ContractUpdateTransactionWithSchema {
        return this.createUpdateTransaction(
            EntrypointName.fromStringUnchecked('permit'),
            serializeCIS3PermitParam,
            metadata,
            params,
            formatCIS3PermitParam
        );
    }

    /**
     * Sends a `permit` update transaction to the network.
     * This is a CIS3 sponsored transaction that allows a sponsor to send a transaction on behalf of a sponsoree.
     *
     * @param {ContractTransactionMetadata} metadata - Metadata needed for the transaction creation.
     * @param {CIS3.PermitParam} params - The parameters for the `permit` entrypoint.
     *     Includes the signature of the sponsoree, the address of the sponsoree, and the signed message.
     * @param {AccountSigner} signer - The signer (of the sponsor) to use for the transaction.
     *
     * @returns {Promise<TransactionHash>} The hash of the transaction.
     */
    public permit(
        metadata: ContractTransactionMetadata,
        params: CIS3.PermitParam,
        signer: AccountSigner
    ): Promise<TransactionHash.Type> {
        const transaction = this.createPermit(metadata, params);
        return this.sendUpdateTransaction(transaction, metadata, signer);
    }

    /**
     * Queries the contract to determine if the `permit` function supports a given entrypoint.
     *
     * @param {EntrypointName.Type} entrypoint - The entrypoint to check for support.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {Promise<boolean>} Whether the contract supports the entrypoint.
     */
    public supportsPermit(entrypoint: EntrypointName.Type, blockHash?: BlockHash.Type): Promise<boolean>;
    /**
     * Queries the contract with a list of entrypoints to determine if the `permit` function
     * supports the given entrypoints. Returns an array of booleans indicating support for each entrypoint.
     *
     * @param {EntrypointName.Type[]} entrypoints - The entrypoint to check for support.
     * @param {BlockHash.Type} [blockHash] - The hash of the block to perform the invocation of. Defaults to the latest finalized block on chain.
     *
     * @returns {Promise<boolean[]>} An array of booleans indicating support for each given entrypoint.
     */
    public supportsPermit(entrypoints: EntrypointName.Type[], blockHash?: BlockHash.Type): Promise<boolean[]>;
    public supportsPermit(
        entrypoints: EntrypointName.Type | EntrypointName.Type[],
        blockHash?: BlockHash.Type
    ): Promise<boolean | boolean[]> {
        const serialize = makeDynamicFunction(serializeCIS3SupportsPermitQueryParams);
        const deserialize = ensureMatchesInput(entrypoints, deserializeCIS3SupportsPermitResponse);
        return this.invokeView(
            EntrypointName.fromStringUnchecked('supportsPermit'),
            serialize,
            deserialize,
            entrypoints,
            blockHash
        );
    }
}
