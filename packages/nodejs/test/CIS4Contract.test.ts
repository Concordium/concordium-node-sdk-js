import { Buffer } from 'buffer/index.js';
import {
    AccountAddress,
    ContractAddress,
    Timestamp,
} from '@concordium/common-sdk';
import { serializeTypeValue } from '@concordium/common-sdk/schema';
import { CIS4, CIS4Contract, Web3IdSigner } from '@concordium/common-sdk/cis4';
import { getNodeClientV2 as getNodeClient } from './testHelpers.js';

const ISSUER_ACCOUNT = AccountAddress.fromBase58(
    '4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd'
);
const ISSUER_PUB_KEY =
    '23e7b282e69f39f962fa587eb033ca201e09d59c9740f18d5666b390fea9d486';

const HOLDER_KEYPAIR = {
    prv: 'df37c498bc038cedbb61b9c523f80d6bd4f8e13bddddc0be2d201cc08bb6b8ac',
    pub: '6e8aef0cb3a4bf141e17025f1525367bb8ffd41c08e3ea09a675386baea4d0c9',
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
const WEB3ID_ADDRESS_REVOKE = ContractAddress.create(5587);

const TEST_BLOCK =
    'bf956ef81bb6a22eda754d490bdb7a3085318b3a1fe9370f83f86649a5f7cb60';

const getCIS4 = () =>
    CIS4Contract.create(getNodeClient(), WEB3ID_ADDRESS_REVOKE);

const in5Minutes = () => new Date(Date.now() + 1000 * 60 * 5);

describe('credentialEntry', () => {
    test('Deserializes correctly', async () => {
        const cis4 = await getCIS4();
        const credentialEntry = await cis4.credentialEntry(
            HOLDER_KEYPAIR.pub,
            TEST_BLOCK
        );

        const expected: CIS4.CredentialEntry = {
            credentialInfo: {
                holderPubKey: HOLDER_KEYPAIR.pub,
                holderRevocable: true,
                validFrom: Timestamp.fromDate(
                    new Date('2023-08-01T13:47:02.260Z')
                ),
                validUntil: Timestamp.fromDate(
                    new Date('2023-08-01T13:47:02.260Z')
                ),
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
            validFrom: Timestamp.fromDate(new Date('1/1/2023')),
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
            validFrom: Timestamp.fromDate(new Date('1/1/2023')),
            metadataUrl: {
                url: 'http://issuer-metadata-url.com',
            },
        };

        let tx = cis4.createRegisterCredential({ energy: 100000n }, credential);
        let schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With `validUntil` + !`holderRevocable`
        credential.validUntil = Timestamp.fromDate(
            new Date(new Date().setFullYear(new Date().getFullYear() + 1))
        );
        credential.holderRevocable = false;

        tx = cis4.createRegisterCredential({ energy: 100000n }, credential);
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With data
        const auxData = Buffer.from('Hello world!').toString('hex');

        tx = cis4.createRegisterCredential(
            { energy: 100000n },
            credential,
            auxData
        );
        schemaSerial = serializeTypeValue(
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
        const res = await cis4.dryRun.registerRevocationKeys(
            ISSUER_ACCOUNT,
            NEW_REVOKER_1_KEYPAIR.pub,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();

        // Single key
        let tx = cis4.createRegisterRevocationKeys(
            { energy: 100000n },
            NEW_REVOKER_1_KEYPAIR.pub
        );
        let schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // Multilple keys
        tx = cis4.createRegisterRevocationKeys({ energy: 100000n }, [
            NEW_REVOKER_1_KEYPAIR.pub,
            NEW_REVOKER_2_KEYPAIR.pub,
        ]);
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With data
        tx = cis4.createRegisterRevocationKeys(
            { energy: 100000n },
            [NEW_REVOKER_1_KEYPAIR.pub, NEW_REVOKER_2_KEYPAIR.pub],
            Buffer.from('Test').toString('hex')
        );
        schemaSerial = serializeTypeValue(
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

        let tx = cis4.createRemoveRevocationKeys(
            { energy: 100000n },
            REVOKER_KEYPAIR.pub
        );
        let schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // Multiple keys
        tx = cis4.createRemoveRevocationKeys({ energy: 100000n }, [
            REVOKER_KEYPAIR.pub,
            NEW_REVOKER_1_KEYPAIR.pub,
        ]);
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With data
        tx = cis4.createRemoveRevocationKeys(
            { energy: 100000n },
            [REVOKER_KEYPAIR.pub, NEW_REVOKER_1_KEYPAIR.pub],
            Buffer.from('Test').toString('hex')
        );
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});

describe('revokeCredentialAsIssuer', () => {
    test('Invokes successfully', async () => {
        const cis4 = await getCIS4();
        const res = await cis4.dryRun.revokeCredentialAsIssuer(
            ISSUER_ACCOUNT,
            HOLDER_KEYPAIR.pub,
            undefined,
            undefined,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();

        let tx = cis4.createRevokeCredentialAsIssuer(
            { energy: 100000n },
            HOLDER_KEYPAIR.pub,
            undefined,
            undefined
        );
        let schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With reason
        tx = cis4.createRevokeCredentialAsIssuer(
            { energy: 100000n },
            HOLDER_KEYPAIR.pub,
            'Because test...',
            undefined
        );
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With data
        tx = cis4.createRevokeCredentialAsIssuer(
            { energy: 100000n },
            HOLDER_KEYPAIR.pub,
            undefined,
            Buffer.from('Is anyone watching?').toString('hex')
        );
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});

describe('revokeCredentialAsHolder', () => {
    const signer = new Web3IdSigner(HOLDER_KEYPAIR.prv, HOLDER_KEYPAIR.pub);

    test('Invokes successfully', async () => {
        const cis4 = await getCIS4();
        const res = await cis4.dryRun.revokeCredentialAsHolder(
            ISSUER_ACCOUNT,
            signer,
            0n,
            in5Minutes(),
            undefined,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();

        let tx = await cis4.createRevokeCredentialAsHolder(
            { energy: 100000n },
            signer,
            0n,
            in5Minutes(),
            undefined
        );
        let schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With reason
        tx = await cis4.createRevokeCredentialAsHolder(
            { energy: 100000n },
            signer,
            0n,
            in5Minutes(),
            'Because test...'
        );
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});

describe('revokeCredentialAsOther', () => {
    const signer = new Web3IdSigner(REVOKER_KEYPAIR.prv, REVOKER_KEYPAIR.pub);

    test('Invokes successfully', async () => {
        const cis4 = await getCIS4();
        const res = await cis4.dryRun.revokeCredentialAsOther(
            ISSUER_ACCOUNT,
            signer,
            HOLDER_KEYPAIR.pub,
            0n,
            in5Minutes(),
            undefined,
            TEST_BLOCK
        );
        expect(res.tag).toBe('success');
    });

    test('Manual serialization matches schema serialization', async () => {
        const cis4 = await getCIS4();

        let tx = await cis4.createRevokeCredentialAsOther(
            { energy: 100000n },
            signer,
            HOLDER_KEYPAIR.pub,
            0n,
            in5Minutes(),
            undefined
        );
        let schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));

        // With reason
        tx = await cis4.createRevokeCredentialAsOther(
            { energy: 100000n },
            signer,
            HOLDER_KEYPAIR.pub,
            0n,
            in5Minutes(),
            'Because test...'
        );
        schemaSerial = serializeTypeValue(
            tx.parameter.json,
            Buffer.from(tx.schema.value, 'base64'),
            true
        );
        expect(tx.parameter.hex).toEqual(schemaSerial.toString('hex'));
    });
});
