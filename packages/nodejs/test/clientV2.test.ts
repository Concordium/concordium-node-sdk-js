import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/clientV2';
import { testnetBulletproofGenerators } from './resources/bulletproofgenerators';
import {
    AccountAddress,
} from '@concordium/common-sdk';


/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClient(
    address = 'service.internal.testnet.concordium.com',
    port = 20000
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

const testAccount = '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G';
const testBlockHash = Buffer.from('/oj/NUVAecPfEdiuE9V3e6vWHyi+WElO/lG2WT4wcW4=', 'base64')

test('getCryptographicParameters', async () => {
    const parameters = await client.getCryptographicParameters(testBlockHash);
    expect(parameters.genesisString).toEqual('Concordium Testnet Version 5');
    expect(parameters.onChainCommitmentKey).toEqual(
        Buffer.from('sUy/5EoCxrH3hxEXbV9DcpU2eqTyqMJVHuENJaA63GnWGjMqBYlxkZ2tcxLh/JTFqNReZLb5F8VA7uFslww9S388r0indGKEh44qziHILqRL+EYJg0Ylvh8wmYisUj+s', 'base64')
    );

    expect(parameters.bulletproofGenerators).toEqual(
        Buffer.from(testnetBulletproofGenerators, 'base64')
    );
});

test('NextAccountSequenceNumber', async () => {
    const accountAddress = new AccountAddress(testAccount);
    const nextAccountSequenceNumber = await client.getNextAccountSequenceNumber(accountAddress);
    expect(nextAccountSequenceNumber.sequenceNumber?.value).toBeGreaterThanOrEqual(19n);
    expect(nextAccountSequenceNumber.allFinal).toBeDefined();
});

test('AccountInfo', async () => {
    const accountAddress = new AccountAddress(testAccount);
    const accountInfo = await client.getAccountInfo(accountAddress, testBlockHash);

    expect(accountInfo.creds).toBeDefined(); // Todo: Properly test this
    expect(accountInfo.sequenceNumber?.value).toEqual(19n);
    expect(accountInfo.amount?.value).toEqual(35495453082577742n);
    expect(accountInfo.schedule?.total?.value).toEqual(0n);
    expect(accountInfo.threshold?.value).toEqual(1);
    expect(accountInfo.encryptedBalance).toBeDefined(); // Todo: Properly test this
    expect(accountInfo.encryptionKey?.value).toEqual(
        Buffer.from('sUy/5EoCxrH3hxEXbV9DcpU2eqTyqMJVHuENJaA63GnWGjMqBYlxkZ2tcxLh/JTFqnMARbzSC7XCQ0nbKdlJ92fnL3zORZ3BY8S5PHgKfX9lgB3aj/fk/Ab98aGyRidv', 'base64')
    );
    expect(accountInfo.index?.value).toEqual(11n);
    expect(accountInfo.address?.value).toEqual(Buffer.from(accountAddress.decodedAddress));
});