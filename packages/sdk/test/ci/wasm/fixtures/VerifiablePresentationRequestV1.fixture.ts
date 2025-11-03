import { VerifiablePresentationRequestV1 } from '../../../../src/index.ts';

const json: VerifiablePresentationRequestV1.JSON = {
    requestContext: {
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
        requested: ['BlockHash', 'ResourceID'],
    },
    credentialStatements: [
        {
            type: 'identity' as const,
            source: ['identity'],
            statement: [
                {
                    type: 'RevealAttribute',
                    attributeTag: 'firstName',
                },
            ],
            issuers: ['ccd:testnet:idp:0', 'ccd:testnet:idp:1', 'ccd:testnet:idp:2'],
        },
    ],
    transactionRef: '0102030401020304010203040102030401020304010203040102030401020304',
};

export default json;
