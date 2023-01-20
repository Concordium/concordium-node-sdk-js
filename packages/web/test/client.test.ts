import { createConcordiumClient } from '../src/client';
import ConcordiumNodeClientV2 from '@concordium/common-sdk/lib/GRPCClient';
import { TextEncoder, TextDecoder } from 'util';
import 'isomorphic-fetch';

global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

/**
 * Creates a client to communicate with a local concordium-node
 * used for automatic tests.
 */
export function getNodeClientV2(
    address = 'http://localhost',
    port = 20001
): ConcordiumNodeClientV2 {
    return createConcordiumClient(address, port, 15000);
}

const client = getNodeClientV2();

test('getConsensusStatus', async () => {
    const genesisBlock = Buffer.from(
        'QiEzLTThaUFowqDAs/0PJzgJYSyxPQANXC4A6F9Q95Y=',
        'base64'
    );

    const consensusStatus = await client.getConsensusStatus();

    expect(consensusStatus.genesisBlock).toEqual(genesisBlock.toString('hex'));
    expect(consensusStatus.lastFinalizedTime?.getTime()).toBeGreaterThan(
        1669214033937000
    );
    expect(consensusStatus.lastFinalizedBlockHeight).toBeGreaterThan(
        1395315n
    );
});
