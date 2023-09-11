import {
    AttributeType,
    StatementAttributeType,
    TimestampAttribute,
    statementAttributeTypeToAttributeType,
} from '../src';
import {
    compareStringAttributes,
    isStringAttributeInRange,
    timestampToDate,
    verifyWeb3IdCredentialSignature,
} from '../src/web3-id/web3IdHelpers';
import fs from 'fs';

const globalContext = JSON.parse(
    fs.readFileSync('./test/resources/global.json').toString()
).value;

const signature =
    'ff428a148e41039877a9decf51ec0672da127afb9baa22d6f61ce0a2a1445f1d9fdf82a5a1bcb01fd001b463e534c7d3dfcf2497f0be0511b1b76e7bdb1ad70d';
const randomness = {
    degreeName:
        '4e5072d5ab85c0c29d2d25cfd2ba1da73d4a411867d115aef76a2133d20f22b9',
    degreeType:
        '36127229cc747f055f7a8eae62b9b2ddd9a044a7ad512f3642e881907542714c',
    graduationDate:
        '2818a1414eb087e3a8512c1ec21ca16addb34b4ba0e1c43634ef183668e8b903',
};
const values = {
    degreeName: 'Bachelor of Science and Arts',
    degreeType: 'BachelorDegree',
    graduationDate: '2023-08-09T00:00:00.000Z',
};
const holder =
    '32c0b24855060114c7b781bc94fcb089edc255f16e78ece9b597bf0c6880fa98';
const issuerPublicKey =
    '2DC9C80EBF73F6EE44F6BD8C067C1FCE660C9B78779A5CD4674A56B59C3474B2';
const issuerContract = { index: 5463n, subindex: 0n };

test('verifyWeb3IdCredentialSignature', async () => {
    expect(
        verifyWeb3IdCredentialSignature({
            globalContext,
            signature,
            randomness,
            values,
            issuerContract,
            issuerPublicKey,
            holder,
        })
    ).toBeTruthy();
});

test('verifyWeb3IdCredentialSignature can reject due to incorrect signature', async () => {
    const incorrectSignature =
        'facdb03a1d054a55808875864abc85cc41d2c32290929bbb361a710b0fda5e7f333ac33abdb1b5f0ebb5662335c34410b8e96ca6730df7eb100f814f223d0b07';

    expect(
        verifyWeb3IdCredentialSignature({
            globalContext,
            signature: incorrectSignature,
            randomness,
            values,
            issuerContract,
            issuerPublicKey,
            holder,
        })
    ).toBeFalsy();
});

test('verifyWeb3IdCredentialSignature can reject due to incorrect issuer contract', async () => {
    const incorrectIssuerContract = { index: 4463n, subindex: 0n };
    expect(
        verifyWeb3IdCredentialSignature({
            globalContext,
            signature,
            randomness,
            values,
            issuerContract: incorrectIssuerContract,
            issuerPublicKey,
            holder,
        })
    ).toBeFalsy();
});

test('verifyWeb3IdCredentialSignature can reject due to incorrect holder', async () => {
    const incorrectHolder =
        '76ada0ebd1e8aa5a651a0c4ac1ad3b62d3040f693722f94d61efa4fdd6ee797d';
    expect(
        verifyWeb3IdCredentialSignature({
            globalContext,
            signature,
            randomness,
            values,
            issuerContract,
            issuerPublicKey,
            holder: incorrectHolder,
        })
    ).toBeFalsy();
});

test('verifyWeb3IdCredentialSignature with timestamps', async () => {
    const signature =
        'ec36951aa2795b20b3dee5aa3ddc6b2ce0749bb8b15b1197682614ef2a168ebea38d62711caac54b5097b79fcebf3734c47045c3bf92ad8b2e7d3b4c859a4904';
    const randomness = {
        degreeName:
            '6d89da997e8d6ebeb877413f447e2f6285dd1e885ef6570c0a2322aedb026f6c',
        degreeType:
            '216ad9124a884d89b0f557abb03d4c5c1d639dd807a58972c0d21f47cff798cc',
        graduationDate:
            '5e581a2c4ab96536b5d0918120cae2bb2f92642d4b9df4446890f5c519b2f3ca',
    };
    const values: Record<string, AttributeType> = {
        degreeName: 'Bachelor of Science and Arts',
        degreeType: 'BachelorDegree',
        graduationDate: {
            type: 'date-time',
            timestamp: '2023-08-28T00:00:00.000Z',
        },
    };

    const holder =
        '666b4811c26b36357186b6c286261930d12a8772776d70c485a9b16059881824';
    const issuerPublicKey =
        '00ee7c443e604fbe6defbbc08ee0bf25e76656037fc189c41e631ac3a0ab136d';
    const issuerContract = { index: 6105n, subindex: 0n };

    expect(
        verifyWeb3IdCredentialSignature({
            globalContext,
            signature,
            randomness,
            values,
            issuerContract,
            issuerPublicKey,
            holder,
        })
    ).toBeTruthy();
});

test('compareStringAttributes works with number strings', () => {
    expect(compareStringAttributes('1', '0')).toBe(1);
    expect(compareStringAttributes('1', '10')).toBe(-1);
    expect(compareStringAttributes('1', '1')).toBe(0);
});

test('isStringAttributeInRange works with number strings', () => {
    expect(isStringAttributeInRange('1', '0', '2')).toBeTruthy();
    expect(isStringAttributeInRange('1', '5', '7')).toBeFalsy();
});

test('isStringAttributeInRange works with YearMonth strings', () => {
    expect(isStringAttributeInRange('200204', '199910', '299910')).toBeTruthy();
    expect(isStringAttributeInRange('299910', '200204', '199910')).toBeFalsy();
});

test('isStringAttributeInRange handles value === lower correctly', () => {
    expect(isStringAttributeInRange('1', '1', '2')).toBeTruthy();
    expect(isStringAttributeInRange('199910', '199910', '299910')).toBeTruthy();
});

test('isStringAttributeInRange handles value === upper correctly', () => {
    expect(isStringAttributeInRange('2', '1', '2')).toBeFalsy();
    expect(isStringAttributeInRange('299910', '199910', '299910')).toBeFalsy();
});

test('isStringAttributeInRange handles value === lower === upper correctly', () => {
    expect(isStringAttributeInRange('2', '2', '2')).toBeFalsy();
    expect(isStringAttributeInRange('299910', '299910', '299910')).toBeFalsy();
});

test('mapping statement date attribute to timestamp attribute', () => {
    const statementAttribute: StatementAttributeType = new Date(0);
    expect(statementAttributeTypeToAttributeType(statementAttribute)).toEqual({
        type: 'date-time',
        timestamp: '1970-01-01T00:00:00.000Z',
    });
});

test('mapping timestamp attribute to date', () => {
    const timestampAttribute: TimestampAttribute = {
        type: 'date-time',
        timestamp: '1975-01-01T00:00:00.000Z',
    };

    expect(timestampToDate(timestampAttribute)).toEqual(new Date(157766400000));
});

test('mapping statement date attribute to timestamp attribute and back again', () => {
    const statementAttribute: StatementAttributeType = new Date(50000);
    const timestampAttribute =
        statementAttributeTypeToAttributeType(statementAttribute);

    expect(timestampToDate(timestampAttribute as TimestampAttribute)).toEqual(
        statementAttribute
    );
});
