import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import {
    AttributeKeyString,
    CredentialRegistrationId,
    IdentityObjectV1,
    IdentityProvider,
    IpInfo,
} from '../../../src/pub/types.ts';
import { ConcordiumHdWallet, VerifiablePresentationV1, VerificationRequestV1 } from '../../../src/pub/wasm.ts';
import { createIdentityCommitmentInputWithHdWallet } from '../../../src/pub/web3-id.ts';
import { BlockHash } from '../../../src/types/index.ts';
import { TESTNET_GLOBAL_CONTEXT, TEST_SEED_1 } from './constants.ts';

const presentationFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerifiablePresentationV1.json')).toString()
);

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

describe('VerifiablePresentationV1', () => {
    test('create testnet account-based presentation v1', () => {
        const requestContext = VerificationRequestV1.createContext({
            given: [{ label: 'Nonce', context: Uint8Array.from([0, 1, 2]) }],
            requested: ['BlockHash'],
        });
        const context = VerifiablePresentationV1.createContext(requestContext, [
            { label: 'BlockHash', context: BlockHash.fromHexString('01'.repeat(32)) },
        ]);

        const values: Record<string, string> = {};
        values.dob = '0';
        values.firstName = 'a';

        const statements: VerifiablePresentationV1.SubjectClaims[] = [
            VerifiablePresentationV1.createAccountClaims(
                'Testnet',
                CredentialRegistrationId.fromHexString(
                    '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100df4cac5e161fb81aebe3a04300e63f086d0d8'
                ),
                [
                    {
                        attributeTag: AttributeKeyString.dob,
                        lower: '81',
                        type: 'AttributeInRange',
                        upper: '1231',
                    },
                    {
                        attributeTag: AttributeKeyString.firstName,
                        type: 'RevealAttribute',
                    },
                ]
            ),
        ];
        const inputs: VerifiablePresentationV1.CommitmentInput[] = [
            {
                type: 'account',
                issuer: 1,
                values,
                randomness: {
                    dob: '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
                    firstName: '575851a4e0558d589a57544a4a9f5ad1bd8467126c1b6767d32f633ea03380e6',
                },
            },
        ];

        const presentation = VerifiablePresentationV1.create(
            { subjectClaims: statements, context: context },
            inputs,
            TESTNET_GLOBAL_CONTEXT
        );

        const json = JSON.stringify(presentation);
        const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
        expect(presentation).toEqual(roundtrip);
        // TODO: for now we just check that it does not fail - later we need to check the actual values
    });

    test('create testnet id-based presentation v1', () => {
        const requestContext = VerificationRequestV1.createContext({
            given: [{ label: 'Nonce', context: Uint8Array.from([0, 1, 2]) }],
            requested: ['BlockHash'],
        });
        const context = VerifiablePresentationV1.createContext(requestContext, [
            { label: 'BlockHash', context: BlockHash.fromHexString('01'.repeat(32)) },
        ]);

        const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
        const idObject: IdentityObjectV1 = JSON.parse(
            fs.readFileSync('./test/ci/resources/identity-object.json').toString()
        ).value;
        const ipInfo: IpInfo = JSON.parse(fs.readFileSync('./test/ci/resources/ip_info.json').toString()).value;

        const inputContext: IdentityProvider = {
            ipInfo,
            arsInfos: {
                [1]: {
                    arPublicKey: '0102',
                    arIdentity: 0,
                    arDescription: { description: 'test', name: 'test', url: 'https://ar.com' },
                },
            },
        };
        const input = createIdentityCommitmentInputWithHdWallet(idObject, inputContext, 0, wallet);

        const statements: VerifiablePresentationV1.SubjectClaims[] = [
            VerifiablePresentationV1.createIdentityClaims('Testnet', 0, [
                {
                    attributeTag: AttributeKeyString.dob,
                    lower: '81',
                    type: 'AttributeInRange',
                    upper: '1231',
                },
                {
                    attributeTag: AttributeKeyString.firstName,
                    type: 'RevealAttribute',
                },
            ]),
        ];

        const presentation = VerifiablePresentationV1.create(
            { context, subjectClaims: statements },
            [input],
            TESTNET_GLOBAL_CONTEXT
        );

        const json = JSON.stringify(presentation);
        const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
        expect(presentation).toEqual(roundtrip);
        // TODO: for now we just check that it does not fail - later we need to check the actual values
    });

    it('should match the JSON fixture representation', () => {
        const presentation = VerifiablePresentationV1.fromJSON(
            presentationFixture as unknown as VerifiablePresentationV1.JSON
        );

        const json = presentation.toJSON();
        const jsonString = JSONBig.stringify(json);
        const expectedJsonString = JSONBig.stringify(presentationFixture);

        expect(jsonString).toBe(expectedJsonString);
    });

    it('should deserialize from JSON fixture representation', () => {
        const presentation = VerifiablePresentationV1.fromJSON(
            presentationFixture as unknown as VerifiablePresentationV1.JSON
        );
        expect(presentation.toJSON()).toEqual(presentationFixture);
    });
});
