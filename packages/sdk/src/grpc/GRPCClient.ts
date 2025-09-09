/**
 * This is the GRPC-Client used by both the Web-SDK and the NodeJS-SDK. Check
 * out the {@link ConcordiumGRPCClient}
 *
 * @module Common GRPC-Client
 */
import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport';
import type { RpcError, RpcTransport } from '@protobuf-ts/runtime-rpc';
import { Buffer } from 'buffer/index.js';

import { getAccountTransactionHandler } from '../accountTransactions.js';
import { DEFAULT_INVOKE_ENERGY } from '../constants.js';
import { calculateEnergyCost } from '../energyCost.js';
import { HealthClient } from '../grpc-api/v2/concordium/health.client.js';
import * as GRPCKernel from '../grpc-api/v2/concordium/kernel.js';
import { QueriesClient } from '../grpc-api/v2/concordium/service.client.js';
import * as GRPC from '../grpc-api/v2/concordium/types.js';
import * as PLT from '../plt/index.js';
import { RawModuleSchema } from '../schemaTypes.js';
import { serializeAccountTransactionPayload } from '../serialization.js';
import * as SDK from '../types.js';
import { HexString, isRpcError } from '../types.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as BlockHash from '../types/BlockHash.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as CredentialRegistrationId from '../types/CredentialRegistrationId.js';
import * as Energy from '../types/Energy.js';
import * as ModuleReference from '../types/ModuleReference.js';
import * as Parameter from '../types/Parameter.js';
import * as ReceiveName from '../types/ReceiveName.js';
import * as SequenceNumber from '../types/SequenceNumber.js';
import * as Timestamp from '../types/Timestamp.js';
import * as TransactionExpiry from '../types/TransactionExpiry.js';
import * as TransactionHash from '../types/TransactionHash.js';
import { getEmbeddedModuleSchema } from '../types/VersionedModuleSource.js';
import type { BlockItemStatus, BlockItemSummary } from '../types/blockItemSummary.js';
import { countSignatures, isHex, isValidIp, mapRecord, mapStream, unwrap } from '../util.js';
import * as translate from './translation.js';
import type { Upward } from './upward.js';

/**
 * @hidden
 */
export type FindInstanceCreationReponse = {
    hash: BlockHash.Type;
    height: bigint;
    instanceInfo: SDK.InstanceInfo;
};

/**
 * A concordium-node specific gRPC client wrapper. Only use this if you intend to supply a custom
 * transport layer. Otherwise more user-friendly options {@linkcode ConcordiumGRPCWebClient} and
 * `ConcordiumGRPCNodeClient` exist for web/nodejs use respectively.
 */
export class ConcordiumGRPCClient {
    private client: QueriesClient;
    private healthClient: HealthClient;

    /**
     * Initialize a gRPC client for a specific concordium node.
     * @param transport RpcTransport to send communication over
     */
    constructor(transport: RpcTransport) {
        this.client = new QueriesClient(transport);
        this.healthClient = new HealthClient(transport);
    }

    /**
     * Retrieves the next account nonce for the given account. The account nonce is
     * used in all account transactions as part of their header.
     *
     * {@codeblock ~~:nodejs/client/getNextAccountSequenceNumber.ts#documentation-snippet}
     *
     * @param accountAddress base58 account address to get the next account nonce for.
     *
     * @returns the next account nonce, and a boolean indicating if the nonce is reliable.
     */
    async getNextAccountNonce(accountAddress: AccountAddress.Type): Promise<SDK.NextAccountNonce> {
        const address: GRPCKernel.AccountAddress = {
            value: AccountAddress.toBuffer(accountAddress),
        };

        const response = await this.client.getNextAccountSequenceNumber(address).response;
        return translate.nextAccountSequenceNumber(response);
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     *
     * {@codeblock ~~:nodejs/client/getCryptographicParameters.ts#documentation-snippet}
     *
     * @param blockHash optional block hash to get the cryptographic parameters at, otherwise retrieves from last finalized block.
     * @returns the global cryptographic parameters at the given block, or undefined it the block does not exist.
     */
    async getCryptographicParameters(blockHash?: BlockHash.Type): Promise<SDK.CryptographicParameters> {
        const blockHashInput = getBlockHashInput(blockHash);

        const response = await this.client.getCryptographicParameters(blockHashInput).response;
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
     * {@codeblock ~~:nodejs/client/getAccountInfo.ts#documentation-snippet}
     *
     * @param accountIdentifier base58 account address, or a credential registration id or account index to get the account info for
     * @param blockHash optional block hash to get the account info at, otherwise retrieves from last finalized block
     *
     * @returns the account info for the provided account address.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getAccountInfo(
        accountIdentifier: SDK.AccountIdentifierInput,
        blockHash?: BlockHash.Type
    ): Promise<SDK.AccountInfo> {
        const accountInfoRequest: GRPC.AccountInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            accountIdentifier: getAccountIdentifierInput(accountIdentifier),
        };

        const response = await this.client.getAccountInfo(accountInfoRequest).response;
        return translate.accountInfo(response);
    }

    /**
     * Retrieves a status for the given transaction/block item.
     *
     * {@codeblock ~~:nodejs/client/getBlockItemStatus.ts#documentation-snippet}
     *
     * @param transactionHash the transaction/block item to get a status for.
     *
     * @returns the status for the given transaction/block item, or undefined if it does not exist.
     */
    async getBlockItemStatus(transactionHash: TransactionHash.Type): Promise<BlockItemStatus> {
        const transactionHashV2: GRPC.TransactionHash = {
            value: TransactionHash.toBuffer(transactionHash),
        };

        const response = await this.client.getBlockItemStatus(transactionHashV2).response;
        return translate.blockItemStatus(response);
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     *
     * {@codeblock ~~:nodejs/client/getConsensusStatus.ts#documentation-snippet}
     */
    async getConsensusStatus(): Promise<SDK.ConsensusStatus> {
        const response = await this.client.getConsensusInfo(GRPC.Empty).response;
        return translate.consensusInfo(response);
    }

    /**
     * Retrieves the source of the given module at the provided block.
     *
     * {@codeblock ~~:nodejs/client/getModuleSource.ts#documentation-snippet}
     *
     * @param moduleRef the module's reference, represented by the ModuleReference class.
     * @param blockHash optional block hash to get the module source at, otherwise retrieves from last finalized block
     *
     * @returns the source of the module as raw bytes.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getModuleSource(
        moduleRef: ModuleReference.Type,
        blockHash?: BlockHash.Type
    ): Promise<SDK.VersionedModuleSource> {
        const moduleSourceRequest: GRPC.ModuleSourceRequest = {
            blockHash: getBlockHashInput(blockHash),
            moduleRef: { value: moduleRef.decodedModuleRef },
        };

        const response = await this.client.getModuleSource(moduleSourceRequest).response;
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
     * {@codeblock ~~:nodejs/client/getEmbeddedSchema.ts#documentation-snippet}
     *
     * @param moduleRef the module's reference, represented by the ModuleReference class.
     * @param blockHash optional block hash to get the module embedded schema at, otherwise retrieves from last finalized block
     *
     * @returns the module schema as a {@link RawModuleSchema} or `null` if not found in the block.
     * @throws An error of type `RpcError` if the module was not found in the block.
     * @throws If the module source cannot be parsed or contains duplicate schema sections.
     */
    async getEmbeddedSchema(
        moduleRef: ModuleReference.Type,
        blockHash?: BlockHash.Type
    ): Promise<RawModuleSchema | undefined> {
        const source = await this.getModuleSource(moduleRef, blockHash);
        return getEmbeddedModuleSchema(source);
    }

    /**
     * Retrieve information about a given smart contract instance.
     *
     * {@codeblock ~~:nodejs/client/getInstanceInfo.ts#documentation-snippet}
     *
     * @param contractAddress the address of the smart contract.
     * @param blockHash optional block hash to get the smart contact instances at, otherwise retrieves from last finalized block
     *
     * @returns An object with information about the contract instance.
     * @throws An error of type `RpcError` if not found in the block.
     */
    async getInstanceInfo(
        contractAddress: ContractAddress.Type,
        blockHash?: BlockHash.Type
    ): Promise<SDK.InstanceInfo> {
        const instanceInfoRequest: GRPC.InstanceInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            address: ContractAddress.toProto(contractAddress),
        };

        const response = await this.client.getInstanceInfo(instanceInfoRequest).response;
        return translate.instanceInfo(response);
    }

    /**
     * Invokes a smart contract.
     *
     * {@codeblock ~~:nodejs/client/invokeContract.ts#documentation-snippet}
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
    async invokeContract(context: SDK.ContractContext, blockHash?: BlockHash.Type): Promise<SDK.InvokeContractResult> {
        const blockHashInput = getBlockHashInput(blockHash);

        const invokeInstanceRequest: GRPC.InvokeInstanceRequest = {
            blockHash: blockHashInput,
            invoker: getInvokerInput(context.invoker),
            instance: context.contract,
            amount: { value: context.amount?.microCcdAmount || 0n },
            entrypoint: ReceiveName.toProto(context.method),
            parameter: Parameter.toProto(context.parameter ?? Parameter.empty()),
            energy: Energy.toProto(context.energy ?? DEFAULT_INVOKE_ENERGY),
        };

        const response = await this.client.invokeInstance(invokeInstanceRequest).response;
        return translate.invokeInstanceResponse(response);
    }

    /**
     * Serializes and sends an account transaction to the node to be
     * put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     *
     * {@codeblock ~~:nodejs/common/simpleTransfer.ts#documentation-snippet}
     *
     * @param transaction the transaction to send to the node
     * @param signature the signatures on the signing digest of the transaction
     * @returns The transaction hash as a hex-encoded string
     */
    async sendAccountTransaction(
        transaction: SDK.AccountTransaction,
        signature: SDK.AccountTransactionSignature
    ): Promise<TransactionHash.Type> {
        const accountTransactionHandler = getAccountTransactionHandler(transaction.type);

        const rawPayload = serializeAccountTransactionPayload(transaction);

        // Energy cost
        const baseEnergyCost = accountTransactionHandler.getBaseEnergyCost(transaction.payload);

        const energyCost = calculateEnergyCost(countSignatures(signature), BigInt(rawPayload.length), baseEnergyCost);

        return this.sendRawAccountTransaction(transaction.header, energyCost, rawPayload, signature);
    }

    /**
     * Sends an account transaction, with an already serialized payload, to the node to be
     * put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     *
     * In general, { @link ConcordiumGRPCClient.sendAccountTransaction } is the recommended
     * method to send account transactions, as this does not require the caller to serialize the payload themselves.
     *
     * @param header the transactionheader to send to the node
     * @param energyAmount the amount of energy allotted for the transaction
     * @param payload the payload serialized to a buffer
     * @param signature the signatures on the signing digest of the transaction
     * @returns The transaction hash as a byte array
     */
    async sendRawAccountTransaction(
        header: SDK.AccountTransactionHeader,
        energyAmount: Energy.Type,
        payload: Uint8Array,
        signature: SDK.AccountTransactionSignature
    ): Promise<TransactionHash.Type> {
        const transactionSignature: GRPC.AccountTransactionSignature =
            translate.accountTransactionSignatureToV2(signature);

        if (TransactionExpiry.toDate(header.expiry) < new Date()) {
            throw new Error(
                'A transaction expiry is not allowed to be in the past: ' + TransactionExpiry.toDate(header.expiry)
            );
        }

        // Put together sendBlockItemRequest
        const convertedHeader: GRPC.AccountTransactionHeader = {
            sender: AccountAddress.toProto(header.sender),
            sequenceNumber: SequenceNumber.toProto(header.nonce),
            energyAmount: Energy.toProto(energyAmount),
            expiry: TransactionExpiry.toProto(header.expiry),
        };
        const accountTransaction: GRPC.AccountTransaction = {
            signature: transactionSignature,
            header: convertedHeader,
            payload: {
                payload: { oneofKind: 'rawPayload', rawPayload: payload },
            },
        };
        const sendBlockItemRequest: GRPC.SendBlockItemRequest = {
            blockItem: {
                oneofKind: 'accountTransaction',
                accountTransaction: accountTransaction,
            },
        };

        const response = await this.client.sendBlockItem(sendBlockItemRequest).response;
        return TransactionHash.fromProto(response);
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
     * @param rawPayload the serialized payload, consisting of the {@link SDK.CredentialDeploymentTransaction}
     * along with corresponding signatures. This can be serialized by utilizing the `serializeCredentialDeploymentPayload` function.
     * @param expiry the expiry of the transaction
     * @returns The transaction hash
     */
    async sendCredentialDeploymentTransaction(
        rawPayload: Uint8Array,
        expiry: TransactionExpiry.Type
    ): Promise<TransactionHash.Type> {
        const credentialDeployment: GRPC.CredentialDeployment = {
            messageExpiry: TransactionExpiry.toProto(expiry),
            payload: {
                oneofKind: 'rawPayload',
                rawPayload,
            },
        };
        const sendBlockItemRequest: GRPC.SendBlockItemRequest = {
            blockItem: {
                oneofKind: 'credentialDeployment',
                credentialDeployment: credentialDeployment,
            },
        };

        const response = await this.client.sendBlockItem(sendBlockItemRequest).response;
        return TransactionHash.fromProto(response);
    }

    /**
     * Sends an update instruction transaction for updating a chain parameter
     * to the node to be put in a block on the chain.
     *
     * @param updateInstructionTransaction the update instruction transaction to send to the node
     * @param signatures map of the signatures on the hash of the serialized unsigned update instruction, with the key index as map key
     * @returns The transaction hash
     */
    async sendUpdateInstruction(
        updateInstructionTransaction: SDK.UpdateInstruction,
        signatures: Record<number, HexString>
    ): Promise<TransactionHash.Type> {
        const header = updateInstructionTransaction.header;
        const updateInstruction: GRPC.UpdateInstruction = {
            header: {
                sequenceNumber: {
                    value: header.sequenceNumber,
                },
                effectiveTime: {
                    value: header.effectiveTime,
                },
                timeout: {
                    value: header.timeout,
                },
            },
            payload: {
                payload: {
                    oneofKind: 'rawPayload',
                    rawPayload: Buffer.from(updateInstructionTransaction.payload, 'hex'),
                },
            },
            signatures: {
                signatures: mapRecord(signatures, (x) => ({
                    value: Buffer.from(x, 'hex'),
                })),
            },
        };

        const sendBlockItemRequest: GRPC.SendBlockItemRequest = {
            blockItem: {
                oneofKind: 'updateInstruction',
                updateInstruction: updateInstruction,
            },
        };

        const response = await this.client.sendBlockItem(sendBlockItemRequest).response;
        return TransactionHash.fromProto(response);
    }

    /**
     * Retrieves the status of the block chain parameters at the given blockHash.
     *
     * {@codeblock ~~:nodejs/client/getBlockChainParameters.ts#documentation-snippet}
     *
     * @param blockHash the block hash of the block to get the information from.
     * @returns Info on all of the block chain parameters.
     */
    async getBlockChainParameters(blockHash?: BlockHash.Type): Promise<SDK.ChainParameters> {
        const blockHashInput = getBlockHashInput(blockHash);
        const response = await this.client.getBlockChainParameters(blockHashInput).response;
        return translate.blockChainParameters(response);
    }

    /**
     * Retrieves information on the baker pool of the given bakerId.
     *
     * {@codeblock ~~:nodejs/client/getPoolInfo.ts#documentation-snippet}
     *
     * @param blockHash the block hash of the block to get the information from.
     * @param bakerId the ID of the baker to get the status for.
     * @returns The status of the corresponding baker pool.
     */
    async getPoolInfo(bakerId: SDK.BakerId, blockHash?: BlockHash.Type): Promise<SDK.BakerPoolStatus> {
        const input: GRPC.PoolInfoRequest = {
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
     * {@codeblock ~~:nodejs/client/getPassiveDelegationInfo.ts#documentation-snippet}
     *
     * @param blockHash the block hash of the block to get the information from.
     * @returns The status of the passive delegators.
     */
    async getPassiveDelegationInfo(blockHash?: BlockHash.Type): Promise<SDK.PassiveDelegationStatus> {
        const input = getBlockHashInput(blockHash);
        const response = await this.client.getPassiveDelegationInfo(input).response;
        return translate.passiveDelegationInfo(response);
    }

    /**
     * Retrieves the reward status at the given blockHash
     *
     * {@codeblock ~~:nodejs/client/getTokenomicsInfo.ts#documentation-snippet}
     *
     * @param blockHash optional block hash to get the reward status at, otherwise retrieves from last finalized block
     * @returns the reward status at the given block, or undefined it the block does not exist.
     */
    async getTokenomicsInfo(blockHash?: BlockHash.Type): Promise<Upward<SDK.TokenomicsInfo>> {
        const blockHashInput = getBlockHashInput(blockHash);

        const response = await this.client.getTokenomicsInfo(blockHashInput).response;
        return translate.tokenomicsInfo(response);
    }

    /**
     * Gets a stream of finalized blocks.
     *
     * {@codeblock ~~:nodejs/client/getFinalizedBlocks.ts#documentation-snippet}
     *
     * @param abortSignal an AbortSignal to close the stream. Note that the
     * stream does not close itself as it is infinite, so usually you'd want
     * to provide this parameter.
     * @returns An AsyncIterator stream of finalized blocks.
     */
    getFinalizedBlocks(abortSignal?: AbortSignal): AsyncIterable<SDK.FinalizedBlockInfo> {
        const opts = { abort: abortSignal };
        const blocks = this.client.getFinalizedBlocks(GRPC.Empty, opts).responses;
        return mapStream(blocks, translate.commonBlockInfo);
    }

    /**
     * Gets a stream of blocks. To get a stream of only finalized blocks
     * use `getFinalizedBlocks()` instead.
     *
     * {@codeblock ~~:nodejs/client/getBlocks.ts#documentation-snippet}
     *
     * @param abortSignal an AbortSignal to close the stream. Note that the
     * stream does not close itself as it is infinite, so usually you'd want
     * to provide this parameter.
     * @returns An AsyncIterator stream of blocks.
     */
    getBlocks(abortSignal?: AbortSignal): AsyncIterable<SDK.ArrivedBlockInfo> {
        const opts = { abort: abortSignal };
        const blocks = this.client.getBlocks(GRPC.Empty, opts).responses;
        return mapStream(blocks, translate.commonBlockInfo);
    }

    /**
     * Waits until given transaction is finalized.
     *
     * {@codeblock ~~:nodejs/common/simpleTransfer.ts#documentation-snippet}
     *
     * @param transactionHash a transaction hash as a bytearray.
     * @param timeoutTime the number of milliseconds until the function throws error.
     * @returns BlockItemSummary of the transaction.
     */
    async waitForTransactionFinalization(
        transactionHash: TransactionHash.Type,
        timeoutTime?: number
    ): Promise<SDK.BlockItemSummaryInBlock> {
        return new Promise(async (resolve, reject) => {
            const abortController = new AbortController();
            if (timeoutTime) {
                setTimeout(() => {
                    abortController.abort();
                    reject(new Error('Function timed out.'));
                }, timeoutTime);
            }

            try {
                const blockStream = this.getFinalizedBlocks(abortController.signal);

                const response = await this.getBlockItemStatus(transactionHash);
                if (response.status === 'finalized') {
                    // Simply doing `abortController.abort()` causes an error.
                    // See: https://github.com/grpc/grpc-node/issues/1652
                    setTimeout(() => abortController.abort(), 0);
                    return resolve(response.outcome);
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for await (const _ of blockStream) {
                    const response = await this.getBlockItemStatus(transactionHash);
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
     * {@codeblock ~~:nodejs/client/getAccountList.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the accounts at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of account addresses.
     */
    getAccountList(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<AccountAddress.Type> {
        const opts = { abort: abortSignal };
        const hash = getBlockHashInput(blockHash);
        const asyncIter = this.client.getAccountList(hash, opts).responses;
        return mapStream(asyncIter, AccountAddress.fromProto);
    }

    /**
     * Get a stream of all smart contract modules' references. The stream will end
     * when all modules that exist in the state at the end of the given
     * block have been returned.
     *
     * {@codeblock ~~:nodejs/client/getModuleList.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the contract modules at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of contract module references.
     */
    getModuleList(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<ModuleReference.Type> {
        const opts = { abort: abortSignal };
        const hash = getBlockHashInput(blockHash);
        const asyncIter = this.client.getModuleList(hash, opts).responses;
        return mapStream(asyncIter, ModuleReference.fromProto);
    }

    /**
     * Get a stream of ancestors for the provided block.
     * Starting with the provided block itself, moving backwards until no more
     * ancestors or the requested number of ancestors has been returned.
     *
     * {@codeblock ~~:nodejs/client/getAncestors.ts#documentation-snippet}
     *
     * @param maxAmountOfAncestors the maximum amount of ancestors as a bigint.
     * @param blockHash a optional block hash to get the ancestors at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of ancestors' block hashes.
     */
    getAncestors(
        maxAmountOfAncestors: bigint,
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<BlockHash.Type> {
        const opts = { abort: abortSignal };
        const request: GRPC.AncestorsRequest = {
            blockHash: getBlockHashInput(blockHash),
            amount: maxAmountOfAncestors,
        };
        const asyncIter = this.client.getAncestors(request, opts).responses;
        return mapStream(asyncIter, BlockHash.fromProto);
    }

    /**
     * Get the exact state of a specific contract instance, streamed as a list of
     * key-value pairs. The list is streamed in lexicographic order of keys.
     *
     * {@codeblock ~~:nodejs/client/getInstanceState.ts#documentation-snippet}
     *
     * @param contractAddress the contract to get the state of.
     * @param blockHash a optional block hash to get the instance states at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of instance states as key-value pairs of hex strings.
     */
    getInstanceState(
        contractAddress: ContractAddress.Type,
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<SDK.InstanceStateKVPair> {
        const opts = { abort: abortSignal };
        const request: GRPC.InstanceInfoRequest = {
            blockHash: getBlockHashInput(blockHash),
            address: ContractAddress.toProto(contractAddress),
        };
        const asyncIter = this.client.getInstanceState(request, opts).responses;
        return mapStream(asyncIter, translate.instanceStateKVPair);
    }

    /**
     * Get the value at a specific key of a contract state. In contrast to
     * `GetInstanceState` this is more efficient, but requires the user to know
     * the specific key to look for.
     *
     * {@codeblock ~~:nodejs/client/instanceStateLookup.ts#documentation-snippet}
     *
     * @param contractAddress the contract to get the state of.
     * @param key the key of the desired contract state.
     * @param blockHash a optional block hash to get the instance states at, otherwise retrieves from last finalized block.
     * @returns the state of the contract at the given key as a hex string.
     */
    async instanceStateLookup(
        contractAddress: ContractAddress.Type,
        key: HexString,
        blockHash?: BlockHash.Type
    ): Promise<HexString> {
        assertValidHex(key);
        const request: GRPC.InstanceStateLookupRequest = {
            address: ContractAddress.toProto(contractAddress),
            key: Buffer.from(key, 'hex'),
            blockHash: getBlockHashInput(blockHash),
        };
        const response = await this.client.instanceStateLookup(request).response;
        return translate.unwrapValToHex(response);
    }

    /**
     * Get the identity providers registered as of the end of a given block.
     * The stream will end when all the identity providers have been returned,
     * or an abort signal is called.
     *
     * {@codeblock ~~:nodejs/client/getIdentityProviders.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the providers at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of identity provider info objects.
     */
    getIdentityProviders(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<SDK.IpInfo> {
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
     * {@codeblock ~~:nodejs/client/getAnonymityRevokers.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the anonymity revokers at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of identity provider info objects.
     */
    getAnonymityRevokers(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<SDK.ArInfo> {
        const opts = { abort: abortSignal };
        const block = getBlockHashInput(blockHash);
        const ars = this.client.getAnonymityRevokers(block, opts).responses;
        return mapStream(ars, translate.arInfo);
    }

    /**
     * Get a list of live blocks at a given height.
     *
     * {@codeblock ~~:nodejs/client/getBlocksAtHeightAbsolute.ts#documentation-snippet}
     *
     * @param blockHeightRequest Either an absolute block height request or a relative block height request
     * @returns A list of block hashes as hex strings
     */
    async getBlocksAtHeight(blockHeightRequest: SDK.BlocksAtHeightRequest): Promise<BlockHash.Type[]> {
        const requestV2 = translate.BlocksAtHeightRequestToV2(blockHeightRequest);
        const blocks = await this.client.getBlocksAtHeight(requestV2).response;
        return blocks.blocks.map(BlockHash.fromProto);
    }

    /**
     * Get information, such as height, timings, and transaction counts for the given block.
     *
     * {@codeblock ~~:nodejs/client/getBlockInfo.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the info from, otherwise retrieves from last finalized block.
     * @returns information on a block.
     */
    async getBlockInfo(blockHash?: BlockHash.Type): Promise<SDK.BlockInfo> {
        const block = getBlockHashInput(blockHash);
        const blockInfo = await this.client.getBlockInfo(block).response;
        return translate.blockInfo(blockInfo);
    }

    /**
     * Get all the bakers at the end of the given block.
     *
     * {@codeblock ~~:nodejs/client/getBakerList.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the baker list at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of BakerIds.
     */
    getBakerList(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<SDK.BakerId> {
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
     * {@codeblock ~~:nodejs/client/getPoolDelegators.ts#documentation-snippet}
     *
     * @param baker The BakerId of the pool owner
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorInfo
     */
    getPoolDelegators(
        baker: SDK.BakerId,
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<SDK.DelegatorInfo> {
        const request: GRPC.GetPoolDelegatorsRequest = {
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
     * {@codeblock ~~:nodejs/client/getPoolDelegatorsRewardPeriod.ts#documentation-snippet}
     *
     * @param baker The BakerId of the pool owner
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorRewardPeriodInfo
     */
    getPoolDelegatorsRewardPeriod(
        baker: SDK.BakerId,
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<SDK.DelegatorRewardPeriodInfo> {
        const request: GRPC.GetPoolDelegatorsRequest = {
            blockHash: getBlockHashInput(blockHash),
            baker: { value: baker },
        };
        const delegatorInfo = this.client.getPoolDelegatorsRewardPeriod(request, { abort: abortSignal }).responses;

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
     * {@codeblock ~~:nodejs/client/getPassiveDelegators.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorInfo
     */
    getPassiveDelegators(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<SDK.DelegatorInfo> {
        const delegatorInfo = this.client.getPassiveDelegators(getBlockHashInput(blockHash), {
            abort: abortSignal,
        }).responses;

        return mapStream(delegatorInfo, translate.delegatorInfo);
    }

    /**
     * Get the fixed passive delegators for the reward period of the given block.
     * In contracts to the `GetPassiveDelegators` which returns delegators registered
     * for the given block, this endpoint returns the fixed delegators contributing
     * stake in the reward period containing the given block.
     * The stream will end when all the delegators has been returned.
     *
     * {@codeblock ~~:nodejs/client/getPassiveDelegatorsRewardPeriod.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the delegators at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of DelegatorRewardPeriodInfo
     */
    getPassiveDelegatorsRewardPeriod(
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<SDK.DelegatorRewardPeriodInfo> {
        const delegatorInfo = this.client.getPassiveDelegatorsRewardPeriod(getBlockHashInput(blockHash), {
            abort: abortSignal,
        }).responses;

        return mapStream(delegatorInfo, translate.delegatorInfo);
    }

    /**
     * Get the current branches of blocks starting from and including the last finalized block.
     *
     * {@codeblock ~~:nodejs/client/getBranches.ts#documentation-snippet}
     *
     * @returns a branch with a block hash and a list of branch-children
     */
    async getBranches(): Promise<SDK.Branch> {
        const branch = await this.client.getBranches(GRPC.Empty).response;
        return translate.branch(branch);
    }

    /**
     * Get information related to the baker election for a particular block.
     *
     * @param blockHash an optional block hash to get the election info at, otherwise retrieves from last finalized block.
     * @returns election info for the given block
     */
    async getElectionInfo(blockHash?: BlockHash.Type): Promise<SDK.ElectionInfo> {
        const blockHashInput = getBlockHashInput(blockHash);
        const electionInfo = await this.client.getElectionInfo(blockHashInput).response;
        return translate.electionInfo(electionInfo);
    }

    /**
     * Get a list of non-finalized transaction hashes for a given account. This
     * endpoint is not expected to return a large amount of data in most cases,
     * but in bad network conditions it might. The stream will end when all the
     * non-finalized transaction hashes have been returned.
     *
     * {@codeblock ~~:nodejs/client/getAccountNonFinalizedTransactions.ts#documentation-snippet}
     *
     * @param accountAddress The address of the account that you wish to query.
     * @returns a stream of transaction hashes.
     */
    getAccountNonFinalizedTransactions(
        accountAddress: AccountAddress.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<TransactionHash.Type> {
        const transactions = this.client.getAccountNonFinalizedTransactions(
            { value: AccountAddress.toBuffer(accountAddress) },
            { abort: abortSignal }
        ).responses;

        return mapStream(transactions, TransactionHash.fromProto);
    }

    /**
     * Get a list of transaction events in a given block.
     * The stream will end when all the transaction events for a given block have been returned.
     *
     * {@codeblock ~~:nodejs/client/getBlockTransactionEvents.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the transaction events at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of block item summaries
     *
     * **Please note**, any of these can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    getBlockTransactionEvents(
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<Upward<BlockItemSummary>> {
        const blockItemSummaries = this.client.getBlockTransactionEvents(getBlockHashInput(blockHash), {
            abort: abortSignal,
        }).responses;

        return mapStream(blockItemSummaries, translate.blockItemSummary);
    }

    /**
     * Get next available sequence numbers for updating chain parameters after a given block.
     *
     * {@codeblock ~~:nodejs/client/getNextUpdateSequenceNumbers.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the sequence numbers at, otherwise retrieves from last finalized block.
     * @return a NextUpdateSequenceNumbers object
     */
    async getNextUpdateSequenceNumbers(blockHash?: BlockHash.Type): Promise<SDK.NextUpdateSequenceNumbers> {
        const sequenceNumbers = await this.client.getNextUpdateSequenceNumbers(getBlockHashInput(blockHash)).response;

        return translate.nextUpdateSequenceNumbers(sequenceNumbers);
    }
    /**
     * Shut down the node.
     * Return a GRPC error if the shutdown failed.
     *
     * {@codeblock ~~:nodejs/client/shutdown.ts#documentation-snippet}
     */
    async shutdown(): Promise<void> {
        await this.client.shutdown(GRPC.Empty);
    }

    /**
     * Suggest to a peer to connect to the submitted peer details.
     * This, if successful, adds the peer to the list of given addresses.
     * Otherwise return a GRPC error.
     * Note. The peer might not be connected to instantly, in that case
     * the node will try to establish the connection in near future. This
     * function returns a GRPC status 'Ok' in this case.
     *
     * {@codeblock ~~:nodejs/client/peerConnect.ts#documentation-snippet}
     *
     * @param ip The ip address to connect to. Must be a valid ip address.
     * @param port The port to connect to. Must be between 0 and 65535.
     */
    async peerConnect(ip: SDK.IpAddressString, port: number): Promise<void> {
        assertValidIp(ip);
        assertValidPort(port);

        const request: GRPC.IpSocketAddress = {
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
     * {@codeblock ~~:nodejs/client/peerDisconnect.ts#documentation-snippet}
     *
     * @param ip The ip address to connect to. Must be a valid ip address.
     * @param port The port to connect to. Must be between 0 and 65535.
     */
    async peerDisconnect(ip: SDK.IpAddressString, port: number): Promise<void> {
        assertValidIp(ip);
        assertValidPort(port);

        const request: GRPC.IpSocketAddress = {
            ip: { value: ip },
            port: { value: port },
        };
        await this.client.peerDisconnect(request);
    }

    /**
     * Get a list of banned peers.
     *
     * {@codeblock ~~:nodejs/client/getBannedPeers.ts#documentation-snippet}
     *
     * @return A list of the ip's of banned peers.
     */
    async getBannedPeers(): Promise<SDK.IpAddressString[]> {
        const bannedPeers = await this.client.getBannedPeers(GRPC.Empty).response;
        return bannedPeers.peers.map((x) => unwrap(x.ipAddress?.value));
    }

    /**
     * Ban the given peer.
     * Rejects if the action fails.
     *
     * {@codeblock ~~:nodejs/client/banPeer.ts#documentation-snippet}
     *
     * @param ip The ip address of the peer to ban. Must be a valid ip address.
     */
    async banPeer(ip: SDK.IpAddressString): Promise<void> {
        assertValidIp(ip);

        const request: GRPC.PeerToBan = {
            ipAddress: { value: ip },
        };
        await this.client.banPeer(request);
    }

    /**
     * Unbans the given peer.
     * Rejects if the action fails.
     *
     * {@codeblock ~~:nodejs/client/unbanPeer.ts#documentation-snippet}
     *
     * @param ip The ip address of the peer to unban. Must be a valid ip address.
     */
    async unbanPeer(ip: SDK.IpAddressString): Promise<void> {
        assertValidIp(ip);

        const request: GRPC.BannedPeer = {
            ipAddress: { value: ip },
        };
        await this.client.unbanPeer(request);
    }

    /**
     * Start dumping packages into the specified file.
     * Only enabled if the node was built with the `network_dump` feature.
     * Rejects if the network dump failed to start.
     *
     * {@codeblock ~~:nodejs/client/dumpStart.ts#documentation-snippet}
     *
     * @param filePath Which file to dump the packages into. Requires a valid path.
     * @param raw Whether the node should dump raw packages.
     */
    async dumpStart(filePath: string, raw: boolean): Promise<void> {
        const request: GRPC.DumpRequest = {
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
     * {@codeblock ~~:nodejs/client/dumpStop.ts#documentation-snippet}
     */
    async dumpStop(): Promise<void> {
        await this.client.dumpStop(GRPC.Empty);
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
     * {@codeblock ~~:nodejs/client/getNodeInfo.ts#documentation-snippet}
     *
     * @returns Info about the node
     */
    async getNodeInfo(): Promise<SDK.NodeInfo> {
        const nodeInfo = await this.client.getNodeInfo(GRPC.Empty).response;
        return translate.nodeInfo(nodeInfo);
    }

    /**
     * Get a list of the peers that the node is connected to
     * and associated network related information for each peer.
     *
     * {@codeblock ~~:nodejs/client/getPeersInfo.ts#documentation-snippet}
     *
     * @returns a list containing info on each peer of the node.
     */
    async getPeersInfo(): Promise<SDK.PeerInfo[]> {
        const peersInfo = await this.client.getPeersInfo(GRPC.Empty).response;
        return peersInfo.peers.map(translate.peerInfo);
    }

    /**
     * Get a list of special events in a given block. These are events generated
     * by the protocol, such as minting and reward payouts. They are not directly
     * generated by any transaction. The stream will end when all the special
     * events for a given block have been returned.
     *
     * {@codeblock ~~:nodejs/client/getBlockSpecialEvents.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the special events at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of block item summaries
     *
     * **Please note**, these can possibly be unknown if the SDK is not fully compatible with the Concordium
     * node queried, in which case `null` is returned.
     */
    getBlockSpecialEvents(
        blockHash?: BlockHash.Type,
        abortSignal?: AbortSignal
    ): AsyncIterable<Upward<SDK.BlockSpecialEvent>> {
        const blockSpecialEvents = this.client.getBlockSpecialEvents(getBlockHashInput(blockHash), {
            abort: abortSignal,
        }).responses;

        return mapStream(blockSpecialEvents, translate.blockSpecialEvent);
    }

    /**
     * Get the pending updates to chain parameters at the end of a given block.
     * The stream will end when all the pending updates for a given block have been returned.
     *
     * {@codeblock ~~:nodejs/client/getBlockPendingUpdates.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the pending updates at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns a stream of pending updates
     */
    getBlockPendingUpdates(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<SDK.PendingUpdate> {
        const pendingUpdates = this.client.getBlockPendingUpdates(getBlockHashInput(blockHash), {
            abort: abortSignal,
        }).responses;

        return mapStream(pendingUpdates, translate.pendingUpdate);
    }

    /**
     * Get the summary of the finalization data in a given block.
     *
     * {@codeblock ~~:nodejs/client/getBlockFinalizationSummary.ts#documentation-snippet}
     *
     * @param blockHash an optional block hash to get the finalization summaries at, otherwise retrieves from last finalized block.
     * @returns a finalization summary
     */
    async getBlockFinalizationSummary(blockHash?: BlockHash.Type): Promise<SDK.BlockFinalizationSummary> {
        const finalizationSummary = await this.client.getBlockFinalizationSummary(getBlockHashInput(blockHash))
            .response;

        return translate.blockFinalizationSummary(finalizationSummary);
    }

    /**
     * Gets a stream of finalized blocks from specified `startHeight`.
     *
     * @param {bigint} [startHeight=0n] - An optional height to start streaming blocks from. Defaults to 0n.
     * @param {AbortSignal} [abortSignal] - An optional abort signal, which will end the stream. If this is not specified, the stream continues indefinitely.
     * @returns {AsyncIterable<SDK.FinalizedBlockInfo>} A stream of {@link SDK.FinalizedBlockInfo}.
     */
    getFinalizedBlocksFrom(
        startHeight: SDK.AbsoluteBlocksAtHeightRequest,
        abortSignal?: AbortSignal
    ): AsyncIterable<SDK.FinalizedBlockInfo>;
    /**
     * Gets a stream of finalized blocks from specified `startHeight`.
     *
     * @param {bigint} [startHeight=0n] - An optional height to start streaming blocks from. Defaults to 0n.
     * @param {bigint} [endHeight] - An optional height to stop streaming at. If this is not specified, the stream continues indefinitely.
     * @returns {AsyncIterable<SDK.FinalizedBlockInfo>} A stream of {@link SDK.FinalizedBlockInfo}.
     */
    getFinalizedBlocksFrom(
        startHeight: SDK.AbsoluteBlocksAtHeightRequest,
        endHeight?: SDK.AbsoluteBlocksAtHeightRequest
    ): AsyncIterable<SDK.FinalizedBlockInfo>;
    getFinalizedBlocksFrom(
        startHeight: SDK.AbsoluteBlocksAtHeightRequest = 0n,
        end?: AbortSignal | SDK.AbsoluteBlocksAtHeightRequest
    ): AsyncIterable<SDK.FinalizedBlockInfo> {
        let height = startHeight;
        let finHeight: bigint;
        const abortController = new AbortController();
        const abortSignal = end instanceof AbortSignal ? end : abortController.signal;
        const newBlocks = this.getFinalizedBlocks(abortSignal);
        const endSignal: IteratorReturnResult<undefined> = {
            done: true,
            value: undefined,
        };
        let searchKnown = true;

        const nextKnown = async (): Promise<SDK.FinalizedBlockInfo | undefined> => {
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
            const bi: SDK.FinalizedBlockInfo = { hash, height };
            height += 1n;

            return bi;
        };

        const nextNew = async (): Promise<SDK.FinalizedBlockInfo | undefined> => {
            // At this point, we've found all blocks already finalized on chain. Start streaming new blocks.
            for await (const block of newBlocks) {
                if (block.height < height) {
                    // Skip blocks already found.
                    continue;
                }

                return block;
            }
        };

        const next = async (): Promise<IteratorResult<SDK.FinalizedBlockInfo>> => {
            if (abortSignal.aborted) {
                return endSignal;
            }

            if (finHeight === undefined) {
                finHeight = await this.getConsensusHeight();
            }

            let bi: SDK.FinalizedBlockInfo | undefined;
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
     * @param {(bi: SDK.FinalizedBlockInfo) => Promise<R | undefined>} predicate - A predicate function resolving with value of type {@link R} if the predicate holds, and undefined if not.
     * The precondition for this method is that the function is monotone, i.e., if block at height `h` satisfies the test then also a block at height `h+1` does.
     * If this precondition does not hold then the return value from this method is unspecified.
     * @param {bigint} [from=0n] - An optional lower bound of the range of blocks to search. Defaults to 0n.
     * @param {bigint} [to] - An optional upper bound of the range of blocks to search. Defaults to latest finalized block.
     *
     * @returns {Promise<R | undefined>} The value returned from `predicate` at the lowest block (in terms of height) where the predicate holds.
     */
    async findEarliestFinalized<R>(
        predicate: (bi: SDK.FinalizedBlockInfo) => Promise<R | undefined>,
        from: SDK.AbsoluteBlocksAtHeightRequest = 0n,
        to?: SDK.AbsoluteBlocksAtHeightRequest
    ): Promise<R | undefined> {
        let lower = from;
        let upper = to ?? (await this.getConsensusHeight());

        if (lower > upper) {
            throw new Error('Please specify a "to" value greater than the specified "from" value');
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
        address: ContractAddress.Type,
        from?: SDK.AbsoluteBlocksAtHeightRequest,
        to?: SDK.AbsoluteBlocksAtHeightRequest
    ): Promise<FindInstanceCreationReponse | undefined> {
        return this.findEarliestFinalized(
            async ({ hash, height }) => {
                try {
                    const instanceInfo = await this.getInstanceInfo(address, hash);
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
     * @returns {SDK.BlockInfo} Information about the block found, or undefined if no block was found.
     */
    async findFirstFinalizedBlockNoLaterThan(
        time: Date,
        from?: SDK.AbsoluteBlocksAtHeightRequest,
        to?: SDK.AbsoluteBlocksAtHeightRequest
    ): Promise<SDK.BlockInfo | undefined> {
        return this.findEarliestFinalized(
            async ({ hash }) => {
                const bi = await this.getBlockInfo(hash);
                return bi.blockSlotTime >= time ? bi : undefined;
            },
            from,
            to
        );
    }

    /**
     * Get the projected earliest time at which a particular baker will be required to bake a block.
     *
     * If the baker is not a baker for the current reward period, this returns a timestamp at the
     * start of the next reward period. If the baker is a baker for the current reward period, the
     * earliest win time is projected from the current round forward, assuming that each round after
     * the last finalized round will take the minimum block time. (If blocks take longer, or timeouts
     * occur, the actual time may be later, and the reported time in subsequent queries may reflect
     * this.) At the end of an epoch (or if the baker is not projected to bake before the end of the
     * epoch) the earliest win time for a (current) baker will be projected as the start of the next
     * epoch. This is because the seed for the leader election is updated at the epoch boundary, and
     * so the winners cannot be predicted beyond that. Note that in some circumstances the returned
     * timestamp can be in the past, especially at the end of an epoch.
     *
     * @throws an `UNAVAILABLE` RPC error if the current consensus version is 0 (prior to protocol version 6), as the endpoint is only supported from consensus version 1 (from protocol version 6).
     *
     * @param {SDK.BakerId} baker - The baker that should be queried for.
     *
     * @returns {Timestamp.Type} The projected earliest time at which a particular baker will be required to bake a block, as a unix timestamp in milliseconds.
     */
    async getBakerEarliestWinTime(baker: SDK.BakerId): Promise<Timestamp.Type> {
        const bakerId = {
            value: baker,
        };
        const winTime = await this.client.getBakerEarliestWinTime(bakerId).response;
        return Timestamp.fromMillis(winTime.value);
    }

    /**
     * For a non-genesis block, this returns the quorum certificate, a timeout
     * certificate (if present) and epoch finalization entry (if present).
     *
     * @throws an `UNIMPLEMENTED` RPC error if the endpoint is not enabled by the node.
     * @throws an `INVALID_ARGUMENT` if the block being pointed to is not a product of ConcordiumBFT
     *
     * @param blockHash optional block hash to get the cryptographic parameters at, otherwise retrieves from last finalized block.
     *
     * @returns the requested block certificates.
     */
    async getBlockCertificates(blockHash?: BlockHash.Type): Promise<SDK.BlockCertificates> {
        const blockHashInput = getBlockHashInput(blockHash);
        const blockCertificates = await this.client.getBlockCertificates(blockHashInput).response;
        return translate.blockCertificates(blockCertificates);
    }

    /**
     * Get all bakers in the reward period of a block.
     * This endpoint is only supported for protocol version 6 and onwards.
     *
     * @throws an `IllegalArgument` RPC error if the protocol does not support the endpoint.
     *
     * @param blockHash optional block hash to get the cryptographic parameters at, otherwise retrieves from last finalized block.
     *
     * @returns All bakers in the reward period of a block
     */
    getBakersRewardPeriod(blockHash?: BlockHash.Type): AsyncIterable<SDK.BakerRewardPeriodInfo> {
        const blockHashInput = getBlockHashInput(blockHash);
        const bakersRewardPeriod = this.client.getBakersRewardPeriod(blockHashInput).responses;
        return mapStream(bakersRewardPeriod, translate.bakerRewardPeriodInfo);
    }

    /**
     * Get the list of bakers that won the lottery in a particular historical epoch (i.e. the
     * last finalized block is in a later epoch). This lists the winners for each round in the
     * epoch, starting from the round after the last block in the previous epoch, running to
     * the round before the first block in the next epoch. It also indicates if a block in each
     * round was included in the finalized chain.
     *
     * The following error cases are possible:
     * @throws a `NOT_FOUND` RPC error if the query specifies an unknown block.
     * @throws an `UNAVAILABLE` RPC error if the query is for an epoch that is not finalized in the current genesis index, or is for a future genesis index.
     * @throws an `INVALID_ARGUMENT` RPC error if the query is for an epoch that is not finalized for a past genesis index.
     * @throws an `INVALID_ARGUMENT` RPC error if the query is for a genesis index at consensus version 0.
     * @throws an `INVALID_ARGUMENT` RPC error if the input `EpochRequest` is malformed.
     * @throws an `UNAVAILABLE` RPC error if the endpoint is disabled on the node.
     *
     * @param {BlockHash.Type | SDK.RelativeEpochRequest } epochRequest - Consists of either a block hash or a relative epoch request consisting of a genesis index and an epoch. If none is passed, it queries the last finalized block.
     *
     * @returns {SDK.WinningBaker} A stream of winning bakers for a given epoch.
     */
    getWinningBakersEpoch(epochRequest?: BlockHash.Type | SDK.RelativeEpochRequest): AsyncIterable<SDK.WinningBaker> {
        const req = getEpochRequest(epochRequest);
        const winningBakers = this.client.getWinningBakersEpoch(req).responses;

        return mapStream(winningBakers, translate.winningBaker);
    }

    /**
     * Get the block hash of the first finalized block in a specified epoch.
     *
     * The following error cases are possible:
     * @throws - a `NOT_FOUND` RPC error if the query specifies an unknown block.
     * @throws - an `UNAVAILABLE` RPC error if the query is for an epoch that is not finalized in the current genesis index, or is for a future genesis index.
     * @throws - an `INVALID_ARGUMENT` RPC error if the query is for an epoch with no finalized blocks for a past genesis index.
     * @throws - an `INVALID_ARGUMENT` RPC error if the input `EpochRequest` is malformed.
     * @throws - an `UNAVAILABLE` RPC error if the endpoint is disabled on the node.
     *
     * @param {BlockHash.Type | SDK.RelativeEpochRequest } epochRequest - Consists of either a block hash or a relative epoch request consisting of a genesis index and an epoch. If none is passed, it queries the last finalized block.
     *
     * @returns {HexString} The block hash as a hex encoded string.
     */
    async getFirstBlockEpoch(epochRequest?: BlockHash.Type | SDK.RelativeEpochRequest): Promise<BlockHash.Type> {
        const req = getEpochRequest(epochRequest);
        const blockHash = await this.client.getFirstBlockEpoch(req).response;

        return BlockHash.fromProto(blockHash);
    }

    private async getConsensusHeight() {
        return (await this.getConsensusStatus()).lastFinalizedBlockHeight;
    }

    /**
     * Queries the node to check its health
     *
     * {@codeblock ~~:nodejs/client/healthCheck.ts#documentation-snippet}
     *
     * @returns a HealthCheck indicating whether the node is healthy or not and provides the message from the client, if not healthy.
     */
    async healthCheck(): Promise<SDK.HealthCheckResponse> {
        try {
            await this.healthClient.check({});
            return { isHealthy: true };
        } catch (e) {
            return { isHealthy: false, message: (e as RpcError).message };
        }
    }

    /**
     * Get information about a protocol level token (PLT) at a certain block.
     * This endpoint is only supported for protocol version 9 and onwards.
     *
     * {@codeblock ~~:nodejs/client/getTokenInfo.ts#documentation-snippet}
     *
     * @param tokenId the ID of the token to query information about
     * @param blockHash an optional block hash to get the info from, otherwise retrieves from last finalized block.
     * @returns {PLT.TokenInfo} information about the corresponding token.
     */
    async getTokenInfo(tokenId: PLT.TokenId.Type, blockHash?: BlockHash.Type): Promise<PLT.TokenInfo> {
        const blockHashInput = getBlockHashInput(blockHash);
        const req: GRPC.TokenInfoRequest = {
            tokenId: PLT.TokenId.toProto(tokenId),
            blockHash: blockHashInput,
        };
        const res = await this.client.getTokenInfo(req);
        return translate.trTokenInfo(res.response);
    }

    /**
     * Get all token IDs currently registered at a block.
     * This endpoint is only supported for protocol version 9 and onwards.
     *
     * {@codeblock ~~:nodejs/client/getTokenList.ts#documentation-snippet}
     *
     * @param blockHash optional block hash, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     *
     * @returns All token IDs registered at a block
     */
    getTokenList(blockHash?: BlockHash.Type, abortSignal?: AbortSignal): AsyncIterable<PLT.TokenId.Type> {
        const blockHashInput = getBlockHashInput(blockHash);
        const tokenIds = this.client.getTokenList(blockHashInput, { abort: abortSignal }).responses;
        return mapStream(tokenIds, PLT.TokenId.fromProto);
    }
}

/**
 * @hidden
 */
export function getBlockHashInput(blockHash?: BlockHash.Type): GRPC.BlockHashInput {
    if (blockHash) {
        return {
            blockHashInput: {
                oneofKind: 'given',
                given: BlockHash.toProto(blockHash),
            },
        };
    } else {
        return {
            blockHashInput: {
                oneofKind: 'lastFinal',
                lastFinal: GRPC.Empty,
            },
        };
    }
}

/**
 * @hidden
 */
export function getAccountIdentifierInput(accountIdentifier: SDK.AccountIdentifierInput): GRPC.AccountIdentifierInput {
    let returnIdentifier: GRPC.AccountIdentifierInput['accountIdentifierInput'];

    if (AccountAddress.instanceOf(accountIdentifier)) {
        returnIdentifier = {
            oneofKind: 'address',
            address: AccountAddress.toProto(accountIdentifier),
        };
    } else if (CredentialRegistrationId.instanceOf(accountIdentifier)) {
        returnIdentifier = {
            oneofKind: 'credId',
            credId: {
                value: CredentialRegistrationId.toBuffer(accountIdentifier),
            },
        };
    } else if (typeof accountIdentifier === 'bigint') {
        returnIdentifier = {
            oneofKind: 'accountIndex',
            accountIndex: { value: accountIdentifier },
        };
    } else {
        throw new Error(`Unsupported account identifier: ${accountIdentifier}.`);
    }

    return { accountIdentifierInput: returnIdentifier };
}

/**
 * A concordium-node specific gRPC client wrapper, using a grpc-web transport layer.
 * This requires that the node at the address supplied has grpc-web enabled.
 *
 * @example
 * import { ConcordiumGRPCWebClient } from "..."
 * const client = new ConcordiumGRPCWebClient('127.0.0.1', 20000);
 */
export class ConcordiumGRPCWebClient extends ConcordiumGRPCClient {
    constructor(address: string, port: number, options?: Partial<GrpcWebOptions>) {
        const transport = new GrpcWebFetchTransport({
            baseUrl: `${address}:${port}`,
            ...options,
        });
        super(transport);
    }
}

/**
 * @hidden
 */
export function getInvokerInput(invoker?: AccountAddress.Type | ContractAddress.Type): GRPC.Address | undefined {
    if (!invoker) {
        return undefined;
    } else if (AccountAddress.instanceOf(invoker)) {
        return {
            type: {
                oneofKind: 'account',
                account: AccountAddress.toProto(invoker),
            },
        };
    } else if (ContractAddress.instanceOf(invoker)) {
        return {
            type: {
                oneofKind: 'contract',
                contract: ContractAddress.toProto(invoker),
            },
        };
    } else {
        throw new Error('Unexpected input to build invoker');
    }
}

function getEpochRequest(epochRequest?: BlockHash.Type | SDK.RelativeEpochRequest): GRPC.EpochRequest {
    if (BlockHash.instanceOf(epochRequest) || typeof epochRequest === 'undefined') {
        return {
            epochRequestInput: {
                oneofKind: 'blockHash',
                blockHash: getBlockHashInput(epochRequest),
            },
        };
    } else {
        return {
            epochRequestInput: {
                oneofKind: 'relativeEpoch',
                relativeEpoch: {
                    genesisIndex: { value: epochRequest.genesisIndex },
                    epoch: { value: epochRequest.epoch },
                },
            },
        };
    }
}

function assertValidIp(ip: SDK.IpAddressString): void {
    if (!isValidIp(ip)) {
        throw new Error('The input was not a valid ip: ' + ip);
    }
}

function assertValidPort(port: number): void {
    if (port > 65535 || port < 0) {
        throw new Error('The input was not a valid port, must be between 0 and 65535: ' + port);
    }
}

function assertValidHex(hex: HexString): void {
    if (!isHex(hex)) {
        throw new Error('The input was not a valid hex: ' + hex);
    }
}
