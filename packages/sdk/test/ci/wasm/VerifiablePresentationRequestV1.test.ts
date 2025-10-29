import _JB from 'json-bigint';

import { AttributeKeyString, ContractAddress, TransactionHash } from '../../../src/pub/types.ts';
import { VerifiablePresentationRequestV1 } from '../../../src/pub/wasm.ts';
import { Web3StatementBuilder } from '../../../src/pub/web3-id.ts';

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

describe('VerifiablePresentationRequestV1', () => {
    it('should perform successful JSON roundtrip', () => {
        const context = VerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const builder = new Web3StatementBuilder();
        const statement = builder
            .addForVerifiableCredentials([ContractAddress.create(2101), ContractAddress.create(1337, 42)], (b) =>
                b.addRange('b', 80n, 1237n).addMembership('c', ['aa', 'ff', 'zz'])
            )
            .addForIdentityCredentials([0, 1, 2], (b) => b.revealAttribute(AttributeKeyString.firstName))
            .getStatements();
        const transactionRef = TransactionHash.fromHexString('01020304'.repeat(8));
        const presentationRequest = VerifiablePresentationRequestV1.create(context, statement, transactionRef);

        const json = JSONBig.stringify(presentationRequest);
        const roundtrip = VerifiablePresentationRequestV1.fromJSON(JSONBig.parse(json));
        expect(presentationRequest).toEqual(roundtrip);
    });

    it('should compute the correct anchor', () => {
        const context = VerifiablePresentationRequestV1.createSimpleContext(
            Uint8Array.from([0, 1, 2, 3]),
            '0102'.repeat(16),
            'Wine payment'
        );
        const builder = new Web3StatementBuilder();
        const statement = builder
            .addForVerifiableCredentials([ContractAddress.create(2101), ContractAddress.create(1337, 42)], (b) =>
                b.addRange('b', 80n, 1237n).addMembership('c', ['aa', 'ff', 'zz'])
            )
            .addForIdentityCredentials([0, 1, 2], (b) => b.revealAttribute(AttributeKeyString.firstName))
            .getStatements();
        const anchor = VerifiablePresentationRequestV1.createAnchor(context, statement, {
            somePulicInfo: 'public info',
        });
        const expectedAnchor =
            'a4646861736858203e594af5733889ea6433d851f167f28ac41a12ef5236bd977bdf83815bf0d5d7647479706566434344565241667075626c6963a16d736f6d6550756c6963496e666f6b7075626c696320696e666f6776657273696f6e01';
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
});
