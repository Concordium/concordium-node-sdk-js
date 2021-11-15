import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    SMArray,
    InitContractPayload,
    ParameterType,
    SMParameter,
} from '../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionHash, getAccountTransactionSignDigest } from '../src/serialization';
import { getNodeClient } from './testHelpers';
import { AccountAddress } from '../src/types/accountAddress';
import { GtuAmount } from '../src/types/gtuAmount';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from '../src/types/moduleReference';
const client = getNodeClient();
const senderAccountAddress =
    '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5';
const wrongPrivateKey =
    '681de9a98d274b56eace2f86eb134bfc414f5c366022f281335be0b2d45a8988';
// test case for init contract
test('init contract with the wrong private key', async () => {
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

    const contractName = 'INDBankU83';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputParams: SMParameter<SMArray<number>> = {
        type: ParameterType.Array,
        value: {
            type: ParameterType.U8,
            value: [10, 10, 15],
        },
    };
    const baseEnergy = 300000n;

    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            'd883ce0619ff08711dea54f48acda749db62ace27d8dcc5eddc3796d5ebb5688'
        ),
        contractName: contractName,
        parameter: inputParams,
        maxContractExecutionEnergy: baseEnergy,
    };

    const initContractTransaction: AccountTransaction = {
        header: header,
        payload: initModule,
        type: AccountTransactionType.InitializeSmartContractInstance,
    };

    const hashToSign = getAccountTransactionSignDigest(initContractTransaction);
    const signature = Buffer.from(
        await ed.sign(hashToSign, wrongPrivateKey)
    ).toString('hex');
    const signatures: AccountTransactionSignature = {
        0: {
            0: signature,
        },
    };

    const result = await client.sendAccountTransaction(
        initContractTransaction,
        signatures
    );

    const txHash = await getAccountTransactionHash(
        initContractTransaction,
        signatures
    );
    console.log(txHash);
    expect(result).toBeTruthy();
}, 300000);
