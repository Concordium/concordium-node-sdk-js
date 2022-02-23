import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    InitContractPayload,
} from '../../src/types';
import * as ed from 'noble-ed25519';
import { getAccountTransactionSignDigest } from '../../src/serialization';
import { getNodeClient } from '../testHelpers';
import { AccountAddress } from '../../src/types/accountAddress';
import { GtuAmount } from '../../src/types/gtuAmount';
import { TransactionExpiry } from '../../src/types/transactionExpiry';
import { Buffer } from 'buffer/';
import { ModuleReference } from '../../src/types/moduleReference';
import { getModuleBuffer } from '../../src/deserializeSchema';
import { serializeInitContractParameters } from '../../src/serialization';
const client = getNodeClient();
const senderAccountAddress =
    '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M';
const wrongPrivateKey =
    'ce432f6cca0d47caec1f45739331dc354b6d749fdb8ab7c2b7f6cb24db39ca0c';
// test case for init contract
test('Parameter of data types with the wrong private key', async () => {
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

    const contractName = 'schema-test';
    const userInput = {
        s_account_address: '4tBQDCUdDQZWeDAxJP3kvnW3oLqeq9SHYYTcqwr9AtgiPHRdgF',
        s_enum: {
            B: [
                {
                    X: [],
                },
            ],
        },
        s_receive_name: {
            func: 'hello',
            contract: 'contr',
        },
        s_i8: 5,
        s_map: [
            [
                4,
                {
                    a: '100000',
                    b: 1,
                },
            ],
        ],
        s_list: [
            {
                index: 0,
            },
        ],
        s_i128: '1235123123123123',
        s_set: [
            {
                a: '42424242',
                b: 3,
            },
            {
                a: '42424242',
                b: 1,
            },
        ],
        s_u16: 123,
        s_u8: 2,
        s_i32: 1231231,
        s_i64: -12938123987,
        s_contract_address: {
            subindex: 1231231,
            index: 123151231,
        },
        s_bool: true,
        s_timestamp: '2021-12-01T00:00:00Z',
        s_u128: '123123123123',
        s_duration: '3h 4m 2h 9s',
        s_i16: 12,
        s_array: [
            [['2021-12-01T00:00:00Z', '2021-12-01T00:00:00Z'], '3m'],
            [['2021-12-01T00:00:00Z', '2021-12-01T00:00:00Z'], '3m'],
        ],
        s_u32: 123,
        s_amount: '1231512412',
        s_u64: 5123123,
        s_struct: {
            first_field: [
                {
                    func: 'hello',
                    contract: 'there',
                },
                {
                    func: 'hello',
                    contract: 'there',
                },
            ],
            second_field: [5],
            third_field: '-1231431231',
        },
        s_pair: [
            {
                index: 10,
            },
            123,
        ],
        s_contract_name: {
            contract: 'hello',
        },
        s_string: 'some string',
    };
    const modulefileBuffer = getModuleBuffer(
        'test/resources/schemaFiles/schema_test.bin'
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
            '9f6e3fed25741a25efdc619b9981afd7c0615637d261e69d0ee8ddb83f00a90f'
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
