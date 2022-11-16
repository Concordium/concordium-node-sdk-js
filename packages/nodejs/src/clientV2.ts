import { ChannelCredentials, ServiceError } from '@grpc/grpc-js';
import { CryptographicParameters as CryptographicParametersJS } from '@concordium/common-sdk';
import {
    AccountAddress as AccountAddressLocal,
    CredentialRegistrationId as CredentialRegistrationIdLocal,
} from '@concordium/common-sdk';
import {
    AccountAddress,
    BlockHashInput,
    CryptographicParameters,
    Empty,
    NextAccountSequenceNumber,
    CredentialRegistrationId,
    AccountIndex,
    AccountInfoRequest,
    AccountIdentifierInput,
    AccountInfo
} from "./grpc/v2/concordium/types"

import {
    QueriesClient
} from "./grpc/v2/concordium/service.client"
import {GrpcTransport} from "@protobuf-ts/grpc-transport";

import { Metadata } from '@grpc/grpc-js/';

import { _grpc_channelz_v1_ChannelConnectivityState_State } from '@grpc/grpc-js/build/src/generated/grpc/channelz/v1/ChannelConnectivityState';

export type AccountIdentifierInputLocal = AccountAddressLocal | CredentialRegistrationIdLocal | bigint

function getBlockHashInput(blockHash?: Uint8Array): BlockHashInput {
    let blockHashInput: any = {};
    if (blockHash) {
        blockHashInput = {
            oneofKind: "given",
            given: {value: blockHash}
        };
    } else {
        blockHashInput = {
            oneofKind: "lastFinal",
            lastFinal: Empty
        };
    }
    return {blockHashInput : blockHashInput}
}

function getAccountIdentifierInput(accountIdentifier: AccountIdentifierInputLocal): AccountIdentifierInput {
    let returnIdentifier: any = {};

    if (accountIdentifier instanceof AccountAddressLocal) {
        const decodedAddress = new Uint8Array(accountIdentifier.decodedAddress);
        returnIdentifier.oneofKind = "address"
        returnIdentifier.address = {value: decodedAddress}
    } else if (accountIdentifier instanceof CredentialRegistrationIdLocal) {
        const credId = new Uint8Array(Buffer.from(accountIdentifier.credId, 'hex'));
        returnIdentifier.oneofKind = "credId"
        returnIdentifier.credId = {value: credId}
    } else {
        returnIdentifier.oneofKind = "accountIndex"
        returnIdentifier.accountIndex = {value: accountIdentifier};
    }

    return {accountIdentifierInput: returnIdentifier}
}

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
            channelCredentials: credentials
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
    async getNextAccountSequenceNumber(
        accountAddress: AccountAddressLocal
    ): Promise<NextAccountSequenceNumber> {
        const address: AccountAddress = {
            value: new Uint8Array(accountAddress.decodedAddress)
        };
        return await this.client.getNextAccountSequenceNumber(address).response
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     */
    async getCryptographicParameters(
        blockHash?: Uint8Array
    ): Promise<CryptographicParameters> {
        const blockHashInput = getBlockHashInput(blockHash)
        return await this.client.getCryptographicParameters(blockHashInput).response
    }

    async getAccountInfo(
        accountIdentifier: AccountIdentifierInputLocal,
        blockHash?: Uint8Array
    ): Promise<AccountInfo> {
        const blockHashInput = getBlockHashInput(blockHash);
        const accountIdentifierGrpc = getAccountIdentifierInput(accountIdentifier);
        //console.log(accountIdentifierGrpc);
        //console.log(blockHashInput);
        //console.log(blockHashInput.blockHashInput);

        const accountInfoRequest: AccountInfoRequest = {
            blockHash: blockHashInput,
            accountIdentifier: accountIdentifierGrpc
        };
        //console.log(accountInfoRequest);

        return await this.client.getAccountInfo(accountInfoRequest).response;
    }
}