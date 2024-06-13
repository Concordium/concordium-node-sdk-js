import {
    AccountAddress,
    BigintFormatType,
    BlockHash,
    CcdAmount,
    ContractAddress,
    ContractName,
    CredentialRegistrationId,
    DataBlob,
    Duration,
    Energy,
    EntrypointName,
    InitName,
    ModuleReference,
    Parameter,
    ReceiveName,
    ReturnValue,
    SequenceNumber,
    Timestamp,
    TransactionExpiry,
    TransactionHash,
    jsonParse,
    jsonStringify,
    jsonUnwrapStringify,
} from '../../../src/pub/types.js';

describe('JSON ID test', () => {
    test('Stringified types are parsed correctly', () => {
        const original = {
            parameter: Parameter.fromHexString('010203'),
            nested: {
                returnValue: ReturnValue.fromHexString('020103'),
            },
            sequenceNumber: SequenceNumber.create(1),
            energy: Energy.create(123),
            transactionhash: TransactionHash.fromHexString(
                '443682391401cd5938a8b87275e5f5e6d0c8178d512391bca81d9a2a45f11a63'
            ),
            blockHash: BlockHash.fromHexString('c2ef4acafd8ac8956ad941b4c4b87688baa714eb43510f078427db1b52e824e3 '),
            some: {
                deeply: {
                    nested: {
                        contractName: ContractName.fromString('test-contract'),
                    },
                },
            },
            initName: InitName.fromString('init_another-contract'),
            receiveName: ReceiveName.fromString('some-contract.receive'),
            credRegId: CredentialRegistrationId.fromHexString(
                '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1'
            ),
            accountAddress: AccountAddress.fromBase58('35CJPZohio6Ztii2zy1AYzJKvuxbGG44wrBn7hLHiYLoF2nxnh'),
            contractAddress: ContractAddress.create(1234),
            entrypointName: EntrypointName.fromString('entrypoint'),
            timestamp: Timestamp.fromDate(new Date()),
            duration: Duration.fromMillis(100000),
            ccdAmount: CcdAmount.fromMicroCcd(123),
            transactionExpiry: TransactionExpiry.futureMinutes(5),
            moduleRef: ModuleReference.fromHexString(
                '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a'
            ),
            dataBlob: new DataBlob(Buffer.from('030201', 'hex')),
        };

        const json = jsonStringify(original);
        const parsed = jsonParse(json);

        expect(parsed).toEqual(original);
    });
});

describe(jsonStringify, () => {
    test('Throws on circular reference', () => {
        const obj = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (obj as any)['circular'] = obj;

        expect(() => jsonStringify(obj)).toThrowError();
    });

    test('Allow non-circular references to same object', () => {
        const other = { test: 1 };
        expect(() => jsonStringify([other, other])).not.toThrow();
    });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const testBigintReplacer = (_k: any, v: any) => (typeof v === 'bigint' ? 'replaced' : v);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const unsafeReplacer = (_: any, v: any) => (typeof v === 'bigint' ? Number(v) : v);

describe(jsonUnwrapStringify, () => {
    const t = 100n;

    test('Serializes bigint values as expected', () => {
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual('100');
        expect(jsonUnwrapStringify(t, BigintFormatType.String)).toEqual('"100"');
        expect(jsonUnwrapStringify(t, BigintFormatType.None, testBigintReplacer)).toEqual('"replaced"');

        // Test for numbers bigger than `Number.MAX_SAFE_INTEGER`
        const unsafeNumber = SequenceNumber.create(9007199254740997n);
        const unsafeExpected = '9007199254740997';
        expect(jsonUnwrapStringify(unsafeNumber, undefined, unsafeReplacer)).not.toEqual(unsafeExpected);
        expect(jsonUnwrapStringify(unsafeNumber, BigintFormatType.Integer)).toEqual(unsafeExpected);
    });

    test('Throws `TypeError` on serialize bigint', () => {
        expect(() => jsonUnwrapStringify(t)).toThrowError(TypeError);
    });

    test('Serializes nested bigint (arrays) values as expected', () => {
        const t = [100n, 200n];
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual('[100,200]');
        expect(jsonUnwrapStringify(t, BigintFormatType.String)).toEqual('["100","200"]');
        expect(jsonUnwrapStringify(t, BigintFormatType.None, testBigintReplacer)).toEqual('["replaced","replaced"]');
    });

    test('Serializes nested bigint (objects) values as expected', () => {
        const t = { a: 100n, b: 200n };
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual('{"a":100,"b":200}');
        expect(jsonUnwrapStringify(t, BigintFormatType.String)).toEqual('{"a":"100","b":"200"}');
        expect(jsonUnwrapStringify(t, BigintFormatType.None, testBigintReplacer)).toEqual(
            '{"a":"replaced","b":"replaced"}'
        );
    });

    test('Replacer overrides bigint default', () => {
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer, testBigintReplacer)).toEqual('"replaced"');
        expect(jsonUnwrapStringify(t, BigintFormatType.String, testBigintReplacer)).toEqual('"replaced"');
    });
});

describe('ContractName', () => {
    test('Unwraps as expected', () => {
        const t = ContractName.fromString('some-name');
        const e = '"some-name"';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const name = ContractName.fromString('some-name');
        const json = name.toJSON();
        const parsed = ContractName.fromJSON(json);
        expect(parsed).toEqual(name);
    });

    test('Is stringified correctly by toString', () => {
        const name = ContractName.fromString('some-name');
        expect(`${name}`).toEqual('some-name');
    });
});

describe('InitName', () => {
    test('Unwraps as expected', () => {
        const t = InitName.fromString('init_some-name');
        const e = '"init_some-name"';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const name = InitName.fromString('init_some-name');
        const json = name.toJSON();
        const parsed = InitName.fromJSON(json);
        expect(parsed).toEqual(name);
    });

    test('Is stringified correctly by toString', () => {
        const name = InitName.fromString('init_some-name');
        expect(`${name}`).toEqual('init_some-name');
    });
});

describe('ReceiveName', () => {
    test('Unwraps as expected', () => {
        const t = ReceiveName.fromString('some_name.test');
        const e = '"some_name.test"';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const name = ReceiveName.fromString('some_name.test');
        const json = name.toJSON();
        const parsed = ReceiveName.fromJSON(json);
        expect(parsed).toEqual(name);
    });

    test('Is stringified correctly by toString', () => {
        const name = ReceiveName.fromString('some_name.test');
        expect(`${name}`).toEqual('some_name.test');
    });
});

describe('EntrypointName', () => {
    test('Unwraps as expected', () => {
        const t = EntrypointName.fromString('some_name.test');
        const e = '"some_name.test"';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const name = EntrypointName.fromString('some_name.test');
        const json = name.toJSON();
        const parsed = EntrypointName.fromJSON(json);
        expect(parsed).toEqual(name);
    });

    test('Is stringified correctly by toString', () => {
        const name = EntrypointName.fromString('some_name.test');
        expect(`${name}`).toEqual('some_name.test');
    });
});

describe('TransactionExpiry', () => {
    test('Unwraps as expected', () => {
        const t = TransactionExpiry.fromEpochSeconds(300);
        const e = '300';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Is stringified correctly by toString', () => {
        let expiry = TransactionExpiry.fromEpochSeconds(300);
        expect(`${expiry}`).toEqual('300');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        expiry = TransactionExpiry.fromEpochSeconds(9007199254740997n);
        expect(`${expiry}`).toEqual('9007199254740997');
    });
});

describe('CcdAmount', () => {
    test('Unwraps as expected', () => {
        let t = CcdAmount.fromMicroCcd(300);
        let e = '"300"';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = CcdAmount.fromMicroCcd(9007199254740997n);
        e = '"9007199254740997"';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        let amount = CcdAmount.fromMicroCcd(300);
        let json = amount.toJSON();
        let parsed = CcdAmount.fromJSON(json);
        expect(parsed).toEqual(amount);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        amount = CcdAmount.fromMicroCcd(9007199254740997n);
        json = amount.toJSON();
        parsed = CcdAmount.fromJSON(json);
        expect(parsed).toEqual(amount);
    });

    test('Is stringified correctly by toString', () => {
        let amount = CcdAmount.fromMicroCcd(300);
        expect(`${amount}`).toEqual('0.000300');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        amount = CcdAmount.fromMicroCcd(9007199254740997n);
        expect(`${amount}`).toEqual('9007199254.740997');
    });
});

describe('SequenceNumber', () => {
    test('Unwraps as expected', () => {
        const t = SequenceNumber.create(300);
        const e = '300';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        let num = SequenceNumber.create(300);
        let json = num.toJSON();
        let parsed = SequenceNumber.fromJSON(json);
        expect(parsed).toEqual(num);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        num = SequenceNumber.create(9007199254740997n);
        json = num.toJSON();
        parsed = SequenceNumber.fromJSON(json);
        expect(parsed).toEqual(num);
    });

    test('Is stringified correctly by toString', () => {
        let num = SequenceNumber.create(300);
        expect(`${num}`).toEqual('300');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        num = SequenceNumber.create(9007199254740997n);
        expect(`${num}`).toEqual('9007199254740997');
    });
});

describe('Energy', () => {
    test('Unwraps as expected', () => {
        let t = Energy.create(300);
        let e = '300';

        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Energy.create(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Is stringified correctly by toString', () => {
        let energy = Energy.create(300);
        expect(`${energy}`).toEqual('300');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        energy = Energy.create(9007199254740997n);
        expect(`${energy}`).toEqual('9007199254740997');
    });
});

describe('Timestamp', () => {
    test('Unwraps as expected', () => {
        let t = Timestamp.fromMillis(300);
        let e = '300';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Timestamp.fromMillis(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Is stringified correctly by toString', () => {
        let time = Timestamp.fromMillis(300);
        expect(`${time}`).toEqual('300');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        time = Timestamp.fromMillis(9007199254740997n);
        expect(`${time}`).toEqual('9007199254740997');
    });
});

describe('Duration', () => {
    test('Unwraps as expected', () => {
        let t = Duration.fromMillis(300);
        let e = '300';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Duration.fromMillis(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Is stringified correctly by toString', () => {
        let duration = Duration.fromMillis(300);
        expect(`${duration}`).toEqual('300');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        duration = Duration.fromMillis(9007199254740997n);
        expect(`${duration}`).toEqual('9007199254740997');
    });
});

describe('ContractAddress', () => {
    test('Unwraps as expected', () => {
        let t = ContractAddress.create(100, 10);
        let e = '{"index":100,"subindex":10}';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
        expect(jsonUnwrapStringify(t, BigintFormatType.String)).toEqual('{"index":"100","subindex":"10"}');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = ContractAddress.create(9007199254740997n, 10);
        e = '{"index":9007199254740997,"subindex":10}';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);

        t = ContractAddress.create(9007199254740997n, 109007199254740997n);
        e = '{"index":9007199254740997,"subindex":109007199254740997}';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Is stringified correctly by toString', () => {
        let addr = ContractAddress.create(100, 10);
        expect(`${addr}`).toEqual('<100, 10>');

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        addr = ContractAddress.create(9007199254740997n, 10);
        expect(`${addr}`).toEqual('<9007199254740997, 10>');

        addr = ContractAddress.create(9007199254740997n, 109007199254740997n);
        expect(`${addr}`).toEqual('<9007199254740997, 109007199254740997>');
    });
});

describe('Parameter', () => {
    test('Unwraps as expected', () => {
        const t = Parameter.fromHexString('000102');
        const e = '"000102"';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const param = Parameter.fromHexString('000102');
        const json = param.toJSON();
        const parsed = Parameter.fromJSON(json);
        expect(parsed).toEqual(param);
    });

    test('Is stringified correctly by toString', () => {
        const param = Parameter.fromHexString('000102');
        expect(`${param}`).toEqual('000102');
    });
});

describe('TransactionHash', () => {
    test('Unwraps as expected', () => {
        const v = '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const t = TransactionHash.fromHexString(v);
        const e = `"${v}"`;
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const v = '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const txHash = TransactionHash.fromHexString(v);
        const json = txHash.toJSON();
        const parsed = TransactionHash.fromJSON(json);
        expect(parsed).toEqual(txHash);
    });

    test('Is stringified correctly by toString', () => {
        const v = '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const txHash = TransactionHash.fromHexString(v);
        expect(`${txHash}`).toEqual(v);
    });
});

describe('BlockHash', () => {
    test('Unwraps as expected', () => {
        const v = '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const t = BlockHash.fromHexString(v);
        const e = `"${v}"`;
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const v = '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const blockHash = BlockHash.fromHexString(v);
        const json = blockHash.toJSON();
        const parsed = BlockHash.fromJSON(json);
        expect(parsed).toEqual(blockHash);
    });

    test('Is stringified correctly by toString', () => {
        const v = '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const blockHash = BlockHash.fromHexString(v);
        expect(`${blockHash}`).toEqual(v);
    });
});

describe('ReturnValue', () => {
    test('Unwraps as expected', () => {
        const t = ReturnValue.fromHexString('000102');
        const e = '"000102"';
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const retVal = ReturnValue.fromHexString('000102');
        const json = retVal.toJSON();
        const parsed = ReturnValue.fromJSON(json);
        expect(parsed).toEqual(retVal);
    });

    test('Is stringified correctly by toString', () => {
        const retVal = ReturnValue.fromHexString('000102');
        expect(`${retVal}`).toEqual('000102');
    });
});

describe('ModuleReference', () => {
    test('Unwraps as expected', () => {
        const v = '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a';
        const t = ModuleReference.fromHexString(v);
        const e = `"00000020${v}"`; // is prefixed with 4 byte length
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const v = '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a';
        const moduleRef = ModuleReference.fromHexString(v);
        const json = moduleRef.toJSON();
        const parsed = ModuleReference.fromJSON(json);
        expect(parsed).toEqual(moduleRef);
    });

    test('Is stringified correctly by toString', () => {
        const v = '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a';
        const moduleRef = ModuleReference.fromHexString(v);
        expect(`${moduleRef}`).toEqual(v);
    });
});

describe('CredentialRegistrationId', () => {
    test('Unwraps as expected', () => {
        const v = '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const t = CredentialRegistrationId.fromHexString(v);
        const e = `"${v}"`;
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const v = '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const cri = CredentialRegistrationId.fromHexString(v);
        const json = cri.toJSON();
        const parsed = CredentialRegistrationId.fromJSON(json);
        expect(parsed).toEqual(cri);
    });

    test('Is stringified correctly by toString', () => {
        const v = '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const cri = CredentialRegistrationId.fromHexString(v);
        expect(`${cri}`).toEqual(v);
    });
});

describe('DataBlob', () => {
    test('Unwraps as expected', () => {
        const v = '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const t = new DataBlob(Buffer.from(v, 'hex'));
        const e = `"0030${v}"`; // Is prefixed with 2 byte length
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });
});

describe('AccountAddress', () => {
    test('Unwraps as expected', () => {
        const v = '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe';
        const t = AccountAddress.fromBase58(v);
        const e = `"${v}"`; // Is prefixed with 2 byte length
        expect(jsonUnwrapStringify(t, BigintFormatType.Integer)).toEqual(e);
    });

    test('Serializes and deserializes to JSON as expected', () => {
        const v = '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe';
        const address = AccountAddress.fromBase58(v);
        const json = address.toJSON();
        const parsed = AccountAddress.fromJSON(json);
        expect(parsed).toEqual(address);
    });

    test('Is stringified correctly by toString', () => {
        const v = '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe';
        const address = AccountAddress.fromBase58(v);
        expect(`${address}`).toEqual(v);
    });
});
