import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
    getAccountTransactionSignDigest,
    AccountAddress,
    CcdAmount,
    TransactionExpiry,
    ModuleReference,
    serializeInitContractParameters,
} from '@concordium/common-sdk';
import * as ed from '@noble/ed25519';
import { getNodeClient, getModuleBuffer } from '../testHelpers';
import { Buffer } from 'buffer/';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
// Source of module: test/resources/smartcontracts/ContractForDuration
test('Parameter of Duration with the wrong private key', async () => {
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

    const contractName = 'ContractForDuration';

    const userInput = '10d 1h 42s 1h';
    const moduleFileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema18.bin'
    );
    const inputParams = serializeInitContractParameters(
        contractName,
        userInput,
        moduleFileBuffer,
        0
    );
    const baseEnergy = 300000n;

    const initModule: InitContractPayload = {
        amount: new CcdAmount(0n),
        moduleRef: new ModuleReference(
            'b4019e327beaf53b21417369f09bfb2c3671fd3b920a28a51bc1f900d490b7a7'
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
