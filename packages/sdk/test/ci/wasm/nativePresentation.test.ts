import { stringify } from '../../../src/json-bigint.js';
import { loadBindings } from '../../../src/react-native/bindings.js';
import { verifyPresentationV1 } from '../../../src/react-native/presentation.js';
import { fromJSON } from '../../../src/wasm/VerifiablePresentationV1/proof.js';
import type { RequestJSON } from '../../../src/wasm/VerifiablePresentationV1/proof.js';
import { TESTNET_GLOBAL_CONTEXT } from './constants.js';

jest.mock('../../../src/react-native/bindings.js');

test('native V1 presentation verification preserves integer attributes as bigints', async () => {
    const request: RequestJSON = {
        type: 'ConcordiumVerifiablePresentationRequestV1',
        context: { type: 'ConcordiumContextInformationV1', given: [], requested: [] },
        subjectClaims: [
            {
                type: ['ConcordiumSubjectClaimsV1', 'ConcordiumIdBasedSubjectClaims'],
                issuer: 'did:ccd:testnet:idp:0',
                statement: [{ type: 'AttributeValue', attributeTag: 'test', attributeValue: 42n }],
            },
        ],
    };
    (loadBindings as jest.Mock).mockResolvedValue({
        verifyPresentationV1: async () => stringify(request),
    });

    const presentation = fromJSON({
        type: ['VerifiablePresentation', 'ConcordiumVerifiablePresentationV1'],
        presentationContext: request.context,
        verifiableCredential: [],
        proof: { type: 'ConcordiumWeakLinkingProofV1', proofValue: '', created: '' },
    });
    const verified = await verifyPresentationV1({
        presentation,
        globalContext: TESTNET_GLOBAL_CONTEXT,
        publicData: [],
    });
    expect(verified.subjectClaims[0].statement[0]).toMatchObject({ attributeValue: 42n });
});
