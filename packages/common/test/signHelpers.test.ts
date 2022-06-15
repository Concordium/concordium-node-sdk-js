import {
    signMessage,
    buildBasicAccountSigner,
    verifyMessageSignature,
} from '../src/signHelpers';
import { AccountInfo } from '../src';

test('test signMessage', async () => {
    const message = 'test';
    const signature = await signMessage(
        message,
        buildBasicAccountSigner(
            'e1cf504954663e49f4fe884c7c35415b09632cccd82d3d2a62ab2825e67d785d'
        )
    );
    expect(signature[0][0]).toBe(
        '5420cc5a6c956e8a9b47a834d8aaee1176349435f8d172f0255db28a96040eed553d18cd98e2c873bf37a0c1794d382397f68a230485efab1ef16f678008080a'
    );
});

test('test verifyMessageSignature', async () => {
    const message = 'test';
    const signature = await verifyMessageSignature(
        message,
        {
            0: {
                0: '5420cc5a6c956e8a9b47a834d8aaee1176349435f8d172f0255db28a96040eed553d18cd98e2c873bf37a0c1794d382397f68a230485efab1ef16f678008080a',
            },
        },
        {
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
