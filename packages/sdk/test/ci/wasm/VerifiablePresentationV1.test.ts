import _JB from 'json-bigint';
import fs from 'node:fs';
import path from 'node:path';

import {
    AttributeKeyString,
    AttributesKeys,
    CredentialRegistrationId,
    IdentityObjectV1,
    IdentityProvider,
    IpInfo,
} from '../../../src/pub/types.ts';
import {
    ConcordiumHdWallet,
    VerifiableCredentialV1,
    VerifiablePresentationV1,
    VerificationRequestV1,
} from '../../../src/pub/wasm.ts';
import { createIdentityCommitmentInputWithHdWallet } from '../../../src/pub/web3-id.ts';
import { BlockHash } from '../../../src/types/index.ts';
import { ID_0_0_0, PUBLIC_0_0_0, TESTNET_GLOBAL_CONTEXT, TESTNET_IP_0, TEST_SEED } from './constants.ts';

const presentationFixture = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, './fixtures/VerifiablePresentationV1.json')).toString()
);

const JSONBig = _JB({ alwaysParseAsBig: true, useNativeBigInt: true });

const WALLET = ConcordiumHdWallet.fromHex(TEST_SEED, 'Testnet');

describe('VerifiablePresentationV1', () => {
    test('Create testnet account-based presentation v1', () => {
        const requestContext = VerificationRequestV1.createContext({
            given: [{ label: 'Nonce', context: Uint8Array.from([0, 1, 2]) }],
            requested: ['BlockHash'],
        });
        const context = VerifiablePresentationV1.createContext(requestContext, [
            { label: 'BlockHash', context: BlockHash.fromHexString('01'.repeat(32)) },
        ]);

        const credRegId = WALLET.getCredentialId(0, 0, 0, TESTNET_GLOBAL_CONTEXT);
        const values: Record<string, string> = ID_0_0_0.attributeList.chosenAttributes;

        const claims: VerifiablePresentationV1.SubjectClaims = VerifiablePresentationV1.createAccountClaims(
            'Testnet',
            CredentialRegistrationId.fromHexString(credRegId.toString('hex')),
            0,
            VerifiablePresentationV1.revealRequestedStatements(
                [
                    {
                        attributeTag: AttributeKeyString.dob,
                        lower: '19500101',
                        type: 'AttributeInRange',
                        upper: '20000101',
                    },
                    {
                        attributeTag: AttributeKeyString.firstName,
                        type: 'RevealAttribute',
                    },
                ],
                values
            )
        );
        const inputs: VerifiablePresentationV1.CommitmentInput = {
            type: 'account',
            issuer: 0,
            values,
            randomness: {
                dob: WALLET.getAttributeCommitmentRandomness(0, 0, 0, AttributesKeys.dob).toString('hex'),
                firstName: WALLET.getAttributeCommitmentRandomness(0, 0, 0, AttributesKeys.firstName).toString('hex'),
            },
        };

        const presentation = VerifiablePresentationV1.create(
            { subjectClaims: [claims], context: context },
            [inputs],
            TESTNET_GLOBAL_CONTEXT
        );

        const json = JSON.stringify(presentation);
        const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
        expect(presentation).toEqual(roundtrip);

        const publicData: VerifiableCredentialV1.AccountVerificationMaterial = {
            type: 'account',
            issuer: 0,
            commitments: PUBLIC_0_0_0.commitments.cmmAttributes,
        };

        const result = VerifiablePresentationV1.verify(presentation, TESTNET_GLOBAL_CONTEXT, [publicData]);
        expect(result.type).toBe('success');
    });

    test('Create testnet id-based presentation v1', () => {
        const requestContext = VerificationRequestV1.createContext({
            given: [{ label: 'Nonce', context: Uint8Array.from([0, 1, 2]) }],
            requested: ['BlockHash'],
        });
        const context = VerifiablePresentationV1.createContext(requestContext, [
            { label: 'BlockHash', context: BlockHash.fromHexString('01'.repeat(32)) },
        ]);

        const wallet = ConcordiumHdWallet.fromHex(TEST_SEED, 'Testnet');
        const idObject: IdentityObjectV1 = ID_0_0_0;
        const ipInfo: IpInfo = TESTNET_IP_0.ipInfo;

        const arsInfos = TESTNET_IP_0.arsInfos;
        const inputContext: IdentityProvider = {
            ipInfo,
            arsInfos,
        };
        const input = createIdentityCommitmentInputWithHdWallet(idObject, inputContext, 0, wallet);

        const statements: VerifiablePresentationV1.SubjectClaims[] = [
            VerifiablePresentationV1.createIdentityClaims(
                'Testnet',
                0,
                VerifiablePresentationV1.revealRequestedStatements(
                    [
                        {
                            attributeTag: AttributeKeyString.dob,
                            lower: '19500101',
                            type: 'AttributeInRange',
                            upper: '20000101',
                        },
                        {
                            attributeTag: AttributeKeyString.firstName,
                            type: 'RevealAttribute',
                        },
                    ],
                    idObject.attributeList.chosenAttributes
                )
            ),
        ];

        const presentation = VerifiablePresentationV1.create(
            { context, subjectClaims: statements },
            [input],
            TESTNET_GLOBAL_CONTEXT
        );

        const json = JSON.stringify(presentation);
        const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
        expect(presentation).toEqual(roundtrip);

        const publicData: VerifiableCredentialV1.IdentityVerificationMaterial = {
            type: 'identity',
            ipInfo,
            arsInfos,
        };

        const result = VerifiablePresentationV1.verify(presentation, TESTNET_GLOBAL_CONTEXT, [publicData]);
        expect(result.type).toBe('success');
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
