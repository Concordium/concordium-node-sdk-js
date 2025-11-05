import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import { AttributeKeyString, TransactionHash } from '../../../src/pub/types.ts';
import { VerificationRequestV1 } from '../../../src/pub/wasm.ts';
import { IdentityProviderDID } from '../../../src/pub/web3-id.ts';

const vraFixtureEncoded = fs
    .readFileSync(path.resolve(__dirname, './fixtures/VerificationRequestV1.Anchor.hex'))
    .toString();
const vraFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerificationRequestV1.Anchor.json')).toString()
);
const presentationRequestFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerificationRequestV1.json')).toString()
);

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

describe('VerificationRequestV1', () => {
    it('should perform successful JSON roundtrip', () => {
        const context = VerificationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const statement = VerificationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const transactionRef = TransactionHash.fromHexString('01020304'.repeat(8));
        const presentationRequest = VerificationRequestV1.create(context, statement, transactionRef);

        const json = JSONBig.stringify(presentationRequest);
        const roundtrip = VerificationRequestV1.fromJSON(JSONBig.parse(json));
        expect(presentationRequest).toEqual(roundtrip);
    });

    it('should match the JSON fixture representation', () => {
        const context = VerificationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102010201020102010201020102010201020102010201020102010201020102',
            'Wine payment'
        );
        const statement = VerificationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const transactionRef = TransactionHash.fromHexString(
            '0102030401020304010203040102030401020304010203040102030401020304'
        );
        const presentationRequest = VerificationRequestV1.create(context, statement, transactionRef);

        const json = presentationRequest.toJSON();
        const jsonString = JSONBig.stringify(json);
        const expectedJsonString = JSONBig.stringify(presentationRequestFixture);

        expect(jsonString).toBe(expectedJsonString);
    });

    it('should deserialize from JSON fixture representation', () => {
        const request = VerificationRequestV1.fromJSON(presentationRequestFixture as VerificationRequestV1.JSON);
        expect(request.toJSON()).toEqual(presentationRequestFixture);
    });
});

describe('VerificationRequestV1.Anchor', () => {
    it('should compute the correct anchor', () => {
        const context = VerificationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const statement = VerificationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();
        const anchor = VerificationRequestV1.createAnchor(context, statement, {
            somePulicInfo: 'public info',
        });
        const expectedAnchor =
            'a4646861736858202b3cab3d547ded97cfebd24e9d5193e221675ba715795ef5931c0557ba5e2277647479706566434344565241667075626c6963a16d736f6d6550756c6963496e666f6b7075626c696320696e666f6776657273696f6e01';
        expect(Buffer.from(anchor).toString('hex')).toEqual(expectedAnchor);

        const roundtrip = VerificationRequestV1.decodeAnchor(anchor);
        const expectedData: VerificationRequestV1.Anchor = {
            type: 'CCDVRA',
            version: 1,
            hash: VerificationRequestV1.computeAnchorHash(context, statement),
            public: { somePulicInfo: 'public info' },
        };
        expect(roundtrip).toEqual(expectedData);
    });

    it('should match the fixture anchor representation', () => {
        const context = VerificationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102010201020102010201020102010201020102010201020102010201020102',
            'Wine payment'
        );
        const statement = VerificationRequestV1.statementBuilder()
            .addIdentityStatement(
                [0, 1, 2].map((i) => new IdentityProviderDID('Testnet', i)),
                (b) => b.revealAttribute(AttributeKeyString.firstName)
            )
            .getStatements();

        const anchor = VerificationRequestV1.createAnchor(context, statement, {
            verifier: 'Test Verifier',
            purpose: 'Age verification',
        });

        const anchorData = VerificationRequestV1.decodeAnchor(anchor);
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
        const decoded = VerificationRequestV1.decodeAnchor(anchor);

        expect(decoded.type).toBe(vraFixture.type);
        expect(decoded.version).toBe(Number(vraFixture.version));
        expect(Buffer.from(decoded.hash).toString('hex')).toBe(vraFixture.hash);
        expect(decoded.public).toEqual(vraFixture.public);
    });
});
