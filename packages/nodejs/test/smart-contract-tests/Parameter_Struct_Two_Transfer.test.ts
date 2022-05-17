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
// Source of module: https://github.com/Concordium/concordium-rust-smart-contracts/blob/main/examples/two-step-transfer/src/lib.rs
test('Parameter of Struct (U8, string, string variables) with the wrong private key', async () => {
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

    const contractName = 'two-step-transfer';
    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema_two_step_transfer.bin'
    );
    const userInput = {
        account_holders: [
            '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M',
            '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5',
        ],
        transfer_agreement_threshold: 2,
        transfer_request_ttl: '10d 1h 42s 1h',
    };
    const inputParams = serializeInitContractParameters(
        contractName,
        userInput,
        modulefileBuffer
    );

    const baseEnergy = 300000n;

    const initModule: InitContractPayload = {
        amount: new GtuAmount(0n),
        moduleRef: new ModuleReference(
            '3e2f0403963e533f8dbaebf9681bcec12c124aead60cf3b308f6be11db02625f'
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
