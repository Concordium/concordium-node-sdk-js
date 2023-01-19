import { ChannelCredentials, Metadata } from '@grpc/grpc-js';
import * as v1 from '@concordium/common-sdk';
import * as v2 from '../grpc/v2/concordium/types';
import * as translate from './typeTranslation';
import { HexString } from '@concordium/common-sdk';
import { getBlockHashInput, getAccountIdentifierInput } from './util';
import { QueriesClient } from '../grpc/v2/concordium/service.client';
import { GrpcTransport } from '@protobuf-ts/grpc-transport';

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

    /**
     * Retrieves the status of the block chain parameters at the given blockHash.
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
     * @param blockHash the block hash of the block to get the information from.
     * @param bakerId the ID of the baker to get the status for.
     * @returns The status of the corresponding baker pool.
     */
    async getPoolInfo(
        bakerId: bigint,
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
     * @param blockHash optional block hash to get the reward status at, otherwise retrieves from last finalized block
     * @returns the reward status at the given block, or undefined it the block does not exist.
     */
    async getTokenomicsInfo(blockHash?: HexString): Promise<v1.TokenomicsInfo> {
        const blockHashInput = getBlockHashInput(blockHash);

        const response = await this.client.getTokenomicsInfo(blockHashInput)
            .response;
        return translate.tokenomicsInfo(response);
    }
}
