import { getNodeClient } from './testHelpers';
import { decryptMobileWalletExport, EncryptedData } from '../src/crypto';
import * as fs from 'fs';
import { MobileWalletExport } from '../src/mobileTypes';
import { VerifyKey, CredentialDeploymentTransaction } from '../src/types';
import { createCredentialDeploymentTransaction } from '../src/credentialDeploymentTransactions';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import * as ed from 'noble-ed25519';
import { getCredentialDeploymentSignDigest } from '../src/serialization';
import { Buffer } from 'buffer/';

const client = getNodeClient();

test('credential deployment for new account is accepted', async () => {
    const rawData = fs.readFileSync(
        './test/resources/mobileWalletExport.json',
        'utf8'
    );
    const mobileWalletExport: EncryptedData = JSON.parse(rawData);
    const decrypted: MobileWalletExport = decryptMobileWalletExport(
        mobileWalletExport,
        '123123'
    );

    const lastFinalizedBlockHash = (await client.getConsensusStatus())
        .lastFinalizedBlock;
    const cryptographicParameters = await client.getCryptographicParameters(
        lastFinalizedBlockHash
    );
    if (!cryptographicParameters) {
        throw new Error('Missing global');
    }

    const publicKeys: VerifyKey[] = [
        {
            schemeId: 'Ed25519',
            verifyKey:
                '51a13d025def1cf89ef3a85103d4fc958fa9121fd6ad5f05aadf789eeed070aa',
        },
        {
            schemeId: 'Ed25519',
            verifyKey:
                '1ecf0c0ef778a4ee8938e66049006f0cf8ce000b571daa6883f46f80b00d166e',
        },
    ];

    const threshold = 1;

    // Intentionally use a credential index that has already been used. This means that
    // the transaction will not succeed, but it should still be received by the node.
    const credentialIndex = 0;

    const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
    const credentialDeploymentTransaction: CredentialDeploymentTransaction =
        createCredentialDeploymentTransaction(
            decrypted.value.identities[0],
            cryptographicParameters.value,
            threshold,
            publicKeys,
            credentialIndex,
            expiry
        );
    const hashToSign: Buffer = getCredentialDeploymentSignDigest(
        credentialDeploymentTransaction
    );

    // Sign the thing now.
    const signingKey1 =
        '236c4b01c2b62d830ac0e86a3ddd4f53e83d5807e5bf3b190afb3ae93f7937ec';
    const signingKey2 =
        '9c0e4d2e3a09d4fba3ff27ddb8ca89b25cc48776cbf513bf318c833abc59f0c5';

    const signature1 = Buffer.from(
        await ed.sign(hashToSign, signingKey1)
    ).toString('hex');
    const signature2 = Buffer.from(
        await ed.sign(hashToSign, signingKey2)
    ).toString('hex');
    const signatures: string[] = [signature1, signature2];

    // Send the transaction to the node
    const success = await client.sendCredentialDeploymentTransaction(
        credentialDeploymentTransaction,
        signatures
    );
    expect(success).toBeTruthy();
});
