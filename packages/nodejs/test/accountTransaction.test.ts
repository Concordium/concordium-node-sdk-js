import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    AttributeKey,
    IdentityInput,
    IndexedCredentialDeploymentInfo,
    RegisterDataPayload,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    UpdateCredentialsPayload,
    VerifyKey,
    ConfigureDelegationPayload,
    DelegationTargetType,
    getAccountTransactionSignDigest,
    getCredentialForExistingAccountSignDigest,
    AccountAddress,
    CcdAmount,
    TransactionExpiry,
    DataBlob,
    buildSignedCredentialForExistingAccount,
    createUnsignedCredentialForExistingAccount,
} from '@concordium/common-sdk';
import * as ed from '@noble/ed25519';
import { getIdentityInput, getNodeClient } from './testHelpers';

const client = getNodeClient();

test('send simple transfer signed with wrong private key is accepted', async () => {
    const senderAccountAddress =
        '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
    const simpleTransferPayload: SimpleTransferPayload = {
        amount: new CcdAmount(100n),
        toAddress: new AccountAddress(
            '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
        ),
    };

    const nextAccountNonce = await client.getNextAccountNonce(
        new AccountAddress(senderAccountAddress)
    );
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: new AccountAddress(senderAccountAddress),
    };

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransferPayload,
        type: AccountTransactionType.SimpleTransfer,
    };

    const wrongPrivateKey =
        'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';

    const hashToSign = getAccountTransactionSignDigest(
        simpleTransferAccountTransaction
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        simpleTransferAccountTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});

test('send simple transfer with memo signed with wrong private key is accepted', async () => {
    const senderAccountAddress =
        '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
    const payload: SimpleTransferWithMemoPayload = {
        amount: new CcdAmount(100n),
        toAddress: new AccountAddress(
            '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
        ),
        memo: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')),
    };

    const nextAccountNonce = await client.getNextAccountNonce(
        new AccountAddress(senderAccountAddress)
    );
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: new AccountAddress(senderAccountAddress),
    };

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: payload,
        type: AccountTransactionType.SimpleTransferWithMemo,
    };

    const wrongPrivateKey =
        'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';

    const hashToSign = getAccountTransactionSignDigest(
        simpleTransferAccountTransaction
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        simpleTransferAccountTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});

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
                'b85c8a998d9d2eca2a1f9e8fc41bff045ccb28f5ba3f6462a41f34801af8e898',
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
        '6563f93a822c7d9b8a107558438c1e981bdf9921f2f0bec3efbf96307f4180ad';
    const credentialSignature = Buffer.from(
        await ed.sign(credentialDigestToSign, credentialSigningKey)
    ).toString('hex');

    const signedCredentialToDeploy = buildSignedCredentialForExistingAccount(
        credentialToDeploy.unsignedCdi,
        [credentialSignature]
    );

    const addCredential: IndexedCredentialDeploymentInfo = {
        cdi: signedCredentialToDeploy,
        index: 1,
    };

    const updateCredentialsPayload: UpdateCredentialsPayload = {
        newCredentials: [addCredential],
        currentNumberOfCredentials: BigInt(2),
        threshold: 1,
        removeCredentialIds: [
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
        '103dad2edcb1e245204db1f7845358d7d5ae1508e601732e46ebcbde9fb7667f';

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

test('send registerData signed with wrong private key is accepted', async () => {
    const senderAccountAddress =
        '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
    const payload: RegisterDataPayload = {
        data: new DataBlob(Buffer.from('6B68656C6C6F20776F726C64', 'hex')),
    };

    const nextAccountNonce = await client.getNextAccountNonce(
        new AccountAddress(senderAccountAddress)
    );
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: new AccountAddress(senderAccountAddress),
    };

    const registerDataTransaction: AccountTransaction = {
        header: header,
        payload: payload,
        type: AccountTransactionType.RegisterData,
    };

    const wrongPrivateKey =
        'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';

    const hashToSign = getAccountTransactionSignDigest(registerDataTransaction);
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        registerDataTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});

test('send configureDelegation signed with wrong private key is accepted', async () => {
    const senderAccountAddress =
        '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';

    const nextAccountNonce = await client.getNextAccountNonce(
        new AccountAddress(senderAccountAddress)
    );
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender: new AccountAddress(senderAccountAddress),
    };
    const configureDelegationPayload: ConfigureDelegationPayload = {
        stake: new CcdAmount(1000000000n),
        delegationTarget: {
            delegateType: DelegationTargetType.Baker,
            bakerId: 0n,
        },
        restakeEarnings: true,
    };

    const configureDelegationTransaction: AccountTransaction = {
        header,
        payload: configureDelegationPayload,
        type: AccountTransactionType.ConfigureDelegation,
    };

    const wrongPrivateKey =
        'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';

    const hashToSign = getAccountTransactionSignDigest(
        configureDelegationTransaction
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        configureDelegationTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});
