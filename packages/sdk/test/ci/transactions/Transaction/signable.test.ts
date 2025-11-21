import { HeaderJSON } from '../../../../src/transactions/Transaction/shared.ts';
import { Transaction } from '../../../../src/transactions/index.js';
import { AccountAddress, CcdAmount, SequenceNumber, TransactionExpiry } from '../../../../src/types/index.ts';
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
            const expectedHeader: HeaderJSON = {
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
});
