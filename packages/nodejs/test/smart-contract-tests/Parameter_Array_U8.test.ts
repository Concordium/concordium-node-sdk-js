import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
} from '@concordium/common-sdk/lib/src/types';
import * as ed from 'noble-ed25519';
import {
    getAccountTransactionSignDigest,
    serializeInitContractParameters,
} from '@concordium/common-sdk/lib/src/serialization';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '@concordium/common-sdk/lib/src/types/accountAddress';
import { GtuAmount } from '@concordium/common-sdk/lib/src/types/gtuAmount';
import { TransactionExpiry } from '@concordium/common-sdk/lib/src/types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from '@concordium/common-sdk/lib/src/types/moduleReference';
import { getModuleBuffer } from '../testHelpers';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
// Source of module: test/resources/smartcontracts/INDBankU83
test('Parameter of Array of U8 with the wrong private key', async () => {
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
    const userInput = [26, 27, 51];

    const scheme = getModuleBuffer('test/resources/schemaFiles/schema6.bin');
    const inputParams = serializeInitContractParameters(
        contractName,
        userInput,
        scheme
    );
    const baseEnergy = 300000n;

    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            'd883ce0619ff08711dea54f48acda749db62ace27d8dcc5eddc3796d5ebb5688'
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
