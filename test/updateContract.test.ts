import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    ModuleTransactionType,
    UpdateContractPayload,
    ContractAddress,
    ParamtersValue,
} from '../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../src/serialization';
import { getNodeClient } from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import { TransactionExpiry } from '../src/types/transactionExpiry';

const client = getNodeClient();
const senderAccountAddress =
    '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5';

//test case for update contract
test('update contract', async () => {
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
    const params: ParamtersValue<any>[] = [];
    const updateModule: UpdateContractPayload = {
        tag: ModuleTransactionType.Update,
        amount: new GtuAmount(1000n),
        contractAddress: {
            index: BigInt(87),
            subindex: BigInt(0),
        } as ContractAddress,
        receiveName: receiveName,
        parameter: params,
    } as UpdateContractPayload;

    const updateContractTransaction: AccountTransaction = {
        header: header,
        payload: updateModule,
        type: AccountTransactionType.UpdateSmartContractInstance,
    };

    const signingKey =
        '631de9a98d274b56ea4e2f86eb134bfc414f4c366022f281335be0b2d45a8928';
    const hashToSign = getAccountTransactionSignDigest(
        updateContractTransaction
    );
    const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey)
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

    const txs = await client.GetAccountNonFinalizedTransactions(
        new AccountAddress(senderAccountAddress)
    );
    console.log(txs);
    expect(result).toBeTruthy();
}, 300000);
