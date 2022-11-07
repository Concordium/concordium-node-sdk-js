import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/clientV2';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = '127.0.0.1',
    port = 20001
): ConcordiumNodeClient {
    const metadata = new Metadata();
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
    // TODO use specific hash: fe88ff35454079c3df11d8ae13d5777babd61f28be58494efe51b6593e30716e
    const parameters = await client.getCryptographicParameters('');
    expect(parameters.genesisString).toEqual('Concordium Testnet Version 5');
    expect(parameters.onChainCommitmentKey).toEqual(
        'sUy/5EoCxrH3hxEXbV9DcpU2eqTyqMJVHuENJaA63GnWGjMqBYlxkZ2tcxLh/JTFqNReZLb5F8VA7uFslww9S388r0indGKEh44qziHILqRL+EYJg0Ylvh8wmYisUj+s'
    );
    expect(parameters.bulletproofGenerators).toEqual(
        testnetBulletproofGenerators
    );
});
