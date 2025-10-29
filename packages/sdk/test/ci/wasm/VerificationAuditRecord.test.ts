import _JB from 'json-bigint';

import {
    ContractInstanceDID,
    IdentityProviderDID,
    VerifiablePresentationRequestV1,
    VerifiablePresentationV1,
    VerificationAuditRecordV1,
} from '../../../src/index.ts';
import { ContractAddress } from '../../../src/types/index.ts';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const PRESENTATION_REQUEST = VerifiablePresentationRequestV1.fromJSON({
    requestContext: {
        type: 'ConcordiumContextInformationV1',
        given: [
            { label: 'Nonce', context: '00010203' },
            { label: 'ConnectionID', context: '0102010201020102010201020102010201020102010201020102010201020102' },
            { label: 'ContextString', context: 'Wine payment' },
        ],
        requested: ['BlockHash', 'ResourceID'],
    },
    credentialStatements: [
        {
            type: 'web3Id',
            issuers: [
                new ContractInstanceDID('Testnet', ContractAddress.create(2101)).toJSON(),
                new ContractInstanceDID('Testnet', ContractAddress.create(1337)).toJSON(),
            ],
            statement: [
                { type: 'AttributeInRange', attributeTag: 'b', lower: 80n, upper: 1237n } as any,
                { type: 'AttributeInSet', attributeTag: 'c', set: ['aa', 'ff', 'zz'] },
            ],
        },
        {
            type: 'identity',
            source: ['identity'],
            issuers: [
                new IdentityProviderDID('Testnet', 0).toJSON(),
                new IdentityProviderDID('Testnet', 1).toJSON(),
                new IdentityProviderDID('Testnet', 2).toJSON(),
            ],
            statement: [{ type: 'RevealAttribute', attributeTag: 'firstName' }],
        },
    ],
    transactionRef: '0102030401020304010203040102030401020304010203040102030401020304',
});

const PRESENTATION = VerifiablePresentationV1.fromJSON({
    presentationContext: {
        type: 'ConcordiumContextInformationV1',
        given: [
            { label: 'Nonce', context: '00010203' },
            { label: 'ConnectionID', context: '0102010201020102010201020102010201020102010201020102010201020102' },
            { label: 'ContextString', context: 'Wine payment' },
        ],
        requested: [
            { label: 'BlockHash', context: '0101010101010101010101010101010101010101010101010101010101010101' },
            { label: 'ResourceID', context: 'https://compliant.shop' },
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
                    { attributeTag: 'dob', lower: '81', type: 'AttributeInRange', upper: '1231' },
                    { attributeTag: 'firstName', type: 'RevealAttribute' },
                ],
                id: '123456123456123456123456123456123456123456123456',
            },
        },
    ],
    proof: { created: '2025-10-17T13:14:14.290Z', proofValue: [], type: 'ConcordiumWeakLinkingProofV1' },
});

const PRIVATE_RECORD = VerificationAuditRecordV1.create('VERY unique ID', PRESENTATION_REQUEST, PRESENTATION);

describe('VerificationAuditRecord', () => {
    it('completes JSON roundtrip', () => {
        const json = JSONBig.stringify(PRIVATE_RECORD);
        const roundtrip = VerificationAuditRecordV1.fromJSON(JSONBig.parse(json));
        expect(roundtrip).toEqual(PRIVATE_RECORD);
    });

    it('creates expected anchor', () => {
        const anchor = VerificationAuditRecordV1.createAnchor(PRIVATE_RECORD, { info: 'some public info?' });
        const expected =
            'a464686173685820df6c87461f549ac8d734c42f65b5355e745aa8444ce83907ba1a3ab9f5a0898f647479706566434344564141667075626c6963a164696e666f71736f6d65207075626c696320696e666f3f6776657273696f6e01';
        expect(Buffer.from(anchor).toString('hex')).toEqual(expected);
    });
});
