import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { ConcordiumGRPCClient } from '@concordium/common-sdk';

/**
 * Initialize a gRPC client for a specific concordium node.
 * @param address the ip address of the node, e.g. 127.0.0.1
 * @param port the port to use when econnecting to the node
 * @param credentials credentials to use to connect to the node
 * @param timeout milliseconds to wait before timing out
 * @param options optional options for the P2PClient
 */
export function createConcordiumClient(
    address: string,
    port: number,
    timeout: number,
    options?: Record<string, unknown>
): ConcordiumGRPCClient {
    const transport = new GrpcWebFetchTransport({
        baseUrl: `${address}:${port}`,
        options,
    });
    return new ConcordiumGRPCClient(timeout, transport);
}
