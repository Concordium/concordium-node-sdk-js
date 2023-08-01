import { Buffer } from 'buffer/';
import {
    CIS4,
    CIS4Contract,
    ContractAddress,
    serializeTypeValue,
} from '@concordium/common-sdk';
import { getNodeClientV2 as getNodeClient } from './testHelpers';
// import * as ed25519 from '@noble/ed25519';

const TEST_ACCOUNT = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';

// (async () => {
//     const prv = ed25519.utils.randomPrivateKey();
//     const pub = await ed25519.getPublicKey(prv);
//     console.log(
//         Buffer.from(prv).toString('hex'),
//         Buffer.from(pub).toString('hex')
//     );
// })();

const TEST_HOLDER_KEYPAIR = {
    prv: '3a02247f30b3448438e648190bd08c86ab54743f90593ecd91c51e8e8464f6a5',
    pub: '6da02aced802eb2b5fdc8f180c6bf4adac422fd78ddcfbe177035a5b96157780',
};
const NEW_REVOKER_1_KEYPAIR = {
    prv: '43ec8c08efb05eed2dce1dd3ee8d6974b83e077e03ca8abbcfdccd6d923210cb',
    pub: 'a5bb0b16d22be9b8510c75ef80f808d65897095e6e5dd9335b01c0632c143c6a',
};
const NEW_REVOKER_2_KEYPAIR = {
    prv: 'cbfa761a29b8d11c5a0b421f402dfc498703d40762007876550beae7727c68c2',
    pub: 'b9372d7afffa99f7223c622aac78b5cb199c94f3b961feabd6f776d2d0a10b1c',
};
const WEB3ID_ADDRESS_CREDS: ContractAddress = {
    index: 5565n,
    subindex: 0n,
};
const WEB3ID_ADDRESS_REVOKE: ContractAddress = {
    index: 5587n,
    subindex: 0n,
};

const TEST_BLOCK =
    '1f506da8cc3661c37efae4d51c3b3e56deca2fa8580388c2d2b77b47fd1a853f';

const getCIS4 = (add: ContractAddress) =>
    CIS4Contract.create(getNodeClient(), add);

describe('credentialEntry', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_CREDS);
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
        const cis4 = await getCIS4(WEB3ID_ADDRESS_CREDS);
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
        const cis4 = await getCIS4(WEB3ID_ADDRESS_CREDS);
        const issuer = await cis4.issuer(TEST_BLOCK);

        const expected =
            '359b04cc54be6ff044522f4712ff0e4c90c45c7ca132900f2436b35b0c9bc2d7';
        expect(issuer).toEqual(expected);
    });
});

describe('registryMetadata', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        const metadata = await cis4.registryMetadata(TEST_BLOCK);

        const expected = {
            issuerMetadata: {
                url: 'http://issuer-metadata-url.com',
            },
            credentialType: 'Foo',
            credentialSchema: {
                url: 'http://foo-schema-url.com',
            },
        };
        expect(metadata).toEqual(expected);
    });
});

describe('revocationKeys', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        const rKeys = await cis4.revocationKeys(TEST_BLOCK);

        const expected: CIS4.RevocationKeyWithNonce[] = []; // TODO: deploy version with revocation keys...
        expect(rKeys).toEqual(expected);
    });
});

describe('dryRun.registerCredential', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        const credential: CIS4.CredentialInfo = {
            holderPubKey: TEST_HOLDER_KEYPAIR.pub,
            holderRevocable: true,
            validFrom: new Date('1/1/2023'),
            metadataUrl: {
                url: 'http://issuer-metadata-url.com',
            },
        };
        const auxData = Buffer.from('Hello world!').toString('hex');
        const res = await cis4.dryRun.registerCredential(
            TEST_ACCOUNT,
            credential,
            auxData,
            TEST_BLOCK
        );

        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        const credential: CIS4.CredentialInfo = {
            holderPubKey: TEST_HOLDER_KEYPAIR.pub,
            holderRevocable: true,
            validFrom: new Date('1/1/2023'),
            metadataUrl: {
                url: 'http://issuer-metadata-url.com',
            },
        };
        const auxData = Buffer.from('Hello world!').toString('hex');

        const tx = cis4.createRegisterCredential(
            { energy: 100000n },
            credential,
            auxData
        );

        const schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});

describe('dryRun.registerRevocationKeys', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        let res = await cis4.dryRun.registerRevocationKeys(
            TEST_ACCOUNT,
            NEW_REVOKER_1_KEYPAIR.pub,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');

        res = await cis4.dryRun.registerRevocationKeys(
            TEST_ACCOUNT,
            [NEW_REVOKER_1_KEYPAIR.pub, NEW_REVOKER_2_KEYPAIR.pub],
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        const tx = cis4.createRegisterRevocationKeys({ energy: 100000n }, [
            NEW_REVOKER_1_KEYPAIR.pub,
            NEW_REVOKER_2_KEYPAIR.pub,
        ]);

        const schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});

describe('dryRun.removeRevocationKeys', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        let res = await cis4.dryRun.removeRevocationKeys(
            TEST_ACCOUNT,
            NEW_REVOKER_1_KEYPAIR.pub,
            TEST_BLOCK
        );
        console.log(res);
        expect(res.tag).toBe('success');

        res = await cis4.dryRun.removeRevocationKeys(
            TEST_ACCOUNT,
            [NEW_REVOKER_1_KEYPAIR.pub, NEW_REVOKER_2_KEYPAIR.pub],
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4(WEB3ID_ADDRESS_REVOKE);
        const tx = cis4.createRemoveRevocationKeys({ energy: 100000n }, [
            NEW_REVOKER_1_KEYPAIR.pub,
            NEW_REVOKER_2_KEYPAIR.pub,
        ]);

        const schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});
