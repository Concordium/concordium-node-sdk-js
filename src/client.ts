import { ChannelCredentials, Metadata, ServiceError } from '@grpc/grpc-js';
import { P2PClient } from '../grpc/concordium_p2p_rpc_grpc_pb';
import {
    AccountAddress,
    BlockHash,
    BlockHeight,
    Empty,
    GetAddressInfoRequest,
    SendTransactionRequest,
    TransactionHash,
} from '../grpc/concordium_p2p_rpc_pb';
import { serializeAccountTransactionForSubmission } from './serialization';
import {
    AccountEncryptedAmount,
    AccountInfo,
    AccountReleaseSchedule,
    AccountTransaction,
    AccountTransactionSignature,
    BlockInfo,
    BlockSummary,
    ChainParameters,
    ConsensusStatus,
    ExchangeRate,
    FinalizationData,
    KeysWithThreshold,
    NextAccountNonce,
    PartyInfo,
    ReleaseSchedule,
    TransactionStatus,
    TransactionSummary,
    TransferredEvent,
    UpdateQueue,
} from './types';
import {
    buildJsonResponseReviver,
    intToStringTransformer,
    isValidHash,
    unwrapBoolResponse,
    unwrapJsonResponse,
} from './util';

/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @example
 * import ConcordiumNodeClient from "..."
 * const client = new ConcordiumNodeClient('127.0.0.1', 10000, credentials, metadata, 15000);
 */
export default class ConcordiumNodeClient {
    client: P2PClient;

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

        this.address = address;
        this.port = port;
        this.timeout = timeout;
        this.metadata = metadata;
        this.client = new P2PClient(`${address}:${port}`, credentials, options);
    }

    /**
     * Serializes and sends an account transaction to the node to be
     * put in a block on the chain.
     *
     * Note that a transaction can still fail even if it was accepted by the node.
     * To keep track of the transaction use getTransactionStatus.
     * @param accountTransaction the transaction to send to the node
     * @param signatures the signatures on the signing digest of the transaction
     * @returns true if the transaction was accepted, otherwise false
     */
    async sendAccountTransaction(
        accountTransaction: AccountTransaction,
        signatures: AccountTransactionSignature
    ): Promise<boolean> {
        const serializedAccountTransaction: Buffer = Buffer.from(
            serializeAccountTransactionForSubmission(
                accountTransaction,
                signatures
            )
        );

        const sendTransactionRequest = new SendTransactionRequest();
        sendTransactionRequest.setNetworkId(100);
        sendTransactionRequest.setPayload(serializedAccountTransaction);

        const response = await this.sendRequest(
            this.client.sendTransaction,
            sendTransactionRequest
        );
        return unwrapBoolResponse(response);
    }

    /**
     * Retrieves the account info for the given account. If the provided block
     * hash is in a block prior to the finalization of the account, then the account
     * information will not be available. If there is no account with the provided address,
     * then the node will check if there exists any credential with that address and
     * return information for that credential.
     * @param accountAddress base58 account address to get the account info for
     * @param blockHash the block hash to get the account info at
     * @returns the account info for the provided account address, undefined is the account does not exist
     */
    async getAccountInfo(
        accountAddress: string,
        blockHash: string
    ): Promise<AccountInfo | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const getAddressInfoRequest = new GetAddressInfoRequest();
        getAddressInfoRequest.setAddress(accountAddress);
        getAddressInfoRequest.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getAccountInfo,
            getAddressInfoRequest
        );
        const bigIntPropertyKeys: (
            | keyof AccountInfo
            | keyof AccountEncryptedAmount
            | keyof AccountReleaseSchedule
            | keyof ReleaseSchedule
        )[] = [
            'accountAmount',
            'accountNonce',
            'accountIndex',
            'startIndex',
            'total',
            'amount',
        ];
        return unwrapJsonResponse<AccountInfo>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves the next account nonce for the given account. The account nonce is
     * used in all account transactions as part of their header.
     * @param accountAddress base58 account address to get the next account nonce for
     * @returns the next account nonce, and a boolean indicating if the nonce is reliable
     */
    async getNextAccountNonce(
        accountAddress: string
    ): Promise<NextAccountNonce | undefined> {
        const accountAddressObject = new AccountAddress();
        accountAddressObject.setAccountAddress(accountAddress);

        const response = await this.sendRequest(
            this.client.getNextAccountNonce,
            accountAddressObject
        );

        const bigIntPropertyKeys: (keyof NextAccountNonce)[] = ['nonce'];

        return unwrapJsonResponse<NextAccountNonce>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves a status for the given transaction.
     * @param transactionHash the transaction to get a status for
     * @returns the transaction status for the given transaction, or null if the transaction does not exist
     */
    async getTransactionStatus(
        transactionHash: string
    ): Promise<TransactionStatus | undefined> {
        if (!isValidHash(transactionHash)) {
            throw new Error(
                'The input was not a valid hash: ' + transactionHash
            );
        }

        const bigIntPropertyKeys: (keyof TransactionSummary)[] = [
            'cost',
            'energyCost',
            'index',
        ];

        const transactionHashObject = new TransactionHash();
        transactionHashObject.setTransactionHash(transactionHash);
        const response = await this.sendRequest(
            this.client.getTransactionStatus,
            transactionHashObject
        );
        return unwrapJsonResponse<TransactionStatus>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves the block summary for a specific block. This contains information
     * about finalization, update sequence numbers (their nonce), update queues,
     * updateable chain parameters and transaction summaries for any transaction
     * in the block.
     * @param blockHash the block to get the summary for
     * @returns the block summary for the given block, or undefined if the block does not exist
     */
    async getBlockSummary(
        blockHash: string
    ): Promise<BlockSummary | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);

        const response = await this.sendRequest(
            this.client.getBlockSummary,
            blockHashObject
        );

        const bigIntPropertyKeys: (
            | keyof PartyInfo
            | keyof FinalizationData
            | keyof TransactionSummary
            | keyof ChainParameters
            | keyof ExchangeRate
            | keyof UpdateQueue
            | keyof KeysWithThreshold
            | keyof TransferredEvent
        )[] = [
            'bakerId',
            'weight',
            'finalizationIndex',
            'finalizationDelay',
            'cost',
            'energyCost',
            'index',
            'bakerCooldownEpochs',
            'minimumThresholdForBaking',
            'foundationAccountIndex',
            'numerator',
            'denominator',
            'nextSequenceNumber',
            'amount',
        ];

        return unwrapJsonResponse<BlockSummary>(
            response,
            buildJsonResponseReviver([], bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves information about a specific block.
     * @param blockHash the block to get information about
     * @returns the block information for the given block, or null if the block does not exist
     */
    async getBlockInfo(blockHash: string): Promise<BlockInfo | undefined> {
        if (!isValidHash(blockHash)) {
            throw new Error('The input was not a valid hash: ' + blockHash);
        }

        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);
        const response = await this.sendRequest(
            this.client.getBlockInfo,
            blockHashObject
        );

        const datePropertyKeys: (keyof BlockInfo)[] = [
            'blockArriveTime',
            'blockReceiveTime',
            'blockSlotTime',
        ];
        const bigIntPropertyKeys: (keyof BlockInfo)[] = [
            'blockHeight',
            'blockBaker',
            'blockSlot',
            'transactionEnergyCost',
            'transactionCount',
            'transactionsSize',
        ];

        return unwrapJsonResponse<BlockInfo>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    /**
     * Retrieves the blocks are the given height.
     * @param height the block height as a positive integer
     * @returns a string array containing the blocks at the given height, i.e. ['blockHash1', 'blockHash2', ...]
     */
    async getBlocksAtHeight(height: bigint): Promise<string[]> {
        if (height <= 0n) {
            throw new Error(
                'The block height has to be a positive integer, but it was: ' +
                    height
            );
        }
        const blockHeight = new BlockHeight();
        blockHeight.setBlockHeight(height.toString());
        const response = await this.sendRequest(
            this.client.getBlocksAtHeight,
            blockHeight
        );

        const blocksAtHeight = unwrapJsonResponse<string[]>(response);
        if (!blocksAtHeight) {
            return [];
        }
        return blocksAtHeight;
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     */
    async getConsensusStatus(): Promise<ConsensusStatus> {
        const response = await this.sendRequest(
            this.client.getConsensusStatus,
            new Empty()
        );

        const datePropertyKeys: (keyof ConsensusStatus)[] = [
            'blockLastReceivedTime',
            'blockLastArrivedTime',
            'genesisTime',
            'lastFinalizedTime',
        ];
        const bigIntPropertyKeys: (keyof ConsensusStatus)[] = [
            'epochDuration',
            'slotDuration',
            'bestBlockHeight',
            'lastFinalizedBlockHeight',
            'finalizationCount',
            'blocksVerifiedCount',
            'blocksReceivedCount',
        ];

        const consensusStatus = unwrapJsonResponse<ConsensusStatus>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );

        if (!consensusStatus) {
            throw new Error(
                'Nothing was returned when trying to get the consensus status.'
            );
        }

        return consensusStatus;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    sendRequest<T>(command: any, input: T): Promise<Uint8Array> {
        const deadline = new Date(Date.now() + this.timeout);
        return new Promise<Uint8Array>((resolve, reject) => {
            this.client.waitForReady(deadline, (error) => {
                if (error) {
                    return reject(error);
                }

                return command.bind(this.client)(
                    input,
                    this.metadata,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (err: ServiceError | null, response: any) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve(response.serializeBinary());
                    }
                );
            });
        });
    }
}
