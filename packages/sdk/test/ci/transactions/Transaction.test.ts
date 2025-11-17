import { Buffer } from 'buffer/index.js';
import JSONBig from 'json-bigint';

import { CcdAmount, DataBlob, Energy, SequenceNumber } from '../../../src/index.js';
import { AccountAddress, TransactionExpiry } from '../../../src/pub/types.js';
import { Transaction } from '../../../src/transactions/index.js';

const jsonBig = JSONBig({ useNativeBigInt: true });

describe('Transaction', () => {
    const senderAddress = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const recipientAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

    const metadata = {
        sender: senderAddress,
        nonce: SequenceNumber.create(1n),
        expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
    };

    describe('header', () => {
        test('creates header with all fields', () => {
            const header = Transaction.header(
                senderAddress,
                SequenceNumber.create(1n),
                TransactionExpiry.fromEpochSeconds(1700000000n),
                Energy.create(100n)
            );

            expect(AccountAddress.equals(header.sender, senderAddress)).toBe(true);
            expect(header.nonce.value).toBe(1n);
            expect(header.expiry.expiryEpochSeconds).toBe(1700000000n);
            expect(header.executionEnergyAmount.value).toBe(100n);
            expect(header.numSignatures).toBeUndefined();
        });

        test('creates header with numSignatures', () => {
            const header = Transaction.header(
                senderAddress,
                SequenceNumber.create(1n),
                TransactionExpiry.fromEpochSeconds(1700000000n),
                Energy.create(100n),
                2n
            );

            expect(header.numSignatures).toBe(2n);
        });
    });

    describe('transfer', () => {
        describe('without memo', () => {
            const tx = Transaction.transfer(metadata, {
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            });
            test('creates transfer transaction', () => {
                expect(tx.payload.type).toBe(3);
            });
        });

        describe('with memo', () => {
            const tx = Transaction.transfer(metadata, {
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
                memo: new DataBlob(Buffer.from('test', 'utf8')),
            });

            test('creates transfer with memo transaction', () => {
                expect(tx.payload.type).toBe(22);
            });

            test('creates transfer with memo using third parameter', () => {
                const tx = Transaction.transfer(
                    metadata,
                    {
                        amount: CcdAmount.fromMicroCcd(1000000n),
                        toAddress: recipientAddress,
                    },
                    new DataBlob(Buffer.from('test', 'utf8'))
                );

                expect(tx.payload.type).toBe(22);
            });
        });
    });

    describe('deployModule', () => {
        const tx = Transaction.deployModule(metadata, {
            source: new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
            version: 1,
        });

        test('creates deploy module transaction', () => {
            expect(tx.payload.type).toBe(0);
        });

        test('calculates energy cost correctly', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(Number(energy.value)).toBe(301);
        });
    });

    describe('registerData', () => {
        const tx = Transaction.registerData(metadata, {
            data: new DataBlob(Buffer.from('test data', 'utf8')),
        });

        test('creates register data transaction', () => {
            expect(tx.payload.type).toBe(21);
        });

        test('calculates energy cost correctly', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(Number(energy.value)).toBe(301);
        });
    });

    describe('getEnergyCost', () => {
        test('energy cost increases with multiple signatures', () => {
            const tx1 = Transaction.transfer(metadata, {
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            });

            const tx2 = Transaction.transfer(metadata, {
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            }).multiSig(3);

            const energy1 = Transaction.getEnergyCost(tx1);
            expect(energy1.value).toBe(301n);

            const energy2 = Transaction.getEnergyCost(tx2);
            expect(energy2.value).toBe(401n);
        });
    });

    describe('toJSON/fromJSON', () => {
        test('roundtrip completes successfully', () => {
            const tx = Transaction.transfer(metadata, {
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            });

            const json = Transaction.toJSON(tx);
            const jsonString = jsonBig.stringify(json);
            const parsed = jsonBig.parse(jsonString);
            const deserialized = Transaction.fromJSON(parsed);

            expect(AccountAddress.equals(deserialized.header.sender, tx.header.sender)).toBe(true);
            expect(deserialized.header.nonce.value).toBe(tx.header.nonce.value);
            expect(deserialized.payload).toEqual(tx.payload);
        });

        test('header JSON values are correct types', () => {
            const tx = Transaction.transfer(metadata, {
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            }).multiSig(3);

            const json = Transaction.toJSON(tx);
            expect(typeof json.header.sender).toBe('string');
            expect(typeof json.header.nonce).toBe('bigint');
            expect(typeof json.header.expiry).toBe('number');
            expect(typeof json.header.executionEnergyAmount).toBe('bigint');
            expect(typeof json.header.numSignatures).toBe('number');
        });
    });
});
