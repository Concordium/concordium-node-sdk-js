import { type VerifiablePresentationV1 } from '../../../../src/pub/wasm.ts';

const json: VerifiablePresentationV1.JSON = {
    presentationContext: {
        type: 'ConcordiumContextInformationV1' as const,
        given: [
            {
                label: 'Nonce',
                context: '00010203',
            },
            {
                label: 'ConnectionID',
                context: '0102010201020102010201020102010201020102010201020102010201020102',
            },
            {
                label: 'ContextString',
                context: 'Wine payment',
            },
        ],
        requested: [
            {
                label: 'BlockHash',
                context: '0101010101010101010101010101010101010101010101010101010101010101',
            },
            {
                label: 'ResourceID',
                context: 'https://compliant.shop',
            },
        ],
    },
    verifiableCredential: [
        {
            type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumIDBasedCredential'],
            proof: {
                type: 'ConcordiumZKProofV4',
                createdAt: '2025-10-17T13:14:14.292Z',
                proofValue:
                    '01020102010201020102010201020102010201020102010201020102010201020102010201020102010201020102010201020102010201020102010201020102',
            },
            issuer: 'ccd:testnet:idp:0',
            credentialSubject: {
                statement: [
                    {
                        attributeTag: 'dob',
                        lower: '81',
                        type: 'AttributeInRange',
                        upper: '1231',
                    },
                    {
                        attributeTag: 'firstName',
                        type: 'RevealAttribute',
                    },
                ],
                id: '123456123456123456123456123456123456123456123456',
            },
        },
    ],
    proof: {
        created: '2025-10-17T13:14:14.290Z',
        proofValue: [] as string[],
        type: 'ConcordiumWeakLinkingProofV1' as const,
    },
};

export default json;
