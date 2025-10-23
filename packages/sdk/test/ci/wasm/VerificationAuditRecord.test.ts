import _JB from 'json-bigint';

import {
    PrivateVerificationAuditRecord,
    VerifiablePresentationRequestV1,
    VerifiablePresentationV1,
    VerificationAuditRecord,
} from '../../../src/index.ts';

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
            idQualifier: {
                type: 'sci',
                issuers: [
                    { index: 2101n, subindex: 0n },
                    { index: 1337n, subindex: 42n },
                ] as any,
            },
            statement: [
                { type: 'AttributeInRange', attributeTag: 'b', lower: 80n, upper: 1237n } as any,
                { type: 'AttributeInSet', attributeTag: 'c', set: ['aa', 'ff', 'zz'] },
            ],
        },
        {
            idQualifier: { type: 'id', issuers: [0, 1, 2] },
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

const PRIVATE_RECORD = PrivateVerificationAuditRecord.create('VERY unique ID', PRESENTATION_REQUEST, PRESENTATION);
const PUBLIC_RECORD = PrivateVerificationAuditRecord.toPublic(PRIVATE_RECORD, 'some public info?');

describe('PrivateVerificationAuditRecord', () => {
    it('completes JSON roundtrip', () => {
        const json = JSONBig.stringify(PRIVATE_RECORD);
        const roundtrip = PrivateVerificationAuditRecord.fromJSON(JSONBig.parse(json));
        expect(roundtrip).toEqual(PRIVATE_RECORD);
    });

    it('creates expected public record', () => {
        const publicAuditRecord = PrivateVerificationAuditRecord.toPublic(PRIVATE_RECORD, 'some public info?');
        const expected: VerificationAuditRecord.Type = VerificationAuditRecord.fromJSON({
            hash: 'fcce3a7222e09bc86f0b4e0186501ff360c5a0abce88b8d1df2aaf7aa3ef8d78',
            info: 'some public info?',
        });
        expect(publicAuditRecord).toEqual(expected);
    });
});

describe('VerificationAuditRecord', () => {
    it('completes JSON roundtrip', () => {
        const json = JSONBig.stringify(PUBLIC_RECORD);
        const roundtrip = VerificationAuditRecord.fromJSON(JSONBig.parse(json));
        expect(roundtrip).toEqual(PUBLIC_RECORD);
    });

    it('computes the anchor as expected', () => {
        const anchor = VerificationAuditRecord.createAnchor(PUBLIC_RECORD, { pub: 'anchor info' });
        const decoded = VerificationAuditRecord.decodeAnchor(anchor);
        const expected: VerificationAuditRecord.AnchorData = {
            type: 'CCDVAA',
            version: 1,
            hash: PUBLIC_RECORD.hash,
            public: { pub: 'anchor info' },
        };
        expect(decoded).toEqual(expected);
    });
});
