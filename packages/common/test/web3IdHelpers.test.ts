import {
    isStringAttributeInRange,
    verifyWeb3IdCredentialSignature,
} from '../src/web3IdHelpers';
import fs from 'fs';
import { compareStringAttributes } from '@concordium/rust-bindings';

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
