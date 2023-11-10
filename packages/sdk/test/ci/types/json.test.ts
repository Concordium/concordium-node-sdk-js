import {
    Parameter,
    ReturnValue,
    SequenceNumber,
    Energy,
    TransactionHash,
    BlockHash,
    ContractName,
    InitName,
    ReceiveName,
    CredentialRegistrationId,
    AccountAddress,
    ContractAddress,
    EntrypointName,
    Timestamp,
    Duration,
    CcdAmount,
    TransactionExpiry,
    ModuleReference,
    DataBlob,
    jsonUnwrapStringify,
    jsonStringify,
    jsonParse,
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
            blockHash: BlockHash.fromHexString(
                'c2ef4acafd8ac8956ad941b4c4b87688baa714eb43510f078427db1b52e824e3 '
            ),
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
            accountAddress: AccountAddress.fromBase58(
                '35CJPZohio6Ztii2zy1AYzJKvuxbGG44wrBn7hLHiYLoF2nxnh'
            ),
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

describe('jsonStringify', () => {
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

describe('ContractName', () => {
    test('Unwraps as expected', () => {
        const t = ContractName.fromString('some-name');
        const e = '"some-name"';

        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('InitName', () => {
    test('Unwraps as expected', () => {
        const t = InitName.fromString('init_some-name');
        const e = '"init_some-name"';

        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('ReceiveName', () => {
    test('Unwraps as expected', () => {
        const t = ReceiveName.fromString('some_name.test');
        const e = '"some_name.test"';

        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('EntrypointName', () => {
    test('Unwraps as expected', () => {
        const t = EntrypointName.fromString('some_name.test');
        const e = '"some_name.test"';

        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('TransactionExpiry', () => {
    test('Unwraps as expected', () => {
        const t = TransactionExpiry.fromEpochSeconds(300);
        const e = '300';

        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('CcdAmount', () => {
    test('Unwraps as expected', () => {
        let t = CcdAmount.fromMicroCcd(300);
        let e = '"300"';

        expect(jsonUnwrapStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = CcdAmount.fromMicroCcd(9007199254740997n);
        e = '"9007199254740997"';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('SequenceNumber', () => {
    test('Unwraps as expected', () => {
        let t = SequenceNumber.create(300);
        let e = '300';
        expect(jsonUnwrapStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = SequenceNumber.create(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('Energy', () => {
    test('Unwraps as expected', () => {
        let t = Energy.create(300);
        let e = '300';

        expect(jsonUnwrapStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Energy.create(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('Timestamp', () => {
    test('Unwraps as expected', () => {
        let t = Timestamp.fromMillis(300);
        let e = '300';
        expect(jsonUnwrapStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Timestamp.fromMillis(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('Duration', () => {
    test('Unwraps as expected', () => {
        let t = Duration.fromMillis(300);
        let e = '300';
        expect(jsonUnwrapStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Duration.fromMillis(9007199254740997n);
        e = '9007199254740997';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('ContractAddress', () => {
    test('Unwraps as expected', () => {
        let t = ContractAddress.create(100, 10);
        let e = '{"index":100,"subindex":10}';
        expect(jsonUnwrapStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = ContractAddress.create(9007199254740997n, 10);
        e = '{"index":9007199254740997,"subindex":10}';
        expect(jsonUnwrapStringify(t)).toEqual(e);

        t = ContractAddress.create(9007199254740997n, 109007199254740997n);
        e = '{"index":9007199254740997,"subindex":109007199254740997}';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('Parameter', () => {
    test('Unwraps as expected', () => {
        const t = Parameter.fromHexString('000102');
        const e = '"000102"';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('TransactionHash', () => {
    test('Unwraps as expected', () => {
        const v =
            '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const t = TransactionHash.fromHexString(v);
        const e = `"${v}"`;
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('BlockHash', () => {
    test('Unwraps as expected', () => {
        const v =
            '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const t = BlockHash.fromHexString(v);
        const e = `"${v}"`;
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('ReturnValue', () => {
    test('Unwraps as expected', () => {
        const t = ReturnValue.fromHexString('000102');
        const e = '"000102"';
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('ModuleReference', () => {
    test('Unwraps as expected', () => {
        const v =
            '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a';
        const t = ModuleReference.fromHexString(v);
        const e = `"00000020${v}"`; // is prefixed with 4 byte length, for some reason
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('CredentialRegistrationId', () => {
    test('Unwraps as expected', () => {
        const v =
            '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const t = CredentialRegistrationId.fromHexString(v);
        const e = `"${v}"`;
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('DataBlob', () => {
    test('Unwraps as expected', () => {
        const v =
            '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const t = new DataBlob(Buffer.from(v, 'hex'));
        const e = `"0030${v}"`; // Is prefixed with 2 byte length
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});

describe('AccountAddress', () => {
    test('Unwraps as expected', () => {
        const v = '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe';
        const t = AccountAddress.fromBase58(v);
        const e = `"${v}"`; // Is prefixed with 2 byte length
        expect(jsonUnwrapStringify(t)).toEqual(e);
    });
});
