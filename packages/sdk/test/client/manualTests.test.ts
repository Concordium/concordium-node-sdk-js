import { QueriesClient } from '../../src/grpc-api/v2/concordium/service.client.ts';
import * as v2 from '../../src/grpc-api/v2/concordium/types.js';
import * as v1 from '../../src/index.js';
import { buildBasicAccountSigner } from '../../src/index.js';
import { Transaction } from '../../src/pub/transactions.ts';
import { getNodeClientV2 as getNodeClient } from './testHelpers.js';

const client = getNodeClient();
const queries: QueriesClient = (client as any).client;

const testAccount = v1.AccountAddress.fromBase58('3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G');
const senderAccount = v1.AccountAddress.fromBase58('39zbDo5ycLdugboskzUqjme8uNnDFfAYdyAYB9csegQJ2BqLoe');

const senderAccountPrivateKey = 'dcf347bda4fc45a4318c98e80b0939c83cb6a368e84e791f88f618cace4c3c41';

describe.skip('Manual test suite', () => {
    test('waitForTransactionFinalization', async () => {
        const nonce = (await client.getNextAccountNonce(senderAccount)).nonce;

        // Create local transaction
        const header = {
            expiry: v1.TransactionExpiry.futureMinutes(60),
            nonce: nonce,
            sender: senderAccount,
        };
        const simpleTransfer: v1.SimpleTransferPayload = {
            amount: v1.CcdAmount.fromMicroCcd(100),
            toAddress: testAccount,
        };

        const accountTransaction = Transaction.transfer(simpleTransfer).addMetadata(header);

        // Sign transaction
        const signer = buildBasicAccountSigner(senderAccountPrivateKey);
        const signed = await Transaction.signAndFinalize(accountTransaction, signer);

        const transactionHash = await client.sendSignedTransaction(signed);
        const blockHash = await client.waitForTransactionFinalization(transactionHash, undefined);

        console.log('Blockhash:', blockHash);
        console.log('TransactionHash:', transactionHash);
    }, 750000);

    // Requires a node that allows performing banPeer/unbanPeer/getBannedPeers
    test('Ban/Unban peer is reflected in ban list', async () => {
        const randomIp = '229.249.155.177';
        await client.banPeer(randomIp);
        let peers = await client.getBannedPeers();
        expect(peers).toContainEqual(randomIp);
        await client.unbanPeer(randomIp);
        peers = await client.getBannedPeers();
        expect(peers).not.toContainEqual(randomIp);
    }, 750000);

    // Requires a node that allows performing peerConnect/peerDisconnect/getPeersInfo
    test('Connecting/disconnecting peer is reflected in Peers info list', async () => {
        const peer = (await queries.getPeersInfo(v2.Empty).response).peers[0].socketAddress;
        if (!peer || !peer.ip || !peer.port) {
            throw new Error('missing peer');
        }
        await client.peerDisconnect(peer.ip.value, peer.port.value);
        await new Promise((r) => setTimeout(r, 10000));
        let updatedPeers = (await queries.getPeersInfo(v2.Empty).response).peers.map((x) => x.socketAddress);
        expect(updatedPeers).not.toContainEqual(peer);
        await client.peerConnect(peer.ip.value, peer.port.value);
        await new Promise((r) => setTimeout(r, 10000));
        updatedPeers = (await queries.getPeersInfo(v2.Empty).response).peers.map((x) => x.socketAddress);
        expect(updatedPeers).toContainEqual(peer);
    }, 750000);
});
