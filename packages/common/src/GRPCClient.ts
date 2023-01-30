import * as v1 from './types';
import * as v2 from '../grpc/v2/concordium/types';
import { Base58String, HexString } from './types';
import { QueriesClient } from '../grpc/v2/concordium/service.client';
import type { RpcTransport } from '@protobuf-ts/runtime-rpc';
import { CredentialRegistrationId } from './types/CredentialRegistrationId';
import * as translate from './GRPCTypeTranslation';
import { AccountAddress } from './types/accountAddress';
import { getAccountTransactionHandler } from './accountTransactions';
import { calculateEnergyCost } from './energyCost';
import { countSignatures, mapAsyncIterable } from './util';
import {
    serializeAccountTransactionPayload,
    serializeCredentialDeploymentPayload,
} from './serialization';
import { BlockItemStatus } from './types/blockItemSummary';
import { ModuleReference } from './types/moduleReference';

/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @example
 * import ConcordiumNodeClient from "..."
 * const client = new ConcordiumNodeClient('127.0.0.1', 20000, credentials, metadata, 15000);
 */
export default class ConcordiumNodeClient {
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
     * @param accountAddress base58 account address to get the next account nonce for.
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
     * @param blockHash optional block hash to get the account info at, otherwise retrieves from last finalized block.
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
     * @param accountIdentifier base58 account address, or a credential registration id or account index to get the account info for
     * @param blockHash optional block hash to get the account info at, otherwise retrieves from last finalized block
     * @returns the account info for the provided account address, throws if the account does not exist
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
     * @param transactionHash the transaction/block item to get a status for.
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
     */
    async getConsensusStatus(): Promise<v1.ConsensusStatus> {
        const response = await this.client.getConsensusInfo(v2.Empty).response;
        return translate.consensusInfo(response);
    }

    /**
     * Retrieves the source of the given module at
     * the provided block.
     * @param moduleRef the module's reference, hash of the source represented as a bytearray.
     * @param blockHash the block to get the module source at.
     * @returns the source of the module as raw bytes.
     */
    async getModuleSource(
        moduleRef: ModuleReference,
        blockHash?: HexString
    ): Promise<Buffer> {
        const moduleSourceRequest: v2.ModuleSourceRequest = {
            blockHash: getBlockHashInput(blockHash),
            moduleRef: { value: moduleRef.decodedModuleRef },
        };

        const response = await this.client.getModuleSource(moduleSourceRequest)
            .response;
        if (response.module.oneofKind === 'v0') {
            return Buffer.from(response.module.v0.value);
        } else if (response.module.oneofKind === 'v1') {
            return Buffer.from(response.module.v1.value);
        } else {
            throw Error('Invalid ModuleSource response received!');
        }
    }

    /**
     * Retrieve information about a given smart contract instance.
     * @param contractAddress the address of the smart contract.
     * @param blockHash the block hash to get the smart contact instances at.
     * @returns An object with information about the contract instance.
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
     * @param context.contract The address of the smart contract that shall be evoked.
     * @param context.amount The amount of microCCD to invoke the contract with.
     * @param context.method The entrypoint (receive function) that shall be invoked.
     * @param context.parameter The serialized parameters that the contract will be invoked with.
     * @param context.energy The maximum amount of energy to allow for execution.
     * @param context.invoker The address of the invoker, if undefined uses the zero account address.
     * @param blockHash the block hash at which the contract should be invoked at. The contract is invoked in the state at the end of this block.
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
            energy: { value: context.energy || 0n },
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
     * @param credentialDeploymentTransaction the credential deployment transaction to send to the node
     * @param signatures the signatures on the hash of the serialized unsigned credential deployment information, in order
     * @returns The transaction hash as a hex string
     */
    async sendCredentialDeploymentTransaction(
        credentialDeploymentTransaction: v1.CredentialDeploymentTransaction,
        signatures: string[]
    ): Promise<HexString> {
        const payloadHex = serializeCredentialDeploymentPayload(
            signatures,
            credentialDeploymentTransaction
        );

        const credentialDeployment: v2.CredentialDeployment = {
            messageExpiry: {
                value: credentialDeploymentTransaction.expiry
                    .expiryEpochSeconds,
            },
            payload: {
                oneofKind: 'rawPayload',
                rawPayload: payloadHex,
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
     * Gets a stream of finalized blocks.
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
        return mapAsyncIterable(blocks, translate.commonBlockInfo);
    }

    /**
     * Gets a stream of blocks. To get a stream of only finalized blocks
     * use `getFinalizedBlocks()` instead.
     *
     * @param abortSignal an AbortSignal to close the stream. Note that the
     * stream does not close itself as it is infinite, so usually you'd want
     * to provide this parameter.
     * @returns An AsyncIterator stream of blocks.
     */
    getBlocks(abortSignal?: AbortSignal): AsyncIterable<v1.ArrivedBlockInfo> {
        const opts = { abort: abortSignal };
        const blocks = this.client.getBlocks(v2.Empty, opts).responses;
        return mapAsyncIterable(blocks, translate.commonBlockInfo);
    }

    /**
     * Waits until given transaction is finalized.
     *
     * @param transactionHash a transaction hash as a bytearray.
     * @param timeoutTime the number of milliseconds until the function throws error.
     * @returns A blockhash as a byte array.
     */
    async waitForTransactionFinalization(
        transactionHash: HexString,
        timeoutTime?: number
    ): Promise<HexString> {
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
                setImmediate(() => abortController.abort());
                return resolve(response.outcome.blockHash);
            }

            try {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for await (const _ of blockStream) {
                    const response = await this.getBlockItemStatus(
                        transactionHash
                    );
                    if (response.status === 'finalized') {
                        setImmediate(() => abortController.abort());
                        return resolve(response.outcome.blockHash);
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
        return mapAsyncIterable(asyncIter, translate.unwrapToBase58);
    }

    /**
     * Get a stream of all smart contract modules' references. The stream will end
     * when all modules that exist in the state at the end of the given
     * block have been returned.
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
        return mapAsyncIterable(asyncIter, translate.unwrapValToHex);
    }

    /**
     * Get a stream of ancestors for the provided block.
     * Starting with the provided block itself, moving backwards until no more
     * ancestors or the requested number of ancestors has been returned.
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
        return mapAsyncIterable(asyncIter, translate.unwrapValToHex);
    }

    /**
     * Get the exact state of a specific contract instance, streamed as a list of
     * key-value pairs. The list is streamed in lexicographic order of keys.
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
        return mapAsyncIterable(asyncIter, translate.instanceStateKVPair);
    }

    /**
     * Get the value at a specific key of a contract state. In contrast to
     * `GetInstanceState` this is more efficient, but requires the user to know
     * the specific key to look for.
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
     * Retrieve the list of accounts that exist at the end of the given block.
     *
     * @param blockHash an optional block hash to get the accounts at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of account addresses
     */
    getAccountList(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<AccountAddress> {
        const opts = { abort: abortSignal };
        const hash = getBlockHashInput(blockHash);
        const asyncIter = this.client.getAccountList(hash, opts).responses;
        return mapAsyncIterable(asyncIter, translate.accountAddress);
    }

    /**
     * Get a list of all smart contract modules. The stream will end
     * when all modules that exist in the state at the end of the given
     * block have been returned.
     *
     * @param blockHash an optional block hash to get the contract modules at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of contract modules.
     */
    getModuleList(
        blockHash?: HexString,
        abortSignal?: AbortSignal
    ): AsyncIterable<ModuleReference> {
        const opts = { abort: abortSignal };
        const hash = getBlockHashInput(blockHash);
        const asyncIter = this.client.getModuleList(hash, opts).responses;
        return mapAsyncIterable(asyncIter, translate.moduleReference);
    }

    /**
     * Get a stream of ancestors for the provided block.
     * Starting with the provided block itself, moving backwards until no more
     * ancestors or the requested number of ancestors has been returned.
     *
     * @param maxAmountOfAncestors the maximum amount of ancestors as a bigint.
     * @param blockHash a optional block hash to get the ancestors at, otherwise retrieves from last finalized block.
     * @param abortSignal an optional AbortSignal to close the stream.
     * @returns an async iterable of ancestors as hex strings.
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
        return mapAsyncIterable(asyncIter, translate.unwrapValToHex);
    }

    /**
     * Get the exact state of a specific contract instance, streamed as a list of
     * key-value pairs. The list is streamed in lexicographic order of keys.
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
        return mapAsyncIterable(asyncIter, translate.instanceStateKVPair);
    }

    /**
     * Get the value at a specific key of a contract state. In contrast to
     * `GetInstanceState` this is more efficient, but requires the user to know
     * the specific key to look for.
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
     * @param blockHash a optional block hash to get the instance states at, otherwise retrieves from last finalized block.
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
        return mapAsyncIterable(ips, translate.ipInfo);
    }

    /**
     * Get the anonymity revokers registered as of the end of a given block.
     * The stream will end when all the anonymity revokers have been returned,
     * or an abort signal is called.
     *
     * @param blockHash a optional block hash to get the instance states at, otherwise retrieves from last finalized block.
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
        return mapAsyncIterable(ars, translate.arInfo);
    }
}

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

function assertValidHash(hash: HexString): void {
    if (hash.length !== 64) {
        throw new Error(
            'The input was not a valid hash, must be 32 bytes: ' + hash
        );
    }
}
