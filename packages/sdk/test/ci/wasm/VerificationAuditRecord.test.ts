import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import {
    IdentityProviderDID,
    VerifiablePresentationV1,
    VerificationAuditRecordV1,
    VerificationRequestV1,
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

const VERIFICATION_REQUEST = VerificationRequestV1.fromJSON({
    type: 'ConcordiumVerificationRequestV1',
    context: {
        type: 'ConcordiumUnfilledContextInformationV1',
        given: [
            { label: 'Nonce', context: '0102010201020102010201020102010201020102010201020102010201020102' },
            { label: 'ConnectionID', context: '0102010201020102010201020102010201020102010201020102010201020102' },
            { label: 'ContextString', context: 'Wine payment' },
        ],
        requested: ['BlockHash', 'ResourceID'],
    },
    subjectClaims: [
        {
            type: 'identity',
            source: ['identityCredential'],
            issuers: [
                new IdentityProviderDID('Testnet', 0).toJSON(),
                new IdentityProviderDID('Testnet', 1).toJSON(),
                new IdentityProviderDID('Testnet', 2).toJSON(),
            ],
            statements: [{ type: 'RevealAttribute', attributeTag: 'firstName' }],
        },
    ],
    transactionRef: '0102030401020304010203040102030401020304010203040102030401020304',
});

const PRESENTATION = VerifiablePresentationV1.fromJSON({
    type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'],
    presentationContext: {
        type: 'ConcordiumContextInformationV1',
        given: [{ label: 'Nonce', context: '000102' }],
        requested: [
            { label: 'BlockHash', context: '0101010101010101010101010101010101010101010101010101010101010101' },
        ],
    },
    verifiableCredential: [
        {
            type: ['VerifiableCredential', 'ConcordiumVerifiableCredentialV1', 'ConcordiumAccountBasedCredential'],
            credentialSubject: {
                id: 'did:ccd:testnet:cred:a7d3493e18302a7d1c796e08babad5c70e538db7174592738e459ed2c8682aa4171f25c947bc70a58a224d53da142fb5',
                statement: [
                    { type: 'AttributeInRange', attributeTag: 'dob', lower: '19500101', upper: '20000101' },
                    { type: 'RevealAttribute', attributeTag: 'firstName' },
                ],
            },
            issuer: 'did:ccd:testnet:idp:0',
            proof: {
                created: '2025-11-13T15:46:38.259Z',
                proofValue:
                    '0000000000000002018d93736e12c272d97ff36c064634f225b94cf5adc5deb21ad6c42a595d5e8949d79782ba34c82f561c6642e8635d56429669a6c45abbe09a04cc471ceadf4c0fb1bedad77c4ff8572bc2eed1a36c6608f052ac6c646394c56d7887065e5631ff8f55211f69b9de9cf9da6da777791a9cf088c29f1457a4f7a629619e1da745f1edad438d6b95dafe2df413ef52c56685b8ecd938eb72803feea02c757380bb4b7a1d3b0d5968267d415d81aaf53652943f0008455cdc55569a03bcffd2de226512ac0dc4e704420a4fc1c2184ac4e84ba07387daffdf4a1b29ccb40d3679036415d267e2ee4813e9c6ab1763c6797544c0012cf511c61526dd51bc9679a752866682ab84766b2996108caafbc035b96dcb3818d3879166d44de6896390f823ff0000000789908ab6b54fa411cc90d4eb55747dd114d63eaecc109904f903f0cf3d5a4371284579bb41cfbf7fa44b0eabeeb548ca8a05aa999fccc8800c9c54948bce0cfca652ffafb64a08d2be5839d71d060bdc0c94737623c7d50a0da6fb44414ac6ac90a43416551637311b3fbf308092d0f81a393484d986ef5e1cf4fd9e0b54dfe6e7c1983f68967bc1938e1eb37961baf5939096c9152e5632acada142ee4c4215d6bad13a2eb3fbf4b56bb1ab134d82533b6c5abec4382195c2ccb9f8631298b0b5276491fc55c8a039d44f3852b8125dafff3da030e166a9ddafe352cf2647fafd9e3c0e591b7775a747cc89107eb04eb327d7cda59bc115442e41035b0bfc70372178a13307040f1a2ca5763735a8670ef987535264ba085ca61fb886f69bd1911a9bff8b227f1bc7d9bc72489beb5a0585fa72f55b10feb3edeb14f12687eaf801ac66ce9e761981b9377c3ef37f36b9b295fc7568d04611abb5905b5d6536a549cce2b2037049315bb9ba2f6d6fe47b914574e23820d9275ad0067364c84c9008fb2a297cec2f2c695812f32c29aa3dad82e3e715d4da0369e64822ca5968571c1663df9b7f104c30d281e1e842cb8b0584dbbffdfc0388baca5cf6ffdc9948e3217634b3fa36e6013cc9ae76c8b2502f7ff77030f7ac2cf1e8b0217307e3996168a33014c19dd5d4a1409fc9efd488066e0f839ef4753e055bfb64426d8be08afcf9f5d95d7ae4db66c59484b9c39038bfd16ecae9081ecb43783e0e67b6671eebf20dc27c6265a2d70fb9b3d5d6d3e756f674575fb763c275d73d3ea698b5e58aee741e4388707575c39c6d1a7d10c2262705f61e1628c4a42a89766701f4af70fe98dcd5128dd5aecefdc87f89a435d7b42c13ab26e0168bad8da7c006fa369bd7624bafc5aa04fb819dddeccb3ae4a5293e8ca12a1b39b7c0e2555ff9651294b159ac3be3989a1fb3433b399cc4b754093887a126376366aec0dc0f160efff0b10349e2c593be720a561552c9a635fd6e3eeae849dd070a53764791ca0000054a65737573e4040addac6205e8fe4f0546a4baea977d80c928f0e7c3a6fca04c7db80c544650073e02411bf0ff7d50f93fb467bb5b56940b1b164c24e9cc73b8916466a2bc',
                type: 'ConcordiumZKProofV4',
            },
        },
    ],
    proof: { created: '2025-11-13T15:46:38.259Z', proofValue: '', type: 'ConcordiumWeakLinkingProofV1' },
});

const PRIVATE_RECORD = VerificationAuditRecordV1.create('VERY unique ID', VERIFICATION_REQUEST, PRESENTATION);

describe('VerificationAuditRecordV1', () => {
    it('completes JSON roundtrip', () => {
        const json = JSONBig.stringify(PRIVATE_RECORD);
        const roundtrip = VerificationAuditRecordV1.fromJSON(JSONBig.parse(json));
        expect(roundtrip).toEqual(PRIVATE_RECORD);
    });

    describe('JSON Fixture Tests', () => {
        test('should match the locked JSON representation', () => {
            const json = PRIVATE_RECORD.toJSON();
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
            'a4646861736858204b1d8223c9826820b6119058695bb71ef8a6ae5a04225b23ca7a47fbbf3c8dcc647479706566434344564141667075626c6963a164696e666f71736f6d65207075626c696320696e666f3f6776657273696f6e01';
        expect(Buffer.from(anchor).toString('hex')).toEqual(expected);
    });

    describe('JSON fixture tests', () => {
        test('should match the fixture anchor representation', () => {
            const anchor = VerificationAuditRecordV1.createAnchor(PRIVATE_RECORD, {
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
