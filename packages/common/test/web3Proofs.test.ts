import {
    ConcordiumHdWallet,
    createAccountDID,
    createWeb3IdDID,
    getVerifiablePresentation,
    RequestStatement,
    Web3StatementBuilder,
} from '../src';
import {
    expectedAccountCredentialPresentation,
    expectedWeb3IdCredentialPresentation,
} from './resources/expectedPresentation';
import { expectedStatementMixed } from './resources/expectedStatements';
import { CommitmentInput, VerifiablePresentation } from '../src/web3ProofTypes';
import { TEST_SEED_1 } from './HdWallet.test';
import fs from 'fs';

test('Generate V2 statement', () => {
    const builder = new Web3StatementBuilder();
    const statement = builder
        .addForVerifiableCredentials(
            [
                { index: 2101n, subindex: 0n },
                { index: 1337n, subindex: 42n },
            ],
            (b) =>
                b.addRange(17, 80n, 1237n).addMembership(23, ['aa', 'ff', 'zz'])
        )
        .addForVerifiableCredentials([{ index: 1338n, subindex: 0n }], (b) =>
            b.addRange(0, 80n, 1237n).addNonMembership(1, ['aa', 'ff', 'zz'])
        )
        .addForIdentityCredentials([0, 1, 2], (b) => b.revealAttribute(0))
        .getStatements();
    expect(statement).toStrictEqual(expectedStatementMixed);
});

test('create Web3Id proof with account credentials', () => {
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;

    const values: Record<number, string> = {};
    values[0] = '0';
    values[17] = 'a';

    const credentialStatements: RequestStatement[] = [
        {
            id: createAccountDID(
                'Testnet',
                '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100df4cac5e161fb81aebe3a04300e63f086d0d8'
            ),
            statement: [
                {
                    attributeTag: 17,
                    lower: '81',
                    type: 'AttributeInRange',
                    upper: '1231',
                },
                {
                    attributeTag: 0,
                    type: 'RevealAttribute',
                },
            ],
        },
    ];

    const commitmentInputs: CommitmentInput[] = [
        {
            type: 'account',
            issuanceDate: '2019-10-12T07:20:50.52Z',
            issuer: 1,
            values,
            randomness: {
                0: '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
                17: '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
            },
        },
    ];

    const presentation = getVerifiablePresentation({
        request: {
            challenge:
                '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100dAAAA',
            credentialStatements,
        },
        globalContext,
        commitmentInputs,
    });

    const expected = VerifiablePresentation.fromString(
        expectedAccountCredentialPresentation
    );
    expect(presentation.presentationContext).toBe(expected.presentationContext);
    expect(presentation.type).toBe(expected.type);
    expect(presentation.proof.type).toBe(expected.proof.type);
    // TODO is this date check even valid?
    expect(new Date(presentation.proof.created)).not.toBeNaN();
    expect(presentation.verifiableCredential[0].issuanceDate).toBe(
        expected.verifiableCredential[0].issuanceDate
    );
    expect(presentation.verifiableCredential[0].type).toEqual(
        expected.verifiableCredential[0].type
    );
    expect(presentation.verifiableCredential[0].issuer).toBe(
        expected.verifiableCredential[0].issuer
    );
    expect(presentation.verifiableCredential[0].credentialSubject.id).toBe(
        expected.verifiableCredential[0].credentialSubject.id
    );
    expect(
        presentation.verifiableCredential[0].credentialSubject.proof.type
    ).toBe(expected.verifiableCredential[0].credentialSubject.proof.type);
    expect(
        presentation.verifiableCredential[0].credentialSubject.statement
    ).toEqual(expected.verifiableCredential[0].credentialSubject.statement);
});

test('create Web3Id proof with Web3Id Credentials', () => {
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;

    const values: Record<number, bigint | string> = {};
    values[0] = 18446744073709551615n;
    values[17] = 2n;

    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');

    const publicKey = wallet
        .getVerifiableCredentialPublicKey(0)
        .toString('hex');

    const credentialStatements: RequestStatement[] = [
        {
            id: createWeb3IdDID('Testnet', publicKey, 1n, 0n),
            statement: [
                {
                    attributeTag: 17,
                    lower: 80n,
                    type: 'AttributeInRange',
                    upper: 1237n,
                },
                {
                    attributeTag: 0,
                    type: 'RevealAttribute',
                },
            ],
            type: [],
        },
    ];
    const commitmentInputs: CommitmentInput[] = [
        {
            type: 'web3Issuer',
            issuanceDate: '2019-10-12T07:20:50.52Z',
            signer:
                wallet.getVerifiableCredentialSigningKey(1).toString('hex') +
                publicKey,
            values,
            randomness:
                '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
        },
    ];

    const presentation = getVerifiablePresentation({
        request: {
            challenge:
                '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100dAAAA',
            credentialStatements,
        },
        globalContext,
        commitmentInputs,
    });

    const expected = VerifiablePresentation.fromString(
        expectedWeb3IdCredentialPresentation
    );
    expect(presentation.presentationContext).toBe(expected.presentationContext);
    expect(presentation.type).toBe(expected.type);
    expect(presentation.proof.type).toBe(expected.proof.type);
    // TODO is this date check even valid?
    expect(new Date(presentation.proof.created)).not.toBeNaN();
    expect(presentation.verifiableCredential[0].issuanceDate).toBe(
        expected.verifiableCredential[0].issuanceDate
    );
    expect(presentation.verifiableCredential[0].type).toEqual(
        expected.verifiableCredential[0].type
    );
    expect(presentation.verifiableCredential[0].issuer).toBe(
        expected.verifiableCredential[0].issuer
    );
    expect(presentation.verifiableCredential[0].credentialSubject.id).toBe(
        expected.verifiableCredential[0].credentialSubject.id
    );
    expect(
        presentation.verifiableCredential[0].credentialSubject.proof.type
    ).toBe(expected.verifiableCredential[0].credentialSubject.proof.type);
    expect(
        presentation.verifiableCredential[0].credentialSubject.statement
    ).toEqual(expected.verifiableCredential[0].credentialSubject.statement);
});
