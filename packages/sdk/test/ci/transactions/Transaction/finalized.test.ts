import assert from 'node:assert';

import {
    AccountAddress,
    AccountInfo,
    BlockItemKind,
    CcdAmount,
    SequenceNumber,
    TransactionExpiry,
    isKnown,
} from '../../../../src/index.js';
import { buildBasicAccountSigner } from '../../../../src/signHelpers.js';
import { Transaction } from '../../../../src/transactions/index.js';

const TEST_ACCOUNT_SINGLE = AccountAddress.fromBase58('3eP94feEdmhYiPC1333F9VoV31KGMswonuHk5tqmZrzf761zK5');
const TEST_KEY_SINGLE = 'e1cf504954663e49f4fe884c7c35415b09632cccd82d3d2a62ab2825e67d785d';
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

describe('Transaction.Finalized', () => {
    const recipientAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

    const metadata = {
        sender: TEST_ACCOUNT_SINGLE,
        nonce: SequenceNumber.create(1n),
        expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
    };

    describe('serializeBlockItem/deserializeBlockItem roundtrip', () => {
        test('v0 transaction roundtrip', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);
            const finalized = Transaction.finalize(signed);

            const serialized = Transaction.serializeBlockItem(finalized);
            const deserialized = Transaction.deserializeBlockItem(serialized);

            expect(deserialized).toEqual({
                kind: 0,
                transaction: finalized,
            });
        });

        test('v1 transaction roundtrip', async () => {
            const sponsorAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(sponsorAddress, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            assert(signed.version === 1);
            const sponsored = await Transaction.sponsor(signed, signer);
            const finalized = Transaction.finalize(sponsored);

            const serialized = Transaction.serializeBlockItem(finalized);
            const deserialized = Transaction.deserializeBlockItem(serialized);

            expect(deserialized).toEqual({
                kind: 3,
                transaction: finalized,
            });
        });
    });

    describe('deserializeBlockItem with fixture', () => {
        test('deserializes v0 transaction correctly', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);
            const finalized = Transaction.finalize(signed);

            const serialized = Transaction.serializeBlockItem(finalized);
            const deserialized = Transaction.deserializeBlockItem(serialized);

            assert(isKnown(deserialized));
            assert(deserialized.kind === BlockItemKind.AccountTransactionKind);

            expect(deserialized.transaction.version).toBe(0);
            expect(AccountAddress.equals(deserialized.transaction.header.sender, TEST_ACCOUNT_SINGLE)).toBe(true);
            expect(deserialized.transaction.header.nonce.value).toBe(1n);
            expect(deserialized.transaction.header.expiry.expiryEpochSeconds).toBe(1700000000n);
        });

        test('deserializes v1 transaction correctly', async () => {
            const sponsorAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(sponsorAddress, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);
            if (signed.version === 1) {
                const sponsored = await Transaction.sponsor(signed, signer);
                const finalized = Transaction.finalize(sponsored);

                const serialized = Transaction.serializeBlockItem(finalized);
                const deserialized = Transaction.deserializeBlockItem(serialized);
                assert(isKnown(deserialized));
                assert(deserialized.kind === BlockItemKind.AccountTransactionV1Kind);

                expect(deserialized.transaction.version).toBe(1);
                expect(AccountAddress.equals(deserialized.transaction.header.sender, TEST_ACCOUNT_SINGLE)).toBe(true);
                expect(deserialized.transaction.header.nonce.value).toBe(1n);
                expect(deserialized.transaction.header.expiry.expiryEpochSeconds).toBe(1700000000n);
                expect(AccountAddress.equals(deserialized.transaction.header.sponsor!, sponsorAddress)).toBe(true);
            }
        });
    });

    describe('getAccountTransactionHash', () => {
        test('returns consistent hash for same transaction', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);
            const finalized = Transaction.finalize(signed);

            const hash1 = Transaction.getAccountTransactionHash(finalized);
            const hash2 = Transaction.getAccountTransactionHash(finalized);

            expect(hash1).toEqual(hash2);
            expect(hash1).toBeInstanceOf(Uint8Array);
            expect(hash1.length).toBe(32);
        });

        test('returns different hash for different transactions', async () => {
            const tx1 = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const tx2 = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(2000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);

            const signed1 = await Transaction.sign(tx1, signer);
            const finalized1 = Transaction.finalize(signed1);

            const signed2 = await Transaction.sign(tx2, signer);
            const finalized2 = Transaction.finalize(signed2);

            const hash1 = Transaction.getAccountTransactionHash(finalized1);
            const hash2 = Transaction.getAccountTransactionHash(finalized2);

            expect(hash1).not.toEqual(hash2);
        });
    });

    describe('verifySignature', () => {
        test('verifies valid v0 transaction signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            const accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'> = {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo;

            if (signed.version === 0) {
                const isValid = await Transaction.verifySignature(signed, signed.signature, accountInfo);
                expect(isValid).toBe(true);
            }
        });

        test('verifies valid v1 transaction sender signature', async () => {
            const sponsorAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addSponsor(sponsorAddress, 1)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            const accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'> = {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo;

            if (signed.version === 1) {
                const isValid = await Transaction.verifySignature(signed, signed.signatures.sender, accountInfo);
                expect(isValid).toBe(true);
            }
        });

        test('returns false for wrong signature', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            const accountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'> = {
                accountAddress: TEST_ACCOUNT_SINGLE,
                accountThreshold: 1,
                accountCredentials: TEST_CREDENTIALS_SINGLE,
            } as unknown as AccountInfo;

            const wrongSignature = {
                0: {
                    0: 'b54e4c5f894deb951621b9c13e8f96a4176626265e7bcf5ec197e8ee74ef8464cd32cff4085b0d741fae7cba97fc559ff66adc7c0cdb305d89c5a5d7e657f407',
                },
            };

            const isValid = await Transaction.verifySignature(signed, wrongSignature, accountInfo);
            expect(isValid).toBe(false);
        });

        test('returns false for wrong account', async () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .build();

            const signer = buildBasicAccountSigner(TEST_KEY_SINGLE);
            const signed = await Transaction.sign(tx, signer);

            const wrongCredentials = {
                0: {
                    value: {
                        contents: {
                            credentialPublicKeys: {
                                keys: {
                                    0: {
                                        verifyKey: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                                        schemeId: 'Ed25519',
                                    },
                                },
                                threshold: 1,
                            },
                        },
                    },
                },
            };

            const wrongAccountInfo: Pick<AccountInfo, 'accountThreshold' | 'accountCredentials' | 'accountAddress'> = {
                accountAddress: AccountAddress.fromBase58('3dbRxtzhb8MotFBgH5DcdFJy7t4we4N8Ep6Mxdha8XvLhq7YmZ'),
                accountThreshold: 1,
                accountCredentials: wrongCredentials,
            } as unknown as AccountInfo;

            if (signed.version === 0) {
                const isValid = await Transaction.verifySignature(signed, signed.signature, wrongAccountInfo);
                expect(isValid).toBe(false);
            }
        });
    });
});
