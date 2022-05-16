import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
} from '@concordium/common-sdk';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '@concordium/common-sdk';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '@concordium/common-sdk';
import { GtuAmount } from '@concordium/common-sdk';
import { TransactionExpiry } from '@concordium/common-sdk';
import { Buffer } from 'buffer/';
import { ModuleReference } from '@concordium/common-sdk';
import { serializeInitContractParameters } from '@concordium/common-sdk';
import { getModuleBuffer } from '../testHelpers';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
// Source of module: test/resources/smartcontracts/SimpleU8
test('Parameter of U8 with the wrong private key', async () => {
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

    const userInput = 25;
    const contractName = 'SimpleU8';

    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema31.bin'
    );
    const inputParams = serializeInitContractParameters(
        contractName,
        userInput,
        modulefileBuffer
    );
    const baseEnergy = 300000n;

    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            '6cabee5b2d9d5013216eef3e5745288dcade77a4b1cd0d7a8951262476d564a0'
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

    expect(result).toBeTruthy();
}, 300000);
