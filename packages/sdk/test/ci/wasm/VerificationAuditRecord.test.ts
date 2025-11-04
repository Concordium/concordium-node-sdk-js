import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import {
    IdentityProviderDID,
    VerifiablePresentationRequestV1,
    VerifiablePresentationV1,
    VerificationAuditRecordV1,
} from '../../../src/index.ts';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const vaaFixtureEncoded = fs
    .readFileSync(path.resolve(__dirname, './fixtures/VerificationAuditRecordV1.Anchor.hex'))
    .toString();
const vaaFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerificationAuditRecordV1.Anchor.json')).toString()
);
const auditRecordFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerificationAuditRecordV1.json')).toString()
);

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

describe('VerificationAuditRecordV1', () => {
    it('completes JSON roundtrip', () => {
        const json = JSONBig.stringify(PRIVATE_RECORD);
        const roundtrip = VerificationAuditRecordV1.fromJSON(JSONBig.parse(json));
        expect(roundtrip).toEqual(PRIVATE_RECORD);
    });

    describe('JSON Fixture Tests', () => {
        const createSampleRecord = () => {
            const presentationRequest = VerifiablePresentationRequestV1.fromJSON({
                requestContext: {
                    type: 'ConcordiumContextInformationV1',
                    given: [
                        { label: 'Nonce', context: '00010203' },
                        {
                            label: 'ConnectionID',
                            context: '0102010201020102010201020102010201020102010201020102010201020102',
                        },
                        { label: 'ContextString', context: 'Wine payment' },
                    ],
                    requested: ['BlockHash', 'ResourceID'],
                },
                credentialStatements: [
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

            const presentation = VerifiablePresentationV1.fromJSON({
                presentationContext: {
                    type: 'ConcordiumContextInformationV1',
                    given: [
                        { label: 'Nonce', context: '00010203' },
                        {
                            label: 'ConnectionID',
                            context: '0102010201020102010201020102010201020102010201020102010201020102',
                        },
                        { label: 'ContextString', context: 'Wine payment' },
                    ],
                    requested: [
                        {
                            label: 'BlockHash',
                            context: '0101010101010101010101010101010101010101010101010101010101010101',
                        },
                        { label: 'ResourceID', context: 'https://compliant.shop' },
                    ],
                },
                verifiableCredential: [
                    {
                        type: [
                            'VerifiableCredential',
                            'ConcordiumVerifiableCredentialV1',
                            'ConcordiumIDBasedCredential',
                        ],
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
                proof: {
                    created: '2025-10-17T13:14:14.290Z',
                    proofValue: [],
                    type: 'ConcordiumWeakLinkingProofV1',
                },
            });

            return VerificationAuditRecordV1.create('unique-audit-id-12345', presentationRequest, presentation);
        };

        test('should match the locked JSON representation', () => {
            const record = createSampleRecord();

            const json = record.toJSON();
            const jsonString = JSONBig.stringify(json);
            const expectedJsonString = JSONBig.stringify(auditRecordFixture);

            expect(jsonString).toBe(expectedJsonString);
        });

        test('should deserialize from locked JSON representation', () => {
            const record = VerificationAuditRecordV1.fromJSON(auditRecordFixture as any);

            const roundtripJson = record.toJSON();
            expect(JSONBig.stringify(roundtripJson)).toBe(JSONBig.stringify(auditRecordFixture));
        });
    });
});
describe('VerificationAuditRecordV1.Anchor', () => {
    it('creates expected anchor', () => {
        const anchor = VerificationAuditRecordV1.createAnchor(PRIVATE_RECORD, { info: 'some public info?' });
        const expected =
            'a464686173685820f227b4a9296404d79845fddf3418363d8c12286a8c71b949e5133a948fed793b647479706566434344564141667075626c6963a164696e666f71736f6d65207075626c696320696e666f3f6776657273696f6e01';
        expect(Buffer.from(anchor).toString('hex')).toEqual(expected);
    });

    describe('JSON fixture tests', () => {
        const createSampleRecord = () => {
            const presentationRequest = VerifiablePresentationRequestV1.fromJSON({
                requestContext: {
                    type: 'ConcordiumContextInformationV1',
                    given: [
                        { label: 'Nonce', context: '00010203' },
                        {
                            label: 'ConnectionID',
                            context: '0102010201020102010201020102010201020102010201020102010201020102',
                        },
                        { label: 'ContextString', context: 'Wine payment' },
                    ],
                    requested: ['BlockHash', 'ResourceID'],
                },
                credentialStatements: [
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

            const presentation = VerifiablePresentationV1.fromJSON({
                presentationContext: {
                    type: 'ConcordiumContextInformationV1',
                    given: [
                        { label: 'Nonce', context: '00010203' },
                        {
                            label: 'ConnectionID',
                            context: '0102010201020102010201020102010201020102010201020102010201020102',
                        },
                        { label: 'ContextString', context: 'Wine payment' },
                    ],
                    requested: [
                        {
                            label: 'BlockHash',
                            context: '0101010101010101010101010101010101010101010101010101010101010101',
                        },
                        { label: 'ResourceID', context: 'https://compliant.shop' },
                    ],
                },
                verifiableCredential: [
                    {
                        type: [
                            'VerifiableCredential',
                            'ConcordiumVerifiableCredentialV1',
                            'ConcordiumIDBasedCredential',
                        ],
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

            return VerificationAuditRecordV1.create('unique-audit-id-12345', presentationRequest, presentation);
        };

        test('should match the fixture anchor representation', () => {
            const record = createSampleRecord();

            const anchor = VerificationAuditRecordV1.createAnchor(record, {
                verifier: 'Audit System',
                timestamp: '2025-10-17T13:14:14.000Z',
            });

            const anchorData = VerificationAuditRecordV1.decodeAnchor(anchor);
            const json = {
                type: anchorData.type,
                version: anchorData.version,
                hash: Buffer.from(anchorData.hash).toString('hex'),
                public: anchorData.public,
            };
            const jsonString = JSONBig.stringify(json);
            const expectedJsonString = JSONBig.stringify(vaaFixture);

            expect(jsonString).toBe(expectedJsonString);
        });

        test('should decode from fixture anchor representation', () => {
            const anchor = Uint8Array.from(Buffer.from(vaaFixtureEncoded, 'hex'));
            const decoded = VerificationAuditRecordV1.decodeAnchor(anchor);

            expect(decoded.type).toBe(vaaFixture.type);
            expect(decoded.version).toBe(Number(vaaFixture.version));
            expect(Buffer.from(decoded.hash).toString('hex')).toBe(vaaFixture.hash);
            expect(decoded.public).toEqual(vaaFixture.public);
        });
    });
});
