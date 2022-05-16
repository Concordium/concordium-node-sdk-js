import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    ContractAddress,
    UpdateContractPayload,
} from '@concordium/common-sdk';
import * as ed from 'noble-ed25519';
import {
    getAccountTransactionSignDigest,
    serializeUpdateContractParameters,
} from '@concordium/common-sdk';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '@concordium/common-sdk';
import { GtuAmount } from '@concordium/common-sdk';
import { TransactionExpiry } from '@concordium/common-sdk';
import { Buffer } from 'buffer/';
import { getModuleBuffer } from '../testHelpers';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
// Source of module: https://github.com/Concordium/concordium-rust-smart-contracts/blob/main/examples/two-step-transfer/src/lib.rs
test('Parameter of Enum with the wrong private key', async () => {
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

    const userInput = {
        RequestTransfer: [
            0,
            '5',
            '3gLPtBSqSi7i7TEzDPpcpgD8zHiSbWEmn23QZH29A7hj4sMoL5',
        ],
    };

    const contractName = 'two-step-transfer';
    const receiveFunctionName = 'receive';
    const receiveName = contractName + '.' + receiveFunctionName;

    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema_two_step_transfer.bin'
    );
    const inputParams = serializeUpdateContractParameters(
        contractName,
        receiveFunctionName,
        userInput,
        modulefileBuffer
    );
    const baseEnergy = 300000n;
    const contractAddress = {
        index: BigInt(1671),
        subindex: BigInt(0),
    } as ContractAddress;

    const initModule: UpdateContractPayload = {
        amount: new GtuAmount(10000n),
        contractAddress: contractAddress,
        contractName: contractName,
        receiveName: receiveName,
        parameter: inputParams,
        maxContractExecutionEnergy: baseEnergy,
    } as UpdateContractPayload;

    const updateContractTransaction: AccountTransaction = {
        header: header,
        payload: initModule,
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
