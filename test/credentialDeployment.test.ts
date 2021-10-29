import { getNodeClient } from './testHelpers';
import { decryptMobileWalletExport, EncryptedData } from '../src/wallet/crypto';
import * as fs from 'fs';
import { MobileWalletExport } from '../src/wallet/types';
import {
    VerifyKey,
    CredentialDeploymentTransaction,
    AttributeKey,
    IdentityInput,
} from '../src/types';
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
    const identity = decrypted.value.identities[0];
    const identityInput: IdentityInput = {
        identityProvider: identity.identityProvider,
        identityObject: identity.identityObject,
        idCredSecret:
            identity.privateIdObjectData.aci.credentialHolderInformation
                .idCredSecret,
        prfKey: identity.privateIdObjectData.aci.prfKey,
        randomness: identity.privateIdObjectData.randomness,
    };

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
                'c8cd7623c5a9316d8e2fccb51e1deee615bdb5d324fb4a6d33801848fb5e459e',
        },
        {
            schemeId: 'Ed25519',
            verifyKey:
                'b6baf645540d0ea6ae5ff0b87dff324340ae1120a5c430ffee60d5f370b2ab75',
        },
    ];

    const threshold = 1;

    // Intentionally use a credential index that has already been used. This means that
    // the transaction will not succeed, but it should still be received by the node.
    const credentialIndex = 0;

    // The attributes to reveal on the chain. Ensure they are in the identity(?)
    const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];

    const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
    const credentialDeploymentTransaction: CredentialDeploymentTransaction =
        createCredentialDeploymentTransaction(
            identityInput,
            cryptographicParameters.value,
            threshold,
            publicKeys,
            credentialIndex,
            revealedAttributes,
            expiry
        );
    const hashToSign: Buffer = getCredentialDeploymentSignDigest(
        credentialDeploymentTransaction
    );

    // Sign the thing now.
    const signingKey1 =
        '1053de23867e0f92a48814aabff834e2ca0b518497abaef71cad4e1be506334a';
    const signingKey2 =
        'fcd0e499f5dc7a989a37f8c89536e9af956170d7f502411855052ff75cfc3646';

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
