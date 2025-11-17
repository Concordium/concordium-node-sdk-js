import { Buffer } from 'buffer/index.js';
import _JSONBig from 'json-bigint';

import { CcdAmount, Energy, SequenceNumber } from '../../../src/index.js';
import { AccountAddress, TransactionExpiry } from '../../../src/pub/types.js';
import { AccountTransactionV0, Payload } from '../../../src/transactions/index.js';

const JSONBig = _JSONBig({ useNativeBigInt: true });

describe('AccountTransactionV0', () => {
    const senderAddress = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const recipientAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

    const transferPayload = Payload.transfer({
        amount: CcdAmount.fromMicroCcd(1000000n),
        toAddress: recipientAddress,
    });

    const header: AccountTransactionV0.Header = {
        sender: senderAddress,
        nonce: SequenceNumber.create(1n),
        expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
        energyAmount: Energy.create(500n),
        payloadSize: Payload.sizeOf(transferPayload),
    };

    const mockSignature = {
        0: {
            0: '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
        },
    };

    const transaction: AccountTransactionV0.Type = {
        version: 0,
        header,
        payload: transferPayload,
        signature: mockSignature,
    };

    describe('serialize/deserialize', () => {
        test('roundtrip for transfer transaction', () => {
            const serialized = AccountTransactionV0.serialize(transaction);
            const deserialized = AccountTransactionV0.deserialize(serialized);
            expect(deserialized).toEqual(transaction);
        });
    });

    describe('toJSON/fromJSON', () => {
        test('roundtrip for transfer transaction', () => {
            const json = AccountTransactionV0.toJSON(transaction);
            const jsonString = JSONBig.stringify(json);
            const parsed = JSONBig.parse(jsonString);
            const deserialized = AccountTransactionV0.fromJSON(parsed);
            expect(deserialized).toEqual(transaction);
        });
    });

    describe('serializeBlockItem', () => {
        test('produces serialized block item with correct prefix', () => {
            const blockItem = AccountTransactionV0.serializeBlockItem(transaction);
            expect(blockItem[0]).toBe(0);
        });
    });

    describe('getAccountTransactionHash', () => {
        test('produces 32-byte hash', () => {
            const hash = AccountTransactionV0.getAccountTransactionHash(transaction);
            expect(hash.length).toBe(32);
        });

        test('same transaction produces same hash', () => {
            const hash1 = AccountTransactionV0.getAccountTransactionHash(transaction);
            const hash2 = AccountTransactionV0.getAccountTransactionHash(transaction);
            expect(Buffer.from(hash1).equals(Buffer.from(hash2))).toBe(true);
        });

        test('different transactions produce different hashes', () => {
            const differentTransaction = {
                ...transaction,
                header: {
                    ...transaction.header,
                    nonce: SequenceNumber.create(2n),
                },
            };
            const hash1 = AccountTransactionV0.getAccountTransactionHash(transaction);
            const hash2 = AccountTransactionV0.getAccountTransactionHash(differentTransaction);
            expect(Buffer.from(hash1).equals(Buffer.from(hash2))).toBe(false);
        });
    });

    describe('calculateEnergyCost', () => {
        test('energy cost increases as expected with number of signatures', () => {
            const baseCost = Energy.create(100n);
            let energy = AccountTransactionV0.calculateEnergyCost(1n, transferPayload, baseCost);
            expect(Number(energy.value)).toBe(301);

            energy = AccountTransactionV0.calculateEnergyCost(2n, transferPayload, baseCost);
            expect(Number(energy.value)).toBe(401);
        });
    });

    describe('signDigest', () => {
        const unsigned: AccountTransactionV0.Unsigned = {
            version: 0,
            header,
            payload: transferPayload,
        };

        test('produces 32-byte digest', () => {
            const digest = AccountTransactionV0.signDigest(unsigned);
            expect(digest.length).toBe(32);
        });

        test('same unsigned transaction produces same digest', () => {
            const digest1 = AccountTransactionV0.signDigest(unsigned);
            const digest2 = AccountTransactionV0.signDigest(unsigned);
            expect(Buffer.from(digest1).equals(Buffer.from(digest2))).toBe(true);
        });

        test('different unsigned transactions produce different digests', () => {
            const differentUnsigned = {
                ...unsigned,
                header: {
                    ...unsigned.header,
                    nonce: SequenceNumber.create(2n),
                },
            };
            const digest1 = AccountTransactionV0.signDigest(unsigned);
            const digest2 = AccountTransactionV0.signDigest(differentUnsigned);
            expect(Buffer.from(digest1).equals(Buffer.from(digest2))).toBe(false);
        });
    });
});
