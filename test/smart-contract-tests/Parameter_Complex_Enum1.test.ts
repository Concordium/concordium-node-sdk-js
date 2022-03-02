import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    ContractAddress,
    UpdateContractPayload,
} from '../../src/types';
import * as ed from 'noble-ed25519';
import {
    getAccountTransactionSignDigest,
    serializeUpdateContractParameters,
} from '../../src/serialization';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '../../src/types/accountAddress';
import { GtuAmount } from '../../src/types/gtuAmount';
import { TransactionExpiry } from '../../src/types/transactionExpiry';
import { Buffer } from 'buffer/';
import { getModuleBuffer } from '../../src/deserializeSchema';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    '681de9a98d274b56eace2f86eb134bfc414f5c366022f281335be0b2d45a8988';
// test case for init contract
// Source of module: test/resources/smartcontracts/ComplexEnum1
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

    enum DCBBankState {
        /// Alive and well, allows for GTU to be inserted.
        Intact = 1,
        /// The dcb bank has been emptied, preventing further GTU to be inserted.
        Smashed,
    }

    const userInput = { Intact: [DCBBankState.Intact] };

    const contractName = 'ComplexEnum1';
    const receiveFunctionName = 'insertAmount';
    const receiveName = contractName + '.' + receiveFunctionName;

    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema35.bin'
    );
    const inputParams = serializeUpdateContractParameters(
        contractName,
        receiveFunctionName,
        userInput,
        modulefileBuffer
    );
    const baseEnergy = 300000n;
    const contractAddress = {
        index: BigInt(1657),
        subindex: BigInt(0),
    } as ContractAddress;

    const initModule: UpdateContractPayload = {
        amount: new GtuAmount(0n),
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
