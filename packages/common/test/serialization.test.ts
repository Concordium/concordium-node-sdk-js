import fs from 'fs';
import { Buffer } from 'buffer/';
import { AccountAddress } from '../src/types/accountAddress';
import { CcdAmount } from '../src/types/ccdAmount';
import {
    serializeAccountTransactionForSubmission,
    serializeAccountTransactionSignature,
    serializeUpdateContractParameters,
} from '../src/serialization';
import {
    AccountTransaction,
    AccountTransactionHeader,
    AccountTransactionSignature,
    AccountTransactionType,
    ParameterType,
    SimpleTransferPayload,
} from '../src/types';
import { TransactionExpiry } from '../src/types/transactionExpiry';
import {
    serializeByteArray,
    serializeByteList,
    serializeILeb128,
    serializeULeb128,
} from '../src/serializationHelpers';
import { SizeLength } from '../src/deserializeSchema';

test('fail account transaction serialization if no signatures', () => {
    const simpleTransferPayload: SimpleTransferPayload = {
        amount: new CcdAmount(5100000n),
        toAddress: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const header: AccountTransactionHeader = {
        expiry: new TransactionExpiry(new Date(Date.now() + 1200000)),
        nonce: 0n,
        sender: new AccountAddress(
            '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt'
        ),
    };

    const simpleTransferAccountTransaction: AccountTransaction = {
        header: header,
        payload: simpleTransferPayload,
        type: AccountTransactionType.Transfer,
    };

    expect(() =>
        serializeAccountTransactionForSubmission(
            simpleTransferAccountTransaction,
            {}
        )
    ).toThrow();
});

test('serialization of an account signature with two credentials', () => {
    const signature: AccountTransactionSignature = {
        0: {
            0: '893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f',
        },
        1: {
            0: '620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603',
        },
    };

    const serializedSignature = serializeAccountTransactionSignature(signature);
    expect(serializedSignature.toString('hex')).toBe(
        '020001000040893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f0101000040620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603'
    );
});

test('serialize UpdateContractParameters using CIS2 contract', () => {
    const parameter = serializeUpdateContractParameters(
        'CIS2-NFT',
        'transfer',
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

    expect(parameter.toString('hex')).toBe(
        '010000c80000c320b41f1997accd5d21c6bf4992370948ed711435e0e2c9302def62afd1295f004651a37c65c8461540decd511e7440d1ff6d4191b7e2133b7239b2485be1a4860000'
    );
});

test('serialize ULeb128', () => {
    let parameter = serializeULeb128(
        { typeTag: ParameterType.ULeb128, constraint: 5 },
        '1'
    );
    expect(parameter.toString('hex')).toBe('01');

    parameter = serializeULeb128(
        { typeTag: ParameterType.ULeb128, constraint: 5 },
        '10'
    );
    expect(parameter.toString('hex')).toBe('0a');

    parameter = serializeULeb128(
        { typeTag: ParameterType.ULeb128, constraint: 5 },
        '129'
    );
    expect(parameter.toString('hex')).toBe('8101');

    parameter = serializeULeb128(
        { typeTag: ParameterType.ULeb128, constraint: 10 },
        '18446744073709551615'
    );
    expect(parameter.toString('hex')).toBe('ffffffffffffffffff01');

    parameter = serializeULeb128(
        { typeTag: ParameterType.ULeb128, constraint: 37 },
        '115792089237316195423570985008687907853269984665640564039457584007913129639935'
    );
    expect(parameter.toString('hex')).toBe(
        'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0f'
    );
});

test('serialize ILeb128', () => {
    let parameter = serializeILeb128(
        { typeTag: ParameterType.ILeb128, constraint: 5 },
        '1'
    );
    expect(parameter.toString('hex')).toBe('01');

    parameter = serializeILeb128(
        { typeTag: ParameterType.ILeb128, constraint: 5 },
        '10'
    );
    expect(parameter.toString('hex')).toBe('0a');

    parameter = serializeILeb128(
        { typeTag: ParameterType.ILeb128, constraint: 5 },
        '-129'
    );
    expect(parameter.toString('hex')).toBe('ff7e');

    parameter = serializeILeb128(
        { typeTag: ParameterType.ILeb128, constraint: 10 },
        '18446744073709551615'
    );
    expect(parameter.toString('hex')).toBe('ffffffffffffffffff01');

    parameter = serializeILeb128(
        { typeTag: ParameterType.ILeb128, constraint: 10 },
        '-9223372036854775808'
    );
    expect(parameter.toString('hex')).toBe('8080808080808080807f');
});

test('serialize ByteList', () => {
    let parameter = serializeByteList(
        { typeTag: ParameterType.ByteList, sizeLength: SizeLength.U8 },
        '00000000'
    );
    expect(parameter.toString('hex')).toBe('0400000000');

    parameter = serializeByteList(
        { typeTag: ParameterType.ByteList, sizeLength: SizeLength.U8 },
        '1234567890abcdef'
    );
    expect(parameter.toString('hex')).toBe('081234567890abcdef');
});

test('serialize ByteArray', () => {
    let parameter = serializeByteArray(
        { typeTag: ParameterType.ByteArray, size: 4 },
        '00000000'
    );
    expect(parameter.toString('hex')).toBe('00000000');

    parameter = serializeByteArray(
        { typeTag: ParameterType.ByteArray, size: 8 },
        '1234567890abcdef'
    );
    expect(parameter.toString('hex')).toBe('1234567890abcdef');
});
