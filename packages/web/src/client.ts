import {
    GrpcWebFetchTransport,
    GrpcWebOptions,
} from '@protobuf-ts/grpcweb-transport';
import { ConcordiumGRPCClient } from '@concordium/common-sdk';

/**
 * Initialize a gRPC client for a specific concordium node.
 * @param address the ip address of the node, e.g. http://127.0.0.1
 * @param port the port to use when econnecting to the node
 * @param options optional options for the grpc-web transport
 */
export function createConcordiumClient(
    address: string,
    port: number,
    options?: Partial<GrpcWebOptions>
): ConcordiumGRPCClient {
    const transport = new GrpcWebFetchTransport({
        baseUrl: `${address}:${port}`,
        ...options,
    });
    return new ConcordiumGRPCClient(transport);
}
