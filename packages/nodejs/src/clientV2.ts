import { ChannelCredentials, Metadata, ServiceError } from '@grpc/grpc-js';
import { SurfaceCall } from '@grpc/grpc-js/build/src/call';
import { Empty } from '../grpc/concordium_p2p_rpc_pb';
import { QueriesClient } from '../grpc/v2/concordium/service_grpc_pb';
import {
    CryptographicParameters,
    BlockHashInput,
    BlockHash,
} from '../grpc/v2/concordium/types_pb';
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

        this.address = address;
        this.port = port;
        this.timeout = timeout;
        this.metadata = metadata;
        this.client = new QueriesClient(
            `${address}:${port}`,
            credentials,
            options
        );
    }

    /**
     * Retrieves the consensus status information from the node. Note that the optional
     * fields will only be unavailable for a newly started node that has not processed
     * enough data yet.
     */
    async getCryptographicParameters(
        blockHash?: string
    ): Promise<CryptographicParameters> {
        const blockHashInput = new BlockHashInput();
        if (blockHash) {
            const b = new BlockHash();
            b.setValue(blockHash);
            blockHashInput.setGiven(b);
        } else {
            blockHashInput.setLastFinal(new Empty());
        }

        const response = await this.sendRequest<
            BlockHashInput,
            CryptographicParameters
        >(this.client.getCryptographicParameters, blockHashInput);

        return response;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
    sendRequest<T, V>(
        command: (
            input: T,
            metadata: Metadata,
            callback: Callback<V>
        ) => SurfaceCall,
        input: T
    ): Promise<V> {
        const deadline = new Date(Date.now() + this.timeout);
        return new Promise<V>((resolve, reject) => {
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

type Callback<V> = (error: ServiceError | null, response: V) => void;
