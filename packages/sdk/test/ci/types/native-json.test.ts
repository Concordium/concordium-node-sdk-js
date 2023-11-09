import JSONBig from 'json-bigint';
import {
    Parameter,
    ReturnValue,
    Energy,
    TransactionHash,
    BlockHash,
    CredentialRegistrationId,
    AccountAddress,
    ModuleReference,
    DataBlob,
    ContractAddress,
    SequenceNumber,
    Timestamp,
    Duration,
    CcdAmount,
    TransactionExpiry,
    ContractName,
    InitName,
    ReceiveName,
    EntrypointName,
} from '../../../src/pub/types.js';

const testStringify = (value: unknown) => {
    return JSON.stringify(value, (_, v) => {
        if (typeof v === 'bigint') {
            return Number(v);
        }

        return v;
    });
};

describe('ContractName', () => {
    test('Serializes as expected', () => {
        const t = ContractName.fromString('some-name');
        const e = '"some-name"';

        expect(JSON.stringify(t)).toEqual(e);
    });
});

describe('InitName', () => {
    test('Serializes as expected', () => {
        const t = InitName.fromString('init_some-name');
        const e = '"init_some-name"';

        expect(JSON.stringify(t)).toEqual(e);
    });
});

describe('ReceiveName', () => {
    test('Serializes as expected', () => {
        const t = ReceiveName.fromString('some_name.test');
        const e = '"some_name.test"';

        expect(JSON.stringify(t)).toEqual(e);
    });
});

describe('EntrypointName', () => {
    test('Serializes as expected', () => {
        const t = EntrypointName.fromString('some_name.test');
        const e = '"some_name.test"';

        expect(JSON.stringify(t)).toEqual(e);
    });
});

describe('TransactionExpiry', () => {
    test('Serializes as expected', () => {
        const t = TransactionExpiry.fromEpochSeconds(300);
        const e = '300';

        expect(JSONBig.stringify(t)).toEqual(e);
        expect(JSON.stringify(t)).toEqual(e);
        expect(testStringify(t)).toEqual(e);
    });
});

describe('CcdAmount', () => {
    test('Serializes as expected', () => {
        let t = CcdAmount.fromMicroCcd(300);
        let e = '"300"';

        expect(JSONBig.stringify(t)).toEqual(e);
        expect(JSON.stringify(t)).toEqual(e);
        expect(testStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = CcdAmount.fromMicroCcd(9007199254740997n);
        e = '"9007199254740997"';
        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('SequenceNumber', () => {
    test('Serializes as expected', () => {
        let t = SequenceNumber.create(300);
        let e = '300';
        expect(JSONBig.stringify(t)).toEqual(e);
        expect(() => JSON.stringify(t)).toThrowError(TypeError);
        expect(testStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = SequenceNumber.create(9007199254740997n);
        e = '9007199254740997';
        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('Energy', () => {
    test('Serializes as expected', () => {
        let t = Energy.create(300);
        let e = '300';

        expect(JSONBig.stringify(t)).toEqual(e);
        expect(() => JSON.stringify(t)).toThrowError(TypeError);
        expect(testStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Energy.create(9007199254740997n);
        e = '9007199254740997';
        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('Timestamp', () => {
    test('Serializes as expected', () => {
        let t = Timestamp.fromMillis(300);
        let e = '300';

        expect(JSONBig.stringify(t)).toEqual(e);
        expect(() => JSON.stringify(t)).toThrowError(TypeError);
        expect(testStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Timestamp.fromMillis(9007199254740997n);
        e = '9007199254740997';
        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('Duration', () => {
    test('Serializes as expected', () => {
        let t = Duration.fromMillis(300);
        let e = '300';

        expect(JSONBig.stringify(t)).toEqual(e);
        expect(() => JSON.stringify(t)).toThrowError(TypeError);
        expect(testStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = Duration.fromMillis(9007199254740997n);
        e = '9007199254740997';
        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('ContractAddress', () => {
    test('Serializes as expected', () => {
        let t = ContractAddress.create(100, 10);
        let e = '{"index":100,"subindex":10}';

        expect(JSONBig.stringify(t)).toEqual(e);
        expect(() => JSON.stringify(t)).toThrowError(TypeError);
        expect(testStringify(t)).toEqual(e);

        // Test for numbers bigger than Number.MAX_SAFE_INTEGER
        t = ContractAddress.create(9007199254740997n, 10);
        e = '{"index":9007199254740997,"subindex":10}';
        expect(JSONBig.stringify(t)).toEqual(e);

        t = ContractAddress.create(9007199254740997n, 109007199254740997n);
        e = '{"index":9007199254740997,"subindex":109007199254740997}';
        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('Parameter', () => {
    test('Serializes as expected', () => {
        const t = Parameter.fromHexString('000102');
        const e = '"000102"';

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('TransactionHash', () => {
    test('Serializes as expected', () => {
        const v =
            '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const t = TransactionHash.fromHexString(v);
        const e = `"${v}"`;

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('BlockHash', () => {
    test('Serializes as expected', () => {
        const v =
            '1a17008f7944a5fd11a665a864266fb2d76794e754986c367455a4937fd3a66b';
        const t = BlockHash.fromHexString(v);
        const e = `"${v}"`;

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('ReturnValue', () => {
    test('Serializes as expected', () => {
        const t = ReturnValue.fromHexString('000102');
        const e = '"000102"';

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('ModuleReference', () => {
    test('Serializes as expected', () => {
        const v =
            '5d99b6dfa7ba9dc0cac8626754985500d51d6d06829210748b3fd24fa30cde4a';
        const t = ModuleReference.fromHexString(v);
        const e = `"00000020${v}"`; // is prefixed with 4 byte length, for some reason

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('CredentialRegistrationId', () => {
    test('Serializes as expected', () => {
        const v =
            '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const t = CredentialRegistrationId.fromHexString(v);
        const e = `"${v}"`;

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('DataBlob', () => {
    test('Serializes as expected', () => {
        const v =
            '83e4b29e1e2582a6f1dcc93bf2610ce6b0a6ba89c8f03e661f403b4c2e055d3adb80d071c2723530926bb8aed3ed52b1';
        const t = new DataBlob(Buffer.from(v, 'hex'));
        const e = `"0030${v}"`; // Is prefixed with 2 byte length

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});

describe('AccountAddress', () => {
    test('Serializes as expected', () => {
        const v = '4owvMHZSKsPW8QGYUEWSdgqxfoPBh3ZwPameBV46pSvmeHDkEe';
        const t = AccountAddress.fromBase58(v);
        const e = `"${v}"`; // Is prefixed with 2 byte length

        expect(JSONBig.stringify(t)).toEqual(e);
    });
});
