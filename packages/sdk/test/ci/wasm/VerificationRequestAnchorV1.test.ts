import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import { AttributeKeyString, IdentityProviderDID } from '../../../src/index.ts';
import { UnfilledVerifiablePresentationRequestV1, VerificationRequestAnchorV1 } from '../../../src/wasm/index.ts';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const vraFixtureEncoded = fs
    .readFileSync(path.resolve(__dirname, './fixtures/VerificationRequestAnchorV1.hex'))
    .toString();
const vraFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerificationRequestAnchorV1.json')).toString()
);

describe('VerificationRequestAnchorV1', () => {
    it('should compute the correct anchor', () => {
        const context = UnfilledVerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const statement = UnfilledVerifiablePresentationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const anchor = VerificationRequestAnchorV1.createAnchor(context, statement, {
            somePulicInfo: 'public info',
        });
        const expectedAnchor =
            'a4646861736858209f95efe3bfea8e5af0179b83158bc2aafd15f416fb4a0dc027861da5155e9379647479706566434344565241667075626c6963a16d736f6d6550756c6963496e666f6b7075626c696320696e666f6776657273696f6e01';
        expect(Buffer.from(anchor).toString('hex')).toEqual(expectedAnchor);

        const roundtrip = VerificationRequestAnchorV1.decodeAnchor(anchor);
        const expectedData: VerificationRequestAnchorV1.Type = {
            type: 'CCDVRA',
            version: 1,
            hash: VerificationRequestAnchorV1.computeAnchorHash(context, statement),
            public: { somePulicInfo: 'public info' },
        };
        expect(roundtrip).toEqual(expectedData);
    });

    it('should match the fixture anchor representation', () => {
        const context = UnfilledVerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102010201020102010201020102010201020102010201020102010201020102',
            'Wine payment'
        );
        const statement = UnfilledVerifiablePresentationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();

        const anchor = VerificationRequestAnchorV1.createAnchor(context, statement, {
            verifier: 'Test Verifier',
            purpose: 'Age verification',
        });

        const anchorData = VerificationRequestAnchorV1.decodeAnchor(anchor);
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
        const anchor = Uint8Array.from(Buffer.from(vraFixtureEncoded, 'hex'));
        const decoded = VerificationRequestAnchorV1.decodeAnchor(anchor);

        expect(decoded.type).toBe(vraFixture.type);
        expect(decoded.version).toBe(Number(vraFixture.version));
        expect(Buffer.from(decoded.hash).toString('hex')).toBe(vraFixture.hash);
        expect(decoded.public).toEqual(vraFixture.public);
    });
});
