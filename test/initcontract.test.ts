import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
    ParamtersValue,
} from '../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../src/serialization';
import { getNodeClient } from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from '../src/types/moduleReference';
const client = getNodeClient();
const senderAccountAddress =
    '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5';

test('init contract', async () => {
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

    const initName = 'init_INDBank';
    const params: ParamtersValue<any>[] = [];
    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            'e51d9f9329f103faa18b1c99335281204df9e3eec23d7138f69ddd17fd63e9d0'
        ),
        initName: initName,
        parameter: params,
    } as InitContractPayload;
    const initModuleTransaction: AccountTransaction = {
        header: header,
        payload: initModule,
        type: AccountTransactionType.InitializeSmartContractInstance,
    };

    const signingKey =
        '631de9a98d274b56ea4e2f86eb134bfc414f4c366022f281335be0b2d45a8928';
    const hashToSign = getAccountTransactionSignDigest(initModuleTransaction);
    const signature = Buffer.from(
        await ed.sign(hashToSign, signingKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        initModuleTransaction,
        signatures
    );

    const txs = await client.GetAccountNonFinalizedTransactions(
        new AccountAddress(senderAccountAddress)
    );
    console.log(txs);
    expect(result).toBeTruthy();
}, 300000);
