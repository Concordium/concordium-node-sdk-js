import { getNodeClient } from './testHelpers';
import { decryptMobileWalletExport, EncryptedData } from '../src/wallet/crypto';
import * as fs from 'fs';
import { MobileWalletExport } from '../src/wallet/types';
import {
    VerifyKey,
    CredentialDeploymentTransaction,
    AttributeKey,
    IdentityInput,
    UpdateCredentialsPayload,
    AccountTransactionHeader,
    AccountTransaction,
    AccountTransactionType,
    AccountTransactionSignature,
    IndexedCredential,
} from '../src/types';
import {
    buildSignedCredentialForExistingAccount,
    createCredentialDeploymentTransaction,
    createUnsignedCredentialForExistingAccount,
} from '../src/credentialDeploymentTransactions';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import * as ed from 'noble-ed25519';
import {
    getAccountTransactionSignDigest,
    getCredentialDeploymentSignDigest,
    getCredentialForExistingAccountSignDigest,
} from '../src/serialization';
import { Buffer } from 'buffer/';
import { AccountAddress } from '../src/types/accountAddress';

const client = getNodeClient();

function getIdentityInput(): IdentityInput {
    const rawData = fs.readFileSync(
        './test/resources/mobileWalletExportTemp.json',
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
    return identityInput;
}

test('update credential is accepted', async () => {
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
                '2e22e43bf92970eb408929014d7cd744277b9e767f60de7d7ab985ad38d98841',
        },
    ];

    const threshold = 1;
    const credentialIndex = 1;

    // The attributes to reveal on the chain.
    const revealedAttributes: AttributeKey[] = ['firstName', 'nationality'];

    const senderAccountAddress =
        '4mqk9WnmunRAtT8dadH2Xt5ZapnxSnoDD22DRe436qwL8tdbam';
    const address = new AccountAddress(senderAccountAddress);

    const credentialToDeploy = createUnsignedCredentialForExistingAccount(
        identityInput,
        cryptographicParameters.value,
        threshold,
        publicKeys,
        credentialIndex,
        revealedAttributes,
        address
    );

    const credentialDigestToSign = getCredentialForExistingAccountSignDigest(
        credentialToDeploy.unsignedCdi,
        address
    );
    const credentialSigningKey =
        '6563f93a822c7d9b8a106558438c1e981bdf9921f2f0bec3efbf96307f4180ad';
    const credentialSignature = Buffer.from(
        await ed.sign(credentialDigestToSign, credentialSigningKey)
    ).toString('hex');

    const signedCredentialToDeploy = buildSignedCredentialForExistingAccount(
        credentialToDeploy.unsignedCdi,
        [credentialSignature]
    );

    const addCredential: IndexedCredential = {
        value: signedCredentialToDeploy,
        index: 1,
    };

    const updateCredentialsPayload: UpdateCredentialsPayload = {
        addedCredentials: [addCredential],
        currentNumberOfCredentials: BigInt(2),
        threshold: 1,
        removedCredentialIds: [
            'ad88734c858172e24cf2d16954da7d17af1b24de8e6b7631aef991556d05065f11ce994108f8f90c8efff9fdd55f1baa',
        ],
    };

    const nextAccountNonce = await client.getNextAccountNonce(address);
    if (!nextAccountNonce) {
        throw new Error('Nonce not found');
    }

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: address,
    };

    const updateCredentialsAccountTransaction: AccountTransaction = {
        header: header,
        payload: updateCredentialsPayload,
        type: AccountTransactionType.UpdateCredentials,
    };

    const privateKey =
        '294c1c845783069852b44696d822c4e9b69c1e2936bd8a4031f9af9864b335f2';

    const hashToSign = getAccountTransactionSignDigest(
        updateCredentialsAccountTransaction
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, privateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        updateCredentialsAccountTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});

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
