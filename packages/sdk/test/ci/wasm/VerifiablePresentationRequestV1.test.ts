import _JB from 'json-bigint';

import { AttributeKeyString, TransactionHash } from '../../../src/pub/types.ts';
import { VerifiablePresentationRequestV1 } from '../../../src/pub/wasm.ts';
import { IdentityProviderDID } from '../../../src/pub/web3-id.ts';
import { vraFixture, vraFixtureEncoded } from './fixtures/VerifiablePresentationRequestV1.Anchor.fixture.ts';
import presentationRequestFixture from './fixtures/VerifiablePresentationRequestV1.fixture.ts';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

describe('VerifiablePresentationRequestV1', () => {
    it('should perform successful JSON roundtrip', () => {
        const context = VerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const statement = VerifiablePresentationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const transactionRef = TransactionHash.fromHexString('01020304'.repeat(8));
        const presentationRequest = VerifiablePresentationRequestV1.create(context, statement, transactionRef);

        const json = JSONBig.stringify(presentationRequest);
        const roundtrip = VerifiablePresentationRequestV1.fromJSON(JSONBig.parse(json));
        expect(presentationRequest).toEqual(roundtrip);
    });

    it('should match the JSON fixture representation', () => {
        const context = VerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102010201020102010201020102010201020102010201020102010201020102',
            'Wine payment'
        );
        const statement = VerifiablePresentationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const transactionRef = TransactionHash.fromHexString(
            '0102030401020304010203040102030401020304010203040102030401020304'
        );
        const presentationRequest = VerifiablePresentationRequestV1.create(context, statement, transactionRef);

        const json = presentationRequest.toJSON();
        const jsonString = JSONBig.stringify(json);
        const expectedJsonString = JSONBig.stringify(presentationRequestFixture);

        expect(jsonString).toBe(expectedJsonString);
    });

    it('should deserialize from JSON fixture representation', () => {
        const request = VerifiablePresentationRequestV1.fromJSON(presentationRequestFixture);
        expect(request.toJSON()).toEqual(presentationRequestFixture);
    });
});

describe('VerifiablePresentationRequestV1.Anchor', () => {
    it('should compute the correct anchor', () => {
        const context = VerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const statement = VerifiablePresentationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const anchor = VerifiablePresentationRequestV1.createAnchor(context, statement, {
            somePulicInfo: 'public info',
        });
        const expectedAnchor =
            'a464686173685820acd94ad63951d7c1c48655ddfcf3dbc23a6e11ff20728be1c7f5e6a8b991349d647479706566434344565241667075626c6963a16d736f6d6550756c6963496e666f6b7075626c696320696e666f6776657273696f6e01';
        expect(Buffer.from(anchor).toString('hex')).toEqual(expectedAnchor);

        const roundtrip = VerifiablePresentationRequestV1.decodeAnchor(anchor);
        const expectedData: VerifiablePresentationRequestV1.AnchorData = {
            type: 'CCDVRA',
            version: 1,
            hash: VerifiablePresentationRequestV1.computeAnchorHash(context, statement),
            public: { somePulicInfo: 'public info' },
        };
        expect(roundtrip).toEqual(expectedData);
    });

    it('should match the fixture anchor representation', () => {
        const context = VerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102010201020102010201020102010201020102010201020102010201020102',
            'Wine payment'
        );
        const statement = VerifiablePresentationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();

        const anchor = VerifiablePresentationRequestV1.createAnchor(context, statement, {
            verifier: 'Test Verifier',
            purpose: 'Age verification',
        });

        const anchorData = VerifiablePresentationRequestV1.decodeAnchor(anchor);
        const json = {
            type: anchorData.type,
            version: anchorData.version,
            hash: Buffer.from(anchorData.hash).toString('hex'),
            public: anchorData.public,
        };
        const jsonString = JSONBig.stringify(json);
        const expectedJsonString = JSONBig.stringify(vraFixture);

        expect(jsonString).toBe(expectedJsonString);
    });

    it('should decode from fixture anchor representation', () => {
        const anchor = Buffer.from(vraFixtureEncoded, 'hex');
        const decoded = VerifiablePresentationRequestV1.decodeAnchor(anchor);

        expect(decoded.type).toBe(vraFixture.type);
        expect(decoded.version).toBe(Number(vraFixture.version));
        expect(Buffer.from(decoded.hash).toString('hex')).toBe(vraFixture.hash);
        expect(decoded.public).toEqual(vraFixture.public);
    });
});
