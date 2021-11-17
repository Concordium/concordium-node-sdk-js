import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    UpdateContractPayload,
    ContractAddress,
    SMParameter,
    ParameterType,
} from '../../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../../src/serialization';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '../../src/types/accountAddress';
import { GtuAmount } from '../../src/types/gtuAmount';
import { TransactionExpiry } from '../../src/types/transactionExpiry';
import { Buffer } from 'buffer/';

const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
//test case for update contract
test('update contract with the wrong private key', async () => {
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

    const receiveName = 'INDBank.insertAmount';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const params: SMParameter<undefined> = {
        type: ParameterType.NoParameters,
        value: undefined,
    };
    const contractAddress: ContractAddress = {
        index: BigInt(87),
        subindex: BigInt(0),
    };
    const maxContractExecutionEnergy = 30000n;

    const updateModule: UpdateContractPayload = {
        amount: new GtuAmount(1000n),
        contractAddress: contractAddress,
        receiveName: receiveName,
        parameter: params,
        maxContractExecutionEnergy: maxContractExecutionEnergy,
    };

    const updateContractTransaction: AccountTransaction = {
        header: header,
        payload: updateModule,
        type: AccountTransactionType.UpdateSmartContractInstance,
    };

    const hashToSign = getAccountTransactionSignDigest(
        updateContractTransaction
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
        updateContractTransaction,
        signatures
    );

    expect(result).toBeTruthy();
}, 300000);
