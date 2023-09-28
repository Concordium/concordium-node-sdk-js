import * as fs from 'fs';
import {
    displayTypeSchemaTemplate,
    getUpdateContractParameterSchema,
    deserializeContractState,
    deserializeReceiveReturnValue,
    deserializeReceiveError,
    deserializeInitError,
    deserializeTypeValue,
    serializeUpdateContractParameters,
    serializeTypeValue,
    serializeInitContractParameters,
} from '../src/schema.js';
import {
    CIS2_WCCD_STATE_SCHEMA,
    V0_PIGGYBANK_SCHEMA,
    CIS2_WCCD_STATE_GET_BALANCE_RETURN_VALUE_SCHEMA,
    TEST_CONTRACT_INIT_ERROR_SCHEMA,
    TEST_CONTRACT_SCHEMA,
    TEST_CONTRACT_RECEIVE_ERROR_SCHEMA,
    AUCTION_WITH_ERRORS_VIEW_RETURN_VALUE_SCHEMA,
    TEST_CONTRACT_U64,
} from './resources/schema.js';
import { ContractName, EntrypointName, Parameter } from '../src/index.js';

const U64_MAX = 18446744073709551615n;

test('U64_MAX can be deserialized', () => {
    const returnVal = deserializeReceiveReturnValue(
        Buffer.from('ffffffffffffffff', 'hex'),
        Buffer.from(TEST_CONTRACT_U64, 'base64'),
        ContractName.fromStringUnchecked('test'),
        EntrypointName.fromStringUnchecked('receive')
    );

    expect(returnVal).toEqual(U64_MAX);
});

test('schema template display', () => {
    const fullSchema = Buffer.from(
        fs.readFileSync('./test/resources/cis2-nft-schema.bin')
    );
    const schemaVersion = 1;
    const contractName = ContractName.fromStringUnchecked('CIS2-NFT');
    const functionName = EntrypointName.fromStringUnchecked('transfer');
    const template = displayTypeSchemaTemplate(
        getUpdateContractParameterSchema(
            fullSchema,
            contractName,
            functionName,
            schemaVersion
        )
    );
    expect(template).toBe(
        '[{"amount":["<UInt8>","<UInt8>"],"data":["<UInt8>"],"from":{"Enum":[{"Account":["<AccountAddress>"]},{"Contract":[{"index":"<UInt64>","subindex":"<UInt64>"}]}]},"to":{"Enum":[{"Account":["<AccountAddress>"]},{"Contract":[{"index":"<UInt64>","subindex":"<UInt64>"},{"contract":"<String>","func":"<String>"}]}]},"token_id":["<UInt8>"]}]'
    );
});

test('test that deserializeContractState works', () => {
    const state = deserializeContractState(
        ContractName.fromStringUnchecked('PiggyBank'),
        Buffer.from(V0_PIGGYBANK_SCHEMA, 'base64'),
        Buffer.from('00', 'hex')
    );

    expect(state.Intact).toBeDefined();
});

test('Receive return value can be deserialized', () => {
    const returnValue = deserializeReceiveReturnValue(
        Buffer.from('80f18c27', 'hex'),
        Buffer.from(CIS2_WCCD_STATE_SCHEMA, 'base64'),
        ContractName.fromStringUnchecked('CIS2-wCCD-State'),
        EntrypointName.fromStringUnchecked('getBalance')
    );

    expect(returnValue).toEqual('82000000');
});

/**
 *  Repeats the "Receive return value can be deserialized" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Receive return value can be deserialized using deserializeTypeValue', () => {
    const returnValue = deserializeTypeValue(
        Buffer.from('80f18c27', 'hex'),
        Buffer.from(CIS2_WCCD_STATE_GET_BALANCE_RETURN_VALUE_SCHEMA, 'base64')
    );
    expect(returnValue).toEqual('82000000');
});

const auctionRawReturnValue = Buffer.from(
    '00000b0000004120676f6f64206974656d00a4fbca84010000',
    'hex'
);

/**
 * Small helper for expected deserialized value of rawAuctionReturnValue
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expectAuctionReturnValue = (returnValue: any) => {
    expect(returnValue.item).toEqual('A good item');
    expect(returnValue.end).toEqual('2022-12-01T00:00:00+00:00');
    expect(returnValue.auction_state).toHaveProperty('NotSoldYet');
    expect(returnValue.highest_bidder).toHaveProperty('None');
};

test('Return value can be deserialized - auction', () => {
    const returnValue = deserializeReceiveReturnValue(
        auctionRawReturnValue,
        Buffer.from(
            fs.readFileSync('./test/resources/auction-with-errors-schema.bin')
        ),
        ContractName.fromStringUnchecked('auction'),
        EntrypointName.fromStringUnchecked('view')
    );

    expectAuctionReturnValue(returnValue);
});

/**
 *  Repeats the "Return value can be deserialized - auction" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Return value can be deserialized - auction  using deserializeTypeValue', () => {
    const returnValue = deserializeTypeValue(
        auctionRawReturnValue,
        Buffer.from(AUCTION_WITH_ERRORS_VIEW_RETURN_VALUE_SCHEMA, 'base64')
    );

    expectAuctionReturnValue(returnValue);
});

test('Receive error can be deserialized', () => {
    const error = deserializeReceiveError(
        Buffer.from('ffff', 'hex'),
        Buffer.from(TEST_CONTRACT_SCHEMA, 'base64'),
        ContractName.fromStringUnchecked('TestContract'),
        EntrypointName.fromStringUnchecked('receive_function')
    );

    expect(error).toEqual(-1n);
});

/**
 *  Repeats the "Receive error can be deserialized" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Receive error can be deserialized using deserializeTypeValue', () => {
    const error = deserializeTypeValue(
        Buffer.from('ffff', 'hex'),
        Buffer.from(TEST_CONTRACT_RECEIVE_ERROR_SCHEMA, 'base64')
    );
    expect(error).toEqual(-1n);
});

test('Init error can be deserialized', () => {
    const error = deserializeInitError(
        Buffer.from('0100', 'hex'),
        Buffer.from(TEST_CONTRACT_SCHEMA, 'base64'),
        ContractName.fromStringUnchecked('TestContract')
    );

    expect(error).toEqual(1n);
});

/**
 *  Repeats the "Init error can be deserialized" test, using deserializeTypeValue and a type specific schema instead.
 */
test('Init error can be deserialized using deserializeTypeValue', () => {
    const error = deserializeTypeValue(
        Buffer.from('0100', 'hex'),
        Buffer.from(TEST_CONTRACT_INIT_ERROR_SCHEMA, 'base64')
    );
    expect(error).toEqual(1n);
});

test('serialize UpdateContractParameters using CIS2 contract', () => {
    const parameter = serializeUpdateContractParameters(
        ContractName.fromStringUnchecked('CIS2-NFT'),
        EntrypointName.fromStringUnchecked('transfer'),
        [
            {
                token_id: [],
                amount: [200, 0],
                from: {
                    Account: [
                        '4RgTGQhg1Y8DAUkC2TpZsKmXdicArDqY9gcgJmBDECg4kkYNg4',
                    ],
                },
                to: {
                    Account: [
                        '3UiNwnmZ64YR423uamgZyY8RnRkD88tfn6SYtKzvWZCkyFdN94',
                    ],
                },
                data: [],
            },
        ],
        Buffer.from(fs.readFileSync('./test/resources/cis2-nft-schema.bin')),
        1
    );

    expect(Parameter.toHexString(parameter)).toBe(
        '010000c80000c320b41f1997accd5d21c6bf4992370948ed711435e0e2c9302def62afd1295f004651a37c65c8461540decd511e7440d1ff6d4191b7e2133b7239b2485be1a4860000'
    );
});

test('serialize UpdateContractParameters using CIS2 contract and incorrect name', () => {
    const parameter = function () {
        serializeUpdateContractParameters(
            ContractName.fromStringUnchecked('CIS2-NFT'),
            EntrypointName.fromStringUnchecked('non-existent'),
            [
                {
                    token_id: [],
                    amount: [200, 0],
                    from: {
                        Account: [
                            '4RgTGQhg1Y8DAUkC2TpZsKmXdicArDqY9gcgJmBDECg4kkYNg4',
                        ],
                    },
                    to: {
                        Account: [
                            '3UiNwnmZ64YR423uamgZyY8RnRkD88tfn6SYtKzvWZCkyFdN94',
                        ],
                    },
                    data: [],
                },
            ],
            Buffer.from(
                fs.readFileSync('./test/resources/cis2-nft-schema.bin')
            ),
            1
        );
    };

    expect(parameter).toThrow();
});

test('serialize type value and serializeUpdateContractParameters give same result', () => {
    const parameters = [
        {
            token_id: [],
            amount: [200, 0],
            from: {
                Account: ['4RgTGQhg1Y8DAUkC2TpZsKmXdicArDqY9gcgJmBDECg4kkYNg4'],
            },
            to: {
                Account: ['3UiNwnmZ64YR423uamgZyY8RnRkD88tfn6SYtKzvWZCkyFdN94'],
            },
            data: [],
        },
    ];
    const fullSchema = Buffer.from(
        fs.readFileSync('./test/resources/cis2-nft-schema.bin')
    );
    const schemaVersion = 1;
    const contractName = ContractName.fromStringUnchecked('CIS2-NFT');
    const functionName = EntrypointName.fromStringUnchecked('transfer');

    const serializedParameter = serializeUpdateContractParameters(
        contractName,
        functionName,
        parameters,
        fullSchema,
        schemaVersion
    );

    const serializedType = serializeTypeValue(
        parameters,
        getUpdateContractParameterSchema(
            fullSchema,
            contractName,
            functionName,
            schemaVersion
        )
    );

    expect(Parameter.toHexString(serializedParameter)).toEqual(
        Parameter.toHexString(serializedType)
    );
});

test('serializeTypeValue throws an error if unable to serialize', () => {
    expect(() => serializeTypeValue('test', Buffer.alloc(0))).toThrowError(
        Error
    );
});

test('Parameter serialization works for U64_MAX', () => {
    const updateParam = serializeUpdateContractParameters(
        ContractName.fromStringUnchecked('test'),
        EntrypointName.fromStringUnchecked('receive'),
        U64_MAX,
        Buffer.from(TEST_CONTRACT_U64, 'base64')
    );
    const initParam = serializeInitContractParameters(
        ContractName.fromStringUnchecked('test'),
        U64_MAX,
        Buffer.from(TEST_CONTRACT_U64, 'base64')
    );
    expect(Parameter.toHexString(updateParam)).toEqual('ffffffffffffffff');
    expect(Parameter.toHexString(initParam)).toEqual('ffffffffffffffff');
});

test('Parameter serialization errors on (U64_MAX + 1)', () => {
    const errMsg =
        'Unable to serialize parameters, due to: Unsigned integer required';
    const updateParam = () =>
        serializeUpdateContractParameters(
            ContractName.fromStringUnchecked('test'),
            EntrypointName.fromStringUnchecked('receive'),
            U64_MAX + 1n,
            Buffer.from(TEST_CONTRACT_U64, 'base64')
        );
    const initParam = () =>
        serializeInitContractParameters(
            ContractName.fromStringUnchecked('test'),
            U64_MAX + 1n,
            Buffer.from(TEST_CONTRACT_U64, 'base64')
        );
    expect(updateParam).toThrow(errMsg);
    expect(initParam).toThrow(errMsg);
});
