import { Buffer } from 'buffer/';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    AttributeKey,
    IdentityInput,
    IndexedCredentialDeploymentInfo,
    Schedule,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
    TransferWithSchedulePayload,
    UpdateCredentialsPayload,
    VerifyKey,
} from '../src/types';
import * as ed from 'noble-ed25519';
import {
    getAccountTransactionSignDigest,
    getCredentialForExistingAccountSignDigest,
} from '../src/serialization';
import { getIdentityInput, getNodeClient } from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import { Memo } from '../src/types/Memo';
import {
    buildSignedCredentialForExistingAccount,
    createUnsignedCredentialForExistingAccount,
} from '../src/credentialDeploymentTransactions';
import { createEncryptedTransferPayload } from '../src';

const client = getNodeClient();

async function getAccountHeader(
    sender: AccountAddress
): Promise<AccountTransactionHeader> {
    const nextAccountNonce = await client.getNextAccountNonce(sender);
    if (!nextAccountNonce) {
        throw new Error('Nonce not found!');
    }
    return {
        expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
        nonce: nextAccountNonce.nonce,
        sender,
    };
}

test('send simple transfer signed with wrong private key is accepted', async () => {
    const senderAccountAddress =
        '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
    const simpleTransferPayload: SimpleTransferPayload = {
        amount: new GtuAmount(100n),
        toAddress: new AccountAddress(
            '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
        ),
    };

    const header = await getAccountHeader(
        new AccountAddress(senderAccountAddress)
    );

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
        amount: new GtuAmount(100n),
        toAddress: new AccountAddress(
            '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
        ),
        memo: new Memo(Buffer.from('6B68656C6C6F20776F726C64', 'hex')),
    };

    const header = await getAccountHeader(
        new AccountAddress(senderAccountAddress)
    );

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

    const header = await getAccountHeader(
        new AccountAddress(senderAccountAddress)
    );

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

test('send transfer with schedule signed with wrong private key is accepted', async () => {
    const senderAccountAddress =
        '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';

    const header = await getAccountHeader(
        new AccountAddress(senderAccountAddress)
    );

    const schedule: Schedule = [
        {
            timestamp: new Date(Date.now() + 36000000),
            amount: new GtuAmount(50n),
        },
        {
            timestamp: new Date(Date.now() + 36500000),
            amount: new GtuAmount(25n),
        },
    ];

    const scheduledTransfer: TransferWithSchedulePayload = {
        toAddress: new AccountAddress(
            '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
        ),
        schedule: schedule,
    };

    const scheduledTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: scheduledTransfer,
        type: AccountTransactionType.TransferWithSchedule,
    };

    const wrongPrivateKey =
        'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';

    const hashToSign = getAccountTransactionSignDigest(
        scheduledTransferAccountTransaction
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
        scheduledTransferAccountTransaction,
        signatures
    );
    expect(result).toBeTruthy();
});

test('send shielded transfer signed with wrong private key is accepted', async () => {
    const sender = new AccountAddress(
        '4EdBeGmpnQZWxaiig7FGEhWwmJurYmYsPWXo6owMDxA7ZtJMMH'
    );
    const receiver = new AccountAddress(
        '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
    );
    // This is the actual decryptionKey of the sender. Otherwise creating the encryptedTransferData would never terminate.
    const decryptionKey =
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c54f10b8b7388dbeefe1e98ac22e6041c2fb92e1562a59e04a03fa0ebc0a889e72';

    const payload = await createEncryptedTransferPayload(
        sender,
        receiver,
        new GtuAmount(50n),
        decryptionKey,
        client
    );

    const header = await getAccountHeader(sender);

    const transaction: AccountTransaction = {
        header,
        payload,
        type: AccountTransactionType.EncryptedTransfer,
    };

    const wrongPrivateKey =
        'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';

    const hashToSign = getAccountTransactionSignDigest(transaction);
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(transaction, signatures);
    expect(result).toBeTruthy();
});
