import {
    signMessage,
    buildBasicAccountSigner,
    verifyMessageSignature,
} from '../src/signHelpers';
import { AccountAddress, AccountInfo } from '../src';

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

test('test verifyMessageSignature', async () => {
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
            accountCredentials: {
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
            },
        } as unknown as AccountInfo
    );
    expect(signature).toBeTruthy();
});
