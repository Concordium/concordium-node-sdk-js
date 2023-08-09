import { CredentialStatement } from '../../src/web3ProofTypes';

export const expectedStatementMixed: CredentialStatement[] = [
    {
        idQualifier: {
            type: 'sci',
            issuers: [
                { index: 2101n, subindex: 0n },
                { index: 1337n, subindex: 42n },
            ],
        },
        statement: [
            {
                attributeTag: 'b',
                lower: 80n,
                type: 'AttributeInRange',
                upper: 1237n,
            },
            {
                attributeTag: 'c',
                set: ['aa', 'ff', 'zz'],
                type: 'AttributeInSet',
            },
        ],
    },
    {
        idQualifier: {
            type: 'sci',
            issuers: [{ index: 1338n, subindex: 0n }],
        },
        statement: [
            {
                attributeTag: 'a',
                lower: 80n,
                type: 'AttributeInRange',
                upper: 1237n,
            },
            {
                attributeTag: 'd',
                set: ['aa', 'ff', 'zz'],
                type: 'AttributeNotInSet',
            },
        ],
    },
    {
        idQualifier: {
            type: 'cred',
            issuers: [0, 1, 2],
        },
        statement: [
            {
                attributeTag: 'firstName',
                type: 'RevealAttribute',
            },
        ],
    },
];
