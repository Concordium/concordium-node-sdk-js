import { ChannelCredentials, Metadata, ServiceError } from "@grpc/grpc-js";
import { P2PClient } from "./grpc/concordium_p2p_rpc_grpc_pb";
import { BlockHash, BlockHeight, Empty } from "./grpc/concordium_p2p_rpc_pb";
import { BlockInfo, ConsensusStatus } from "./types";
import {
    buildJsonResponseReviver,
    intToStringTransformer,
    isValidHash,
    unwrapJsonResponse,
} from "./util";

interface GrpcClient extends P2PClient {
    waitForReady?(date: Date, cb: (error: ServiceError) => void): void;
}

type Command<T, Response> = (
    input: T,
    metadata: Metadata,
    callback: (error: ServiceError, response: Response) => void
) => Promise<Response>;

interface Serializable {
    serializeBinary(): Uint8Array;
}

/**
 * A concordium-node specific gRPC client wrapper.
 *
 * @example
 * import ConcordiumNodeClient from "..."
 * const client = new ConcordiumNodeClient('127.0.0.1', 10000, credentials, metadata, 15000);
 */
export default class ConcordiumNodeClient {
    client: GrpcClient;

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
                "The timeout must be a positive integer, but was: " + timeout
            );
        }

        this.address = address;
        this.port = port;
        this.timeout = timeout;
        this.metadata = metadata;
        this.client = new P2PClient(`${address}:${port}`, credentials, options);
    }

    /**
     * Retrieves information about a specific block.
     * @param blockHash the block to get information about
     * @returns the block information for the given block, or null if the block does not exist
     */
    async getBlockInfo(blockHash: string): Promise<BlockInfo | null> {
        if (!isValidHash(blockHash)) {
            throw new Error("The input was not a valid hash: " + blockHash);
        }

        const blockHashObject = new BlockHash();
        blockHashObject.setBlockHash(blockHash);
        const response = await this.sendRequest(
            this.client.getBlockInfo,
            blockHashObject
        );

        const datePropertyKeys: (keyof BlockInfo)[] = [
            "blockArriveTime",
            "blockReceiveTime",
            "blockSlotTime",
        ];
        const bigIntPropertyKeys: (keyof BlockInfo)[] = [
            "blockHeight",
            "blockBaker",
            "blockSlot",
            "transactionEnergyCost",
            "transactionCount",
            "transactionsSize",
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
                "The block height has to be a positive integer, but it was: " +
                    height
            );
        }
        const blockHeight = new BlockHeight();
        blockHeight.setBlockHeight(height.toString());
        const response = await this.sendRequest(
            this.client.getBlocksAtHeight,
            blockHeight
        );
        return unwrapJsonResponse<string[]>(response);
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
            "blockLastReceivedTime",
            "blockLastArrivedTime",
            "genesisTime",
            "lastFinalizedTime",
        ];
        const bigIntPropertyKeys: (keyof ConsensusStatus)[] = [
            "epochDuration",
            "slotDuration",
            "bestBlockHeight",
        ];

        return unwrapJsonResponse<ConsensusStatus>(
            response,
            buildJsonResponseReviver(datePropertyKeys, bigIntPropertyKeys),
            intToStringTransformer(bigIntPropertyKeys)
        );
    }

    sendRequest<T, Response extends Serializable>(
        command: Command<T, Response>,
        input: T
    ): Promise<Uint8Array> {
        const deadline = new Date(Date.now() + this.timeout);
        return new Promise<Uint8Array>((resolve, reject) => {
            if (this.client.waitForReady === undefined) {
                reject(
                    new Error("The client is missing the waitForReady function")
                );
            } else {
                this.client.waitForReady(deadline, (error) => {
                    if (error) {
                        return reject(error);
                    }

                    return command.bind(this.client)(
                        input,
                        this.metadata,
                        (err, response) => {
                            if (err) {
                                return reject(err);
                            }
                            return resolve(response.serializeBinary());
                        }
                    );
                });
            }
        });
    }
}
