import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    SimpleTransferPayload,
    SimpleTransferWithMemoPayload,
} from '../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../src/serialization';
import getNodeClient from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import { TransactionExpiry } from '../src/types/transactionExpiry';

const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';

test('send simple transfer signed with wrong private key is accepted', async () => {
    const simpleTransferPayload: SimpleTransferPayload = {
        amount: new GtuAmount(100n),
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
    const payload: SimpleTransferWithMemoPayload = {
        amount: new GtuAmount(100n),
        toAddress: new AccountAddress(
            '4hXCdgNTxgM7LNm8nFJEfjDhEcyjjqQnPSRyBS9QgmHKQVxKRf'
        ),
        memo: 'test'
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
