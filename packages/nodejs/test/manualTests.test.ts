import * as v2 from '../../common/lib/grpc-api/v2/concordium/types';
import * as v1 from '@concordium/common-sdk';
import {
    buildBasicAccountSigner,
    signTransaction,
} from '@concordium/common-sdk';
import { getNodeClientV2 as getNodeClient } from '../test/testHelpers';

const client = getNodeClient();

const testAccount = new v1.AccountAddress(
    '3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G'
);
const senderAccount = new v1.AccountAddress(
    '39zbDo5ycLdugboskzUqjme8uNnDFfAYdyAYB9csegQJ2BqLoe'
);

const senderAccountPrivateKey =
    'dcf347bda4fc45a4318c98e80b0939c83cb6a368e84e791f88f618cace4c3c41';

describe.skip('Manual test suite', () => {
    test('waitForTransactionFinalization', async () => {
        const nonce = (await client.getNextAccountNonce(senderAccount)).nonce;

        // Create local transaction
        const header: v1.AccountTransactionHeader = {
            expiry: new v1.TransactionExpiry(new Date(Date.now() + 3600000)),
            nonce: nonce,
            sender: senderAccount,
        };
        const simpleTransfer: v1.SimpleTransferPayload = {
            amount: new v1.CcdAmount(100n),
            toAddress: testAccount,
        };
        const accountTransaction: v1.AccountTransaction = {
            header: header,
            payload: simpleTransfer,
            type: v1.AccountTransactionType.Transfer,
        };

        // Sign transaction
        const signer = buildBasicAccountSigner(senderAccountPrivateKey);
        const signature: v1.AccountTransactionSignature = await signTransaction(
            accountTransaction,
            signer
        );

        const transactionHash = await client.sendAccountTransaction(
            accountTransaction,
            signature
        );

        const blockHash = await client.waitForTransactionFinalization(
            transactionHash,
            undefined
        );

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
        const peer = (await client.client.getPeersInfo(v2.Empty).response)
            .peers[0].socketAddress;
        if (!peer || !peer.ip || !peer.port) {
            throw new Error('missing peer');
        }
        await client.peerDisconnect(peer.ip.value, peer.port.value);
        await new Promise((r) => setTimeout(r, 10000));
        let updatedPeers = (
            await client.client.getPeersInfo(v2.Empty).response
        ).peers.map((x) => x.socketAddress);
        expect(updatedPeers).not.toContainEqual(peer);
        await client.peerConnect(peer.ip.value, peer.port.value);
        await new Promise((r) => setTimeout(r, 10000));
        updatedPeers = (
            await client.client.getPeersInfo(v2.Empty).response
        ).peers.map((x) => x.socketAddress);
        expect(updatedPeers).toContainEqual(peer);
    }, 750000);
});
