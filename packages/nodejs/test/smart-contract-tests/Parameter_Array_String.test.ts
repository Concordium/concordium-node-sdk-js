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
import { Buffer } from 'buffer/';
import { ModuleReference } from '@concordium/common/lib/src/types/moduleReference';
import { getModuleBuffer } from '@concordium/common/lib/src/deserializeSchema';
import { serializeInitContractParameters } from '@concordium/common/lib/src/serialization';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
// Source of module: test/resources/smartcontracts/INDBankStringArray
test('Parameter of Array of string with the wrong private key', async () => {
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

    const contractName = 'INDBankStringArray';

    const userInput = ['Concordium', 'Zug', 'CCD'];

    const baseEnergy = 300000n;

    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema21.bin'
    );
    const inputParams = serializeInitContractParameters(
        contractName,
        userInput,
        modulefileBuffer
    );

    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            'edff6bce3cc9117d88db66d55f43695a0ee337e6803b48fb1bfa7ef76ec98447'
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
