import { Buffer } from 'buffer/';
import {
    CIS4,
    CIS4Contract,
    ContractAddress,
    serializeTypeValue,
} from '@concordium/common-sdk';
import { getNodeClientV2 as getNodeClient } from './testHelpers';
// import * as ed25519 from '@noble/ed25519';

const ISSUER_ACCOUNT = '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd';
const ISSUER_PUB_KEY =
    '23e7b282e69f39f962fa587eb033ca201e09d59c9740f18d5666b390fea9d486';

// (async () => {
//     const prv = ed25519.utils.randomPrivateKey();
//     const pub = await ed25519.getPublicKey(prv);
//     console.log(
//         Buffer.from(prv).toString('hex'),
//         Buffer.from(pub).toString('hex')
//     );
// })();

const HOLDER_KEYPAIR = {
    prv: 'ea7f032449ee98fa076369e14424d54aad28ec47b1a3f6e95c50d5b2fe63c38d',
    pub: '67964cdcc3462f9dbf2e1b5aaaae402605432a9d577c3cbf7a9f2c4237c3a459',
};
const NEW_HOLDER_KEYPAIR = {
    prv: '3a02247f30b3448438e648190bd08c86ab54743f90593ecd91c51e8e8464f6a5',
    pub: '6da02aced802eb2b5fdc8f180c6bf4adac422fd78ddcfbe177035a5b96157780',
};
const REVOKER_KEYPAIR = {
    prv: 'c678454d82655544bb12954620ce1b2d8d827347f1870a6ba7f43cabdee8361b',
    pub: '8a2cb33d95335a51a3ce332b3ff3c9f9dd06b05c91b81f078211862e367ff59e',
};
const NEW_REVOKER_1_KEYPAIR = {
    prv: '43ec8c08efb05eed2dce1dd3ee8d6974b83e077e03ca8abbcfdccd6d923210cb',
    pub: 'a5bb0b16d22be9b8510c75ef80f808d65897095e6e5dd9335b01c0632c143c6a',
};
const NEW_REVOKER_2_KEYPAIR = {
    prv: 'cbfa761a29b8d11c5a0b421f402dfc498703d40762007876550beae7727c68c2',
    pub: 'b9372d7afffa99f7223c622aac78b5cb199c94f3b961feabd6f776d2d0a10b1c',
};
const WEB3ID_ADDRESS_REVOKE: ContractAddress = {
    index: 5587n,
    subindex: 0n,
};

const TEST_BLOCK =
    'ae1abd765e17f9c450ff527097698ac7af9b630775ca8e79bf85579b65216b17';

const getCIS4 = () =>
    CIS4Contract.create(getNodeClient(), WEB3ID_ADDRESS_REVOKE);

describe('credentialEntry', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const credentialEntry = await cis4.credentialEntry(
            HOLDER_KEYPAIR.pub,
            TEST_BLOCK
        );

        const expected: CIS4.CredentialEntry = {
            credentialInfo: {
                holderPubKey:
                    '67964cdcc3462f9dbf2e1b5aaaae402605432a9d577c3cbf7a9f2c4237c3a459',
                holderRevocable: false,
                validFrom: new Date('2023-08-01T12:58:50.239Z'),
                validUntil: new Date('2025-08-01T12:58:50.239Z'),
                metadataUrl: { url: '' },
            },
            schemaRef: { url: 'http://foo-schema-url.com' },
            revocationNonce: 0n,
        };
        expect(credentialEntry).toEqual(expected);
    });
});

describe('credentialStatus', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const credentialStatus = await cis4.credentialStatus(
            HOLDER_KEYPAIR.pub,
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

        const expected = ISSUER_PUB_KEY;
        expect(issuer).toEqual(expected);
    });
});

describe('registryMetadata', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
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
        const cis4 = await getCIS4();
        const rKeys = await cis4.revocationKeys(TEST_BLOCK);

        const expected: CIS4.RevocationKeyWithNonce[] = [
            {
                key: '00008a2cb33d95335a51a3ce332b3ff3c9f9dd06b05c91b81f078211862e367f',
                nonce: 40693n,
            },
        ];
        expect(rKeys).toEqual(expected);
    });
});

describe('registerCredential', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4();
        const credential: CIS4.CredentialInfo = {
            holderPubKey: NEW_HOLDER_KEYPAIR.pub,
            holderRevocable: true,
            validFrom: new Date('1/1/2023'),
            metadataUrl: {
                url: 'http://issuer-metadata-url.com',
            },
        };
        const auxData = Buffer.from('Hello world!').toString('hex');
        const res = await cis4.dryRun.registerCredential(
            ISSUER_ACCOUNT,
            credential,
            auxData,
            TEST_BLOCK
        );

        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();
        const credential: CIS4.CredentialInfo = {
            holderPubKey: NEW_HOLDER_KEYPAIR.pub,
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

describe('registerRevocationKeys', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4();
        let res = await cis4.dryRun.registerRevocationKeys(
            ISSUER_ACCOUNT,
            NEW_REVOKER_1_KEYPAIR.pub,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');

        res = await cis4.dryRun.registerRevocationKeys(
            ISSUER_ACCOUNT,
            [NEW_REVOKER_1_KEYPAIR.pub, NEW_REVOKER_2_KEYPAIR.pub],
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();
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

describe('removeRevocationKeys', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4();
        const res = await cis4.dryRun.removeRevocationKeys(
            ISSUER_ACCOUNT,
            REVOKER_KEYPAIR.pub,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();
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
