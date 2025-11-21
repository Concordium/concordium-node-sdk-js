import { Transaction } from '../../../../src/pub/transactions.ts';
import {
    AccountAddress,
    AccountInfo,
    CcdAmount,
    SequenceNumber,
    SimpleAccountKeys,
    TransactionExpiry,
    buildAccountSigner,
    buildBasicAccountSigner,
} from '../../../../src/pub/types.js';
import { assert } from '../../../../src/util.ts';

describe('Transaction.Signable', () => {
    const senderAddress = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const recipientAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

    const metadata = {
        sender: senderAddress,
        nonce: SequenceNumber.create(1n),
        expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
    };
    describe('addSignature', () => {
        test('fails when signature count exceeds numSignatures in header', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2)
                .build();

            const signature = {
                0: {
                    0: 'signature1',
                    1: 'signature2',
                    2: 'signature3',
                },
            };

            expect(() => Transaction.addSignature(tx, signature)).toThrow();
        });

        test('succeeds when signature count equals numSignatures', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2)
                .build();

            const signature = {
                0: {
                    0: 'signature1',
                    1: 'signature2',
                },
            };

            const signed = Transaction.addSignature(tx, signature);

            assert(signed.version === 0);
            expect(signed.signature).toEqual(signature);
        });

        test('succeeds when signature count is less than numSignatures', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3)
                .build();

            const signature = {
                0: {
                    0: 'signature1',
                },
            };

            const signed = Transaction.addSignature(tx, signature);

            assert(signed.version === 0);
            expect(signed.signature).toEqual(signature);
        });

        test('defaults numSignatures to 1 when not specified', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signature = {
                0: {
                    0: 'signature1',
                },
            };

            const signed = Transaction.addSignature(tx, signature);

            assert(signed.version === 0);
            expect(signed.signature).toEqual(signature);
            expect(signed.header.numSignatures).toBe(1n);
        });
    });

    describe('mergeSignatures', () => {
        test('merges signatures from two transactions successfully', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3)
                .build();

            const sig1 = {
                0: {
                    0: 'signature1',
                },
            };

            const sig2 = {
                0: {
                    1: 'signature2',
                },
            };

            Transaction.addSignature(tx, sig1);
            Transaction.addSignature(tx, sig2);
            assert(tx.version === 0);

            expect(tx.signature).toEqual({
                0: {
                    0: 'signature1',
                    1: 'signature2',
                },
            });
        });

        test('merges signatures from different credentials', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3)
                .build();

            const sig1 = {
                0: {
                    0: 'signature1',
                },
            };

            const sig2 = {
                1: {
                    0: 'signature2',
                },
            };

            Transaction.addSignature(tx, sig1);
            Transaction.addSignature(tx, sig2);

            assert(tx.version === 0);

            expect(tx.signature).toEqual({
                0: {
                    0: 'signature1',
                },
                1: {
                    0: 'signature2',
                },
            });
        });

        test('fails when duplicate signatures exist for same credential and key index', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2)
                .build();

            const sig1 = {
                0: {
                    0: 'signature1',
                },
            };

            const sig2 = {
                0: {
                    0: 'signature2',
                },
            };

            Transaction.addSignature(tx, sig1);
            expect(() => Transaction.addSignature(tx, sig2)).toThrow(
                'Duplicate signature found for credential index 0 at key index 0'
            );
        });

        test('mutates the first transaction', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2)
                .build();

            const sig1 = {
                0: {
                    0: 'signature1',
                },
            };

            const signed1 = Transaction.addSignature(tx, sig1);
            expect(signed1).toBe(tx);
        });
    });

    describe('toJSON/fromJSON', () => {
        test('v0 roundtrip completes successfully', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const sig1 = {
                0: {
                    0: 'signature1',
                },
            };

            Transaction.addSignature(tx, sig1);

            const json = Transaction.toJSONString(tx);
            const deserialized = Transaction.fromJSONString(json, Transaction.signableFromJSON);
            expect(deserialized).toEqual(tx);
        });

        test('v1 roundtrip completes successfully', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const json = Transaction.toJSONString(tx);
            const deserialized = Transaction.fromJSONString(json, Transaction.builderFromJSON);

            expect(AccountAddress.equals(deserialized.header.sender!, tx.header.sender)).toBe(true);
            expect(deserialized.header.nonce!.value).toBe(tx.header.nonce.value);
            expect(deserialized.payload).toEqual(tx.payload);
        });

        test('v0 JSON values are correct types', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3)
                .build();
            const sig1 = {
                0: {
                    0: 'signature1',
                },
            };

            Transaction.addSignature(tx, sig1);

            const json = Transaction.toJSON(tx);
            const expectedHeader = {
                sender: '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt',
                nonce: 1n,
                expiry: 1700000000,
                executionEnergyAmount: 300n,
                numSignatures: 3,
            };
            expect(json.header).toEqual(expectedHeader);

            assert(json.version === 0);
            expect(json.signature === sig1);
        });

        test('v1 JSON values are correct types', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(recipientAddress, 3)
                .build();

            const senderSig = {
                0: {
                    0: 'sender',
                },
            };
            const sponsorSig = {
                0: {
                    1: 'sponsor',
                },
            };

            Transaction.addSignature(tx, senderSig);
            Transaction.addSponsorSignature(tx, sponsorSig);

            const json = Transaction.toJSON(tx);
            const expectedHeader = {
                sender: '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt',
                nonce: 1n,
                expiry: 1700000000,
                executionEnergyAmount: 300n,
                numSignatures: 1,
                sponsor: {
                    account: '4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M',
                    numSignatures: 3,
                },
            };
            expect(json.header).toEqual(expectedHeader);

            assert(json.version === 1);

            expect(json.signatures.sender === senderSig);
            expect(json.signatures.sponsor === sponsorSig);
        });
    });

    describe('sign', () => {
        test('signs v0 transaction with single signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 0);
            expect(signed.signature[0]).toBeDefined();
            expect(signed.signature[0][0]).toBeDefined();
            expect(signed.signature[0][0].length).toBe(128);
        });

        test('signs v0 transaction with multiple signatures', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3)
                .build();

            const signer = buildAccountSigner(TEST_KEYS_MULTI);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 0);
            expect(signed.signature[0][0]).toBeDefined();
            expect(signed.signature[0][1]).toBeDefined();
            expect(signed.signature[0][2]).toBeDefined();
            expect(signed.signature[0][0].length).toBe(128);
            expect(signed.signature[0][1].length).toBe(128);
            expect(signed.signature[0][2].length).toBe(128);
        });

        test('signs v1 transaction (sponsored) as sender', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(recipientAddress, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 1);
            expect(signed.signatures.sender[0]).toBeDefined();
            expect(signed.signatures.sender[0][0]).toBeDefined();
            expect(signed.signatures.sender[0][0].length).toBe(128);
            expect(signed.signatures.sponsor).toBeUndefined();
        });
    });

    describe('sponsor', () => {
        test('signs v1 transaction as sponsor', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(recipientAddress, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sponsor(tx, signer);

            assert(signed.version === 1);
            expect(signed.signatures.sponsor).toBeDefined();
            expect(signed.signatures.sponsor![0]).toBeDefined();
            expect(signed.signatures.sponsor![0][0]).toBeDefined();
            expect(signed.signatures.sponsor![0][0].length).toBe(128);
        });

        test('signs v1 transaction as sponsor with multiple keys', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(recipientAddress, 3)
                .build();

            const signer = buildAccountSigner(TEST_KEYS_MULTI);
            const signed = await Transaction.sponsor(tx, signer);

            assert(signed.version === 1);
            expect(signed.signatures.sponsor).toBeDefined();
            expect(signed.signatures.sponsor![0][0]).toBeDefined();
            expect(signed.signatures.sponsor![0][1]).toBeDefined();
            expect(signed.signatures.sponsor![0][2]).toBeDefined();
            expect(signed.signatures.sponsor![0][0].length).toBe(128);
        });

        test('throws when adding too many sponsor signatures', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(recipientAddress, 2)
                .build();

            const signer = buildAccountSigner(TEST_KEYS_MULTI);

            await expect(Transaction.sponsor(tx, signer)).rejects.toThrow();
        });

        test('can sign both sender and sponsor on same transaction', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(recipientAddress, 1)
                .build();

            const senderSigner = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const sponsorSigner = buildBasicAccountSigner(TEST_KEY_SINGLE);

            const signedSender = await Transaction.sign(tx, senderSigner);
            assert(signedSender.version === 1);
            const signedBoth = await Transaction.sponsor(signedSender, sponsorSigner);

            assert(signedBoth.version === 1);
            expect(signedBoth.signatures.sender[0]).toBeDefined();
            expect(signedBoth.signatures.sender[0][0]).toBeDefined();
            expect(signedBoth.signatures.sponsor).toBeDefined();
            expect(signedBoth.signatures.sponsor![0]).toBeDefined();
            expect(signedBoth.signatures.sponsor![0][0]).toBeDefined();
        });
    });

    describe('verifySignature', () => {
        test('verifies valid v0 transaction signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata({ ...metadata, sender: TEST_ACCOUNT_SINGLE })
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 0);
            const isValid = await Transaction.verifySignature(signed, signed.signature, {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo);

            expect(isValid).toBe(true);
        });

        test('verifies valid v1 transaction sender signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata({ ...metadata, sender: TEST_ACCOUNT_SINGLE })
                .addSponsor(recipientAddress, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 1);
            const isValid = await Transaction.verifySignature(signed, signed.signatures.sender, {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo);

            expect(isValid).toBe(true);
        });

        test('verifies valid v1 transaction sponsor signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(TEST_ACCOUNT_SINGLE, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sponsor(tx, signer);

            assert(signed.version === 1);
            const isValid = await Transaction.verifySignature(signed, signed.signatures.sponsor!, {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo);

            expect(isValid).toBe(true);
        });

        test('verifies multi-signature transaction', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata({ ...metadata, sender: TEST_ACCOUNT_MULTI })
                .addMultiSig(3)
                .build();

            const signer = buildAccountSigner(TEST_KEYS_MULTI);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 0);
            const isValid = await Transaction.verifySignature(signed, signed.signature, {
                accountAddress: TEST_ACCOUNT_MULTI,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_MULTI,
            } as unknown as AccountInfo);

            expect(isValid).toBe(true);
        });

        test('returns false for wrong signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata({ ...metadata, sender: TEST_ACCOUNT_SINGLE })
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            const wrongSignature = {
                0: {
                    0: 'b54e4c5f894deb951621b9c13e8f96a4176626265e7bcf5ec197e8ee74ef8464cd32cff4085b0d741fae7cba97fc559ff66adc7c0cdb305d89c5a5d7e657f407',
                },
            };

            assert(signed.version === 0);
            const isValid = await Transaction.verifySignature(signed, wrongSignature, {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo);

            expect(isValid).toBe(false);
        });

        test('returns false for wrong account', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata({ ...metadata, sender: TEST_ACCOUNT_SINGLE })
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            const wrongAccount = AccountAddress.fromBase58('3dbRxtzhb8MotFBgH5DcdFJy7t4we4N8Ep6Mxdha8XvLhq7YmZ');

            assert(signed.version === 0);
            const isValid = await Transaction.verifySignature(signed, signed.signature, {
                accountAddress: wrongAccount,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE_INCORRECT,
            } as unknown as AccountInfo);

            expect(isValid).toBe(false);
        });

        test('returns false when insufficient signatures', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata({ ...metadata, sender: TEST_ACCOUNT_MULTI })
                .addMultiSig(3)
                .build();

            const insufficientSignature = {
                0: {
                    0: '37798d551f26f48496a3d14aee0d29f5bb6a1dc99a75c06b5a8be4f901ba8e6e7c32a7461bd419f481115e647a43d43075f0ccb000627eaa2329eed81582fc02',
                    1: '36fc3a13869535a934adb61809b010dd015126920c24032dfcde1c3883151bc61219f2582564f1e13d743a34ce762925d6171685a1fec62e1cbf731e551a430f',
                },
            };

            const signed = Transaction.addSignature(tx, insufficientSignature);

            assert(signed.version === 0);
            const isValid = await Transaction.verifySignature(signed, signed.signature, {
                accountAddress: TEST_ACCOUNT_MULTI,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_MULTI,
            } as unknown as AccountInfo);

            expect(isValid).toBe(false);
        });
    });
});

const TEST_ACCOUNT_SINGLE = AccountAddress.fromBase58('3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5');
const TEST_ACCOUNT_MULTI = AccountAddress.fromBase58('4hTGW1Uz6u2hUgEtwWjJUdZQncVpHGWZPgGdRpgL1VNn5NzyHd');

const TEST_KEY_SINGLE = 'e1cf504954663e49f4fe884c7c35415b09632cccd82d3d2a62ab2825e67d785d';
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
                            verifyKey: 'fef5414fc757cd4694bf0c7ea436f015cb7f87a80d08e1d1085b9cc91f13f376',
                            schemeId: 'Ed25519',
                        },
                    },
                    threshold: 1,
                },
            },
        },
    },
};
const TEST_CREDENTIALS_SINGLE_INCORRECT = {
    0: {
        value: {
            contents: {
                credentialPublicKeys: {
                    keys: {
                        0: {
                            verifyKey: '008739a5c6708b25c359d45179fefda7ef1345099c0ad8e9b66ed253d968098d',
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
                            verifyKey: '008739a5c6708b25c359d45179fefda7ef1345099c0ad8e9b66ed253d968098d',
                        },
                        1: {
                            schemeId: 'Ed25519',
                            verifyKey: '45b55ad7438cb72c06489be231443cb3b7708f9b3f770729e2092f78ea9e2d9d',
                        },
                        2: {
                            schemeId: 'Ed25519',
                            verifyKey: 'ed2f710f6edbf65806eaee6d643a12124332a6dc687be099b63fd0150294168d',
                        },
                    },
                    threshold: 3,
                },
            },
        },
    },
};
