import { Buffer } from 'buffer/index.js';

import { CcdAmount, Energy, SequenceNumber } from '../../../src/index.js';
import { AccountAddress, TransactionExpiry } from '../../../src/pub/types.js';
import { AccountTransactionV1, Payload } from '../../../src/transactions/index.js';

describe('AccountTransactionV1', () => {
    const senderAddress = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const sponsorAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');
    const recipientAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

    const transferPayload = Payload.transfer({
        amount: CcdAmount.fromMicroCcd(1000000n),
        toAddress: recipientAddress,
    });

    const senderSignature = {
        0: {
            0: '893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f',
        },
    };
    const sponsorSignature = {
        0: {
            0: '620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603',
        },
    };

    describe('Header serialization', () => {
        describe('without sponsor', () => {
            const header: AccountTransactionV1.Header = {
                sender: senderAddress,
                nonce: SequenceNumber.create(1n),
                expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
                energyAmount: Energy.create(500n),
                payloadSize: Payload.sizeOf(transferPayload),
            };

            test('serialize/deserialize header roundtrip', () => {
                const serialized = AccountTransactionV1.serializeHeader(header);
                const deserialized = AccountTransactionV1.deserializeHeader(serialized);
                expect(deserialized).toEqual(header);
            });

            test('header serialization produces expected format', () => {
                const serialized = AccountTransactionV1.serializeHeader(header);
                const hex = Buffer.from(serialized).toString('hex');
                // Should start with bitmap (0000 for no optional fields) followed by V0 header
                expect(hex).toMatch(/^0000/);
            });

            test('header serialization produces fixed hex output', () => {
                const serialized = AccountTransactionV1.serializeHeader(header);
                const hex = Buffer.from(serialized).toString('hex');
                expect(hex).toBe(
                    '000049176df18432686c93c61ca89dafbe1cb383bfe6eb3a301ef8907f852643d98d000000000000000100000000000001f400000029000000006553f100'
                );
            });
        });

        describe('with sponsor', () => {
            const headerWithSponsor: AccountTransactionV1.Header = {
                sender: senderAddress,
                nonce: SequenceNumber.create(1n),
                expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
                energyAmount: Energy.create(500n),
                payloadSize: Payload.sizeOf(transferPayload),
                sponsor: sponsorAddress,
            };

            test('serialize/deserialize header with sponsor roundtrip', () => {
                const serialized = AccountTransactionV1.serializeHeader(headerWithSponsor);
                const deserialized = AccountTransactionV1.deserializeHeader(serialized);
                expect(deserialized).toEqual(headerWithSponsor);
            });

            test('header with sponsor serialization produces expected format', () => {
                const serialized = AccountTransactionV1.serializeHeader(headerWithSponsor);
                const hex = Buffer.from(serialized).toString('hex');
                // Should start with bitmap (0001 for sponsor field) followed by V0 header and sponsor
                expect(hex).toMatch(/^0001/);
            });

            test('header with sponsor serialization produces fixed hex output', () => {
                const serialized = AccountTransactionV1.serializeHeader(headerWithSponsor);
                const hex = Buffer.from(serialized).toString('hex');
                expect(hex).toBe(
                    '000149176df18432686c93c61ca89dafbe1cb383bfe6eb3a301ef8907f852643d98d000000000000000100000000000001f400000029000000006553f100d46bbc5fbbbbabb07752d4acb86892d7a2479856d414182f703e21065dad046d'
                );
            });
        });
    });

    describe('Signatures serialization', () => {
        describe('sender only signatures', () => {
            const signatures: AccountTransactionV1.Signatures = {
                sender: senderSignature,
            };

            test('serialize/deserialize signatures roundtrip', () => {
                const serialized = AccountTransactionV1.serializeSignatures(signatures);
                const deserialized = AccountTransactionV1.deserializeSignatures(serialized);
                expect(deserialized).toEqual(signatures);
            });

            test('signatures serialization produces expected format', () => {
                const serialized = AccountTransactionV1.serializeSignatures(signatures);
                const hex = Buffer.from(serialized).toString('hex');
                // Should end with 00 byte indicating no sponsor signatures
                expect(hex).toMatch(/00$/);
            });

            test('signatures serialization produces fixed hex output', () => {
                const serialized = AccountTransactionV1.serializeSignatures(signatures);
                const hex = Buffer.from(serialized).toString('hex');
                expect(hex).toBe(
                    '010001000040893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f00'
                );
            });
        });

        describe('sender and sponsor signatures', () => {
            const signaturesWithSponsor: AccountTransactionV1.Signatures = {
                sender: senderSignature,
                sponsor: sponsorSignature,
            };

            test('serialize/deserialize signatures with sponsor roundtrip', () => {
                const serialized = AccountTransactionV1.serializeSignatures(signaturesWithSponsor);
                const deserialized = AccountTransactionV1.deserializeSignatures(serialized);
                expect(deserialized).toEqual(signaturesWithSponsor);
            });

            test('signatures with sponsor serialization produces expected format', () => {
                const serialized = AccountTransactionV1.serializeSignatures(signaturesWithSponsor);
                const hex = Buffer.from(serialized).toString('hex');
                // Should not end with 00 byte when sponsor signatures are present
                expect(hex).not.toMatch(/00$/);
            });

            test('signatures with sponsor serialization produces fixed hex output', () => {
                const serialized = AccountTransactionV1.serializeSignatures(signaturesWithSponsor);
                const hex = Buffer.from(serialized).toString('hex');
                expect(hex).toBe(
                    '010001000040893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f010001000040620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603'
                );
            });
        });
    });

    describe('Complete transaction serialization', () => {
        describe('transaction without sponsor', () => {
            const header: AccountTransactionV1.Header = {
                sender: senderAddress,
                nonce: SequenceNumber.create(1n),
                expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
                energyAmount: Energy.create(500n),
                payloadSize: Payload.sizeOf(transferPayload),
            };

            const signatures: AccountTransactionV1.Signatures = {
                sender: senderSignature,
            };

            const transaction: AccountTransactionV1.Type = {
                signatures,
                header,
                payload: transferPayload,
            };

            test('serialize/deserialize complete transaction roundtrip', () => {
                const serialized = AccountTransactionV1.serialize(transaction);
                const deserialized = AccountTransactionV1.deserialize(serialized);
                expect(deserialized).toEqual(transaction);
            });

            test('complete transaction produces deterministic serialization', () => {
                const serialized1 = AccountTransactionV1.serialize(transaction);
                const serialized2 = AccountTransactionV1.serialize(transaction);
                expect(Buffer.from(serialized1).equals(Buffer.from(serialized2))).toBe(true);
            });

            test('complete transaction serialization produces fixed hex output', () => {
                const serialized = AccountTransactionV1.serialize(transaction);
                const hex = Buffer.from(serialized).toString('hex');
                expect(hex).toBe(
                    '010001000040893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f00000049176df18432686c93c61ca89dafbe1cb383bfe6eb3a301ef8907f852643d98d000000000000000100000000000001f400000029000000006553f10003d46bbc5fbbbbabb07752d4acb86892d7a2479856d414182f703e21065dad046d00000000000f4240'
                );
            });
        });

        describe('transaction with sponsor', () => {
            const headerWithSponsor: AccountTransactionV1.Header = {
                sender: senderAddress,
                nonce: SequenceNumber.create(1n),
                expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
                energyAmount: Energy.create(500n),
                payloadSize: Payload.sizeOf(transferPayload),
                sponsor: sponsorAddress,
            };

            const signaturesWithSponsor: AccountTransactionV1.Signatures = {
                sender: senderSignature,
                sponsor: sponsorSignature,
            };

            const transactionWithSponsor: AccountTransactionV1.Type = {
                signatures: signaturesWithSponsor,
                header: headerWithSponsor,
                payload: transferPayload,
            };

            test('serialize/deserialize transaction with sponsor roundtrip', () => {
                const serialized = AccountTransactionV1.serialize(transactionWithSponsor);
                const deserialized = AccountTransactionV1.deserialize(serialized);
                expect(deserialized).toEqual(transactionWithSponsor);
            });

            test('transaction with sponsor produces deterministic serialization', () => {
                const serialized1 = AccountTransactionV1.serialize(transactionWithSponsor);
                const serialized2 = AccountTransactionV1.serialize(transactionWithSponsor);
                expect(Buffer.from(serialized1).equals(Buffer.from(serialized2))).toBe(true);
            });

            test('transaction with sponsor serialization produces fixed hex output', () => {
                const serialized = AccountTransactionV1.serialize(transactionWithSponsor);
                const hex = Buffer.from(serialized).toString('hex');
                expect(hex).toBe(
                    '010001000040893f2e4a230bcbeee24675454c4ca95a2f55fd33f328958b626c6fa368341e07902c9ffe7864c3bee23b2b2300ed0922eb814ea41fdee25035be8cddc5c3980f010001000040620d859224c40160c2bb03dbe84e9f57b8ed17f1a5df28b4e21f10658992531ef27655e6b74b8e47923e1ccb0413d563205e8b6c0cd22b3adce5dc7dc1daf603000149176df18432686c93c61ca89dafbe1cb383bfe6eb3a301ef8907f852643d98d000000000000000100000000000001f400000029000000006553f100d46bbc5fbbbbabb07752d4acb86892d7a2479856d414182f703e21065dad046d03d46bbc5fbbbbabb07752d4acb86892d7a2479856d414182f703e21065dad046d00000000000f4240'
                );
            });

            test('transaction with sponsor differs from transaction without sponsor', () => {
                const transactionWithoutSponsor: AccountTransactionV1.Type = {
                    signatures: { sender: senderSignature },
                    header: {
                        sender: senderAddress,
                        nonce: SequenceNumber.create(1n),
                        expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
                        energyAmount: Energy.create(500n),
                        payloadSize: Payload.sizeOf(transferPayload),
                    },
                    payload: transferPayload,
                };

                const serializedWithSponsor = AccountTransactionV1.serialize(transactionWithSponsor);
                const serializedWithoutSponsor = AccountTransactionV1.serialize(transactionWithoutSponsor);

                expect(Buffer.from(serializedWithSponsor).equals(Buffer.from(serializedWithoutSponsor))).toBe(false);
            });
        });
    });

    describe('Edge cases and validation', () => {
        test('deserialize with empty buffer throws error', () => {
            expect(() => {
                AccountTransactionV1.deserialize(new ArrayBuffer(0));
            }).toThrow();
        });

        test('deserialize header with empty buffer throws error', () => {
            expect(() => {
                AccountTransactionV1.deserializeHeader(new ArrayBuffer(0));
            }).toThrow();
        });

        test('deserialize signatures with empty buffer throws error', () => {
            expect(() => {
                AccountTransactionV1.deserializeSignatures(new ArrayBuffer(0));
            }).toThrow();
        });

        test('deserialize with unsupported bitmap bits throws error', () => {
            // Create a buffer with invalid bitmap (unsupported bits set)
            const invalidBitmap = Buffer.alloc(2);
            invalidBitmap.writeUInt16BE(0xfffe, 0); // All bits set except sponsor bit

            expect(() => {
                AccountTransactionV1.deserializeHeader(invalidBitmap);
            }).toThrow('Found unsupported bits in bitmap');
        });
    });
});
