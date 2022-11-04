import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/clientV2';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = 'service.internal.stagenet.concordium.com',
    port = 20000
): ConcordiumNodeClient {
    const metadata = new Metadata();
    metadata.add('authentication', 'rpcadmin');
    return new ConcordiumNodeClient(
        address,
        port,
        credentials.createInsecure(),
        metadata,
        15000
    );
}

const client = getNodeClient();

test('parameters', async () => {
    console.debug(await client.getCryptographicParameters());
});
