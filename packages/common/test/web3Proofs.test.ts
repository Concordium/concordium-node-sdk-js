import {
    AttributeKeyString,
    ConcordiumHdWallet,
    createAccountDID,
    createWeb3IdDID,
    getVerifiablePresentation,
    RequestStatement,
    VerifiablePresentation,
    Web3StatementBuilder,
} from '../src';
import {
    expectedAccountCredentialPresentation,
    expectedWeb3IdCredentialPresentation,
} from './resources/expectedPresentation';
import { expectedStatementMixed } from './resources/expectedStatements';
import {
    CommitmentInput,
    VerifiableCredentialSubject,
} from '../src/web3ProofTypes';
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
                b
                    .addRange('b', 80n, 1237n)
                    .addMembership('c', ['aa', 'ff', 'zz'])
        )
        .addForVerifiableCredentials([{ index: 1338n, subindex: 0n }], (b) =>
            b
                .addRange('a', 80n, 1237n)
                .addNonMembership('d', ['aa', 'ff', 'zz'])
        )
        .addForIdentityCredentials([0, 1, 2], (b) =>
            b.revealAttribute(AttributeKeyString.firstName)
        )
        .getStatements();
    expect(statement).toStrictEqual(expectedStatementMixed);
});

test('create Web3Id proof with account credentials', () => {
    const globalContext = JSON.parse(
        fs.readFileSync('./test/resources/global.json').toString()
    ).value;

    const values: Record<string, string> = {};
    values.dob = '0';
    values.firstName = 'a';

    const credentialStatements: RequestStatement[] = [
        {
            id: createAccountDID(
                'Testnet',
                '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100df4cac5e161fb81aebe3a04300e63f086d0d8'
            ),
            statement: [
                {
                    attributeTag: AttributeKeyString.dob,
                    lower: '81',
                    type: 'AttributeInRange',
                    upper: '1231',
                },
                {
                    attributeTag: AttributeKeyString.firstName,
                    type: 'RevealAttribute',
                },
            ],
        },
    ];

    const commitmentInputs: CommitmentInput[] = [
        {
            type: 'account',
            issuer: 1,
            values,
            randomness: {
                dob: '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
                firstName:
                    '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
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

    const randomness: Record<string, string> = {};
    randomness.degreeType =
        '53573aac0039a54affd939be0ad0c49df6e5a854ce448a73abb2b0534a0a62ba';
    randomness.degreeName =
        '3917917065f8178e99c954017886f83984247ca16a22b065286de89b54d04610';
    randomness.graduationDate =
        '0f5a299aeba0cdc16fbaa98f21cab57cfa6dd50f0a2b039393686df7c7ae1561';

    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');

    const publicKey = wallet
        .getVerifiableCredentialPublicKey({ index: 1n, subindex: 0n }, 1)
        .toString('hex');

    const values: Record<string, bigint | string> = {
        degreeName: 'Bachelor of Science and Arts',
        degreeType: 'BachelorDegree',
        graduationDate: '2010-06-01T00:00:00Z',
    };

    const credentialStatements: RequestStatement[] = [
        {
            id: createWeb3IdDID('Testnet', publicKey, 1n, 0n),
            statement: [
                {
                    attributeTag: 'degreeType',
                    type: 'AttributeInSet',
                    set: ['BachelorDegree', 'MasterDegree'],
                },
                {
                    attributeTag: 'degreeName',
                    type: 'RevealAttribute',
                },
            ],
            type: [],
        },
    ];
    const commitmentInputs: CommitmentInput[] = [
        {
            type: 'web3Issuer',
            signer: wallet
                .getVerifiableCredentialSigningKey(
                    { index: 1n, subindex: 0n },
                    1
                )
                .toString('hex'),
            values,
            randomness,
            signature:
                '40ced1f01109c7a307fffabdbea7eb37ac015226939eddc05562b7e8a29d4a2cf32ab33b2f76dd879ce69fab7ff3752a73800c9ce41da6d38b189dccffa45906',
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

const schemaWithTimeStamp: VerifiableCredentialSubject = {
    type: 'object',
    properties: {
        id: {
            title: 'Credential subject id',
            type: 'string',
            description: 'Credential subject identifier',
        },
        attributes: {
            title: 'Attributes',
            description: 'Credential attributes',
            type: 'object',
            properties: {
                degreeType: {
                    title: 'Degree Type',
                    type: 'string',
                    description: 'Degree type',
                },
                degreeName: {
                    title: 'Degree name',
                    type: 'string',
                    description: 'Degree name',
                },
                graduationDate: {
                    title: 'Graduation date',
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            const: 'date-time',
                        },
                        timestamp: {
                            type: 'string',
                        },
                    },
                    description: 'Graduation date',
                },
            },
            required: ['degreeType', 'degreeName', 'graduationDate'],
        },
    },
    required: ['id', 'attributes'],
};

test('Generate statement with timestamp', () => {
    const builder = new Web3StatementBuilder();

    const lower = new Date();
    const upper = new Date(new Date().getTime() + 24 * 60 * 60 * 10000);

    const statement = builder
        .addForVerifiableCredentials(
            [{ index: 0n, subindex: 0n }],
            (b) => b.addRange('graduationDate', lower, upper),
            schemaWithTimeStamp
        )
        .getStatements();
    const atomic = statement[0].statement[0];
    expect(atomic.type).toBe('AttributeInRange');
    if (atomic.type === 'AttributeInRange') {
        expect(atomic.lower).toBe(lower);
        expect(atomic.upper).toBe(upper);
    }
});

test('Generate statement with timestamp fails if not timestamp attribute', () => {
    const builder = new Web3StatementBuilder();

    const lower = new Date();
    const upper = new Date(new Date().getTime() + 24 * 60 * 60 * 10000);

    expect(() =>
        builder.addForVerifiableCredentials(
            [{ index: 0n, subindex: 0n }],
            (b) =>
                b
                    // Use degreeName, which is a string property, not timestamp
                    .addRange('degreeName', lower, upper),
            schemaWithTimeStamp
        )
    ).toThrowError('string property');
});
