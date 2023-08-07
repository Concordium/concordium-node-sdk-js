import { getIdentityInput } from './testHelpers';
import {
    VerifyKey,
    CredentialDeploymentTransaction,
    AttributeKey,
    IdentityInput,
    TransactionExpiry,
    getCredentialDeploymentSignDigest,
    serializeCredentialDeploymentTransactionForSubmission,
    BlockItemKind,
    createCredentialDeploymentTransaction,
} from '@concordium/common-sdk';
import fs from 'fs';
import * as ed from '@noble/ed25519';
import { Buffer } from 'buffer/';
import { deserializeTransaction } from '@concordium/common-sdk/lib/cjs/wasm/deserialization';

test('test deserialize credentialDeployment ', async () => {
    const identityInput: IdentityInput = getIdentityInput();

    const cryptographicParameters = JSON.parse(
        fs.readFileSync('../common/test/resources/global.json').toString()
    ).value;
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

    // The attributes to reveal on the chain.
    const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];

    const expiry = new TransactionExpiry(new Date(Date.now() + 3600000));
    const credentialDeploymentTransaction: CredentialDeploymentTransaction =
        createCredentialDeploymentTransaction(
            identityInput,
            cryptographicParameters,
            threshold,
            publicKeys,
            credentialIndex,
            revealedAttributes,
            expiry
        );
    const hashToSign: Buffer = getCredentialDeploymentSignDigest(
        credentialDeploymentTransaction
    );

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

    const serialized = serializeCredentialDeploymentTransactionForSubmission(
        credentialDeploymentTransaction,
        signatures
    );

    const deployment = deserializeTransaction(serialized);

    if (deployment.kind !== BlockItemKind.CredentialDeploymentKind) {
        throw new Error('Incorrect BlockItemKind');
    }
    if (deployment.transaction.credential.type !== 'normal') {
        throw new Error('Incorrect deployment type');
    }

    // TODO: Check correctness of proofs

    const { proofs: deserializedProofs, ...deserializedValues } =
        deployment.transaction.credential.contents;
    const { proofs, ...values } = credentialDeploymentTransaction.unsignedCdi;
    expect(deserializedValues).toEqual(values);
    expect(BigInt(deployment.transaction.expiry)).toEqual(
        credentialDeploymentTransaction.expiry.expiryEpochSeconds
    );
});
