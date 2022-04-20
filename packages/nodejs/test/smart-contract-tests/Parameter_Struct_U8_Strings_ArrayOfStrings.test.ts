import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
} from '@concordium/common/lib/src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '@concordium/common/lib/src/serialization';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '@concordium/common/lib/src/types/accountAddress';
import { GtuAmount } from '@concordium/common/lib/src/types/gtuAmount';
import { TransactionExpiry } from '@concordium/common/lib/src/types/transactionExpiry';
import { ModuleReference } from '@concordium/common/lib/src/types/moduleReference';
import { getModuleBuffer } from '@concordium/common/lib/src/deserializeSchema';
import { serializeInitContractParameters } from '@concordium/common/lib/src/serialization';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
// Source of module: test/resources/smartcontracts/SampleContract1
test('Parameter of Struct parameter (Complex) the wrong private key', async () => {
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

    const contractName = 'SampleContract1';
    const userInput = {
        age: 27,
        name: 'Concordium',
        city: 'Zug',
        country: 'Denmark',
        nicknames: ['CCD', 'Concordium', 'GTU', 'ABC'],
    };

    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema30.bin'
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
            '10c8e1091d0d82b0da90f9530bf23d44d4029fc1964644f9fffe0d4f838decd2'
        ),
        contractName: contractName,
        parameter: inputParams,
        maxContractExecutionEnergy: baseEnergy,
    } as InitContractPayload;

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
