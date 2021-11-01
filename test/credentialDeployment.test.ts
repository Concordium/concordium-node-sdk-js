import { getIdentityInput, getNodeClient } from './testHelpers';
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
    const identityInput: IdentityInput = getIdentityInput();

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
                '93d93f7a46bf62a57cccb9f4da32ef51643138a55b3c59e03375cd0ce2c4624a',
        },
    ];

    const threshold = 1;

    // Intentionally use a credential index that has already been used. This means that
    // the transaction will not succeed, but it should still be received by the node.
    const credentialIndex = 9;

    // The attributes to reveal on the chain.
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
        '294c1c815782068852b44696d822c4e9b69c1e2936bd8a4031f9af9864b335f1';

    const signature1 = Buffer.from(
        await ed.sign(hashToSign, signingKey1)
    ).toString('hex');
    const signatures: string[] = [signature1];

    // Send the transaction to the node
    const success = await client.sendCredentialDeploymentTransaction(
        credentialDeploymentTransaction,
        signatures
    );
    expect(success).toBeTruthy();
});
