import { CredentialStatements } from '../../src/idProofTypes';

export const expectedStatementMixed: CredentialStatements = [
    {
        id: {
            type: 'sci',
            issuers: [
                { index: 2101n, subindex: 0n },
                { index: 1337n, subindex: 42n },
            ],
        },
        statement: [
            {
                attributeTag: 17,
                lower: 80n,
                type: 'AttributeInRange',
                upper: 1237n,
            },
            {
                attributeTag: 23,
                set: ['aa', 'ff', 'zz'],
                type: 'AttributeInSet',
            },
        ],
    },
    {
        id: {
            type: 'sci',
            issuers: [{ index: 1338n, subindex: 0n }],
        },
        statement: [
            {
                attributeTag: 0,
                lower: 80n,
                type: 'AttributeInRange',
                upper: 1237n,
            },
            {
                attributeTag: 1,
                set: ['aa', 'ff', 'zz'],
                type: 'AttributeNotInSet',
            },
        ],
    },
    {
        id: {
            type: 'cred',
            issuers: [0, 1, 2],
        },
        statement: [
            {
                attributeTag: 0,
                type: 'RevealAttribute',
            },
        ],
    },
];
