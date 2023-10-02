import { ContractAddress } from '../../src/index.js';
import { CredentialStatement } from '../../src/web3-id/web3IdProofTypes.js';

export const expectedStatementMixed: CredentialStatement[] = [
    {
        idQualifier: {
            type: 'sci',
            issuers: [
                ContractAddress.create(2101),
                ContractAddress.create(1337, 42),
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
            issuers: [ContractAddress.create(1338, 0)],
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
