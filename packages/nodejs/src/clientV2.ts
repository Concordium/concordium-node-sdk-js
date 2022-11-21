import { ChannelCredentials, Metadata } from '@grpc/grpc-js';
import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import * as translate from './typeTranslation';
import { HexString } from '@concordium/common-sdk';
import { QueriesClient } from '../grpc/v2/concordium/service.client';
import { GrpcTransport } from '@protobuf-ts/grpc-transport';
import { getBlockHashInput, getAccountIdentifierInput, assertValidHash, assertValidModuleRef, assertAmount } from './util';

/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @example
 * import ConcordiumNodeClient from "..."
 * const client = new ConcordiumNodeClient('127.0.0.1', 20000, credentials, metadata, 15000);
 */
export default class ConcordiumNodeClient {
    client: QueriesClient;

    metadata: Metadata;

    address: string;

    port: number;

    timeout: number;

    /**
     * Initialize a gRPC client for a specific concordium node.
     * @param address the ip address of the node, e.g. 127.0.0.1
     * @param port the port to use when econnecting to the node
     * @param credentials credentials to use to connect to the node
     * @param timeout milliseconds to wait before timing out
     * @param options optional options for the P2PClient
     */
    constructor(
        address: string,
        port: number,
        credentials: ChannelCredentials,
        metadata: Metadata,
        timeout: number,
        options?: Record<string, unknown>
    ) {
        if (timeout < 0 || !Number.isSafeInteger(timeout)) {
            throw new Error(
                'The timeout must be a positive integer, but was: ' + timeout
            );
        }

        const grpcTransport = new GrpcTransport({
            host: `${address}:${port}`,
            channelCredentials: credentials,
            options: options,
        });

        this.address = address;
        this.port = port;
        this.timeout = timeout;
        this.metadata = metadata;
        this.client = new QueriesClient(grpcTransport);
    }

    /**
     * Retrieves the next account nonce for the given account. The account nonce is
     * used in all account transactions as part of their header.
     * @param accountAddress base58 account address to get the next account nonce for
     * @returns the next account nonce, and a boolean indicating if the nonce is reliable
     */
    async getNextAccountNonce(
        accountAddress: v1.AccountAddress
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
     * @param blockHash optional block hash to get the account info at, otherwise retrieves from last finalized block
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

    async getBlockItemStatus(
        transactionHash: HexString
    ): Promise<v2.BlockItemStatus> {
        assertValidHash(transactionHash);
        const transactionHashV2: v2.TransactionHash = {
            value: Buffer.from(transactionHash, 'hex')
        }

        return await this.client.getBlockItemStatus(transactionHashV2)
            .response;
    }

    async getConsensusInfo(): Promise<v2.ConsensusInfo> {
        return await this.client.getConsensusInfo(v2.Empty).response;
    }

    async getModuleSource(
        blockHash: HexString,
        moduleRef: Uint8Array
    ): Promise<v2.VersionedModuleSource> {
        const blockHashInput = getBlockHashInput(blockHash);
        assertValidModuleRef(moduleRef);

        const moduleSourceRequest = {
            blockHashInput: blockHashInput,
            moduleRef: { value: moduleRef },
        };

        return await this.client.getModuleSource(moduleSourceRequest).response;
    }

    async getInstanceInfo(
        blockHash: HexString,
        contractAddress: v1.ContractAddress
    ): Promise<v2.InstanceInfo> {
        const blockHashInput = getBlockHashInput(blockHash);

        const instanceInfoRequest = {
            blockHashInput: blockHashInput,
            address: contractAddress,
        };

        return await this.client.getInstanceInfo(instanceInfoRequest).response;
    }

    async invokeInstance(
        blockHash: HexString,
        instance: v1.ContractAddress,
        amount: bigint,
        entrypoint: string,
        parameter: Uint8Array,
        energy: bigint,
        invoker?: v2.Address
    ): Promise<v2.InvokeInstanceResponse> {
        const blockHashInput = getBlockHashInput(blockHash);
        assertAmount(amount);

        const request: v2.InvokeInstanceRequest = {
            blockHash: blockHashInput,
            invoker: invoker,
            instance: instance,
            amount: { value: amount },
            entrypoint: { value: entrypoint },
            parameter: { value: parameter },
            energy: { value: energy },
        };

        return await this.client.invokeInstance(request).response;
    }
}
