import { ChannelCredentials, Metadata, ServiceError } from "@grpc/grpc-js";
import { P2PClient } from "./grpc/concordium_p2p_rpc_grpc_pb";
import { Empty } from "./grpc/concordium_p2p_rpc_pb";
import { ConsensusStatus } from "./types";
import { intToString, unwrapJsonResponse } from "./util";

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        function reviver(key: string, value: any) {
            if (datePropertyKeys.includes(key as keyof ConsensusStatus)) {
                // Note that we reduce the time precision from nano to milliseconds when doing this conversion.
                return new Date(value);
            } else if (
                bigIntPropertyKeys.includes(key as keyof ConsensusStatus)
            ) {
                return BigInt(value);
            }
            return value;
        }

        function transformer(json: string) {
            return intToString(
                json,
                bigIntPropertyKeys.map((key) => key as string)
            );
        }

        return unwrapJsonResponse<ConsensusStatus>(
            response,
            reviver,
            transformer
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
