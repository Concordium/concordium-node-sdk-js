import { ChannelCredentials } from '@grpc/grpc-js';
import { GrpcOptions, GrpcTransport } from '@protobuf-ts/grpc-transport';

import { ConcordiumGRPCClient } from '../grpc/GRPCClient.js';

/**
 * A concordium-node specific gRPC client wrapper.
 * This will not work in a browser environment, in which case {@link ConcordiumGRPCWebClient}
 * should be used instead.
 *
 * @example
 * import { ConcordiumGRPCNodeClient } from "..."
 * import { credentials } from '@grpc/grpc-js';
 *
 * const creds = ...; // e.g. credentials.createInsecure();
 * const client = new ConcordiumGRPCClient('127.0.0.1', 20000, creds);
 */
export class ConcordiumGRPCNodeClient extends ConcordiumGRPCClient {
    constructor(address: string, port: number, credentials: ChannelCredentials, options?: Partial<GrpcOptions>) {
        const transport = new GrpcTransport({
            host: `${address}:${port}`,
            channelCredentials: credentials,
            ...options,
        });
        super(transport);
    }
}

export { credentials, ChannelCredentials, CallCredentials } from '@grpc/grpc-js';
