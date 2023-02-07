import { ChannelCredentials } from '@grpc/grpc-js';
import { GrpcOptions, GrpcTransport } from '@protobuf-ts/grpc-transport';
import ConcordiumGRPCClient from '@concordium/common-sdk/lib/GRPCClient';

/**
 * Initialize a gRPC client for a specific concordium node.
 * @param address the ip address of the node, e.g. http://127.0.0.1
 * @param port the port to use when econnecting to the node
 * @param credentials channel credentials for communicating with the node
 * @param options optional options for the grpc transport
 */
export default function createConcordiumClient(
    address: string,
    port: number,
    credentials: ChannelCredentials,
    options?: Partial<GrpcOptions>
): ConcordiumGRPCClient {
    const grpcTransport = new GrpcTransport({
        host: `${address}:${port}`,
        channelCredentials: credentials,
        ...options,
    });
    return new ConcordiumGRPCClient(grpcTransport);
}
