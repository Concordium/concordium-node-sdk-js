import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import { AttributeKeyString, TransactionHash } from '../../../src/pub/types.ts';
import { UnfilledVerifiablePresentationRequestV1 } from '../../../src/pub/wasm.ts';
import { IdentityProviderDID } from '../../../src/pub/web3-id.ts';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const presentationRequestFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/UnfilledVerifiablePresentationRequestV1.json')).toString()
);

describe('UnfilledVerifiablePresentationRequestV1', () => {
    it('should perform successful JSON roundtrip', () => {
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
        const transactionRef = TransactionHash.fromHexString('01020304'.repeat(8));
        const presentationRequest = UnfilledVerifiablePresentationRequestV1.create(context, statement, transactionRef);

        const json = JSONBig.stringify(presentationRequest);
        const roundtrip = UnfilledVerifiablePresentationRequestV1.fromJSON(JSONBig.parse(json));
        expect(presentationRequest).toEqual(roundtrip);
    });

    it('should match the JSON fixture representation', () => {
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
        const transactionRef = TransactionHash.fromHexString(
            '0102030401020304010203040102030401020304010203040102030401020304'
        );
        const presentationRequest = UnfilledVerifiablePresentationRequestV1.create(context, statement, transactionRef);

        const json = presentationRequest.toJSON();
        const jsonString = JSONBig.stringify(json);
        const expectedJsonString = JSONBig.stringify(presentationRequestFixture);

        expect(jsonString).toBe(expectedJsonString);
    });

    it('should deserialize from JSON fixture representation', () => {
        const request = UnfilledVerifiablePresentationRequestV1.fromJSON(
            presentationRequestFixture as UnfilledVerifiablePresentationRequestV1.JSON
        );
        expect(request.toJSON()).toEqual(presentationRequestFixture);
    });
});
