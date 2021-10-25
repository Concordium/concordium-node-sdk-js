import * as fs from 'fs';
import { MobileWalletExport } from './mobileTypes';
import { createUnsignedCredentialInfo } from './credential/credential';

import { credentials, Metadata } from '@grpc/grpc-js/';
import ConcordiumNodeClient from '../src/client';
import { TransactionExpiry, VerifyKey } from '.';
import { sha256 } from './hash';
import { serializeCredentialDeploymentInformation } from './credentialDeploymentTransactions';
import * as ed from 'noble-ed25519';
import * as wasm from "../pkg/desktop_wallet";
import { decryptMobileWalletExport } from './crypto';

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

const rawData = fs.readFileSync('./test/resources/mobileWalletExport.json', 'utf8');
const mobileWalletExport = JSON.parse(rawData);
const client = getNodeClient();

async function test() {
    const decrypted: MobileWalletExport = decryptMobileWalletExport(mobileWalletExport, '123123');

    const lastFinalizedBlockHash = (await client.getConsensusStatus()).lastFinalizedBlock;
    const cryptographicParameters = await client.getCryptographicParameters(lastFinalizedBlockHash);
    if (!cryptographicParameters) {
        throw new Error('Missing global');
    }

    const publicKey: VerifyKey = {
        schemeId: "Ed25519",
        verifyKey: "6d1f651e7d5191553fc1107173a7a9b0496727b531a0804c388fc4895034f2e6"
    };

    const result = createUnsignedCredentialInfo(
        decrypted.value.identities[0],
        cryptographicParameters.value,
        1,
        [publicKey],
        1
    );

    const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
    const serializedUnsignedCredentialInfo = serializeCredentialDeploymentInformation(result.cdi, expiry);
    const hashed = sha256([serializedUnsignedCredentialInfo]).toString('hex');

    // Sign the thing now.
    const signingKey = "13cd51f0bb4e7f24d799b9a567bfe8e0c9e92724edcc70bd872358735d078c8a";
    const signature = await ed.sign(hashed, signingKey);
    console.log("Signature check: " + await ed.verify(signature, hashed, publicKey.verifyKey));

    const credentialDeploymentInfo = JSON.parse(wasm.getDeploymentDetails(signature, JSON.stringify(result.cdi), expiry.expiryEpochSeconds));
    const forChain = credentialDeploymentInfo.hex;

    console.log(credentialDeploymentInfo.hash);
    // const result = await client.sendTransaction(Buffer.from(forChain, 'hex'));
    // console.log(result);
};

test().then(() => console.log('Finished test'));
