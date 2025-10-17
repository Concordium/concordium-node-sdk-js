import fs from 'node:fs';

import {
    AttributeKeyString,
    ContractAddress,
    IdentityObjectV1,
    IdentityProvider,
    IpInfo,
} from '../../../src/pub/types.ts';
import {
    ConcordiumHdWallet,
    VerifiablePresentationRequestV1,
    VerifiablePresentationV1,
} from '../../../src/pub/wasm.ts';
import {
    CommitmentInput,
    CredentialRequestStatement,
    IdentityCredentialRequestStatement,
    createAccountDID,
    createIdentityCommitmentInputWithHdWallet,
    createWeb3IdDID,
} from '../../../src/pub/web3-id.ts';
import { BlockHash } from '../../../src/types/index.ts';
import { TESTNET_GLOBAL_CONTEXT, TEST_SEED_1 } from './constants.ts';

test('create testnet account-based presentation v1', () => {
    const requestContext = VerifiablePresentationRequestV1.createContext({
        given: [{ label: 'Nonce', context: Uint8Array.from([0, 1, 2]) }],
        requested: ['BlockHash'],
    });
    const context = VerifiablePresentationV1.createContext(requestContext, [
        { label: 'BlockHash', context: BlockHash.fromHexString('01'.repeat(32)) },
    ]);

    const values: Record<string, string> = {};
    values.dob = '0';
    values.firstName = 'a';

    const statements: CredentialRequestStatement[] = [
        {
            id: createAccountDID(
                'Testnet',
                '94d3e85bbc8ff0091e562ad8ef6c30d57f29b19f17c98ce155df2a30100df4cac5e161fb81aebe3a04300e63f086d0d8'
            ),
            statement: [
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
            ],
        },
    ];
    const inputs: CommitmentInput[] = [
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

    const presentation = VerifiablePresentationV1.create(statements, inputs, context, TESTNET_GLOBAL_CONTEXT);

    const json = JSON.stringify(presentation);
    const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
    expect(presentation).toEqual(roundtrip);
    // TODO: for now we just check that it does not fail - later we need to check the actual values
});

test('create testnet web3Id-based presentation v1', () => {
    const requestContext = VerifiablePresentationRequestV1.createContext({
        given: [{ label: 'Nonce', context: Uint8Array.from([0, 1, 2]) }],
        requested: ['BlockHash'],
    });
    const context = VerifiablePresentationV1.createContext(requestContext, [
        { label: 'BlockHash', context: BlockHash.fromHexString('01'.repeat(32)) },
    ]);

    const randomness: Record<string, string> = {};
    randomness.degreeType = '53573aac0039a54affd939be0ad0c49df6e5a854ce448a73abb2b0534a0a62ba';
    randomness.degreeName = '3917917065f8178e99c954017886f83984247ca16a22b065286de89b54d04610';
    randomness.graduationDate = '0f5a299aeba0cdc16fbaa98f21cab57cfa6dd50f0a2b039393686df7c7ae1561';

    const wallet = ConcordiumHdWallet.fromHex(TEST_SEED_1, 'Testnet');
    const publicKey = wallet.getVerifiableCredentialPublicKey(ContractAddress.create(1), 1).toString('hex');

    const values: Record<string, bigint | string> = {
        degreeName: 'Bachelor of Science and Arts',
        degreeType: 'BachelorDegree',
        graduationDate: '2010-06-01T00:00:00Z',
    };
    const statements: CredentialRequestStatement[] = [
        {
            id: createWeb3IdDID('Testnet', publicKey, 1n, 0n),
            statement: [
                {
                    attributeTag: 'degreeType',
                    type: 'AttributeInSet',
                    set: ['BachelorDegree', 'MasterDegree'],
                },
                {
                    attributeTag: 'degreeName',
                    type: 'RevealAttribute',
                },
            ],
            type: [],
        },
    ];
    const inputs: CommitmentInput[] = [
        {
            type: 'web3Issuer',
            signer: wallet.getVerifiableCredentialSigningKey(ContractAddress.create(1), 1).toString('hex'),
            values,
            randomness,
            signature:
                '40ced1f01109c7a307fffabdbea7eb37ac015226939eddc05562b7e8a29d4a2cf32ab33b2f76dd879ce69fab7ff3752a73800c9ce41da6d38b189dccffa45906',
        },
    ];

    const presentation = VerifiablePresentationV1.create(statements, inputs, context, TESTNET_GLOBAL_CONTEXT);

    const json = JSON.stringify(presentation);
    const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
    expect(presentation).toEqual(roundtrip);
    // TODO: for now we just check that it does not fail - later we need to check the actual values
});

test('create testnet id-based presentation v1', () => {
    const requestContext = VerifiablePresentationRequestV1.createContext({
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

    const statements: IdentityCredentialRequestStatement[] = [
        {
            id: 'ccd:testnet:id:0:0',
            statement: [
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
            ],
        },
    ];

    const presentation = VerifiablePresentationV1.create(statements, [input], context, TESTNET_GLOBAL_CONTEXT);

    const json = JSON.stringify(presentation);
    const roundtrip = VerifiablePresentationV1.fromJSON(JSON.parse(json));
    expect(presentation).toEqual(roundtrip);
    // TODO: for now we just check that it does not fail - later we need to check the actual values
});
