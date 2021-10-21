import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/client';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(): ConcordiumNodeClient {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new ConcordiumNodeClient(
        '127.0.0.1',
        10001,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

export function isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
}
