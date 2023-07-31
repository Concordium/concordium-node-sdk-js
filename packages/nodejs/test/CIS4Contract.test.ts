import { CIS4, CIS4Contract, ContractAddress } from '@concordium/common-sdk';
import { getNodeClientV2 as getNodeClient } from './testHelpers';

const WEB3ID_ADDRESS: ContractAddress = {
    index: 5565n,
    subindex: 0n,
};

const TEST_BLOCK =
    '86d0956c6d0c461f2f109242add9a31c10d954c9a1922b3fbd2771ae5bb1cff8';

const getCIS4 = () => CIS4Contract.create(getNodeClient(), WEB3ID_ADDRESS);

describe('credentialEntry', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const credentialEntry = await cis4.credentialEntry(
            '32bc71e7930dd4c00fabdf5f692d22375f4061b75a47504bdc35b5615f68edaa',
            TEST_BLOCK
        );

        const expected: CIS4.CredentialEntry = {
            credentialInfo: {
                holderPubKey:
                    '32bc71e7930dd4c00fabdf5f692d22375f4061b75a47504bdc35b5615f68edaa',
                holderRevocable: true,
                validFrom: new Date('2023-07-31T07:54:45.454Z'),
                validUntil: undefined,
                metadataUrl: {
                    url: 'http://127.0.0.1/json-schemas/credential-metadata.json',
                },
            },
            schemaRef: {
                url: 'http://127.0.0.1/json-schemas/JsonSchema2023-some.json',
            },
            revocationNonce: 0n,
        };
        expect(credentialEntry).toEqual(expected);
    });
});

describe('credentialStatus', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const credentialStatus = await cis4.credentialStatus(
            '32bc71e7930dd4c00fabdf5f692d22375f4061b75a47504bdc35b5615f68edaa',
            TEST_BLOCK
        );

        const expected: CIS4.CredentialStatus = CIS4.CredentialStatus.Active;
        expect(credentialStatus).toEqual(expected);
    });
});

describe('issuer', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const issuer = await cis4.issuer(TEST_BLOCK);

        const expected =
            '359b04cc54be6ff044522f4712ff0e4c90c45c7ca132900f2436b35b0c9bc2d7';
        expect(issuer).toEqual(expected);
    });
});

describe('registryMetadata', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const metadata = await cis4.registryMetadata(TEST_BLOCK);

        const expected = {
            issuerMetadata: {
                url: 'http://127.0.0.1/json-schemas/credential-matadata.json',
            },
            credentialType: 'SoMe',
            credentialSchema: {
                url: 'http://127.0.0.1/json-schemas/JsonSchema2023-some.json',
            },
        };
        expect(metadata).toEqual(expected);
    });
});

describe('revocationKeys', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const rKeys = await cis4.revocationKeys(TEST_BLOCK);

        const expected: CIS4.RevocationKeyWithNonce[] = []; // TODO: deploy version with revocation keys...
        expect(rKeys).toEqual(expected);
    });
});
