import { Network } from '@concordium/wallet-connectors';
import { ConcordiumGRPCClient } from '@concordium/web-sdk';
import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport';
import { useEffect, useState } from 'react';

/**
 * React hook that obtains a gRPC Web client for interacting with a node on the appropriate network.
 */
export function useGrpcClient({ grpcOpts }: Network): ConcordiumGRPCClient | undefined {
    const [client, setClient] = useState<ConcordiumGRPCClient>();
    useEffect(() => {
        if (!grpcOpts) {
            return setClient(undefined);
        }
        // No exceptions should ever be thrown from here.
        setClient(new ConcordiumGRPCClient(new GrpcWebFetchTransport(grpcOpts)));
    }, [grpcOpts]);
    return client;
}
