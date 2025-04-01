import fs from 'fs';

import {
    GenericMembershipStatement,
    GenericNonMembershipStatement,
    GenericRangeStatement,
} from '../../src/commonProofTypes.js';
import {
    AttributeKeyString,
    CIS4,
    ConcordiumHdWallet,
    ContractAddress,
    MAX_DATE_TIMESTAMP,
    MIN_DATE_TIMESTAMP,
    RequestStatement,
    StatementTypes,
    VerifiablePresentation,
    Web3StatementBuilder,
    createAccountDID,
    createWeb3IdDID,
    dateToTimestampAttribute,
    getVerifiablePresentation,
    verifyAtomicStatements,
    verifyPresentation,
} from '../../src/index.js';
import {
    CommitmentInput,
    CredentialSchemaSubject,
    CredentialWithMetadata,
    TimestampAttribute,
    Web3IdProofRequest,
} from '../../src/web3-id/types.js';
import { MAX_U64 } from '../../src/constants.js';

import { TEST_SEED_1 } from './HdWallet.test.js';
import {
    expectedAccountCredentialPresentation,
    expectedWeb3IdCredentialPresentation,
} from './resources/expectedPresentation.js';
import { expectedStatementMixed } from './resources/expectedStatements.js';

const GLOBAL_CONTEXT = JSON.parse(fs.readFileSync('./test/ci/resources/global.json').toString()).value;

test('Generate V2 statement', () => {
    const builder = new Web3StatementBuilder();
    const statement = builder
        .addForVerifiableCredentials([ContractAddress.create(2101), ContractAddress.create(1337, 42)], (b) =>
            b.addRange('b', 80n, 1237n).addMembership('c', ['aa', 'ff', 'zz'])
        )
        .addForVerifiableCredentials([ContractAddress.create(1338)], (b) =>
            b.addRange('a', 80n, 1237n).addNonMembership('d', ['aa', 'ff', 'zz'])
        )
        .addForIdentityCredentials([0, 1, 2], (b) => b.revealAttribute(AttributeKeyString.firstName))
        .getStatements();
    expect(statement).toStrictEqual(expectedStatementMixed);
});

test('create Web3Id proof with account credentials', () => {
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
                firstName: '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
            },
        },
    ];

    const presentation = getVerifiablePresentation({
        request: {
            challenge: '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100dAAAA',
            credentialStatements,
        },
        globalContext: GLOBAL_CONTEXT,
        commitmentInputs,
    });

    const expected = VerifiablePresentation.fromString(expectedAccountCredentialPresentation);
    expect(presentation.presentationContext).toBe(expected.presentationContext);
    expect(presentation.type).toBe(expected.type);
    expect(presentation.proof.type).toBe(expected.proof.type);
    // TODO is this date check even valid?
    expect(new Date(presentation.proof.created)).not.toBeNaN();
    expect(presentation.verifiableCredential[0].type).toEqual(expected.verifiableCredential[0].type);
    expect(presentation.verifiableCredential[0].issuer).toBe(expected.verifiableCredential[0].issuer);
    expect(presentation.verifiableCredential[0].credentialSubject.id).toBe(
        expected.verifiableCredential[0].credentialSubject.id
    );
    expect(presentation.verifiableCredential[0].credentialSubject.proof.type).toBe(
        expected.verifiableCredential[0].credentialSubject.proof.type
    );
    expect(presentation.verifiableCredential[0].credentialSubject.statement).toEqual(
        expected.verifiableCredential[0].credentialSubject.statement
    );
});

test('create Web3Id proof with Web3Id Credentials', () => {
    const globalContext = JSON.parse(fs.readFileSync('./test/ci/resources/global.json').toString()).value;

    const randomness: Record<string, string> = {};
    randomness.degreeType = '53573aac0039a54affd939be0ad0c49df6e5a854ce448a73abb2b0534a0a62ba';
    randomness.degreeName = '3917917065f8178e99c954017886f83984247ca16a22b065286de89b54d04610';
    randomness.graduationDate = '0f5a299aeba0cdc16fbaa98f21cab57cfa6dd50f0a2b039393686df7c7ae1561';

    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');

    const publicKey = wallet.getVerifiableCredentialPublicKey(ContractAddress.create(1), 1).toString('hex');

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
            signer: wallet.getVerifiableCredentialSigningKey(ContractAddress.create(1), 1).toString('hex'),
            values,
            randomness,
            signature:
                '40ced1f01109c7a307fffabdbea7eb37ac015226939eddc05562b7e8a29d4a2cf32ab33b2f76dd879ce69fab7ff3752a73800c9ce41da6d38b189dccffa45906',
        },
    ];

    const presentation = getVerifiablePresentation({
        request: {
            challenge: '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100dAAAA',
            credentialStatements,
        },
        globalContext,
        commitmentInputs,
    });

    const expected = VerifiablePresentation.fromString(expectedWeb3IdCredentialPresentation);
    expect(presentation.presentationContext).toBe(expected.presentationContext);
    expect(presentation.type).toBe(expected.type);
    expect(presentation.proof.type).toBe(expected.proof.type);
    // TODO is this date check even valid?
    expect(new Date(presentation.proof.created)).not.toBeNaN();
    expect(presentation.verifiableCredential[0].type).toEqual(expected.verifiableCredential[0].type);
    expect(presentation.verifiableCredential[0].issuer).toBe(expected.verifiableCredential[0].issuer);
    expect(presentation.verifiableCredential[0].credentialSubject.id).toBe(
        expected.verifiableCredential[0].credentialSubject.id
    );
    expect(presentation.verifiableCredential[0].credentialSubject.proof.type).toBe(
        expected.verifiableCredential[0].credentialSubject.proof.type
    );
    expect(presentation.verifiableCredential[0].credentialSubject.statement).toEqual(
        expected.verifiableCredential[0].credentialSubject.statement
    );
});

const schemaWithTimeStamp: CredentialSchemaSubject = {
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
                age: {
                    title: 'Age',
                    type: 'integer',
                    description: 'Age',
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
                    required: ['type', 'timestamp'],
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
            [ContractAddress.create(0)],
            (b) => b.addRange('graduationDate', lower, upper),
            schemaWithTimeStamp
        )
        .getStatements();
    const atomic = statement[0].statement[0];
    expect(atomic.type).toBe('AttributeInRange');
    if (atomic.type === 'AttributeInRange') {
        expect(atomic.lower).toEqual(dateToTimestampAttribute(lower));
        expect(atomic.upper).toEqual(dateToTimestampAttribute(upper));
    }
});

test('Generate statement with timestamp fails if not timestamp attribute', () => {
    const builder = new Web3StatementBuilder();

    const lower = new Date();
    const upper = new Date(new Date().getTime() + 24 * 60 * 60 * 10000);

    expect(() =>
        builder.addForVerifiableCredentials(
            [ContractAddress.create(0)],
            (b) =>
                b
                    // Use degreeName, which is a string property, not timestamp
                    .addRange('degreeName', lower, upper),
            schemaWithTimeStamp
        )
    ).toThrowError('string property');
});

test('A bigint range statement with an out of bounds lower limit fails', () => {
    const statement: GenericRangeStatement<string, bigint> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'age',
        lower: -1n,
        upper: 10n,
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Age is a integer property and therefore the lower end of a range statement must be a bigint in the range of 0 to 18446744073709551615'
    );
});

test('A bigint range statement with an out of bounds upper limit fails', () => {
    const statement: GenericRangeStatement<string, bigint> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'age',
        lower: 0n,
        upper: 18446744073709551616n,
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Age is a integer property and therefore the upper end of a range statement must be a bigint in the range of 0 to 18446744073709551615'
    );
});

test('A bigint range statement with valid bounds succeed verification', () => {
    const statement: GenericRangeStatement<string, bigint> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'age',
        lower: 0n,
        upper: 18446744073709551615n,
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A string range statement with an out of bounds lower limit fails', () => {
    const statement: GenericRangeStatement<string, string> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'degreeType',
        lower: 'Concordium testing strings web33',
        upper: 'Concordium testing strings web3',
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Degree Type is a string property and therefore the lower end of a range statement must be a string in the range of 0 to 31 bytes as UTF-8'
    );
});

test('A string range statement with an out of bounds upper limit fails', () => {
    const statement: GenericRangeStatement<string, string> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'degreeType',
        lower: 'Concordium testing strings web3',
        upper: 'Concordium testing strings web33',
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Degree Type is a string property and therefore the upper end of a range statement must be a string in the range of 0 to 31 bytes as UTF-8'
    );
});

test('A string range statement with valid bounds succeed verification', () => {
    const statement: GenericRangeStatement<string, string> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'degreeType',
        lower: 'Concordium testing strings web3',
        upper: 'Concordium testing strings web3',
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A timestamp range statement with an out of bounds lower limit fails', () => {
    const statement: GenericRangeStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'graduationDate',
        lower: dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP - 1)),
        upper: dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP)),
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Graduation date is a timestamp property and therefore the lower end of a range statement must be a Date in the range of -262144-01-01T00:00:00Zto +262143-12-31T23:59:59.999999999Z'
    );
});

test('A timestamp range statement with an out of bounds upper limit fails', () => {
    const statement: GenericRangeStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'graduationDate',
        lower: dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP)),
        upper: dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP + 1)),
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Graduation date is a timestamp property and therefore the upper end of a range statement must be a Date in the range of -262144-01-01T00:00:00Zto +262143-12-31T23:59:59.999999999Z'
    );
});

test('A timestamp range statement with valid bounds succeed verification', () => {
    const statement: GenericRangeStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeInRange,
        attributeTag: 'graduationDate',
        lower: dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP)),
        upper: dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP)),
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A bigint set statement with an out of bounds item fails', () => {
    const statement: GenericMembershipStatement<string, bigint> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'age',
        set: [MAX_U64 + 1n],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Age is a integer property and therefore the members of a set statement must be bigint in the range of 0 to 18446744073709551615'
    );
});

test('A bigint set statement with a negative number item fails', () => {
    const statement: GenericMembershipStatement<string, bigint> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'age',
        set: [-1n],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Age is a integer property and therefore the members of a set statement must be bigint in the range of 0 to 18446744073709551615'
    );
});

test('A bigint set statement with valid items succeeds', () => {
    const statement: GenericMembershipStatement<string, bigint> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'age',
        set: [0n, MAX_U64],
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A bigint not in set statement with an out of bounds item fails', () => {
    const statement: GenericNonMembershipStatement<string, bigint> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'age',
        set: [MAX_U64 + 1n],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Age is a integer property and therefore the members of a set statement must be bigint in the range of 0 to 18446744073709551615'
    );
});

test('A bigint not in set statement with a negative number item fails', () => {
    const statement: GenericNonMembershipStatement<string, bigint> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'age',
        set: [-1n],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Age is a integer property and therefore the members of a set statement must be bigint in the range of 0 to 18446744073709551615'
    );
});

test('A bigint not in set statement with valid items succeeds', () => {
    const statement: GenericNonMembershipStatement<string, bigint> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'age',
        set: [0n, MAX_U64],
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A string set statement with an out of bounds item fails', () => {
    const statement: GenericMembershipStatement<string, string> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'degreeType',
        set: ['Concordium testing strings web33'],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Degree Type is a string property and therefore the members of a set statement must be string in the range of 0 to 31 bytes as UTF-8'
    );
});

test('A string set statement with valid items succeeds', () => {
    const statement: GenericMembershipStatement<string, string> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'degreeType',
        set: ['', 'Concordium testing strings web3'],
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A string not in set statement with an out of bounds item fails', () => {
    const statement: GenericNonMembershipStatement<string, string> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'degreeType',
        set: ['Concordium testing strings web33'],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Degree Type is a string property and therefore the members of a set statement must be string in the range of 0 to 31 bytes as UTF-8'
    );
});

test('A string not in set statement with valid items succeeds', () => {
    const statement: GenericNonMembershipStatement<string, string> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'degreeType',
        set: ['', 'Concordium testing strings web3'],
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A timestamp set statement with an out of bounds item fails', () => {
    const statement: GenericMembershipStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'graduationDate',
        set: [dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP + 1))],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Graduation date is a date-time property and therefore the members of a set statement must be Date in the range of -262144-01-01T00:00:00Zto +262143-12-31T23:59:59.999999999Z'
    );
});

test('A timestamp set statement with a lower out of bounds item fails', () => {
    const statement: GenericMembershipStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'graduationDate',
        set: [dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP - 1))],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Graduation date is a date-time property and therefore the members of a set statement must be Date in the range of -262144-01-01T00:00:00Zto +262143-12-31T23:59:59.999999999Z'
    );
});

test('A timestamp set statement with valid items succeeds', () => {
    const statement: GenericMembershipStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeInSet,
        attributeTag: 'graduationDate',
        set: [
            dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP)),
            dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP)),
        ],
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

test('A timestamp not in set statement with an out of bounds item fails', () => {
    const statement: GenericNonMembershipStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'graduationDate',
        set: [dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP + 1))],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Graduation date is a date-time property and therefore the members of a set statement must be Date in the range of -262144-01-01T00:00:00Zto +262143-12-31T23:59:59.999999999Z'
    );
});

test('A timestamp not in set statement with a lower out of bounds item fails', () => {
    const statement: GenericNonMembershipStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'graduationDate',
        set: [dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP - 1))],
    };

    expect(() => verifyAtomicStatements([statement], schemaWithTimeStamp)).toThrowError(
        'Graduation date is a date-time property and therefore the members of a set statement must be Date in the range of -262144-01-01T00:00:00Zto +262143-12-31T23:59:59.999999999Z'
    );
});

test('A timestamp not in set statement with valid items succeeds', () => {
    const statement: GenericNonMembershipStatement<string, TimestampAttribute> = {
        type: StatementTypes.AttributeNotInSet,
        attributeTag: 'graduationDate',
        set: [
            dateToTimestampAttribute(new Date(MIN_DATE_TIMESTAMP)),
            dateToTimestampAttribute(new Date(MAX_DATE_TIMESTAMP)),
        ],
    };

    expect(verifyAtomicStatements([statement], schemaWithTimeStamp)).toBeTruthy();
});

const TESTNET_PRESENTATION = VerifiablePresentation.fromString(`{
    "presentationContext": "d7bce30c25cad255a30b8bc72a7d4ee654d2d1e0fa4342fde1e453c034e9afa7",
    "proof": {
        "created": "2024-05-10T06:57:45.005Z",
        "proofValue": [
            "08a6bc326070d685fcd11f9ccf81a50c75f76a787bdf3dc1e9246c46783e249f2e539338ac5d1c511fb98e6e14b5174f19e3dbf9a477398868d7d74482ad9f05"
        ],
        "type": "ConcordiumWeakLinkingProofV1"
    },
    "type": "VerifiablePresentation",
    "verifiableCredential": [
        {
            "credentialSubject": {
                "id": "did:ccd:testnet:pkc:70159fe625e369b05c09294692088174dbc5df15b78ebd6722e5cac6f6b93052",
                "proof": {
                    "commitments": {
                        "commitments": {
                            "userId": "8b98cc0f223b69c63d10ca4edd2021c83a092893407652ad095aa65e4ffcbd9738448f64c3b0a62f7e7adfa57ba7e641",
                            "username": "8ae284303ca77dda87cc17bed0b6b4aaba28fe6f1783909a22d887624f3502a42affd545a7cf15f5c3c06f6734b158d5"
                        },
                        "signature": "a32b1e81611650cebfcb1da1cb08ddadf817f33bef7379ec8cf694cf36fc585315d96f7c8d0efe62cd7f69ec6f824fa421a81747f3bdf9a61af9d15bcfdbba0f"
                    },
                    "created": "2024-05-10T06:57:45.001Z",
                    "proofValue": [
                        {
                            "attribute": "6521470895",
                            "proof": "d72775bcd3a7aad3e8cd021c913acd21bb171d8e20e6252f99bbca7c39724ab02ea90dd4b8d4795c64ea7490a37426cca7088698f22964b84f35cb80fabc6a2b",
                            "type": "RevealAttribute"
                        },
                        {
                            "attribute": "sorenbz",
                            "proof": "2e7e599dfa5eba3ed58dd8bb98f1bcd3f390059a6426a757cb079c0594dca86428191e4f60ed20bb4c498750af17ca621e1401c0ecd195f5ee4ecc52cc9f6dc5",
                            "type": "RevealAttribute"
                        }
                    ],
                    "type": "ConcordiumZKProofV3"
                },
                "statement": [
                    {
                        "attributeTag": "userId",
                        "type": "RevealAttribute"
                    },
                    {
                        "attributeTag": "username",
                        "type": "RevealAttribute"
                    }
                ]
            },
            "issuer": "did:ccd:testnet:sci:6260:0/issuer",
            "type": [
                "ConcordiumVerifiableCredential",
                "SoMeCredential",
                "VerifiableCredential"
            ]
        },
        {
            "credentialSubject": {
                "id": "did:ccd:testnet:cred:9549a7e0894fe888a68019e31db5a99a21c9b14cca0513934e9951057c96434a86dd54f90ff2bf18b99dad5ec64d7563",
                "proof": {
                    "created": "2024-05-10T06:57:45.005Z",
                    "proofValue": [
                        {
                            "attribute": "John",
                            "proof": "3008e5d80469197adb9537cd6f0390351b9151fb3be57cfeceafdb9969d88da647141e3e24d1d9c821559d63aec12195512b4b2704460e152a3887828b77744c",
                            "type": "RevealAttribute"
                        },
                        {
                            "attribute": "Doe",
                            "proof": "91cebc7d0466b5c569b1c014f86f82cd3a637aa8debeaaf95a8a098cc3d585c43881998a252288761127325278ac275a77b844a3775edc159cf2d90cf0c96a71",
                            "type": "RevealAttribute"
                        }
                    ],
                    "type": "ConcordiumZKProofV3"
                },
                "statement": [
                    {
                        "attributeTag": "firstName",
                        "type": "RevealAttribute"
                    },
                    {
                        "attributeTag": "lastName",
                        "type": "RevealAttribute"
                    }
                ]
            },
            "issuer": "did:ccd:testnet:idp:0",
            "type": [
                "VerifiableCredential",
                "ConcordiumVerifiableCredential"
            ]
        }
    ]
}`);

const TESTNET_PRESENTATION_DATA: CredentialWithMetadata[] = [
    {
        status: CIS4.CredentialStatus.Active,
        inputs: {
            type: 'web3',
            issuerPk: '400d2cd6bc50a29168c02d4e7897a3659d8874f3f2cb349dbbeff37cc58469c1',
        },
    },
    {
        status: CIS4.CredentialStatus.Expired,
        inputs: {
            type: 'account',
            commitments: {
                firstName:
                    '89be3003492dadd443a25fa497d0501390639e275c9ede84b7d6124c839540a00a5a5bb7c9ca73a69021e3fe97eefd63',
                lastName:
                    '99b1173bdfb4b2c807cbfc5007f91d535cba365d299fc177d355df1f5800ff40a74ca1a2567dcd00b061309599f91dd9',
                sex: 'a145554049184f6112d3e4a3fa44ed6bda56445a574aa780a06d09882d8519fe8ceb39b33ac8f6303b610a80c8d1c50a',
                dob: 'a7d8bb1eb0afb6cf2f391d29b563ed4e7ad9f029b55a159abe37414ad667ed471be3991eb0bfc405d391828301671853',
                countryOfResidence:
                    '82321ee934060686b4cdfd3718deb45840417dce240da171a39141f709f5c4a6645a3fbf266eef25e7a8237931a24727',
                nationality:
                    'a2b1c1f0422a5904c66f31bdb6bcdb736f4ed0267d165b3df76533ffd4b5d7edaff63b6c4fdc81db0c090322f5107a8e',
                idDocType:
                    'b244ed7528c11bc110a9641e505e28002b437ca9df4fa6a2072d7eedca40a9a0a835791a486e8ffc3d6bab60bc0a4066',
                idDocNo:
                    'b796dce42bce7a0591971fa5e1def8bfe6516b7a9806f5b0287df73ba59d31faaf32e38ddb31fd71b763236cdc47210b',
                idDocIssuer:
                    '8c3d2810ad35a5405e191b2bd5719cb03f1b459a9f8c52d6b4fde84cd7c90b52753e025d245718170438be5ac533e201',
                idDocIssuedAt:
                    '84bdce8c8bc7c867e114468d9fca2a9eee3dfabd4a266a2944d23b2c19f051e894e4e53661d74a7e0ead052be3e838ad',
                idDocExpiresAt:
                    '97e13c07f3e3959d2eae8c74ce95c3f677545b1eb25fe71924c9381426abfac37ce3dd82096b78aa9791695c87992594',
                nationalIdNo:
                    '945a97cac996d42cb1a3548971b2a4c88bcd7683668a51854dbc9e3e4f655cba06b51c29fe6e5077f60eccbe32eea0d0',
                taxIdNo:
                    '81d427defe8fc313590fa3126c211f9c1614f574150be3e279c45a4a5a98ac4c9097158534021ccb28718d0696bf6f48',
            },
        },
    },
];

const TESTNET_GLOBAL_CONTEXT = {
    onChainCommitmentKey:
        'b14cbfe44a02c6b1f78711176d5f437295367aa4f2a8c2551ee10d25a03adc69d61a332a058971919dad7312e1fc94c5a8d45e64b6f917c540eee16c970c3d4b7f3caf48a7746284878e2ace21c82ea44bf84609834625be1f309988ac523fac',
    bulletproofGenerators:
        '0000010098855a650637f2086157d32536f646b758a3c45a2f299a4dad7ea3dbd1c4cfb4ba42aca5461f8e45aab9112984572cdf8ba9381c58d98d196b1c03e149ec0c8de86098f25d23d32288c695dc7ae015f6506b1c74c218f080aaadaf25bb8f31539510c87e8fed74e784b63b88afba4953cacc94bceb060f2ad22e555cffe6f0131c027429826dd3a4358fd75a06e8f7c5878791f70384a7f3a90f4b7afa45fae6e0fa7153b840f6fc37aed121d6c51225c56d1ce6bbc88096aa3f86e6b3517daa90baffc69b9eb27aaebf87f04ed091412547ec94aa7bf0c8dd826e3cdd621e11dfef6fc667c53a5abc82c163efa51435b3be74f47073511db07c1af7229c78ec38554a3f7e9fa38499201d4fe6c80e867df75f2c540e57d2e15f9f5e18f73c0a804567494aba85653f57f5f990111d680400bdbee2d0678271ce93a119c107458b8d4e557fc870de9cf0ccce6d34a216a6ffbec9581349366706377b436261200834fb2654ad5cd34f5bfe3f3658ae94838ed38033886844008143d823f7e49db43017655c53b983a883948d7401f26ed14daef0dc46da30f57e187ca8e027063174a412cbfc8a7b606b41fcf7f75b698ce9115afe5124e8d72f4b34ce839742a46885ed60af26f24f8d10d46621d78b5772b0314311ed3bb627e93bac47e7eda5ff4d2ef5f98ef7265677a382a1f7b8f9a43d1e563b66b6de94c52c3c87169bd19b6e884c6a28dd6f51ba64bc36ac07926a8d91a64e88a4e19b4c0fe0db8b76c9c99bfcddc05fd5630c54bff85c041fea34a630ffe1e6313bf039477994696db0596f9e2522e04ffdb530147780099d918ee47031db2870c00b25ba6d201b00ef2459e73f6a8219d7a7ff96833bd1c8a3c24285d93b85a321d1b6e175f2d9ef111a7304438b5f5874f064539d27bf8bc46d8e2473d458f957fa206bc417ab5b8ca4dd5f0595e21063c1bbae14f07bec6f12d95a05166b90896f33aa941e0a057989dcc1ed77430a3e6f93ab16f62598b9816dc203db6ecc7fd7989d2763d4ef72abae3c4aa1e1b9c9965f8772a1be640a18486dc0804a2efdd7175316af3220a6c10db0ac0e2913de42c44f2f54a20687d2b22c9636e0ba8d09747f2229ee6ba0fa49c4a328f2ffcc5ff462ddca0de8b1d13cf85ad590183767a9ae4179b3c617ed776cf14abad1964d362747492547359c4b65e78f6dfb452d5a559ac0c24b8affdf13256e43d3213bdda0c056172771cda382f3f31fecb82ee8dc81a48fe74467665c4e34e07b1954cae4ee97270b94a336779d27646348ffa0eb52663aa60bd8b7fb9311d38a7fc1f0f2842081cb81b594dfcdefb44db1caeeac7527c5a48e8a8ecb83de0514ef184f2a82c4110f9f64ea655fb42218f95e27c81a0adb3fa7b441b71cb15113aef7c318d73f911688d34111928fdff181dbc014be35cc7e3e5bd75bf767686933931bab272eac577558b1314206d97611152ae82c1bd56ab92a4378dbe73e76a9fbd90154bd1a8c73c681f70298d15f1574d7038521b4e9b9cfc0d900c2d74cad594b68923607a1b913cb9484e093ab8ef2020ddbbd77d041581487f41e2dea13832e566325f4fb0f9934df94ee068c676e475251659770b93e0e32c7739d3c430db581308817ba091c56a5087c6248ee79baddc3c233e77b3fdbbd73f1a4298a8277055ee32a96b7e83f76e0070ea65c4a1784e9e281fa70fd9771c762a91c7ea014f60c87d09687768c9d0c8277d84e8af2eee505fda2967631a999619dc332d98bd45d40458923de655769aac754bf9081dbe9318b4880bd325e6be713f3aafb65d8e44b9143acdc7f2ba7f15290c84225c77111e0629d0f82f2f367d2641d0c3658fd54e538286787d379252876f71ec4a96ca72fdf8b156059ec50131317b9243eb71c5e84ab6791303ee0ebacd790bb27767701083afa616413b1d5bf0347cc4199943c938d74eda87660dd40405aedafbaf54b1e177117f632deeb6a9bd5227d9b8ba5693625ac68ed7d1604ccffe73e97a45411b99c666dd5eaa90cd021d05f12f84acf60bafe0c98e8ae213fa65c189256c79afb4b3eba970a8ad4e94374dd6f9d258b8c86335f36481affdcc9eb074f1ace01fae937a7d1a92279bdfb1081e029103e48877e4442199593c1b946aaed494885b0bd9d67fb7abc6f41c0f7574c3cc007d29a4ddc0a966270f5432a47e3e5563061b158eedef8bae522cb1f800c6d5f0a85a4e24a68a9bddb99e408d204e56cd994796bd004cdc5871798df2bf068ac48271290a2b3b1f0eba346f8746c79ce2389ed3ced67bb962fcb50876b7a32afca94216adadc0aed990dfd2b558aa5d8f35aa773e710f14f1641ff7eaa9ecab43ca3dbf32e846a90c8a3771d378aeb9277ef864377f7ca79ec7bc9e4b373ac890cbcbcf7c33df157e0cab0fcc7fc4daa2599177bd9d6bfc4be694a8e834be081bc7fccee530fbf6bac5be0cd1656b4c79ba6e121c39640cda83f81d17324da795da00f9a05317224ba827cecea6cbba1459df4a5bf6b84cd009d5864d44e747e3f30866a7c261004f861359e717c414a699461086e9136e29f9973e5b3f008a77fedb184e6835bc50934178b4bbd8bc9ecbb10865789d063ee7781fb2dc7b9b641b73fb172c3aba915c420c1c72cdc999d1fd224bf4d3d8a5ce26fa36100533682964abc2e99368402b0c518df1b6af245837eadb31a5616884c5474d25f57a228ed2bbef64d5a80e37cb20385a0283072a3b7a11b68bef323ea4804608c0eed5ea213caf6feb183558d56666f472a9abd10ddbf49650c5318109f9c5ed8fac7847644e153638e29e5f45dd00da06c9b9aab4af18eda0d0bfdc48ae42efe79d4e7196ef07c4319efdf042724d9aeb2c13b089b1fde77467c32cdf778749370e2c3b84a466bdfd1aa00ca8ac85c0eb29f1ccba6953a8bf877802ca3e3c31ceba8f9ff0a8684b3b118ab11a27182b033847baa372fb6b4c88e9177b8b131cd69f6ff5ec347db17215fb9890fab1c4d265d405ca74e249fafda004f86f2a5c3fbec7cae6afe6c507e089bb2d47a9e421512c016b99cb1cb15a3b8e75f2d8ff4866731585c686871691b5ca89a1351f6a79b159530fb5825f87131b0bcee2573d3932d223a358fcf08c8d4bae92f26d7fe35255c7486484bcb26693174ec2688abf39db5f091c8c09ad804f4ae42ca8b645200f27629ece81c6b5d94ef7646cbbc4b62a716ac6d2ad21f5a7e2297ebed15f2e085859a1002a9e7658b0d0249446ce9e769caba71536b9329a5fea3a15d52344d42d868b0d92a423fa44f8a6c4aebf50fb496c62d03598de39f1fbdb29e098c6a2e2ca59cbb5e37eb021594463a72471683117b957890f8307828168b1a8f2066a5e5f2c6822589272f259b012822b8be2b15c004a2a69b66c2f5ee5d81aa9a7bbdd44d059587bea89d021c734f62828382c9f13210185482694f8b30b46111d426927ec5f10b155f825d852fd995b9c7ff27861f7fee8dd2b654473198504cdcb53154b29f323ac1adde8510beabb8cef6d1a927f2dc844f746edeef9b256ace54dd8e3219b265ae958ced6593ea154b8188bf58b72ff05c036630b6d55141c4ac227a4d966fde1d0ff1ed9748c66127feec86e7839d77c1c56b46e29d2033a7871b4b0e3c53b3cc4ac49dc8eacd0555b338265be1234b81259b3746eae71600c16b7f4bc692f0a1d3dc2ed855c9fb11b2ff5fd9e6361a82d42bd4ba00635d974fa1214aa8da9180cb158347608e0c44bb5b77397d8b233df7be91e7047d28d18ee66472b98c78091eb95760c5b381d6050779ce65fd1508af8df81a3385f185f7941f0b7aa9bcd6023c6e4db7ac3045aee58f3b2d307a5be14e2b59d05333949d9e8dafbe15b671034b7c629c1de1bf560415cf72761d4d7abcbe3b762d9a66b1b630b75c2af751f6a5d37b43e84139aeb418e0b10dec012a32095cf7305bda79bb3853c3cb1fb3c8447ee4306923b6b693020880bb11df8c78f3411f176b2393776d0b9b3ea7eb0cecfaadbcd8112c4c4ad9960001f4d4df210860470a4c89a0fb9a07229ec3476e1221f490ff80314da398ffbefac3a376c53c0db82d6785bc3d3b0cf3ce4bb54cb9b6fdc29b01bca2894debb7de518a61cc953d4f92a9c52d427e2858db633d042ca14028ef771d9c8c62014676a30ed9d5f9f51036a823a388ed0f72321a13dad31bb28fe383e456361159490942382ed3e49f1c420968877a42b7bbd8c3c9e78723017400dd178f0f89065072d7ef5f5e9baffafb2ce55fe7b35a7865957260b1789e3fddc5bebdfc3301e79b5077a92f6048121c557099c329bb270cb90ad47818398bbdddefdfa6b9d9256b8194f51b45c69176d5d7deb6440c9a81bc5ad0c8b2f31720f071a8ddb7907fb161ed658f890540ac56c506b7b98df3a45f6fc062698bc86d3cc1150db00d702b2d1e3c8eae552eab55a7afd5a5a3be2610867cfff07545c8227dd26c502039240cf00ce2e91b7bd7ed6495980639eaf919635c82c5073acdc21aa275ba87cb7280d0c6321c6a4021b1f0ae7bce23c32238b3f486ce27434721df436446f9ddfb9c66bb1f4b2337803850b2606d8954268eaa0ae060f8a6da2a0e7cc315c1f8cdad4e11bdf5165a2d72ad34f976bfc41000afff158f31e9632b898f2e9886b8b92c81bf916861c62f07ea326e94ddc4ff9af51fc0420b0d3c57fe0d14109ec90a72de74147d8ae1eeebe6b565c4ed81ac01d49b0e6a9551e9fdb7a9e040b4bcbad61fe627983462106e1c0b59ce762ce89b4b1100444048e2fe84850db19d63522d83993067cf025ddaf796e2f11d76da5a2b6ef4a409720ac4e97f7c75973584d935ab0e723f415a5622b03ece90173ea58da495f402f5ecc33526d251da5d2eb5558cbabc1634e8aced49d7c3bfb514c20f7284e8a902855b2296ae90ffb84bd0ea96aac846b6c9dd8ce92c0f9d457ab44a381046e7cd50b4958bf4b854bff340be4d41452ae1e3e19c82b99908c0a45968e580823450ffcc67561dfcdf446a57ed8d032ca94ec3e8dc0a181b9faf478275fc353ba104d5c31cb7338cc4c2cd445ffed7025f576ae84e9b08311b77490b6111dacd7e3afa920193cded42246276cb999d5d85f594352592002efa2d34c387fa1901cc0f63c0f6ed141c7d2a48d5bed031a204cca98c4e26ab7210d4ca5ba3e20df6d1b0e1daa69216b3e1ed98f20ad9f527efe75a0e7e2067c85383b7a614945669b442e1f0d7ee07160902ba9ac292fa0e9c62bc1b0e848856aa680898c4769d965441a16cec21ffc2eff717267cf0f9d4e7139b764c72826309e8e0ce8965c6c96953c3ebedb4ab4c9b35c32b7b59f8715f7c790afe8a3c7a09965192baa75262a16650cfa1706f4cdb4d34043ad1d6a53898164d049647dba7be95b7c620c750e3146155f57ccaeb283936ba6b9fe6a6c6fc5fec11b59b2d12da76075e022a2308fea5865ab5cbc12a4898de2204bb218cb6757d1d3d380b488a22e4dca9c9b1d1e2d01e7a9e707a6c09c323973dd639c7d48f25e4b5b5e95b4394a1221484d337a032b34cf77998acf78efe6d7c8c1ca4f83970bd62c0a790f38e405827a71baf31a9c89892f6745e2d29bc13b5b2873c0581df064a96bf64eecdec5504a75c7e03369662e0ad9f6c2d38c4da79b82f62aeebb69392a78a2cf6fe5a1ea8627b77d5ec828f4d445fbf3a51987023218ce4f944f03041d01976a2780fe632238a828414364b8b98aa8d709bab9c2202b144f9edaab822c33d5d8ec5f62517567711cf25c890036700b7f39b130335b4b8d14d4e9ebdb6c4fc015027907b931fe5cd99ad87976e8181fa284a53185f1e982ae24842abf28f23de420376b205222e5067a2ec53814d659485327eec748b821d70f114fae08ba181f320717dc462c88a15370cf8acba5516c093e13102d92c681bda73f3ab192976179dea08875abdc054e389b309d62a9737e05edd489469f63497da850450e1f299aea08649a9ed1982a4f8a3b251fb8cfb4737ce650d125199d07f7acbbd50dd65ab973be9684ee248269ff200e2f36118cb0eb9104b94149f9c91ebb76f9d46ef5c11b4b78bf6331116110dbe6bebb7169d3c637839bcf89b114ed9d765cd6211405e2dbbe78a4ad608a960a051097a65dc0620a3d1143439c4e04cc6eb1453e43904dc9f9db084d52b2d251dcb1d476141b74c627fbff849eda5a0abc85416b97d9888dd3cd88d33104e8f0fe03ade560dbe4baee030af797fe68e45196a2137d79de2ced8e6c2771d6b16a74b2c1044e9d381a0107adb870af01329c413c0a29b88d92b3a3c4a117424e613704917bb2aeb343dc22d96b0831db78b63063f10527cafc6731b32d50e4b6e39f45595cabd413f62117244ffc1d69122b5b1c9bd864303c46cdaa1e76a97448ba5ed266859a744411e29d1ce4b78a037d99d337a7b2f74907b591da8103613a19bfa6cc1f87b9698912b85ddb0ad0d86569f813ed4dfd3a9edfc0803427c648ef49724149e49aaaa98279b2ea7d25e3463be263b6cf518e9bfc456e993c2a3806335f13deaecd3c052e8604a08c045175d044f7544291dd4acce9db398fef80ffd0fc75b28886903d2d39c133a1869b8429c9ec58069384d8639e6d268849bc02f863f431f574ca988b84ae59427e446891cdcbed74a72e2b60601ba707b2c839d85b33320a32c1b1f7514510f70d08c474a7b6155a0ed004a23fee27c6aad072c0c751474948a1397ced8f04c5b50b4be2001f4f52ada7731781b69ed93b7602441344dedcc359c385a897532f3475764e0ed3c80959cd95d47f958d237f39694cdad607b966b0d2b690844646b614fa9fd4f169fb4de7c2ff3b4805402e4408c5ba5be95cff6bb68c79104a58c11aac0f999ec307a230eba3869f9078c453af1539a9cf5f07dd18a10c2f2104a2007d52d55b8ba7e24d97002c461c2f21796055179f403a012554b2eb503bd7f62aa3542df13ce9b520c81f364b7bea0deda55e430ff52e0f7408e43e4f7289d93b2431ef21d80e04ca57538dc17b6a7b2f1729cd52ccf7f8b4d58fb2fbaef5c9b3cb38b34b179742e686b9fcb884286cbb9b35d70083d8dc6e6e9f374d473a79ffddf8547bcfc05d5da6250ff982c8692b51e6b219406d9eb1b39dd2adc8de3dd86510da7c383041ed1e87e5104d33478bb8bd7891e16c72eb23029dfb8b90c98c15377d0928a36a65b01b4e83e5c93e5a804a37513447ca0e64a945c0807ffb5f2ff06f270e9080eb0fe471b4241a9f66235b8066d425ef09e6d46e19717747d80f5a16964690b949b335b4c20d3d15a7eabd7e815856f3463565654eaa243f7a4c619289212014d1e1effd99390d1feb0d9a9a0b101a298aefbfa703582c5c2f6470c673a180cd6bd9adab2e6d044ba3f130e47b7340ba9a358b0600d1a8862a9c330e6ef1782ef1c912a4a60db9522cd3f1b941832abdce920a6bebc950d29e057d6a71e75f9056d601079109bbbb3b7bbc46b413934b902ea7bd0ed115553de7c51ce60ca100272221a880d3d2bb0b49f5b36a246df30b7fcfa3e924b5e0db2c55038289b1e266f91d504c14cc3722881721f46d864c9f5ca7c736ade9d7196c9fc59a4740d59d0bc1cc3845ab33c8ee7e539f2bcd8d7295e88803b1a66552fbe133a585962edc24ef8b8b3ee88d005c5817c9e65249c554a678b71fa1e6dabdea92b1ffcd004e16f289ff1758a491a2ebed7c070423b4dbbd61141d3357ee08bb9be71663d0d2ea59f4322ee39348fe8af117fb424ac49e362ccdeec78e99f7f2eef955f7454ce38c8dd963bc6a43bcf476514a5951637c64a71dcb65351b05c557d7485494cbbd0c206acc04002ca1545d1ad3f70cff600aeffa021fcc63d46b5128d466c87475a6b420af9e4648b3218449886a5f3448d2993609e7055566430b2e3f3d09a22633e19a1dd0418be9f99cee8be8336f575d3a55dc090deabc6786fd0d210b7e9577d69ef79beafbb541f96c6a01c9344653d7f84cef645989c9928b1738b4fb901dc9b9c29f4e0940fadc8403262e953ed8f6d772f1040b6ed52df64f7bddcab26bd6f5575e325fc81ede2c931f46c8cac6beb889961d6b2395d711261f9ddfd6be95e17f1aafa506e7d14bddb132b0821e7b06cc8597c8133878ca983bedabf66d0d2abadf4dfa38015d3e0afe9323c792dfccda5544c17624162ef0554b5cc6d77362208018717a53f44c2bffec644467d6b2bdddfd1ac55973d05edebd6e24c41223b8beceef1ea63410eed001c947429b115b864d785de238fa0e68411e9c5de226bfee699ab981ea86a67935faeb6f571f04d6dd1b73920a4afacea51c89a5561532cdb94a08da8e0bce1da552da943efdaf4a9549984337f0f5c4b42fd81a4f545e00d86f41ac6d54eb554efeba20896f3e1234f41c285636524b666b69a21bf19318a618c95a05bd4754318f696e0671662e9b37cd2393fb709e687a8ff171155d71e6ba436857d522aad38d34382c5b9f2c8e5b94464156cfbbefb3e390a935dfce72b9dbd2197e241b68cd9ef87de8165eb0515ecf534d5bdcd2b6a1540c092e26d99985085a95e31cff50452e89a3de519a0bc9494c66e77434242ef17bb0f4719b65b10cdead9b2e9072c59d334cb43827482fb92876e6fdb66dded5245e0f4a8aa6ac7bea417f3feddba61ee20b092fda1502551fe6cd0f14023fefe4d08767a0eaae297faf7352badf5ff9e58cf4d1fecb857ac3b9e83c90d19345474f82c074da1600172969606801ec567df6dbaa2df8a4380d3d500570b8461b2cc8511e5d3a45495b3bbe014440846892b11c3248decfa722419cd30aa94d9209872872820ad1b02b8abbce3b26e31aae5bcc816795d0bb3810c1e4f6ad22ff0a00ad709f93c3f63a9dafc2eb7cc6c8d986808e165b25dbed2af7ff5620ab09b3aae0928ea163fab6315b7885448f5579c40c35ed50340bef058ab56186940cb5fadc5b1d093c1a82ddd172a4d5cf3efd5c5297db8dba62e1a302127b7faac192a1de5f8225c49607768a7561dc138b0c4d9888fe68a5e38c125dcf23c7d9066c34c7536226cf68e8106c9eecf4925e48c6fb8286c5e4d48c136550d179a30daf27017aaa890abdcab582f67f4b7117257ffefc0bb8a8b6bab8c68894955bc13c185b64b5e790483145915881643222c50fc024002a7c619ac5561bb72704c2d46745ca5ee77311a3c22750ee8cadcc77dd037db697b939ce0e8be03f83c82948d491b38289483c8da893ebd9384f83f1ce0148a43065ea4e041c22aaac15a1a82dc6688c3f73f86f97c97ca7e259cf588f8ddf2de829970a0cc527df4d9514032a4161e3175c34dc46065c3a1f4c70a07734fa9bf76a3744d2764df6fb49dd8a97d85c62890d6cc094862a34ca78558c47c263fdeb1dd5dfa9b6c0ae2b3cc43b5fb742049ab38e87f9d50ef256fe3187506f8b462ac07b85f2395089291336d8233db5631cb1afc311f6b1bda3a2b8cbeecdf46085c5f9c0727f40c64681ff0adadfbc742a8a70d717a00080277f8fb67074c98ab4cdd2dba5b9a6d3defa9b6024bb7c452f19b74dc8363cc33b62ff9d5653f7f069723f1d6d7f7fdc38980bcd01d1867c2060dbc75a615933c2830e5a39885185d74f980c733afd19a830b12dadd006530b1514b5ef61de8b5b27ca58b9471029edf360e8bc4cc962d6ab28a1dc2083c5b98510f4c22f4577b9c416b4072f36b298ee1ce8dd8111c254340123e19509c179e4b71cb268381af7290196666e055a7de2715e6cc173bfa5af642a3fa942c85b07fac2f9970bacfa03e09d36da2f80b4f1a379e8e5b43d9e2890d551e6f37df150fe561212a3b0b714d13b46765dcbbac3f6ea01c976cd366da0de6bf601eb17230e6f3032f9a476ceb75d7d25ceab9f65bf93102daed84af1c7e336daf571bae47f98f74214d93403f55adb50693c9cdc1a2144f1544bcd1e441a34a8d2a2f48387130e569a9f3053d510e2bf379df90ed2064ebd503b44a2a729a19ae1af257508dee6133bc8cb0af76690be0b41248f3f447adb4679cbc91e93532513a9cac6dd4a587ffef01c202f6e46c3129567c833b5db32fb36054cef0ed13530c48cd3bb887137f41902fde6e4e472bd6e38f6a0992d363a0470a1f8f98ee17d528a0b4b187d6b0a931f2a0b123d50827d6b50797da8029a868f97e144f7586afb6b394dec7ca89d85be8a0ecec25863eb9215704eaafab2e277c3256dffadc6a99fb3bc94b4483a3fce40f29ecbe39c223a9d99adab90973c65ec64b9b9ba9f1d68ca967d87df7793323d898fd09065da2c6051308cd4e535634e235e6284fdb3697bd285eae40d57b976d7ac690e6a96b193a9c3ab3dfd771efce5cfaf12d48abd69023d7773ae998e7433600924435bc89163b7a18f7bada60f52ced09e50dd8401198fd48ad6741f545fa1b53ddd0b55e71baa55112e01f42731148ad13f696b63e307f3f9878c74bf513fb03b3bbcedd2234f8d299286add8e0f7aa4c7511b9cd080e293b0067b4bed86869a814fe4b2a5b5f2a9eb543795c7139211a61de2d5dad8c61969a0a460552589867d544b3561b8234e7d16ef4fe6590d141e3b29a77e967caaa25bfd1eed4537e5d57372e621f4f99825f99ff7016193038ad5f975fa64497d20f2d05ba4fd2d015ce6ae8d65d536584157d0a4269f5421c308818415235d15c2063bdd645329e270c4c6e180575ba5b20e98812520a41d415df1b7acbaa29d6600b797160d9e4b7f96cffbadc623456aaf9aeaad3fbdfebaed9b7725f4c5027d7acbdf36c3aa77ba6d2f834b5b45b2e7f1538cfc109a4817c913846a4d5a479d5f29e9b377144bb76265d1747644dda7465b498b3ebc4d361ac8817071b60ee23d0803d19a9da55619b430997ebc41c59d8feda62b9e1f287634b1b8b22f415c89444c01af938c50e0fc828996a044d5dc514479fde095d6e91c2e75e74af4dadd159e4e84d9dfb8e6e4e3fffd7f9a1dfebeb14816857dd1b6e197fe33d03f1835f91d2764d3cf8eea43ed03e9d4486cf3dc90f34a4f4e7f1e6b62dec4936284054322904ec54c8e3d618b4c8fea8c5985624b3625b01a904512da4cf3a5bb5d23d99fc6f72f636e08c23d435de96b0d52f16b68932e2a03b0ae8de987e2b9a324c3c1028236ffbbc85399dd8e441ce740ab549ed1547591469251aebad65b00fd4d60abf9e3072213e3ab5ecfa9ea0c1dd98141b6f58d244a6979af521e1d1c04b2de3db33a15b7e4845046a4f749b9a08fac86c32b958079a48a13743777aa000581a58151b3bd18f5b397a786d3323bce206a91013fa451a2e8c0c56cd428497e959b728e88a9707a80230850f82388c5f653adcedfee27ef1d045703dfa12952f9ab8859c610f3a9eddcfa6f3c470b7ec1cad5c06f69a65fa5e8641eff14a5378fdb63099cffdecb4816f5fe8fe64f715b432301523d2280be3e3bb2ff3374c5fe07f1342a37fef2b46a2726d308f9e678246448528a219ddde24baf73cbf4459791f564d9fc06b22635a0580b3ff21c9d5f6ec4433fac3eaddb055714aaceb48ac87af41f00fe3482a9888afa7a0811cbecbe64b264197ae22c1e17baae62116e79948771731bce85068dfa4016f3978e39ddb6373b398939642824f763dbbfdc002af17846352ea59cffbb3b07fd526936f313a9f36c818b9c8935d3535e05a7f8ad66541a202b3770e7b5b9ee000fc03f87a67ec1668c270bb6dbb46e1f58e999887cdaf5bfd08a899afbd1b1712a474fe6bdc0e3c6540072ede5b4fd2eb4da9b93bbda506a634eae7f9b0855c40609011911e765c5bf92c7ef9876d3898d1b9f74ae44dd10de3cc31b5056f219ccb522f6c48d8e32893118f6fdef1441251f5f1ec351b2ee7b95a2ae8d08edc4ce2d5749b2f07321ea546805fc4d46c27392fb66ec9ee04c41c8f77d4920dcbe5937cb5507795210b0acb300b3a9625fc4edb076cfd36c5f8f0dd519025af2eaccbc13747e1c7a848a5deafa9caddd682356e21d7d24d7b3458f8c2351c20a864a152fffa4d049b331de77b2de9490bbede98488158108571cb80c5e3eff895ba2a31a1d70aa1bc3b38cdf5610495f432a9f9369b9ceacbf45da63cf533e42df66df7c7e108146bd107fd890e32252e5e1125db9e5e938fc86a3ad8547951fcaacb69789e99bff56fb9e0350ec742665cae725faba2dd08de44a16d5779fd5c0a3624db0bd265d933494020efe58b64b6da26b0a78377fe8d55a2576e245791efbd9c2811c66374f1d95121ba4ee1b85b637fcbad348cc8b089936520a1c19391ec9186429689919c0692b665e95450bb37c8e88306f1d367cdde245b2174277da0cd799788d6ee9ae8453adcfccc3a5dc9832cdc59946ffbce28be4a4c0630691f5e9bb4f9277df568182fe478a4eac8b6576909c6780a7bcb0ce8f7d60f89e2d76d1fbff45d6390c1ac743129754aa2b7320101e0e7da7327d6c5e545feb5a0c48c6cacaf245503f87d7b7ad7ddb24522df40f94cea9a9044ee7de7216d533e16823ee8599181975253e5841c4a88f71b04d9465eee909c6b1e220d11da5bcfd01ab009ddda154828467adfa4c49cde3991a2062e10e74da1a6535ced9fed0b6d9f4c4f507d711d8879b883c43e7c3588dfc02a3218925feabe7dfc619d110bd5455cb79ad9cea0cbb5d2220c5d83c9a2169af546b260c4eb936a74db8d1538470c73fba41010963314b1ab662230d2bf126102eca5a8e02cf3fc9c3e406110d44c483b5a1770c0c97657b251ebfc59d2db5eac1cb2715aa3c5b65c1f4eae95b700bc4815b663b61d0cc7b5bc2b8270d7cd558edfbe3086cac8eff197ed25b4ca98546735f433db5ccf9d0b01f56400f9eae1656bfdaf81137c306211011e09b15dfbae35c8df774a3bba8e40cd3d4fb00a6880e445324f26d61a612acbdd0737cae1179bf26bc29b7cb0b23a907ea011402947c0cebd8aaa82620a36ab9b6d281470d6f05a42c99b87981f7c45adcd01b2b47026eac614e0930976ba5b0ca56e81fc5277d80a9c7ab49d670ed03dd760af98a47e495a3fe92c0f97c4138958044faf55c5f4ab7833f1db1245522924609028ce1c234bae58d99e377eb82856c7a8fbfc6a21f3f2c21001badd0aab473cfdecd9a89d230ff477d43739debadf3c7d03de3987d4715ac54ccfbc271ef5796428faee43cb46feea3a73ca2acd73685d6be66e86a958a8f29ddf8a7d3f9f444b399dfab5a6e46aff3d3ae8d25a4c737e4c2bd1660b0302d2381ee4dc9980fe75e39da89af19310d61a4042f56d22fa2eab5499eb2865197ef07226c05600fd904f67feabb07a7b6f5fcd31302755a19c28f3fd8fb34849afc27a79c226e91645642229a0415ecb6279770561ea342e043baf8907a6e6a31914bfd8295ba6926bf4cfa11a369e10895d5d4ced4c426b69f6084a304804083020e812d01b0b6e6591dea9145ae40fe4fc0e820c2a3dc813bd6b1e960adb54628f1fc5b66df7e33cc9cfefcefaf14a510ecc1ee5a7bd5656a34b14d3bbd6e20034b421233e24d7d8d80b51aab12a1d55408e3679bb3c68997729b2488594ba5d8ac0deab6b93fc38ee6db89eaa263d34822bc71ca45234db23ec5a6826540781358a9f9f360b863204e81d07046a093dcb0c9bc3c0415b7c45722eee2ac88627823b78421d11f0be2d32590c2380f32d355229e34e33e44ea3ad47be9021aa521b3832b8edde4a37368ee10cc09141822d5dba7c5b50705b4af3e94e3f9ca32840146fd4f5f6910de5004fd23c3089556a0fa92e2645b9a3b9f4ac9e850a3d3e7b5b8d32fc8bd9ebd30d9d5230b04c9f21073dec23366748560c6fc67d741a822c54ebe373e676e515959056a805f09852a111a6beedec8c1ed6d8133e24d04fafeab7b877b71bd107db03e7a47219111a98d8967405396fa2a12e30e5c02b0235d6ab4c414d14393e6bafe123ba93f1c24fa303313ecd123af3c816a898e8c015c977550012256d83c8f96da6129de1b2bd857afee09a2122c264f5535ee17207e07250e756051b665c5130945b98cba09141f4175a1dbfc6fc3440f6a2692f0141a980b856131e75a7f0072305c0065b5b0b32d0a8a406f136a67d8bb51974a46cc1fcaebeede69c8f76e9cddc5c040ef380555ade3492dde6f9caa0d4c18d02106389c3334dd85e21e5d1198bd95e32a97fcb59c85de999cb078d9d2982408cae15ae6fe9fa95b4b5443e8d6effcf4b3e903f021f42644d1605bd52861a520f413bcf9c5fba40195bd534ced9088357fc3155c7606ec5b857eed52106d4472dfd4220c46c88a2e444b0f0ffee688cd472ff90304853bacbe594e7e9eec897b6f6fb0757a658f76ac8a36f995f228db232ff365c842a95ce4dedeccc7d6adcc66f9723b413de9f410bb3a62b338b3bae5e9115fa66d581a5d459ec0bcb09a013e63303e89073cb8473896915f1593c9a62c060a64c8d164cae46388ce6751a7d11e1246af906e1fac401016bc7b8ba49be563af3fe509c1efc2771bb2fab8827c60cb79de9a1ad7485cbf6f145c4117a93b2f476300c403a1fbc48af19666556697857a6422675ee39868e4d694b538a5d90a741829ea1eb7f16a4cb74dd92eb71cfa84b5ed5eef1f5a52232b53d8791b48fb98cb0bf41a881f11d0d202a40d5031ac03961c345750b8d0846f28f76e663b931c0aed8b5dab097d144826ebe16b8e4362868b4b105ae28e4c458982b0861c0c5ee362ca4a714dff9ce082629e21c612546e4cc50fc78dec5ff9bb6cfb7477499e90b3d799fcd26bc460448ae038f4d7dfae99e1ff63d34285a15592955e50691548ec56edf4493f54e90abe856c933b365953c683767622c31bd2b18c50eab5e1e8ae29cba3dbad2199a4fedeac65f4fcb0094524ef23a1d0001147cf902c092e82eb5e2b80340ca64adda9d479af18673875eb661b3f085a016b7fd21bee7789755ddb38555338d36bf6277947fc8debe80d3ca65934882e6b03ae5426dcbfb40efe0de27d5dd33ffe91d8151327b8d49232495a021c7d52b1a70810d270f473b9c0a9481744b0b51ba5a3b7f1f8f86c2f23da41f61c2bb60b545bafb0f7294aa9867e2d1c2c5a1b4bcad31373e8fcd29118f455d0334c9db169a438fc9ef021aac8d8efcedd2fa51750706d4a4fb95d7bb5d91e86d6b8b10b87bd82aaa18c2074e54f9ebfd46c1659a988015c86b7ce187b83fa89e27ba3e91b6e1c1bad902723f0f1a05a9d016e0e6b587ac9b3f1c9985d1ab1975a5427bf34b812e87130b44812cd2e4c5dffc0752c13c523bfc86baaf12a256141f12f33a727abe44c948d58aa76f91df64f063c36b9a6d04dcdf7201dd7c3ffa1d45eaee5ed72b85dc589bf8147ef5fef4ae4b949c2f9add64cc0b45b05723ee3701165b4a5eb8a442dc0af576512b0272338702afaaf13c3fdcaf4854a010733c4c56d1abfabb061cc40b0dab4b6c5861fffe5e3b8294d393a368c38196036b257f70d227b32140708516a1b97c9c50ddba5ab246eaacb193129cff1a51ba69b4744b712ad3477c6fe36a940b6aa5ced1615fd0f9e25ae89812eb682b8a7a376c1e8d08e589cd9e3d29b25ac51e3e8e3ce7d4b3f8b7fe1ac105c7ee26e3f467cddfd77a5da729943a14ce537cf7f54170293996834a4206521a03da2e14bf28ff11ec8288912d13a08631e01278eb5fd631c7ed1f2a2c72f22f7d7b96cb27c27da9ee304f70753287d4e288e53b2781b8dc405379154da26904290850422ff4b396a1352ebe08c7136efe738fe6a38d39b4275127b9f230f437cea7df223b3b31bbd88aeaae1f7ab5e93d39b7f4efc5f2bcb6fafa8ab485f9c121cf9526fca23f3213c5ac138190c9458236557618eb79c0227678f9fa5557a9c214530bf6b858cdb46cb259092425ce63de420298a7ec7ee62b8b5eb61a3df4a479b68e0ccf7ae1cf4908c0b5ff2f34383fbf155c94288614ae02b8f1c4d30fe332ac7a87d45bf55c9fe2fd593d6160b92795ce24cebac2ee6c2803087515b8d44c9a5953bcef88124af2e82f01e66a2ed8e3d68260ab9dfa887036954d3bb9d9b43860bd482a5c8ef96aac05909de00e73d96063256dc875c08327725ae2c71259001b49acb348cc3e2db38372a67cb2fbcb136be5597a6207e801b08430bb5c33e9d1880621a7508960cd3df0c36ccfc9d0bf417fb43239a72490b1d536beb736ee74d37e4745d15b1a860c7c43532c51621414ea153daf68fb09f0eeb8915f0e973013dffdba60c8d7bc807651ec4227c0aa4fab2b04001fa8d27b3743a75e91579551d1c45d1b47994783e5b9b79eba1245f2c779e856343fb34b15b9ef2bc2fc7db25df53f0880184b6afbd88813ca38930d58c6bc371e1e0c6729baff00def2818eaa51ba356d6baddab556c59f198695d58621ca609d187d9937bd4dbaf0a55dfe855d2c6f42df4906eec6565c283684b51f36d642cfc88841292b899f4ffbe6c7bbed34db11ba1646de299d752cfaf3ffb98c163ba8affa22b4b96221991b48a9e51dd5135042e2e90298088da604b8cf7756f6c9904a55ab157f508a028de1cfb65e81ea8065f20b7ed44c15a8687351bdf200aceeadd5542e9e33dd85079a46b54ee44712d8cdf2b7a672d1607171a9c00221cb04c256f0a355d7c98cecc9035ad45032fa6a053333e419250f4b57a026d72b341fd90c4ee43808c70569058a7f391962f39158d84d0c684fa4213551d76fca21d56836a64eb638b1a1b8b9f9d22b2bcaf3bafd6d4ac633dff5556f622ee96f4512aade6f336de2ceafa3efe78d20a4e5a66549a503a44fcc91704b5e865f451fafd8ecddda1d09315f2f2938df845c1f4bbc55615f1d3fff74cd263b6a60b5ca1ed8fdc3e1d69f792ed688d95cd679873ce958458990f2aff5dc86292744cb698d93a37da64965572f663cd4b2203a80685bfb55936bba99b9a6c2e0d6cad1e84b6b62632110dce3b4995f481cdb308b9b9c13f2cee0c92f552b148eb2493c63ff3c8520c4b6660522f7d314f6e5615b81e97c4febd1ddd66df9617814b0f84324d683dbfd082d803ae2e6fbd76ef66fd9a24f1e63c3f3335a2f61554f8be4dd0cc888afa85645372da0ee6d6730d32e5b5c7637564e7590d73f3a86d5a7cfc3fb0079faec67f8f6891d70936993d0b3dd6a385c98b45830b3ec76864347b3fbacc90779cc5fde43af74b5c327502fc6e2f0c4e0533d4d30aeca71273a54aeb815699d38781fdb6871992591104a2617fe6dfb5c628d95d1f6caa29194305f5fe15cfc76d1d18509fba3a09c208aada3edb8fbfadcec634f30866727260bdbd3bfd751700bf9f78a3e896ad23db343877e7ca7b8f0af80cd97ce764ef93c8f5eeae86cbfc196c4137bd0d5134888ec2247e62297928ffe4105c1e40d865264d1d046ae2e785dc369daa550c4861ef870913916694bd0baf4257662b413356ea72cfba8872eb522c6e1f7db5604916d6ecf9d4c8f74999f45af1b486a886c8cf6cc7b8cb8de8b6f9a7e1a6d445a1a0cd69cc3047f4a49a78cb9f0af584d2508c1708c912de3e9567c2d93a5dfa595199aeea8e9600e9193bec7f61b7bc5032b59c653f654b1a2385b5f11266ae2b7cc9ee7154a2ec5b82be245f37aa82b7af41d11e827f965f7819937d2cfafb34e2d67f8afcd63a49c68c2882937378e7d5b1d89bb72f4eb341ba6feac61fab677d42feb8899f763db4c1dba15014c852edeae1ebb9218b36fc465a4f29d6bad08821f7838777559953dfb9b80a164de1f0b757f193be8a8572231c799bffa981a89afde411e7789a567a462d7d0fcd351695f09bbbc46fd96fe4b875135110c740062992867616e920a078148dee0d87a47161c84de9b4061480cf6c184bdfd8b2dfc0d668287d7206b52ea84abe8692c9bda5318fddcc59555cc856fa88795cf981f987fe6a2ec5382bc9bfd9e5c61a9bd29d6c30b72509911980ed85e5f1a2baf1d630b59ed80eae8b7bb8811c1fb43115bf0255a5608345e00a401b82938c5def0a553b921d4a33998dab73aef8dcc94a84629876be7ca1222bb03623c2a684f95acd7cf0829ecd1cb1323a3c2837476b9563f9d3deef4898bc50b48d062eb55f77fba9b929805a612b004e4d67ed7dc3db2de2ff23e696b525334e3645015e3a5926ba734e3a615c037d5795d180fe269ede800d6d505c92b08a35331e49d8e91fd41fadad67480489a1fc165ff593700bab7b98daaf6f47dae85c36e267e8517f7992517da7f35c4a741128b08484d34d9468fe66977bfd06500e286cf246d65a8121be3a6392ea1c011f110882c2c2b6ea8ac13858864fb1d8ec8d3b00238bdf7f17b0e1719b13642424337a35e188503dc4a5439876e201158a082c2035e2c39cac23abf0966a44c659bff7580e063fc565db8d0b319afc7e16062b3bf5f840cbaa07b589d0a68dfcfe75b78d67b2a76e97dcd72a5450dad5ee69b61e4e7717afe68e92d03f0d992a3568590d028d1b4382644b383756541dd7562216671b936ba8fcb01243f03ed4b540fd2a3ab2834583419899b72f5912b4a77e39b638db313eac03b17de82f4576f1578762b83948a7f86ec118a1cfb545d3bbeb33b9f54e2171b880fa9f4a312b721cea7d58b8626cf3ec13c1f1e9d0ad59682400d18beb96b512e5f6d5564926565afe7586162180f6dffbce79600eeb81cfc7465c5820d40993e3b1cc69cb79ee6342dde0c93b89a4b0b57e907ecbcef47f5332fc0fe265d7f4a813cde04f2e32f24b541f6d0f28ba53d632a9317bca045afb660ff41986b421ec5693a0b8c78279f636118e618f192330ecf34f533d3af8f6529bcf5919cb2d4222e45b546ad303f27f655f4d93a867fd929cba132a460b7063146633826809f051392d0c9362408c6e21182108e72538a04b6bf8c80745b3d1446e15b80c26cd25fca5a2f06e2afa0b73041d5e020d8114aed6dcfa8f3692aa08fae2cdc0fa49630bc4520b1c70dc4ff22b9ab64d589a1c8b9d9b15a87c8e1514f7f328db92b0ff5b1b56a95c136b0302697309bc92a0dde9f69db9527ee1d5b42aa2ae05d31d5f84ae266219c8ad8de036bec43d3b65b326645430abf28f3a578167c2b2abe0f20eaad0cc78735bfc0159598070ec2ee2a448a52492bedc6f5743cdaac00a5e0b493a82f16ded5a7760b4ba7db565a96aaa2629caed538d23999286b0395a59b6a32419413b3e3ef5e52c504faae2f54f3801389ff2aba485af2c46cd1218d94814d46dc6733590be1e559da9e71f45a60faffa607d39b790a4c14545b18f6aa9f38f9149451273ddf464501dfd67a55c0f95b9bcb7d378d523c52d80b1066ef5e51baa34bc5575589586ff31c8beec4473cf78072ad7bbb3191abc15c701d3d8f390e91dd0d99d02dcc7129358895ef6b31544fa071e56b8f9bbd74e023b6358f4c7452bc6c22400029f53fff4819f986c287fc4f26c8f071565faa3e1da2b6438745512949996c88b54e39c0dc72f389f7aac0e69158e10906f9ad41db237c507b8e7b0f24f1815c23ed0a9b2da7618196b0b6f50bf8a9b941112b2264709ed2797791d63ac0ea0257aa37a8e3353a2dfb0e90000ea384459a465b6cff2f0671046bac98042c3b9ea9f4432808c6354ab0adf0063448e7d9cc9bdc53963d183411dbfb7209b4ece4b6250a5861364347b4f4bad8de949d5413dd4651071db6eb77c6fa730d312754f3541ccd81c29f24464cc4d370fc6504e6710902538eb75fbad327d6e74c90b2b346dfeb9234522f5e4735259222088b92e1402b4b9e9a2d5ddbd6aab5e47c8abd3f7905d52a832d701e44f8c03b85410206cb5432fdc6b925182f119663f312ec175806c6ade1fa07ae9a43cfa2f7495775ca947d66c3faa0a087620f78cbeaff99955f762e8d82a2ec20c2a5282a87f716c96a5d6a5de2043713e197399bfcaafdaa75d5579ec6514708e60cd6c7a52b9ff57efbe70ab973a5a5ddb7e23cbf19906de5ece03fd1b7c58436ae574bb51b467ac65a0b5684c4d625a3776b10590fac1a9ce8fbabac4bbc369f58492a4734bc57644fb4ff3bdf090fd4db40afb5fd39d8419b3db20b090e766ef4d24fd28a698e12bd94c1961a6d0d26404865e920b5a08dcbb9dda04391b4bb9c4262522139195ace73343bcd2ab056167ed0ff0b98299dec424970d87d325a2bf52cd3ad2641e3459996dcfa0003dd17de89f1c457dac80e3beed0ce574491848762e1163e6d3fc7e876f0209fe6cd101e45b99f7943cab69f6186d9bf6d8e520d7539763f5aa2fb4e43491e6c2142608dbed4c91fc1db473b3576b8e3c1fff7432112e99988ca7a6831a9242eb3b411f03d215e1748b4d15d8188a7e631acc38d59c3d144c1335816a22e0cb5ba99d7be75310a893bb59dff8fc1689c64088723aebe4da7da792ac20e8ff5d4dad89a5ad69f29f596c73bc3a4313eb3bc25312e255f4c895ace26cca38bdf7afa9698ad4a410dadfa286aeb8d5f10c467b6df332127c682b989308b9ac6d77866cf9c9cab9c7148338a4ce3b9e39ebc4d7e1dd5abcd5ecdbb25dcd41a74eb40afa638f6ee1ebbaa31598d5e533147dbed0f4121b9759f32444935800ff21b23f1a4f53daf22d45e680637bc82eaff186540ffbd82831965377fc5374ecc057fab5b606d45df49d1e46b7ea15c42b77740348d3deba6eb02784f09443e251be7beec1728db61c8e6b7a46d9f61c25854c8cc8262afd14a20a37de4cd8bfec05d5a3d603b3f0665c5fa21be03054cd70773fe92364fbc2776b591a279fe000bc52ff0de9b5995ffefa0ab11324ecb4d7848761bf855fd8149a896c9ba8263cc27a90ebcd2f9480cba5ff5d4726cacbbb55562692c74645a2df6e0c965bcc907a7a243e5e6699af637fb252ad071c47e2d5f5538c4d4301c9c176bff0abea559b6c42bf1d0ce04873b99350605bad00e0577967414820a8e5f5b2316d868c9dd5cfd40b2ef35ca7bfec53aeb32a94dd9341b8d629200518776874aae6c8e3281196458645fd97f223da99034b4b3324bcd1a4c51538d363eb2f3b46713831f58fc5411939b6bfde6e0cdc72417090fb4e0905831ba58fd8ea4ea0b9039757e5c83bf635977770bdc802554b54ecdca275dbd921aeeefc84c934f19960f7125a926ef85e30f87b045c2faa23639860a5611d3b4b88deb464d8ae37d53c0125892e226024fb7b1282819f282531dd36ba9f1d6abdba037acf1f43a3fc65f793a858991289a2d00417f8b09fec15c7c0a3d863e583069b93a5b0789150ecaa8be5d54cb88625487eda5dc5996a95c2e15a46fe4ac3ffaee66c0cdb16bbc7ef90894bc427aedc5beb2144c02f6fa9ed8d42a51229eabab54ba7792dadbc0f11b73c18fe5a15610f4530e54610104d7b8ccc14108b8fc4a19a0573250200b070f41a8e5fea8826f0173d8965adcbe90d3810e2e35e9ab038f2631bbcc18af94177a0f1c0af02566971af4ffd6f5bff94a3d5548f9fd9ed9bdee151a4a3f6202a9271fcb4635dd915e0a512df7ca7d60047cb6dc5c128df391875ef3b09701ce7165c9798f2604fd25eb078f2992ce671cadd4313054d80462090290e1a62164dc5ac96f45c0f12654c797f6269a37b12ec4e3b1e5e4d9e5dd17f5262ab1a7ebb873f035aa268ef9e374d6521aae6d7af2d6d65d836e79d6461c5aafe2c91ec35374a038b9ec89748c1693122ac6028d391d6f5143b74b842f53493d5bf6956d26a33c63c9b10994034a36001ddde26e5b8b6c1b8ee76bb94748b1fbe8d2e08fcfc31e2fc459f518282a609c1f97296185ae280c4318137bc411b8d097c40af0a11c2685e1ea3b37f425bb4c78766a235d219531d2cacfc12404ce3de0ddd4712f84671acae9bb139816bbcffedc1a6c273f4d86457af7aff6132e94cb4165e90b16491df1e67ffc0fca1c227a10be9c46447cfd0005a0153fb3b535858ee2cce73ec76ee4aecb5b73cfe4565a1a0ed1f5d582b1e7d244a413e93f5ada361a58443fbe0edc99c1ee3368c7583b70c21bab896491c86aea126b6779294ad1b36fa07ea2b780d4a19c5b0ecef284d444537bbe741c4cfd6987ce20f6c6765ee90d38fc7f2d587d3a40cfd79f312ac44ac734adcd418741d2bb793a468ae43c854ba982e9f5667a488e40b4aeba0eaf81e17b0fd0c76a3326591ce94be7290f30bb23307dc78d6b69975455d6cd925b09bfcbb43a591f9b509508138f6f04aa7680111ea6a280195cf3af9ca06958cc7954db0c53545f473207520acf19153c1219c25b14bd52d9e8ef2efe8fd44716de55f4f3316970ce80076bbc4ca37b93ae358389c5b72f0eaaabd6b500ce63e26fea094dc76e4e7efc0adac93388f5b501f572b9b482d6586a9f9a678fd5f90491eb94dc7359bcb27308b74bfd4541e13c76c29ed6b425beb4a2b68ceeb49503fc4226e980d0fdc1dcaa97f962b2dae3fa4628e1161be82d56b87234ed079daf0cdb95b8eff084f5dc693ab6bc906befb0323eac3974cea284647cf84c3398d1289a4c798daf996d8a1a77b0e326c8241fdc35aae4112f0d306691b533fea134585d93f86239d4aec0907c0476779b9f0255f7ba0c48463c0728904f3f49da65745ba82c6d43a1f69fe0a3939a9dbd0a1a326c8f122467f7a474a1f34db3eae662385e671c45d9d764ee7480f9951044ba58d7202bc749b80f7560df0636cb567dde48d4a40e05b06a02492da43408c7eee67e830692bd56dfa83f2a83925fab3341fd88abc0bc5c912ffd3e989a4809410bc7a88a586a81bf6b7790acd86b4afb10c88cbadcde886424d5bea51773cdd5e3e5cd4b48e61f50fff2d9633fb0ab1dd76df3de572066b9659b18c94c682993a1b63577a8591032e346201c08c821c1515ca4521bdbaf1be924092eadeeb685fec9b2e94e5e7a8129068000c508d07d1059ecb2c44cbc0b5c35e209d04ebde92d82388a6a40bfa63e6d9e185c09857aa0d56047e118771a7801f72d31d91b2a9213d9211a49b49273ce519ac51236030d485f42f08ac720bc1c29c97648784d183cd4cba06b51f55eff0bed608b9a9c05f21e9c6243ef9f294fb23b41028bb9e41fc3e9564916659b5f890ef7a3e49f22981e008a83210566c9a1b6d29a341a12d947601bbbe20e8a2ff2f4bfbb0b7856b4a330eeea7e24643a853884ffeaa0c104d27a4b31f9082506eccfa428d821731e2e62f7af51165e0665b07e26048e6fcbe046bded2bf5d295b29d3b59f119d4b16a8aaa926fa044a9c4caf678041708cf383e5c494f9285471a32e0ec1eb9d363305d9b6645f719d6209d1a7cbb8facb0e40f305ba618c4d36a07289a0e44c957ae861fca29399d576c3a35c1e587381078a7b1ef99155dfd7f981d352b88ccb039d344f5d04f0cec3e14906aa1fed6c5a05853ea70c1dd06aa50266b8f687478e1e2e68a029024fa4a8072a586e336f9b47b947d7594c284a42daa1b2da26091c61f80cb82f7f22b3aaeff341999d1b8af2dc496bb674de530041925e34b039a70a5bd4df33e99cafed534296c8bfc593cd48eaa757e57fb8483e42d98335571272fd84eb0bdd4dc77e4e78d631b7b61c769809bbaba76bc6d5f38884569b2fa542b71054a3f4e5ae1808e8022c1f02024c6144a890b9c37aca0905745d2cd0ac292cf0f91dc20e81dea89a8be98bdde3e2898c02e52fcf8d6193b9a3c7ce2b311a4e764e3980a902f016a1a4fb41267ddc2966f82b8324f967f0b2a3cdca7835491360c23deeae74171489e78ca496d04235576266b834e5971b9fcf2c2cba6bd4803caa4675d6efe7811a90233012d1078c5f7f037e403770ab5d7e4f3171f299547cc45ad7a02c453314f5f2cc40519895f0b4d9bd6bfb70d6a69609979435c41d7dc816d9a8ef9b1ae1ac7f27a281cc93ab680cb6ccb9bef638381308afb37be762f2da5229025f2746abc1dd54732bd8b831994c669ec07b3110ec7cbc00753ed4e40fd0c7284842092aa1636963cad046c97ebc5dd3d732dc94a30b3c3ebcfe9bdf40e550cbd1d229b1907d49832d5d321903db8037743da1ac98e6357f8b65d1add1c2c37573c5ee8843fdac1a938565609f3bd5a76c92bb8dd1418fa12f74048bf1495007a60b1f015a469bbc47bfabd1fe65e6c67459a6a1aa218b747b52c3bf8b51b582332f2004875c7a0357a87b0a04ad01678b107f9a2b9f3039801e7d204462df86096aef837f6d71f9ab6a08d17e91c05de652507879b27e7dc6870c2618b4227aa50f2c3efb8c1568610e179bf578c13a162e54a59cff0e08157198b56957a89e421e9dfba696b3f42ed0b9ebf0cc70608463cc4c376120087bfae5900a5d3c9ddb097aad563b5af2f6abd112323b349d89702c313b0e4002df7a3664c188821c8c7f0571007570c6215c9bd603c53435a77da0b228642d30eb6e84eeb3d0e4564764544edafa987a78def852d72bf838b244a29c1065bf24afdf69f683ea11c7127efd9635a1aa05cc6970f9d312287950a6c4d2117cc2ae844642ffe1d2b004cdf93f2da62081f3957be5995dcd97b590a997b9a093f64db2f861659dbc80c8587044db8247ed16db8eda9bc32fe068d20790725412c66ab95ea879a373a607e9cdb5a62a693c01f7a0a4031ad8de040d28ca5448cc9982fe7304cdf6c6deb9b4782b3cdff0f8cdc00ef05bf3c6ed3258eb90b01e6ab32652c35f8133223755d7ebd73c24989e225aaa168afcde29289b4771596e885005b3d6d65c73a5509202b68f96fedfec2121326488ef60b101e8e60d149d69ede2b08782be1c7aaa9e0c5255dfcab36e5459a25d8f447f868ebfc9ce939471fc807b77eb5a00c653331872c774fb68c212c343a8bd3fc9bc52f2ecbbde2fb2ea9605c0fe6a7dc02b5cdd0f84974cade1832939d2dc0f383626e1bcc3d9193d96d8fec338617ae0c5ad75466d9050a4a7730dd61a87ca62a2143926d7ae8cef2333268d2274155e297d499f7730685c2fd9c863b97c7a3dd01fc18fc3bf42354fe6246d6b78987dcfbd06269081f8975c515d351b1cb8cbfa6c43925d51666a279ce13bc79b6136f195cddc998a18d1f0ad5c9997dbf8c0643280a775a829e7138b5051207e1b2e57f680f82cb3a3484bdf7626dd3267bde824c3ee7995f6f8cff35e71de6c612a06dbe344fc8745adee861dd7959c2b5b3aed5fbc22e65bba308932dc5ee90071ad7b920c5698683fbe7de1e980303df957881b54f1b750654ea3f00aad73efd82b6084dbc646f38b2ac19269d213a0444584e7bd49a30f011f5a2f6bc158c4ffb52aba4e34b212c01368e2ceb565df8cae2dd4b2e1a30cd06e019807104d08238b53ad30e231c4f8d1440e14c21c842ff709648e78b3ea80a29f726113a19918f1f74e39f5052d63d98e66005341688f57ec438b7c6cb90d21a2a86e695ffd48f242e6f642b55194a40fbafd0198f8914c6fe5930fd152d0286ae1bd23848e27fe3446836b2d76b960caa119421fe7f4e7df092e00a7019cd58301882e878600a3970c970c33118d43d13c33af57ddb66085dbf02a9ef4d09b5acd5c6e9eb48fa140713b7987ede4fff7ee835263d99db9df706abad165ff5c56debeb5791cd5b0bb1e0477d139c24d66944093d2a5743fd72b8960b4d602836c536a942ca45a2fbd29ab9d8bd7ae7d65e64f292f26fc96d7088909420db9b303ac963c427a4d05681c4006afb48aac617368da5661c5278a30cfa002268cb3195505b2ace8c8cae1f1fd5b34186798f56ecababaf0b790781e04d08eddd1da8af98950ced6dfee3caa49a78b16ca7049ae0e378da7c9ccd216a06f98cec591879d8ef1ce2ea2d1fd01f55eb92f606a70baf40c999583829a895d74645255202e2daaa498c77f193c06e563a9b3561db8983448cd6d0c9d06a148ceb58082e362864290f38139c148c3d802a3aff13a2e9b9cd5486d89f68478ad22eb6c68f199726e4788cfc2d3ef9d4ede892a99989b5d06b31bc9b76b9374e8ba0b46723ca16bc42097b1666cb762af7d04d78547d7cc036bc211a3ac9b1ea706a2946730b67b50a34fcd135bde01515004b70a7c5c7b588bddb0984b2ba516add041585d78328cf8bc39d081727dd794b7460002fe136f0f2c4005d70a0ea40f11a74857ea18b78dc79a04552d7929b1a4a279aa6ff8cfaf1dbed8c2417f4f86adb54707366df2185f97e5b58ef83bbfa513f0dc53da5cda1b83d8449e3c7868b9a194f962a99b567743ed416fc4eeb390b729ce72db98b7e37690a4ef0578aad7d3975d57e4c982f74e2f1c7902096d2fb31f58512acbfbd480dce54b1d7b5ea1b2493d610f03d3bff2153dbf2a2a4887eb6bd335192cfaa6c3f48a6a83044dc24ca5c3324197bb0ef6c126e4ef9129b6113758c075a0e9afca077e8c92940836b71c1ab34f35a4345b96f437d735be8aef40f202f281e6bc178c65b38aa65da2e8ca183d14aef4c86cc88cb6d506882cbde320ae5a77547f52ef997c3a40f173464e1060380e5a4900e29d081cc34191945c1a7dc69a40e55ede68636c6673752e3adf9e5a217384dd240af5d1cf28b37c7559b964d41ecbdb6e70b9f209fe818c9cbee404298e4863ce600dab3716abf797ad951fa831df1a85a3752e31ec7a1cc1115732e7d537990ba7ac238d14862dc7c256d21e1af90009479a93c28c86d3077931118be2d5bd79640187ac12722e0da3e0582e86efa6e2f5f7b463049311fa0af24b043167b4ac57cc6d0e4058d5e46d7533be851c397c646fa0cde2220235c305ca8729affb67ef3dc3c5a7a1e0dc58e2cc5ed92e4da36072cd55244ea5a2ca061ffb1ecc83b0953fc527c2321acc14df92f9f650c581152315728da425b6e117a3f089897482a5394d363a9943e1160bf113652a510381e9c194bf52fb1986a098e17d8b8594a923b2f7beaa095ecb50ae11d94591f4f4e2332dd85695e588d1fa66611c7cc47202605027fb2512f587355f78e193332ff6b98af8b48a30ed56b498c2676e06921ec6bd322d00064e5d2417fe5f7af871773a80ce8234b5a2b178be151bc79776191bab61a480874edd3740945fc8da656cbfd22d5bae2ca28cedc420876445dc02d3d5d987e7389a972ae7a8aad24c77e97bda20aee0ef68b1014afc1533422728108eb6c21417784ff97bf88493404aa3d485d4d738ccbf5f99188b4723b13739ca1b158341cc62a222e1e5e7fa225ad60dd8152ae44975642622aa4ed6c5615bd309d4e2c793dcfe5a089b58045307fef21892b76244db2e788693899e21348de1c7262ad54a6e9acc2308b71457b725507f175da4497be1b835d3f483eff576d8ec13aa3c57b7b11a0afd8a477b270813eea4600f6c919162e2aa2764f13335b917e13e85f71d4b5aa672389caba88cb547cc81e7cc8c31e88a64038534027af918723e9ae5e7ec32c5b68b8fe6a803b19775648faaeba5d36e7486b9c68041485e8598701748201b31e8245bddb180b17e2230954cef73d3815afabf991dfab9071fadbdfb2b153f75ce519f8f7b479e752790c64d18f32ec7ca29359c994a75206a5c23d5f341d784c1dd6bb6df3caa4ec39dee34e8b65dab6cf22e599bd08b72f686a91807284a7976ca613b5f3969ae4236027b0cc2f34018bb0485bf2222b5ee8cd9b74d60b9e4923e151e29f208268ca9b22514e8e2f8cdd1f1957d68056def464f63fb35836688bb3c444afea76c355639f3b43c0f14832b5313892bcd073da802b1c58433aff0d6d8712e375f6f9c6defc9a6d7d26e66d066809924ab0fc3ad227af43acd3f67fb9a2aab0c2a0a6399154bc988a3fe4983e841b9c79d89ad26c6a3abf912b43c16c58e23d84798856d5e802c4fadaabd41b7084d2d20a7e8a775b5b41f27f9fa7318129957b4e3b6261812c0db74f8ab21f9a810f2c2f979147c31d310b502893ea9bf3e62ad2bd6b088ae4cd3d268883918ff230a958cfb6009fde57defa7745d156795063b92a27aa598efd559db04d336414fcf059876b389ae2a9843e91f22b181dfb2c31f76fd3acdd15d3050ea7e91d4e2978899d0cb53689f687f2a2eef9191e55de8d397b21f9dcbabc170b5cf930b192780b07cbe27720dc2cb66773dd467b7715cb278beb1e3c7392fa3801248a1e848ae3136a371a172d6db3c5e4221492b011c336c47654d0923448d1905661944d58d83fcf968e6b7e09d28f957f6a7ab52b7554d938440a4107a272186f4679d31b1c1d8656f07cb452a2fec1abbd28a3efdb5bc25945563958d6f38faab7dbc0a54b44ba71db2169316f1642f111e69aa0d7126851f264a85c0451f799d8ab080b3528cdd9c1ebebd987e2d660f845313faf4e493b74d93b9839a556bfdbbc2346906e766a5465a8307f232ac0040a56dc969abc2e7519c86815a6d2481944d77175f8f8f6f666f82504f99b5a3368884d07cddc4c92e81ba68ec91ad05f3b9ed1aae4506e3974018c95665ad249f21c6882048854973c71090afb6f8222df5175952b9eaed98f90886b43d36bae4bfc9c8060786309a5cb1c5a47ac26e78f9cabdd84d870041ed102553e8331c06e81fc6646c851d60fbfc4f4df5be47347ee07d3257f923b02331ef9602c566bc2e008b6bc48d9586ce9cf9d3adde5e67cda07655822e00f66b95c32676e22d0ba262d04045a3e6cfa9e2336af3301cc5e23def47e595355271d08650389c4dc7cc25993a84c62b6a95cc700f0eb83231af1bafca03da774c0d8cd4531ee4e3e4a5ef11a5c4819eac5a00fe960da5e4f50c5a9bfc92ad7686ea7d652c3ea9643bfb829bc2932c255b87171d9d3198ed794cb2887291913ae84bc27b5142ca6a2de9eb3a302ff3d8f817d8d7dc2bc9f6bca071599446cfc78cdb58837119f200d44cd16160b4afed472139c34ab8d8f76df4070bf1c520019de28f486e5516fcbb9af1a1d015987fbceae835c0fc165e35b73b9d9608963c0cdd0808cf7ff680ca3bffd60ecdc63ad7e345263253c01df836540bba7319dafcef0f63431899f1c7f58ea4b37ea3d8d4e9a5698c5437a391220707e34af9017e37867bc1ec766c6a24108ef4dbf67130d23eec4f3299a127be649f5d48b478a83d8c81ab29e91e1157327a3f6d2f36957ee21a1f6207a586f3d5a463974967c13e5a219f6d3d3e688587eb8b4d8d914cbf341378d0f25c681026c39fe65403d8d78c764458334141c46098a899d565ab8c8ab1a7464039f72beeb4f0d3b43a69ee063f31881917167fe6e884b681bfe7cc8c03f916b0bbb345ac36c1fc924decfa8ad613bcb3579fa1515ad96495625e259119149aecae93661d32db0d26b051a1cec2e16d984373c5b83ce79b28bb431097894ce01537dbb30c4ad642b7e817b4d4736321504967b70f5c4c8e74fb9c483822668362650dc143325123ce4701502e550fc9c5141534b23240e092287ced7dacac60cd97c01f2d71516c22845b39a943b11264a4f98ac5864ed4e05da850f9336eaa8aab668bce4beef982358d24edb6639d6baeb68c1c37534dcadec3666b18c8440f6eda6cd3045b7f068c193be24b54372a97391a3f143f4b96fbe4a19acb20694c3bc69c2814abe2ffac3514ab6e7371c22025fee43add653981c9fa37af6bb30f27821e4dabdd6d847dff803decc77febda719cdbc1abd4f1002b81db9eb3494f20c1c561100d6babf1e29127a681474a8deb6c44db25bd82fbe9565a1c53918545e07c12e1e9cde07243d5d6e0336134d216dd5b29709cab0057549133fb6a9e95fcdbebe08eeaa5486275870c09a205ca5c32eb7322b20b9bb81a2064ad4d9c8f14c723c97968e319b844a47e81944fcb682cd8edf1d597a4b98a3aeeb029249772b9bb57d5156acb1d1036b3ed700c9495ea285ae5a82d5c788b172eee610a6a1cddb31d9c27a77614b8939f9e014b017580cd6857531bb6d1099e2f171e4a52c3d119addb6816cef1a05f4ec5d9a662dc3d3147effe9391cfe59bda97baa89abd69ad986edf4eaed759ec0913972558a840a9b4fb87dfc5148d26340b61039c1741f87a5e4f858f03c316ac6d5a24e9e42841410adf128d25503a9c3334086a1263eed865c50b7336fdd52f76d72e2a07fec314b353af032bffea9d6a8b74a7b1d3a943c5ffb733dee16bbc179f5192264b5fcd5424a10c3c3e2fc281cca8084b9572c48c8d93e312e3806dd6e7652eb6d2a2a615c34fd018876287aefa6d40f06d321f0b0fa476f31f327a2d80e28162b14e49059b8e6b77577778f61cd60e57099e2629bfda09b44aaa624e9e85e9ce8f2bc9a8b85db28ad19c890f630ca358e4882a1485b0564ccde5028573bb92180ee736ad0fb66e5d02785564c817845bb4dca29444fd7a3b162bfd3bc01b658df1eb35bc8aaa13dd7eff92d4c66a7bebffbae5e7b52331631c0eac829d3b7722949011fa7398d973cf1e6bd863851452a7663ab3da869f6daea5b15973226a4f23daab4d66235078366a3532a1b4285c93c2d072bf1e9ad9b256a3e4bebf2ce55b46c885e78a6c9342e5cb19307b51b5428633300aaf7949570fa37aec730fb0d8e7aea7bfee1d54e13370c9da2e51d7a81c67556a9221175a975dca9728668573e1bf6f519554def0d12cb3a1495f36320cdeacf75cd9f6321c963e372b5b65e7650f158488dfbbd40dcd438d824fdd1ef62318614b64480a822c21197080d90be39520d1b5b59ca1f555d683174371776d7ee08a99679ef2f2a55af7d4e77e08b701ea0c9faf28ebb801067cbc708e951f2621385762f00df797e802f14366ed9aabbed3b5ee3ec0b2b74b566803619a6282de0bb0dbfa16faa4113f90d317ef331f2be8baebc5cc7f301068ed1e7a32f514948c9219618797004b89b4aace04714072ab0e5d57f0a9d06bdd6211811eaa2bbbf76d4ee6200a8afab8c5dd92d331c123b8839cf39cc7cf457f0bf04e35928533145c0a39c562b52f0fdf8abcbffb8bfeb8215fa58f797c0348c8868c876552aa3894eb34807bc62accd2b3f30758b081298bc4c3d4c9ff927efedb828bc629ef622e2edbe178ad70532d081833ab8686f4b5a3e2f6046725d33adc021060962a6be6e410d6e651f75ae03b870a609200c11a549233164ee4b5782c1c6c88ecf8d7a96ef581a4a0c0580cc5c441962ba84ebe9a415f159aef0f78574ec2fb5f0ab295b792b89aeac2df77b3c743c62584b9a119afe81d960c43711436eda67435288f1581727586a29d9c1c98ea945c64626aa7122fc420dc9ecc80d5e36fc8d71f8311b25acd3d11d7bedfa85796d4f02a5e9476845c8806ceb18900902fba4cb1caf338330e465c966120258486c4b3e0aa32b78e88e9502b7da265e804f1f881f81fd948209ca06554af60b631991cf8225759d84d453be06e479a0f8d13186ab504e4de94986f469b97fee6cccbbb54e68336177fdbe678ba93b5bb503516474cb98e4827d20b60266439bcc65b70ed829b45b05b0d7d60da7b099dfdc3cfe5236794c2365e1f655c5e7eb736f761eaa671371687f99e213616a0445dc53ec49144a26cf8041a9ae74772089090fb27e0349b5bce7cb9d9f054e9d5e72a8d1d4581edfecca0dbbdaa3a1cc8fee8b2fb90e25467ec448fa6df4b05fdfd427825fba29d4c718203593f9259c0c593c71a00b901ab3675402f096a748b2d6d66d3b642a9c9f12691108578ea4360001376315c56b99a87f1f7d9401537052532e5b4ba0778aa98f8fe599c4aee56f9e5b882d64e33f101488e10f5502ddeb7f0bd6cdcc6be6c72412ba4e28920bd20cf3d72b805c76b6bff2895bd13150b163587a152c1e1664ec2db9956a87ddbd4471a3c1bb83583b2f93ab7e8eaae739663e45b2354d127346c08191f006b1e67d1b5a7f6714c5abc4bc3a22c5fa11d892a7f1d5fd12655145478c42216c66401172a196bf689181cf37439f738cdf0cbd738b03b7be21966a8a95626eef8de15ed1c6490392090eecfe9930c247eec4ef964d4686ba58a401dd97d1ec2a23b02919a8772acad453c899cbfb88182df74c91b6cdb5265b96b2f4c7ef9ab0635f57803b2b5dbea2d3592c70b2c4fa88a9127c780845d0e7d930565dff12e9eee8094dec44d0b7af5b4e841d5f1da0be424993eac8d405159c1168fb98fef0928ef4a94806661d37e16417de158ce9f52282af51791e78e8c2e0e935fe5151b508a612720eeabe36bfdf7c04c34bf1bd35331088697e53e6b554dc080a1739d55faec48ab7430901c5a37b5c61ab189fe3deb0f2c781d231eb57dfe457b280a2aaac141a27841a4e43973050538062513f15edf39deccb4d6c87791f0475092bd3c5e91384984a0ebedc37daf8e79c727c2f8bf8ef9a79a0c8144dfce77336ad85750e54e9e71bd7cba0ed50866c1d3bedeff85f7b1262be6d8cb2045ce905861dc5fb3b5a113b4253dcff5e9b44f94bbf79af7c82fcf096fe1ccc48a6b96cd5e7fdd3796b87f14c0a55f05e04cf890fbfd4a6388e54d97c622dcd7dd84dd9c1ca288a3fc1654f7d33d192b464c9ed3edb1610bbc7ec142f861c925ba05dbb3e1808320a66553ea320368ec8bdc5f757aa890825673e9d0e80b6b60a0eefad5bdcee3c03ee70db608d24f5e0eb1c64b6ba92f10b58be246655b984b58bf5268504801b4c1cd40c633503d87b907452c332ea16d7be122fdfcf5ffc2fbc950afe5c65f9fad7db166ea7dfe250aef83f2a4da341aead9f40d780fa4562e3e06a47a1b271027add92ffd595638952d101332245d0b94d1ca6bd726d29ae1b495f01868fb79e8505e1caeb7f8379e689add14e2f5efbc750688f4b2f76245efb8addd2458a7957f3829f87138e61370cde7ee72eeee9a0e76cfa79e6d869c3f2e33ad0ef7f6945af98c8659c936ad10c9f66a639c33965a25eb68289e473243c4a8b58132eeecf7fca073b341c6f8e51d88e955ea4b59c5993d57c0d52929d03d7d24504aa6a8865d3766ca9fb619bceac8214c4c6b9bf464493c534c5eef688bcf9538860cf14fc83c4471baf632eb4f8f7ed163fe80966de5f5e7598c495a0d62849ff611a6f308aa6e787752dafe0ea3df7826488ef9040d0b4f05c199ef9e7e2bc39740830cec27e59925a2922f89ebe65089eca31c1f366e300cbc6c239871d7df51975b91a4330850dbde552ef715793df19e8875eb8b9427ee44527a2fb8da0aa347d4305549866d16ff7c608e63781d80e5ab607ff8472bc9d315b8ec6ef1d3e027b9a177a3ff565d21eaa9931aec272136a3c70dbd2335b1bc735f93fc29dd3bba5c5d32f4868f9296436d057756530db0a65b632ed0cb64da888454c5322db6aea62ab1441c8c21bf406782e5b95ba75b6d8e2ceb6cd6c23b9a75de6936a6c3afaddddb0309ea7713a5be55522aacfbf7e07cb5f2e45081f5bf4869fcad36f09a4cd2643a0145972276f7b017c3ea656cb3263c73da1c1ea1c3908ace4a8a0f630a73f0e0fb8db2de4b85c650d9c36edc0d893a0f0bd3c354bba131bafeb8898ba1ec24974d0d5d75b82dcb02fb2f29359fb37d57fed7a9114bdde0e4ece9ee73d4317faef53babfe386399555e41f7dbb19f1b1d076a4373506414e254fd6f2985026ede5774425f82749765337f9cbb20d034778484e0f99cb08abffda6a779adf6097c61ec22ed7a2c1d028ecebf4894db684804ff822fd4efbcdaf5dbf276061faca150e8b9947bb7bd849c10fa8181551706b21421f5acda536144c6b8daf2d3e7ec8c3b5b2b858915b7fae0e188e7df5e6e90d5bdc8cfce90987e01b2bd945c8b2770beca31eb77f393bd6a334ac7a40eaae47e0a675036e591c873fd2b8a78332faead69673db15307e7e23b6eaa55b444571fd402d873e445983c501e9638039fc8c5a7368e7aac86c75fc0396a559e563e733fab6301059931aaed3d97a22000c30ea9323a9d7f000de74d1e578204ccd73f26762def3a8edfff9b5c631ae52a37f4a96346be9ffc2f2da8a9a2ac20fa7509d005a633fd76b7512194a4b8a5076b2f01809ee0543678015475ee4144772b8d2b920f52eeafccd2a7aa8e9b6a6584fe2ceb571abb8f0c9ff0117e6a3e322024718ff2b73f501c4520f1a43820e8b3ee29332275ef68aa602da6a5cc127870a773217642d56cfa1e90e433ce8f30c173f20893c005cae2e2c6e1985974cedd7ef6c07622a0a1d92bf6c1ac7cca43a0c25aeee2f17e3f99d275c6cf7c510bd34cc6a20f0273e3a89a98ebb23322d7fd1ef2c6bd3fc8e4b4e6b130b38c7b343009750608bda2ceef3f764a28fa2f00576b41d2e79d34ed312fbc5351df796f79e7625066cff9a4b1b739df8cacfa7df141ee7086b64dc342808b77f4bfa4f5f20aa1726d085cabe5c2a76a6c000118ea867928e07418600087b0c7a8765a8cf0aa1c844ca5adf6a109cbc8c33502a03b2e339a87473862c09b749af5e83bae5eb411f33b3558072891bac0ab41a2ca027ec82c00d71bab18a2f0b4c53bac438b48f6ed0084516e21bc9497adae3415d180c25b6e9286e58f8697cb83540b3f3cea1ab20159d3c5b0d4f69b888562096639e4483971c5d46631939de3320892ad2e28f567d84cb7127cb2ac86e2cbf80dfbce06b8df580d28c574a4eb82f5de6778cdd8fbc7bb79c4a3bac618c0b0abb1ead50221572d9a60333a26',
    genesisString: 'Concordium Testnet Version 5',
};

test('testnet presentation', () => {
    const request = verifyPresentation(
        TESTNET_PRESENTATION,
        TESTNET_GLOBAL_CONTEXT,
        TESTNET_PRESENTATION_DATA.map((d) => d.inputs)
    );
    const expected: Web3IdProofRequest = {
        challenge: 'd7bce30c25cad255a30b8bc72a7d4ee654d2d1e0fa4342fde1e453c034e9afa7',
        credentialStatements: [
            {
                id: 'did:ccd:testnet:sci:6260:0/credentialEntry/70159fe625e369b05c09294692088174dbc5df15b78ebd6722e5cac6f6b93052',
                statement: [
                    { attributeTag: 'userId', type: 'RevealAttribute' },
                    { attributeTag: 'username', type: 'RevealAttribute' },
                ],
                type: ['ConcordiumVerifiableCredential', 'SoMeCredential', 'VerifiableCredential'],
            },
            {
                id: 'did:ccd:testnet:cred:9549a7e0894fe888a68019e31db5a99a21c9b14cca0513934e9951057c96434a86dd54f90ff2bf18b99dad5ec64d7563',
                statement: [
                    { attributeTag: 'firstName', type: 'RevealAttribute' },
                    { attributeTag: 'lastName', type: 'RevealAttribute' },
                ],
            },
        ],
    };

    expect(request).toEqual(expected);
});
