import {
    signMessage,
    buildBasicAccountSigner,
    verifyMessageSignature,
} from '../src/signHelpers';
import {
    AccountAddress,
    AccountInfo,
    buildAccountSigner,
    SimpleAccountKeys,
} from '../src';

const TEST_ACCOUNT_SINGLE =
    '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5';
const TEST_ACCOUNT_MULTI = '4hTGW1Uz6u2hUgEtwWjJUdZQncVpHGWZPgGdRpgL1VNn5NzyHd';

const TEST_KEY_SINGLE =
    'e1cf504954663e49f4fe884c7c35415b09632cccd82d3d2a62ab2825e67d785d';
const TEST_KEYS_MULTI: SimpleAccountKeys = {
    0: {
        0: '671eb13486ea747a1c27984aca67778508dcf54bdac00a32fd138ef69ad2e5b5',
        1: '76cc8d4202810aa60109435d83357751f3108d00d27d0d6cae07ab536cf6731d',
        2: '131a05cab3b2b18a867ae3e245881cb0f2cf2924ae33a9fa948d1451c2bd8707',
    },
};

const TEST_CREDENTIALS_SINGLE = {
    0: {
        value: {
            contents: {
                credentialPublicKeys: {
                    keys: {
                        0: {
                            verifyKey:
                                'fef5414fc757cd4694bf0c7ea436f015cb7f87a80d08e1d1085b9cc91f13f376',
                            schemeId: 'Ed25519',
                        },
                    },
                    threshold: 1,
                },
            },
        },
    },
};
const TEST_CREDENTIALS_MULTI = {
    0: {
        value: {
            contents: {
                credentialPublicKeys: {
                    keys: {
                        0: {
                            schemeId: 'Ed25519',
                            verifyKey:
                                '008739a5c6708b25c359d45179fefda7ef1345099c0ad8e9b66ed253d968098d',
                        },
                        1: {
                            schemeId: 'Ed25519',
                            verifyKey:
                                '45b55ad7438cb72c06489be231443cb3b7708f9b3f770729e2092f78ea9e2d9d',
                        },
                        2: {
                            schemeId: 'Ed25519',
                            verifyKey:
                                'ed2f710f6edbf65806eaee6d643a12124332a6dc687be099b63fd0150294168d',
                        },
                    },
                    threshold: 3,
                },
            },
        },
    },
};

const testEachMessageType = test.each(['test', Buffer.from('test', 'utf8')]);

testEachMessageType('[%o] test signMessage', async (message) => {
    const sign = () => signMessage(account, message, signer);

    let account = new AccountAddress(TEST_ACCOUNT_SINGLE);
    let signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
    let signature = await sign();
    expect(signature[0][0]).toBe(
        '445197d79ca90d8cc8440328dac9f307932ade0c03cc7aa575b59b746e26e5f1bca13ade5ff7a56e918ba5a32450fdf52b034cd2580929b21213263e81f7f809'
    );

    account = new AccountAddress(TEST_ACCOUNT_MULTI);
    signer = buildAccountSigner(TEST_KEYS_MULTI);
    signature = await sign();

    expect(signature).toEqual({
        0: {
            0: '37798d551f26f48496a3d14aee0d29f5bb6a1dc99a75c06b5a8be4f901ba8e6e7c32a7461bd419f481115e647a43d43075f0ccb000627eaa2329eed81582fc02',
            1: '36fc3a13869535a934adb61809b010dd015126920c24032dfcde1c3883151bc61219f2582564f1e13d743a34ce762925d6171685a1fec62e1cbf731e551a430f',
            2: '024c91adf278e9018f27546da73acf865823989b2385dd9575743c1390dda1afa47e85894ac2324bd9cd5459393b69a18787c18262ac90d65b404245491c6b0c',
        },
    });
});

testEachMessageType(
    '[%o] verifyMessageSignature returns true on the correct address/signature',
    async (message) => {
        const signatureSingle = await verifyMessageSignature(
            message,
            {
                0: {
                    0: '445197d79ca90d8cc8440328dac9f307932ade0c03cc7aa575b59b746e26e5f1bca13ade5ff7a56e918ba5a32450fdf52b034cd2580929b21213263e81f7f809',
                },
            },
            {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo
        );
        expect(signatureSingle).toBeTruthy();

        const signatureMutli = await verifyMessageSignature(
            message,
            {
                0: {
                    0: '37798d551f26f48496a3d14aee0d29f5bb6a1dc99a75c06b5a8be4f901ba8e6e7c32a7461bd419f481115e647a43d43075f0ccb000627eaa2329eed81582fc02',
                    1: '36fc3a13869535a934adb61809b010dd015126920c24032dfcde1c3883151bc61219f2582564f1e13d743a34ce762925d6171685a1fec62e1cbf731e551a430f',
                    2: '024c91adf278e9018f27546da73acf865823989b2385dd9575743c1390dda1afa47e85894ac2324bd9cd5459393b69a18787c18262ac90d65b404245491c6b0c',
                },
            },
            {
                accountAddress: TEST_ACCOUNT_MULTI,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_MULTI,
            } as unknown as AccountInfo
        );
        expect(signatureMutli).toBeTruthy();
    }
);

test('verifyMessageSignature returns false on the incorrect address', async () => {
    const message = 'test';
    const signature = await verifyMessageSignature(
        message,
        {
            0: {
                0: '445197d79ca90d8cc8440328dac9f307932ade0c03cc7aa575b59b746e26e5f1bca13ade5ff7a56e918ba5a32450fdf52b034cd2580929b21213263e81f7f809',
            },
        },
        {
            accountAddress:
                '3dbRxtzhb8MotFBgH5DcdFJy7t4we4N8Ep6Mxdha8XvLhq7YmZ',
            accountThreshold: 1,
            accountCredentials: TEST_CREDENTIALS_SINGLE,
        } as unknown as AccountInfo
    );
    expect(signature).toBeFalsy();
});

test('verifyMessageSignature returns false on the incorrect signature', async () => {
    const message = 'test';
    const signature = await verifyMessageSignature(
        message,
        {
            0: {
                0: 'b54e4c5f894deb951621b9c13e8f96a4176626265e7bcf5ec197e8ee74ef8464cd32cff4085b0d741fae7cba97fc559ff66adc7c0cdb305d89c5a5d7e657f407',
            },
        },
        {
            accountAddress: TEST_ACCOUNT_SINGLE,
            accountThreshold: 1,
            accountCredentials: TEST_CREDENTIALS_SINGLE,
        } as unknown as AccountInfo
    );
    expect(signature).toBeFalsy();
});

testEachMessageType(
    '[%o] verifyMessageSignature returns false on not enough signatures',
    async (message) => {
        const signature = await verifyMessageSignature(
            message,
            {
                0: {
                    0: '37798d551f26f48496a3d14aee0d29f5bb6a1dc99a75c06b5a8be4f901ba8e6e7c32a7461bd419f481115e647a43d43075f0ccb000627eaa2329eed81582fc02',
                    1: '36fc3a13869535a934adb61809b010dd015126920c24032dfcde1c3883151bc61219f2582564f1e13d743a34ce762925d6171685a1fec62e1cbf731e551a430f',
                },
            },
            {
                accountAddress: TEST_ACCOUNT_MULTI,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_MULTI,
            } as unknown as AccountInfo
        );
        expect(signature).toBeFalsy();
    }
);
