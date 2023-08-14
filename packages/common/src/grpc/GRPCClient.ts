/**
 * This is the GRPC-Client used by both the Web-SDK and the NodeJS-SDK. Check
 * out the {@link ConcordiumGRPCClient}
 *
 * @module Common GRPC-Client
 */
import { Buffer } from 'buffer/';
import type { RpcTransport } from '@protobuf-ts/runtime-rpc';

import * as v1 from '../types';
import * as v2 from '../../grpc-api/v2/concordium/types';
import { Base58String, HexString, isRpcError } from '../types';
import { QueriesClient } from '../../grpc-api/v2/concordium/service.client';
import { CredentialRegistrationId } from '../types/CredentialRegistrationId';
import * as translate from './translation';
import { AccountAddress } from '../types/accountAddress';
import { getAccountTransactionHandler } from '../accountTransactions';
import { calculateEnergyCost } from '../energyCost';
import {
    countSignatures,
    isHex,
    isValidHash,
    isValidIp,
    mapStream,
    unwrap,
    wasmToSchema,
} from '../util';
import { serializeAccountTransactionPayload } from '../serialization';
import { BlockItemStatus, BlockItemSummary } from '../types/blockItemSummary';
import { ModuleReference } from '../types/moduleReference';
import { DEFAULT_INVOKE_ENERGY } from '../constants';
import { TransactionExpiry } from '../types/transactionExpiry';

/**
 * @hidden
 */
export type FindInstanceCreationReponse = {
    hash: HexString;
    height: bigint;
    instanceInfo: v1.InstanceInfo;
};

/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @example
 * import { ConcordiumGRPCClient } from "..."
 * const client = new ConcordiumGRPCClient('127.0.0.1', 20000, credentials, metadata, 15000);
 */
export class ConcordiumGRPCClient {
    client: QueriesClient;

    /**
     * Initialize a gRPC client for a specific concordium node.
     * @param transport RpcTransport to send communication over
     */
    constructor(transport: RpcTransport) {
        this.client = new QueriesClient(transport);
    }

    /**
     * Retrieves the next account nonce for the given account. The account nonce is
     * used in all account transactions as part of their header.
     *
     * {@codeblock ~~:client/getNextAccountSequenceNumber.ts#documentation-snippet}
     *
     * @param accountAddress base58 account address to get the next account nonce for.
     *
     * @returns the next account nonce, and a boolean indicating if the nonce is reliable.
     */
    async getNextAccountNonce(
        accountAddress: AccountAddress
    ): Promise<v1.NextAccountNonce> {
        const address: v2.AccountAddress = {
            value: new Uint8Array(accountAddress.decodedAddress),
        };

        const response = await this.client.getNextAccountSequenceNumber(address)
            .response;
        return translate.nextAccountSequenceNumber(response);
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     *
     * {@codeblock ~~:client/getCryptographicParameters.ts#documentation-snippet}
     *
     * @param blockHash optional block hash to get the cryptographic parameters at, otherwise retrieves from last finalized block.
     * @returns the global cryptographic parameters at the given block, or undefined it the block does not exist.
     */
    async getCryptographicParameters(
        blockHash?: HexString
    ): Promise<v1.CryptographicParameters> {
        const blockHashInput = getBlockHashInput(blockHash);

        const response = await this.client.getCryptographicParameters(
            blockHashInput
        ).response;
        return translate.cryptographicParameters(response);
    }

    /**
     * Retrieves the account info for the given account. If the provided block
     * hash is in a block prior to the finalization of the account, then the account
     * information will not be available.
     * A credential registration id can also be provided, instead of an address. In this case
     * the node will return the account info of the account, which the corresponding credential
     * is (or was) deployed to. An account index can also be provided.
     *
     * {@codeblock ~~:client/getAccountInfo.ts#documentation-snippet}
     *
     * @param accountIdentifier base58 account address, or a credential registration id or account index to get the account info for
     * @param blockHash optional block hash to get the account info at, otherwise retrieves from last finalized block
     *
     * @returns the account info for the provided account address.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getAccountInfo(
        accountIdentifier: v1.AccountIdentifierInput,
        blockHash?: HexString
    ): Promise<v1.AccountInfo> {
        const accountInfoRequest: v2.AccountInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            accountIdentifier: getAccountIdentifierInput(accountIdentifier),
        };

        const response = await this.client.getAccountInfo(accountInfoRequest)
            .response;
        return translate.accountInfo(response);
    }

    /**
     * Retrieves a status for the given transaction/block item.
     *
     * {@codeblock ~~:client/getBlockItemStatus.ts#documentation-snippet}
     *
     * @param transactionHash the transaction/block item to get a status for.
     *
     * @returns the status for the given transaction/block item, or undefined if it does not exist.
     */
    async getBlockItemStatus(
        transactionHash: HexString
    ): Promise<BlockItemStatus> {
        assertValidHash(transactionHash);
        const transactionHashV2: v2.TransactionHash = {
            value: Buffer.from(transactionHash, 'hex'),
        };

        const response = await this.client.getBlockItemStatus(transactionHashV2)
            .response;
        return translate.blockItemStatus(response);
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     *
     * {@codeblock ~~:client/getConsensusStatus.ts#documentation-snippet}
     */
    async getConsensusStatus(): Promise<v1.ConsensusStatus> {
        const response = await this.client.getConsensusInfo(v2.Empty).response;
        return translate.consensusInfo(response);
    }

    /**
     * Retrieves the source of the given module at the provided block.
     *
     * {@codeblock ~~:client/getModuleSource.ts#documentation-snippet}
     *
     * @param moduleRef the module's reference, represented by the ModuleReference class.
     * @param blockHash optional block hash to get the module source at, otherwise retrieves from last finalized block
     *
     * @returns the source of the module as raw bytes.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getModuleSource(
        moduleRef: ModuleReference,
        blockHash?: HexString
    ): Promise<v1.VersionedModuleSource> {
        const moduleSourceRequest: v2.ModuleSourceRequest = {
            blockHash: getBlockHashInput(blockHash),
            moduleRef: { value: moduleRef.decodedModuleRef },
        };

        const response = await this.client.getModuleSource(moduleSourceRequest)
            .response;
        if (response.module.oneofKind === 'v0') {
            return {
                version: 0,
                source: Buffer.from(response.module.v0.value),
            };
        } else if (response.module.oneofKind === 'v1') {
            return {
                version: 1,
                source: Buffer.from(response.module.v1.value),
            };
        } else {
            throw Error('Invalid ModuleSource response received!');
        }
    }

    /**
     * Retrieves the embedded schema of the given module at the provided block.
     *
     * {@codeblock ~~:client/getEmbeddedSchema.ts#documentation-snippet}
     *
     * @param moduleRef the module's reference, represented by the ModuleReference class.
     * @param blockHash optional block hash to get the module embedded schema at, otherwise retrieves from last finalized block
     *
     * @returns the module schema as a buffer.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getEmbeddedSchema(
        moduleRef: ModuleReference,
        blockHash?: HexString
    ): Promise<Buffer> {
        const versionedSource = await this.getModuleSource(
            moduleRef,
            blockHash
        );
        return wasmToSchema(versionedSource.source);
    }

    /**
     * Retrieve information about a given smart contract instance.
     *
     * {@codeblock ~~:client/getInstanceInfo.ts#documentation-snippet}
     *
     * @param contractAddress the address of the smart contract.
     * @param blockHash optional block hash to get the smart contact instances at, otherwise retrieves from last finalized block
     *
     * @returns An object with information about the contract instance.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getInstanceInfo(
        contractAddress: v1.ContractAddress,
        blockHash?: HexString
    ): Promise<v1.InstanceInfo> {
        const instanceInfoRequest: v2.InstanceInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            address: contractAddress,
        };

        const response = await this.client.getInstanceInfo(instanceInfoRequest)
            .response;
        return translate.instanceInfo(response);
    }

    /**
     * Invokes a smart contract.
     *
     * {@codeblock ~~:client/invokeContract.ts#documentation-snippet}
     *
     * @param context.contract The address of the smart contract that shall be evoked.
     * @param context.amount The amount of microCCD to invoke the contract with.
     * @param context.method The entrypoint (receive function) that shall be invoked.
     * @param context.parameter The serialized parameters that the contract will be invoked with.
     * @param context.energy The maximum amount of energy to allow for execution.
     * @param context.invoker The address of the invoker, if undefined uses the zero account address.
     * @param blockHash the block hash at which the contract should be invoked at. The contract is invoked in the state at the end of this block.
     *
     * @returns If the node was able to invoke, then a object describing the outcome is returned.
     * The outcome is determined by the `tag` field, which is either `success` or `failure`.
     * The `usedEnergy` field will always be present, and is the amount of NRG was used during the execution.
     * If the tag is `success`, then an `events` field is present, and it contains the events that would have been generated.
     * If invoking a V1 contract and it produces a return value, it will be present in the `returnValue` field.
     * If the tag is `failure`, then a `reason` field is present, and it contains the reason the update would have been rejected.
     * If either the block does not exist, or then node fails to parse of any of the inputs, then undefined is returned.
     */
    async invokeContract(
        context: v1.ContractContext,
        blockHash?: HexString
    ): Promise<v1.InvokeContractResult> {
        const blockHashInput = getBlockHashInput(blockHash);

        const invokeInstanceRequest: v2.InvokeInstanceRequest = {
            blockHash: blockHashInput,
            invoker: getInvokerInput(context.invoker),
            instance: context.contract,
            amount: { value: context.amount?.microCcdAmount || 0n },
            entrypoint: { value: context.method },
            parameter: { value: context.parameter || Buffer.alloc(0) },
            energy: { value: context.energy || DEFAULT_INVOKE_ENERGY },
        };

        const response = await this.client.invokeInstance(invokeInstanceRequest)
            .response;
        return translate.invokeInstanceResponse(response);
    }

    /**
     * Serializes and sends an account transaction to the node to be
     * put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     *
     * {@codeblock ~~:common/simpleTransfer.ts#documentation-snippet}
     *
     * @param transaction the transaction to send to the node
     * @param signature the signatures on the signing digest of the transaction
     * @returns The transaction hash as a byte array
     */
    async sendAccountTransaction(
        transaction: v1.AccountTransaction,
        signature: v1.AccountTransactionSignature
    ): Promise<HexString> {
        const rawPayload = serializeAccountTransactionPayload(transaction);
        const transactionSignature: v2.AccountTransactionSignature =
            translate.accountTransactionSignatureToV2(signature);

        // Energy cost
        const accountTransactionHandler = getAccountTransactionHandler(
            transaction.type
        );
        const baseEnergyCost = accountTransactionHandler.getBaseEnergyCost(
            transaction.payload
        );
        const energyCost = calculateEnergyCost(
            countSignatures(signature),
            BigInt(rawPayload.length),
            baseEnergyCost
        );

        // Put together sendBlockItemRequest
        const header: v2.AccountTransactionHeader = {
            sender: { value: transaction.header.sender.decodedAddress },
            sequenceNumber: { value: transaction.header.nonce },
            energyAmount: { value: energyCost },
            expiry: { value: transaction.header.expiry.expiryEpochSeconds },
        };
        const accountTransaction: v2.AccountTransaction = {
            signature: transactionSignature,
            header: header,
            payload: {
                payload: { oneofKind: 'rawPayload', rawPayload: rawPayload },
            },
        };
        const sendBlockItemRequest: v2.SendBlockItemRequest = {
            blockItem: {
                oneofKind: 'accountTransaction',
                accountTransaction: accountTransaction,
            },
        };

        const response = await this.client.sendBlockItem(sendBlockItemRequest)
            .response;
        return Buffer.from(response.value).toString('hex');
    }

    /**
     * Sends a credential deployment transaction, for creating a new account,
     * to the node to be put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     *
     * See [this](git:docs/account-creation.md) document for how this function can be used.
     *
     * @param rawPayload the serialized payload, consisting of the {@link v1.CredentialDeploymentTransaction}
     * along with corresponding signatures. This can be serialized by utilizing the `serializeCredentialDeploymentPayload` function.
     * @param expiry the expiry of the transaction
     * @returns The transaction hash as a hex string
     */
    async sendCredentialDeploymentTransaction(
        rawPayload: Buffer,
        expiry: TransactionExpiry
    ): Promise<HexString> {
        const credentialDeployment: v2.CredentialDeployment = {
            messageExpiry: {
                value: expiry.expiryEpochSeconds,
            },
            payload: {
                oneofKind: 'rawPayload',
                rawPayload,
            },
        };
        const sendBlockItemRequest: v2.SendBlockItemRequest = {
            blockItem: {
                oneofKind: 'credentialDeployment',
                credentialDeployment: credentialDeployment,
            },
        };

        const response = await this.client.sendBlockItem(sendBlockItemRequest)
            .response;
        return Buffer.from(response.value).toString('hex');
    }

    /**
     * Retrieves the status of the block chain parameters at the given blockHash.
     *
     * {@codeblock ~~:client/getBlockChainParameters.ts#documentation-snippet}
     *
     * @param blockHash the block hash of the block to get the information from.
     * @returns Info on all of the block chain parameters.
     */
    async getBlockChainParameters(
        blockHash?: HexString
    ): Promise<v1.ChainParameters> {
        const blockHashInput = getBlockHashInput(blockHash);
        const response = await this.client.getBlockChainParameters(
            blockHashInput
        ).response;
        return translate.blockChainParameters(response);
    }

    /**
     * Retrieves information on the baker pool of the given bakerId.
     *
     * {@codeblock ~~:client/getPoolInfo.ts#documentation-snippet}
     *
     * @param blockHash the block hash of the block to get the information from.
     * @param bakerId the ID of the baker to get the status for.
     * @returns The status of the corresponding baker pool.
     */
    async getPoolInfo(
        bakerId: v1.BakerId,
        blockHash?: HexString
    ): Promise<v1.BakerPoolStatus> {
        const input: v2.PoolInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            baker: {
                value: bakerId,
            },
        };
        const response = await this.client.getPoolInfo(input).response;
        return translate.bakerPoolInfo(response);
    }

    /**
     * Retrieves information on the passive delegators.
     *
     * {@codeblock ~~:client/getPassiveDelegationInfo.ts#documentation-snippet}
     *
     * @param blockHash the block hash of the block to get the information from.
     * @returns The status of the passive delegators.
     */
    async getPassiveDelegationInfo(
        blockHash?: HexString
    ): Promise<v1.PassiveDelegationStatus> {
        const input = getBlockHashInput(blockHash);
        const response = await this.client.getPassiveDelegationInfo(input)
            .response;
        return translate.passiveDelegationInfo(response);
    }

    /**
     * Retrieves the reward status at the given blockHash
     *
     * {@codeblock ~~:client/getTokenomicsInfo.ts#documentation-snippet}
     *
     * @param blockHash optional block hash to get the reward status at, otherwise retrieves from last finalized block
     * @returns the reward status at the given block, or undefined it the block does not exist.
     */
    async getTokenomicsInfo(blockHash?: HexString): Promise<v1.TokenomicsInfo> {
        const blockHashInput = getBlockHashInput(blockHash);

        const response = await this.client.getTokenomicsInfo(blockHashInput)
            .response;
        return translate.tokenomicsInfo(response);
    }

    /**
     * Gets a stream of finalized blocks.
     *
     * {@codeblock ~~:client/getFinalizedBlocks.ts#documentation-snippet}
     *
     * @param abortSignal an AbortSignal to close the stream. Note that the
     * stream does not close itself as it is infinite, so usually you'd want
     * to provide this parameter.
     * @returns An AsyncIterator stream of finalized blocks.
     */
    getFinalizedBlocks(
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.FinalizedBlockInfo> {
        const opts = { abort: abortSignal };
        const blocks = this.client.getFinalizedBlocks(v2.Empty, opts).responses;
        return mapStream(blocks, translate.commonBlockInfo);
    }

    /**
     * Gets a stream of blocks. To get a stream of only finalized blocks
     * use `getFinalizedBlocks()` instead.
     *
     * {@codeblock ~~:client/getBlocks.ts#documentation-snippet}
     *
     * @param abortSignal an AbortSignal to close the stream. Note that the
     * stream does not close itself as it is infinite, so usually you'd want
     * to provide this parameter.
     * @returns An AsyncIterator stream of blocks.
     */
    getBlocks(abortSignal?: AbortSignal): AsyncIterable<v1.ArrivedBlockInfo> {
        const opts = { abort: abortSignal };
        const blocks = this.client.getBlocks(v2.Empty, opts).responses;
        return mapStream(blocks, translate.commonBlockInfo);
    }

    /**
     * Waits until given transaction is finalized.
     *
     * {@codeblock ~~:common/simpleTransfer.ts#documentation-snippet}
     *
     * @param transactionHash a transaction hash as a bytearray.
     * @param timeoutTime the number of milliseconds until the function throws error.
     * @returns BlockItemSummary of the transaction.
     */
    async waitForTransactionFinalization(
        transactionHash: HexString,
        timeoutTime?: number
    ): Promise<v1.BlockItemSummaryInBlock> {
        assertValidHash(transactionHash);
        return new Promise(async (resolve, reject) => {
            const abortController = new AbortController();
            if (timeoutTime) {
                setTimeout(() => {
                    abortController.abort();
                    reject(new Error('Function timed out.'));
                }, timeoutTime);
            }

            const blockStream = this.getFinalizedBlocks(abortController.signal);

            const response = await this.getBlockItemStatus(transactionHash);
            if (response.status === 'finalized') {
                // Simply doing `abortController.abort()` causes an error.
                // See: https://github.com/grpc/grpc-node/issues/1652
                setTimeout(() => abortController.abort(), 0);
                return resolve(response.outcome);
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for await (const _ of blockStream) {
                    const response = await this.getBlockItemStatus(
                        transactionHash
                    );
                    if (response.status === 'finalized') {
                        setTimeout(() => abortController.abort(), 0);
                        return resolve(response.outcome);
                    }
                }

                if (!abortController.signal.aborted) {
                    return reject(new Error('Unexpected end of stream.'));
                }
            } catch (error) {
                return reject(error);
            }
        });
    }

    /**
     * Retrieve a stream of accounts that exist at the end of the given block.
     *
     * {@codeblock ~~:client/getAccountList.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the accounts at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of account addresses represented as Base58 encoded strings.
     */
    getAccountList(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<Base58String> {
        const opts = { abort: abortSignal };
        const hash = getBlockHashInput(blockHash);
        const asyncIter = this.client.getAccountList(hash, opts).responses;
        return mapStream(asyncIter, translate.unwrapToBase58);
    }

    /**
     * Get a stream of all smart contract modules' references. The stream will end
     * when all modules that exist in the state at the end of the given
     * block have been returned.
     *
     * {@codeblock ~~:client/getModuleList.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the contract modules at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of contract module references, represented as hex strings.
     */
    getModuleList(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<HexString> {
        const opts = { abort: abortSignal };
        const hash = getBlockHashInput(blockHash);
        const asyncIter = this.client.getModuleList(hash, opts).responses;
        return mapStream(asyncIter, translate.unwrapValToHex);
    }

    /**
     * Get a stream of ancestors for the provided block.
     * Starting with the provided block itself, moving backwards until no more
     * ancestors or the requested number of ancestors has been returned.
     *
     * {@codeblock ~~:client/getAncestors.ts#documentation-snippet}
     *
     * @param maxAmountOfAncestors the maximum amount of ancestors as a bigint.
     * @param blockHash a optional block hash to get the ancestors at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of ancestors' block hashes as hex strings.
     */
    getAncestors(
        maxAmountOfAncestors: bigint,
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<HexString> {
        const opts = { abort: abortSignal };
        const request: v2.AncestorsRequest = {
            blockHash: getBlockHashInput(blockHash),
            amount: maxAmountOfAncestors,
        };
        const asyncIter = this.client.getAncestors(request, opts).responses;
        return mapStream(asyncIter, translate.unwrapValToHex);
    }

    /**
     * Get the exact state of a specific contract instance, streamed as a list of
     * key-value pairs. The list is streamed in lexicographic order of keys.
     *
     * {@codeblock ~~:client/getInstanceState.ts#documentation-snippet}
     *
     * @param contractAddress the contract to get the state of.
     * @param blockHash a optional block hash to get the instance states at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of instance states as key-value pairs of hex strings.
     */
    getInstanceState(
        contractAddress: v1.ContractAddress,
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.InstanceStateKVPair> {
        const opts = { abort: abortSignal };
        const request: v2.InstanceInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            address: contractAddress,
        };
        const asyncIter = this.client.getInstanceState(request, opts).responses;
        return mapStream(asyncIter, translate.instanceStateKVPair);
    }

    /**
     * Get the value at a specific key of a contract state. In contrast to
     * `GetInstanceState` this is more efficient, but requires the user to know
     * the specific key to look for.
     *
     * {@codeblock ~~:client/instanceStateLookup.ts#documentation-snippet}
     *
     * @param contractAddress the contract to get the state of.
     * @param key the key of the desired contract state.
     * @param blockHash a optional block hash to get the instance states at, otherwise retrieves from last finalized block.
     * @returns the state of the contract at the given key as a hex string.
     */
    async instanceStateLookup(
        contractAddress: v1.ContractAddress,
        key: HexString,
        blockHash?: HexString
    ): Promise<HexString> {
        assertValidHex(key);
        const request: v2.InstanceStateLookupRequest = {
            address: contractAddress,
            key: Buffer.from(key, 'hex'),
            blockHash: getBlockHashInput(blockHash),
        };
        const response = await this.client.instanceStateLookup(request)
            .response;
        return translate.unwrapValToHex(response);
    }

    /**
     * Get the identity providers registered as of the end of a given block.
     * The stream will end when all the identity providers have been returned,
     * or an abort signal is called.
     *
     * {@codeblock ~~:client/getIdentityProviders.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the providers at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of identity provider info objects.
     */
    getIdentityProviders(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.IpInfo> {
        const opts = { abort: abortSignal };
        const block = getBlockHashInput(blockHash);
        const ips = this.client.getIdentityProviders(block, opts).responses;
        return mapStream(ips, translate.ipInfo);
    }

    /**
     * Get the anonymity revokers registered as of the end of a given block.
     * The stream will end when all the anonymity revokers have been returned,
     * or an abort signal is called.
     *
     * {@codeblock ~~:client/getAnonymityRevokers.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the anonymity revokers at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of identity provider info objects.
     */
    getAnonymityRevokers(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.ArInfo> {
        const opts = { abort: abortSignal };
        const block = getBlockHashInput(blockHash);
        const ars = this.client.getAnonymityRevokers(block, opts).responses;
        return mapStream(ars, translate.arInfo);
    }

    /**
     * Get a list of live blocks at a given height.
     *
     * {@codeblock ~~:client/getBlocksAtHeightAbsolute.ts#documentation-snippet}
     *
     * @param blockHeightRequest Either an absolute block height request or a relative block height request
     * @returns A list of block hashes as hex strings
     */
    async getBlocksAtHeight(
        blockHeightRequest: v1.BlocksAtHeightRequest
    ): Promise<HexString[]> {
        const requestV2 =
            translate.BlocksAtHeightRequestToV2(blockHeightRequest);
        const blocks = await this.client.getBlocksAtHeight(requestV2).response;
        return translate.blocksAtHeightResponse(blocks);
    }

    /**
     * Get information, such as height, timings, and transaction counts for the given block.
     *
     * {@codeblock ~~:client/getBlockInfo.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the info from, otherwise retrieves from last finalized block.
     * @returns information on a block.
     */
    async getBlockInfo(blockHash?: HexString): Promise<v1.BlockInfo> {
        const block = getBlockHashInput(blockHash);
        const blockInfo = await this.client.getBlockInfo(block).response;
        return translate.blockInfo(blockInfo);
    }

    /**
     * Get all the bakers at the end of the given block.
     *
     * {@codeblock ~~:client/getBakerList.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the baker list at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of BakerIds.
     */
    getBakerList(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.BakerId> {
        const opts = { abort: abortSignal };
        const block = getBlockHashInput(blockHash);
        const bakers = this.client.getBakerList(block, opts).responses;
        return mapStream(bakers, (x) => x.value);
    }

    /**
     * Get the registered delegators of a given pool at the end of a given block.
     * In contrast to the `GetPoolDelegatorsRewardPeriod` which returns delegators
     * that are fixed for the reward period of the block, this endpoint returns the
     * list of delegators that are registered in the block. Any changes to delegators
     * are immediately visible in this list.
     * The stream will end when all the delegators has been returned.
     *
     * {@codeblock ~~:client/getPoolDelegators.ts#documentation-snippet}
     *
     * @param baker The BakerId of the pool owner
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorInfo
     */
    getPoolDelegators(
        baker: v1.BakerId,
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.DelegatorInfo> {
        const request: v2.GetPoolDelegatorsRequest = {
            blockHash: getBlockHashInput(blockHash),
            baker: { value: baker },
        };
        const delegatorInfo = this.client.getPoolDelegators(request, {
            abort: abortSignal,
        }).responses;

        return mapStream(delegatorInfo, translate.delegatorInfo);
    }
    /**
     * Get the fixed delegators of a given pool for the reward period of the given block.
     * In contracts to the `GetPoolDelegators` which returns delegators registered
     * for the given block, this endpoint returns the fixed delegators contributing
     * stake in the reward period containing the given block.
     * The stream will end when all the delegators has been returned.
     *
     * {@codeblock ~~:client/getPoolDelegatorsRewardPeriod.ts#documentation-snippet}
     *
     * @param baker The BakerId of the pool owner
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorRewardPeriodInfo
     */
    getPoolDelegatorsRewardPeriod(
        baker: v1.BakerId,
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.DelegatorRewardPeriodInfo> {
        const request: v2.GetPoolDelegatorsRequest = {
            blockHash: getBlockHashInput(blockHash),
            baker: { value: baker },
        };
        const delegatorInfo = this.client.getPoolDelegatorsRewardPeriod(
            request,
            { abort: abortSignal }
        ).responses;

        return mapStream(delegatorInfo, translate.delegatorInfo);
    }

    /**
     * Get the registered passive delegators at the end of a given block.
     * In contrast to the `GetPassiveDelegatorsRewardPeriod` which returns delegators
     * that are fixed for the reward period of the block, this endpoint returns the
     * list of delegators that are registered in the block. Any changes to delegators
     * are immediately visible in this list.
     * The stream will end when all the delegators has been returned.
     *
     * {@codeblock ~~:client/getPassiveDelegators.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorInfo
     */
    getPassiveDelegators(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.DelegatorInfo> {
        const delegatorInfo = this.client.getPassiveDelegators(
            getBlockHashInput(blockHash),
            { abort: abortSignal }
        ).responses;

        return mapStream(delegatorInfo, translate.delegatorInfo);
    }

    /**
     * Get the fixed passive delegators for the reward period of the given block.
     * In contracts to the `GetPassiveDelegators` which returns delegators registered
     * for the given block, this endpoint returns the fixed delegators contributing
     * stake in the reward period containing the given block.
     * The stream will end when all the delegators has been returned.
     *
     * {@codeblock ~~:client/getPassiveDelegatorsRewardPeriod.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorRewardPeriodInfo
     */
    getPassiveDelegatorsRewardPeriod(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.DelegatorRewardPeriodInfo> {
        const delegatorInfo = this.client.getPassiveDelegatorsRewardPeriod(
            getBlockHashInput(blockHash),
            { abort: abortSignal }
        ).responses;

        return mapStream(delegatorInfo, translate.delegatorInfo);
    }

    /**
     * Get the current branches of blocks starting from and including the last finalized block.
     *
     * {@codeblock ~~:client/getBranches.ts#documentation-snippet}
     *
     * @returns a branch with a block hash and a list of branch-children
     */
    async getBranches(): Promise<v1.Branch> {
        const branch = await this.client.getBranches(v2.Empty).response;
        return translate.branch(branch);
    }

    /**
     * Get information related to the baker election for a particular block.
     *
     * @param blockHash an optional block hash to get the election info at, otherwise retrieves from last finalized block.
     * @returns election info for the given block
     */
    async getElectionInfo(blockHash?: HexString): Promise<v1.ElectionInfo> {
        const blockHashInput = getBlockHashInput(blockHash);
        const electionInfo = await this.client.getElectionInfo(blockHashInput)
            .response;
        return translate.electionInfo(electionInfo);
    }

    /**
     * Get a list of non-finalized transaction hashes for a given account. This
     * endpoint is not expected to return a large amount of data in most cases,
     * but in bad network conditions it might. The stream will end when all the
     * non-finalized transaction hashes have been returned.
     *
     * {@codeblock ~~:client/getAccountNonFinalizedTransactions.ts#documentation-snippet}
     *
     * @param accountAddress The address of the account that you wish to query.
     * @returns a stream of transaction hashes as hex strings.
     */
    getAccountNonFinalizedTransactions(
        accountAddress: AccountAddress,
        abortSignal?: AbortSignal
    ): AsyncIterable<HexString> {
        const transactions = this.client.getAccountNonFinalizedTransactions(
            { value: accountAddress.decodedAddress },
            { abort: abortSignal }
        ).responses;

        return mapStream(transactions, translate.unwrapValToHex);
    }

    /**
     * Get a list of transaction events in a given block.
     * The stream will end when all the transaction events for a given block have been returned.
     *
     * {@codeblock ~~:client/getBlockTransactionEvents.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the transaction events at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of block item summaries
     */
    getBlockTransactionEvents(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<BlockItemSummary> {
        const blockItemSummaries = this.client.getBlockTransactionEvents(
            getBlockHashInput(blockHash),
            { abort: abortSignal }
        ).responses;

        return mapStream(blockItemSummaries, translate.blockItemSummary);
    }

    /**
     * Get next available sequence numbers for updating chain parameters after a given block.
     *
     * {@codeblock ~~:client/getNextUpdateSequenceNumbers.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the sequence numbers at, otherwise retrieves from last finalized block.
     * @return a NextUpdateSequenceNumbers object
     */
    async getNextUpdateSequenceNumbers(
        blockHash?: HexString
    ): Promise<v1.NextUpdateSequenceNumbers> {
        const sequenceNumbers = await this.client.getNextUpdateSequenceNumbers(
            getBlockHashInput(blockHash)
        ).response;

        return translate.nextUpdateSequenceNumbers(sequenceNumbers);
    }
    /**
     * Shut down the node.
     * Return a GRPC error if the shutdown failed.
     *
     * {@codeblock ~~:client/shutdown.ts#documentation-snippet}
     */
    async shutdown(): Promise<void> {
        await this.client.shutdown(v2.Empty);
    }

    /**
     * Suggest to a peer to connect to the submitted peer details.
     * This, if successful, adds the peer to the list of given addresses.
     * Otherwise return a GRPC error.
     * Note. The peer might not be connected to instantly, in that case
     * the node will try to establish the connection in near future. This
     * function returns a GRPC status 'Ok' in this case.
     *
     * {@codeblock ~~:client/peerConnect.ts#documentation-snippet}
     *
     * @param ip The ip address to connect to. Must be a valid ip address.
     * @param port The port to connect to. Must be between 0 and 65535.
     */
    async peerConnect(ip: v1.IpAddressString, port: number): Promise<void> {
        assertValidIp(ip);
        assertValidPort(port);

        const request: v2.IpSocketAddress = {
            ip: { value: ip },
            port: { value: port },
        };
        await this.client.peerConnect(request);
    }

    /**
     * Disconnect from the peer and remove them from the given addresses list
     * if they are on it. Return if the request was processed successfully.
     * Otherwise return a GRPC error.
     *
     * {@codeblock ~~:client/peerDisconnect.ts#documentation-snippet}
     *
     * @param ip The ip address to connect to. Must be a valid ip address.
     * @param port The port to connect to. Must be between 0 and 65535.
     */
    async peerDisconnect(ip: v1.IpAddressString, port: number): Promise<void> {
        assertValidIp(ip);
        assertValidPort(port);

        const request: v2.IpSocketAddress = {
            ip: { value: ip },
            port: { value: port },
        };
        await this.client.peerDisconnect(request);
    }

    /**
     * Get a list of banned peers.
     *
     * {@codeblock ~~:client/getBannedPeers.ts#documentation-snippet}
     *
     * @return A list of the ip's of banned peers.
     */
    async getBannedPeers(): Promise<v1.IpAddressString[]> {
        const bannedPeers = await this.client.getBannedPeers(v2.Empty).response;
        return bannedPeers.peers.map((x) => unwrap(x.ipAddress?.value));
    }

    /**
     * Ban the given peer.
     * Rejects if the action fails.
     *
     * {@codeblock ~~:client/banPeer.ts#documentation-snippet}
     *
     * @param ip The ip address of the peer to ban. Must be a valid ip address.
     */
    async banPeer(ip: v1.IpAddressString): Promise<void> {
        assertValidIp(ip);

        const request: v2.PeerToBan = {
            ipAddress: { value: ip },
        };
        await this.client.banPeer(request);
    }

    /**
     * Unbans the given peer.
     * Rejects if the action fails.
     *
     * {@codeblock ~~:client/unbanPeer.ts#documentation-snippet}
     *
     * @param ip The ip address of the peer to unban. Must be a valid ip address.
     */
    async unbanPeer(ip: v1.IpAddressString): Promise<void> {
        assertValidIp(ip);

        const request: v2.BannedPeer = {
            ipAddress: { value: ip },
        };
        await this.client.unbanPeer(request);
    }

    /**
     * Start dumping packages into the specified file.
     * Only enabled if the node was built with the `network_dump` feature.
     * Rejects if the network dump failed to start.
     *
     * {@codeblock ~~:client/dumpStart.ts#documentation-snippet}
     *
     * @param filePath Which file to dump the packages into. Requires a valid path.
     * @param raw Whether the node should dump raw packages.
     */
    async dumpStart(filePath: string, raw: boolean): Promise<void> {
        const request: v2.DumpRequest = {
            file: filePath,
            raw: raw,
        };
        await this.client.dumpStart(request);
    }

    /**
     * Stop dumping packages.
     * Only enabled if the node was built with the `network_dump` feature.
     * Rejects if the network dump failed to be stopped.
     *
     * {@codeblock ~~:client/dumpStop.ts#documentation-snippet}
     */
    async dumpStop(): Promise<void> {
        await this.client.dumpStop(v2.Empty);
    }

    /**
     * Get information about the node.
     * The `NodeInfo` includes information of
     * * Meta information such as the, version of the node, type of the node, uptime and the local time of the node.
     * * NetworkInfo which yields data such as the node id, packets sent/received,
     *   average bytes per second sent/received.
     * * ConsensusInfo. The `ConsensusInfo` returned depends on if the node supports
     *   the protocol on chain and whether the node is configured as a baker or not.
     *
     * {@codeblock ~~:client/getNodeInfo.ts#documentation-snippet}
     *
     * @returns Info about the node
     */
    async getNodeInfo(): Promise<v1.NodeInfo> {
        const nodeInfo = await this.client.getNodeInfo(v2.Empty).response;
        return translate.nodeInfo(nodeInfo);
    }

    /**
     * Get a list of the peers that the node is connected to
     * and associated network related information for each peer.
     *
     * {@codeblock ~~:client/getPeersInfo.ts#documentation-snippet}
     *
     * @returns a list containing info on each peer of the node.
     */
    async getPeersInfo(): Promise<v1.PeerInfo[]> {
        const peersInfo = await this.client.getPeersInfo(v2.Empty).response;
        return peersInfo.peers.map(translate.peerInfo);
    }

    /**
     * Get a list of special events in a given block. These are events generated
     * by the protocol, such as minting and reward payouts. They are not directly
     * generated by any transaction. The stream will end when all the special
     * events for a given block have been returned.
     *
     * {@codeblock ~~:client/getBlockSpecialEvents.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the special events at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of block item summaries
     */
    getBlockSpecialEvents(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.BlockSpecialEvent> {
        const blockSpecialEvents = this.client.getBlockSpecialEvents(
            getBlockHashInput(blockHash),
            { abort: abortSignal }
        ).responses;

        return mapStream(blockSpecialEvents, translate.blockSpecialEvent);
    }

    /**
     * Get the pending updates to chain parameters at the end of a given block.
     * The stream will end when all the pending updates for a given block have been returned.
     *
     * {@codeblock ~~:client/getBlockPendingUpdates.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the pending updates at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of pending updates
     */
    getBlockPendingUpdates(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.PendingUpdate> {
        const pendingUpdates = this.client.getBlockPendingUpdates(
            getBlockHashInput(blockHash),
            { abort: abortSignal }
        ).responses;

        return mapStream(pendingUpdates, translate.pendingUpdate);
    }

    /**
     * Get the summary of the finalization data in a given block.
     *
     * {@codeblock ~~:client/getBlockFinalizationSummary.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the finalization summaries at, otherwise retrieves from last finalized block.
     * @returns a finalization summary
     */
    async getBlockFinalizationSummary(
        blockHash?: HexString
    ): Promise<v1.BlockFinalizationSummary> {
        const finalizationSummary =
            await this.client.getBlockFinalizationSummary(
                getBlockHashInput(blockHash)
            ).response;

        return translate.blockFinalizationSummary(finalizationSummary);
    }

    /**
     * Gets a stream of finalized blocks from specified `startHeight`.
     *
     * @param {bigint} [startHeight=0n] - An optional height to start streaming blocks from. Defaults to 0n.
     * @param {AbortSignal} [abortSignal] - An optional abort signal, which will end the stream. If this is not specified, the stream continues indefinitely.
     * @returns {AsyncIterable<v1.FinalizedBlockInfo>} A stream of {@link v1.FinalizedBlockInfo}.
     */
    getFinalizedBlocksFrom(
        startHeight: v1.AbsoluteBlocksAtHeightRequest,
        abortSignal?: AbortSignal
    ): AsyncIterable<v1.FinalizedBlockInfo>;
    /**
     * Gets a stream of finalized blocks from specified `startHeight`.
     *
     * @param {bigint} [startHeight=0n] - An optional height to start streaming blocks from. Defaults to 0n.
     * @param {bigint} [endHeight] - An optional height to stop streaming at. If this is not specified, the stream continues indefinitely.
     * @returns {AsyncIterable<v1.FinalizedBlockInfo>} A stream of {@link v1.FinalizedBlockInfo}.
     */
    getFinalizedBlocksFrom(
        startHeight: v1.AbsoluteBlocksAtHeightRequest,
        endHeight?: v1.AbsoluteBlocksAtHeightRequest
    ): AsyncIterable<v1.FinalizedBlockInfo>;
    getFinalizedBlocksFrom(
        startHeight: v1.AbsoluteBlocksAtHeightRequest = 0n,
        end?: AbortSignal | v1.AbsoluteBlocksAtHeightRequest
    ): AsyncIterable<v1.FinalizedBlockInfo> {
        let height = startHeight;
        let finHeight: bigint;
        const abortController = new AbortController();
        const abortSignal =
            end instanceof AbortSignal ? end : abortController.signal;
        const newBlocks = this.getFinalizedBlocks(abortSignal);
        const endSignal: IteratorReturnResult<undefined> = {
            done: true,
            value: undefined,
        };
        let searchKnown = true;

        const nextKnown = async (): Promise<
            v1.FinalizedBlockInfo | undefined
        > => {
            // Refresh latest finalized height from consensus
            if (height > finHeight) {
                finHeight = await this.getConsensusHeight();
            }
            // As long as height is lower than latest finalized height, query blocks at height
            if (height > finHeight) {
                searchKnown = false;
                return undefined;
            }

            const [hash] = (await this.getBlocksAtHeight(height)).reverse();
            const bi: v1.FinalizedBlockInfo = { hash, height };
            height += 1n;

            return bi;
        };

        const nextNew = async (): Promise<
            v1.FinalizedBlockInfo | undefined
        > => {
            // At this point, we've found all blocks already finalized on chain. Start streaming new blocks.
            for await (const block of newBlocks) {
                if (block.height < height) {
                    // Skip blocks already found.
                    continue;
                }

                return block;
            }
        };

        const next = async (): Promise<
            IteratorResult<v1.FinalizedBlockInfo>
        > => {
            if (abortSignal.aborted) {
                return endSignal;
            }

            if (finHeight === undefined) {
                finHeight = await this.getConsensusHeight();
            }

            let bi: v1.FinalizedBlockInfo | undefined;
            if (searchKnown) {
                bi = (await nextKnown()) ?? (await nextNew());
            } else {
                bi = await nextNew();
            }

            if (bi === undefined) {
                return endSignal;
            }

            if (typeof end === 'bigint' && bi.height >= end) {
                abortController.abort();
            }

            return {
                done: false,
                value: bi,
            };
        };

        return {
            [Symbol.asyncIterator]: () => ({ next }),
        };
    }

    /**
     * Find a block with lowest possible height where the predicate holds.
     * Note that this function uses binary search and is only intended to work for monotone predicates.
     *
     * @template R
     * @param {(bi: v1.FinalizedBlockInfo) => Promise<R | undefined>} predicate - A predicate function resolving with value of type {@link R} if the predicate holds, and undefined if not.
     * The precondition for this method is that the function is monotone, i.e., if block at height `h` satisfies the test then also a block at height `h+1` does.
     * If this precondition does not hold then the return value from this method is unspecified.
     * @param {bigint} [from=0n] - An optional lower bound of the range of blocks to search. Defaults to 0n.
     * @param {bigint} [to] - An optional upper bound of the range of blocks to search. Defaults to latest finalized block.
     *
     * @returns {Promise<R | undefined>} The value returned from `predicate` at the lowest block (in terms of height) where the predicate holds.
     */
    async findEarliestFinalized<R>(
        predicate: (bi: v1.FinalizedBlockInfo) => Promise<R | undefined>,
        from: v1.AbsoluteBlocksAtHeightRequest = 0n,
        to?: v1.AbsoluteBlocksAtHeightRequest
    ): Promise<R | undefined> {
        let lower = from;
        let upper = to ?? (await this.getConsensusHeight());

        if (lower > upper) {
            throw new Error(
                'Please specify a "to" value greater than the specified "from" value'
            );
        }

        let result: R | undefined;
        while (lower <= upper) {
            const mid = lower + (upper - lower) / 2n;
            const [hash] = await this.getBlocksAtHeight(mid);
            const res = await predicate({ hash, height: mid });

            if (upper === mid) {
                result = res;
                break;
            } else if (res !== undefined) {
                result = res;
                upper = mid;
            } else {
                lower = mid + 1n;
            }
        }

        return result;
    }

    /**
     * Find the block where a smart contract instance was created. This is a specialized form of {@link findEarliestFinalized}.
     *
     * @param {ContractAddress} address - The contract address to search for.
     * @param {bigint} [from=0n] - An optional lower bound of the range of blocks to search. Defaults to 0n.
     * @param {bigint} [to] - An optional upper bound of the range of blocks to search. Defaults to latest finalized block.
     *
     * @returns {FindInstanceCreationReponse} Information about the block and the contract instance, or undefined if not found.
     */
    async findInstanceCreation(
        address: v1.ContractAddress,
        from?: v1.AbsoluteBlocksAtHeightRequest,
        to?: v1.AbsoluteBlocksAtHeightRequest
    ): Promise<FindInstanceCreationReponse | undefined> {
        return this.findEarliestFinalized(
            async ({ hash, height }) => {
                try {
                    const instanceInfo = await this.getInstanceInfo(
                        address,
                        hash
                    );
                    return { hash, height, instanceInfo };
                } catch (e) {
                    if (isRpcError(e) && e.code === 'NOT_FOUND') {
                        return undefined;
                    }

                    throw e;
                }
            },
            from,
            to
        );
    }

    /**
     * Find the first block finalized after a given time.
     *
     * @param {Date} time - The time to find first block after
     * @param {bigint} [from=0n] - An optional lower bound of the range of blocks to search. Defaults to 0n.
     * @param {bigint} [to] - An optional upper bound of the range of blocks to search. Defaults to latest finalized block.
     *
     * @returns {v1.BlockInfo} Information about the block found, or undefined if no block was found.
     */
    async findFirstFinalizedBlockNoLaterThan(
        time: Date,
        from?: v1.AbsoluteBlocksAtHeightRequest,
        to?: v1.AbsoluteBlocksAtHeightRequest
    ): Promise<v1.BlockInfo | undefined> {
        return this.findEarliestFinalized(
            async ({ hash }) => {
                const bi = await this.getBlockInfo(hash);
                return bi.blockSlotTime >= time ? bi : undefined;
            },
            from,
            to
        );
    }

    private async getConsensusHeight() {
        return (await this.getConsensusStatus()).lastFinalizedBlockHeight;
    }
}

/**
 * @hidden
 */
export function getBlockHashInput(blockHash?: HexString): v2.BlockHashInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let blockHashInput: any = {};

    if (blockHash) {
        assertValidHash(blockHash);
        blockHashInput = {
            oneofKind: 'given',
            given: { value: Buffer.from(blockHash, 'hex') },
        };
    } else {
        blockHashInput = {
            oneofKind: 'lastFinal',
            lastFinal: v2.Empty,
        };
    }

    return { blockHashInput: blockHashInput };
}

/**
 * @hidden
 */
export function getAccountIdentifierInput(
    accountIdentifier: v1.AccountIdentifierInput
): v2.AccountIdentifierInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const returnIdentifier: any = {};

    if ((<AccountAddress>accountIdentifier).decodedAddress !== undefined) {
        const address = (<AccountAddress>accountIdentifier).decodedAddress;
        returnIdentifier.oneofKind = 'address';
        returnIdentifier.address = { value: address };
    } else if (
        (<CredentialRegistrationId>accountIdentifier).credId !== undefined
    ) {
        const credId = (<CredentialRegistrationId>accountIdentifier).credId;
        const credIdBytes = Buffer.from(credId, 'hex');
        returnIdentifier.oneofKind = 'credId';
        returnIdentifier.credId = { value: credIdBytes };
    } else {
        returnIdentifier.oneofKind = 'accountIndex';
        returnIdentifier.accountIndex = { value: accountIdentifier };
    }

    return { accountIdentifierInput: returnIdentifier };
}

/**
 * @hidden
 */
export function getInvokerInput(
    invoker?: AccountAddress | v1.ContractAddress
): v2.Address | undefined {
    if (!invoker) {
        return undefined;
    } else if ((<AccountAddress>invoker).decodedAddress) {
        return {
            type: {
                oneofKind: 'account',
                account: { value: (<AccountAddress>invoker).decodedAddress },
            },
        };
    } else if ((<v1.ContractAddress>invoker).index) {
        return {
            type: {
                oneofKind: 'contract',
                contract: <v1.ContractAddress>invoker,
            },
        };
    } else {
        throw new Error('Unexpected input to build invoker');
    }
}

function assertValidIp(ip: v1.IpAddressString): void {
    if (!isValidIp(ip)) {
        throw new Error('The input was not a valid ip: ' + ip);
    }
}

function assertValidPort(port: number): void {
    if (port > 65535 || port < 0) {
        throw new Error(
            'The input was not a valid port, must be between 0 and 65535: ' +
                port
        );
    }
}

function assertValidHex(hex: HexString): void {
    if (!isHex(hex)) {
        throw new Error('The input was not a valid hex: ' + hex);
    }
}

function assertValidHash(hash: HexString): void {
    if (!isValidHash(hash)) {
        throw new Error(
            'The input was not a valid hash, must be 32 bytes: ' + hash
        );
    }
}
