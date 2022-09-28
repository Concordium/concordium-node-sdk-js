import {
    signMessage,
    buildBasicAccountSigner,
    verifyMessageSignature,
} from '../src/signHelpers';
import { AccountAddress, AccountInfo } from '../src';

const TEST_CREDENTIALS = {
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

test('test signMessage', async () => {
    const account = new AccountAddress(
        '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5'
    );
    const message = 'test';
    const signature = await signMessage(
        account,
        message,
        buildBasicAccountSigner(
            'e1cf504954663e49f4fe884c7c35415b09632cccd82d3d2a62ab2825e67d785d'
        )
    );
    expect(signature[0][0]).toBe(
        '445197d79ca90d8cc8440328dac9f307932ade0c03cc7aa575b59b746e26e5f1bca13ade5ff7a56e918ba5a32450fdf52b034cd2580929b21213263e81f7f809'
    );
});

test('verifyMessageSignature returns true on the correct address/signature', async () => {
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
                '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5',
            accountThreshold: 1,
            accountCredentials: TEST_CREDENTIALS,
        } as unknown as AccountInfo
    );
    expect(signature).toBeTruthy();
});

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
            accountCredentials: TEST_CREDENTIALS,
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
            accountAddress:
                '3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5',
            accountThreshold: 1,
            accountCredentials: TEST_CREDENTIALS,
        } as unknown as AccountInfo
    );
    expect(signature).toBeFalsy();
});
