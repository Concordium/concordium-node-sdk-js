import { Buffer } from 'buffer/index.js';

import {
    Cbor,
    CcdAmount,
    ContractAddress,
    ContractName,
    DataBlob,
    DelegationTargetType,
    Energy,
    ModuleReference,
    OpenStatus,
    Parameter,
    ReceiveName,
    SequenceNumber,
    TokenId,
} from '../../../src/index.js';
import { AccountAddress, TransactionExpiry } from '../../../src/pub/types.js';
import { Transaction } from '../../../src/transactions/index.js';

describe('Transaction', () => {
    const senderAddress = AccountAddress.fromBase58('3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt');
    const recipientAddress = AccountAddress.fromBase58('4ZJBYQbVp3zVZyjCXfZAAYBVkJMyVj8UKUNj9ox5YqTCBdBq2M');

    const metadata = {
        sender: senderAddress,
        nonce: SequenceNumber.create(1n),
        expiry: TransactionExpiry.fromEpochSeconds(1700000000n),
    };

    describe('transfer', () => {
        describe('without memo', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            }).addMetadata(metadata);
            tx.header.numSignatures = 2n;
            test('creates transfer transaction', () => {
                expect(tx.payload.type).toBe(3);
            });

            test('calculates fixed energy cost correctly', () => {
                const tx = Transaction.transfer({
                    amount: CcdAmount.fromMicroCcd(1000000n),
                    toAddress: recipientAddress,
                });
                const energy = Transaction.getEnergyCost(tx);
                expect(energy.value).toBe(501n);
            });
        });

        describe('with memo', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
                memo: new DataBlob(Buffer.from('test', 'utf8')),
            });

            test('creates transfer with memo transaction', () => {
                expect(tx.payload.type).toBe(22);
            });

            test('creates transfer with memo using third parameter', () => {
                const tx = Transaction.transfer(
                    {
                        amount: CcdAmount.fromMicroCcd(1000000n),
                        toAddress: recipientAddress,
                    },
                    new DataBlob(Buffer.from('test', 'utf8'))
                );

                expect(tx.payload.type).toBe(22);
            });

            test('calculates fixed energy cost correctly', () => {
                const tx = Transaction.transfer({
                    amount: CcdAmount.fromMicroCcd(1000000n),
                    toAddress: recipientAddress,
                    memo: new DataBlob(Buffer.from('test', 'utf8')),
                });
                const energy = Transaction.getEnergyCost(tx);
                expect(energy.value).toBe(507n);
            });
        });
    });

    describe('deployModule', () => {
        const tx = Transaction.deployModule({
            source: new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
            version: 1,
        });

        test('creates deploy module transaction', () => {
            expect(tx.payload.type).toBe(0);
        });

        test('calculates fixed energy cost', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(177n);
        });
    });

    describe('registerData', () => {
        const tx = Transaction.registerData({
            data: new DataBlob(Buffer.from('test data', 'utf8')),
        });

        test('creates register data transaction', () => {
            expect(tx.payload.type).toBe(21);
        });

        test('calculates fixed energy cost', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(472n);
        });
    });

    describe('initContract', () => {
        const tx = Transaction.initContract(
            {
                amount: CcdAmount.fromMicroCcd(0n),
                initName: ContractName.fromString('my_contract'),
                moduleRef: ModuleReference.fromHexString(
                    'aabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccddaabbccdd'
                ),
                param: Parameter.empty(),
            },
            Energy.create(1000n)
        );

        test('creates init contract transaction', () => {
            expect(tx.payload.type).toBe(1);
        });

        test('calculates fixed energy cost', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(1221n);
        });
    });

    describe('updateContract', () => {
        const tx = Transaction.updateContract(
            {
                amount: CcdAmount.fromMicroCcd(100n),
                address: ContractAddress.create(0, 0),
                receiveName: ReceiveName.fromString('my_contract.receive'),
                message: Parameter.empty(),
            },
            Energy.create(2000n)
        );

        test('creates update contract transaction', () => {
            expect(tx.payload.type).toBe(2);
        });

        test('calculates fixed energy cost', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(2208n);
        });
    });

    describe('configureDelegation', () => {
        const tx = Transaction.configureDelegation({
            stake: CcdAmount.fromMicroCcd(5000000000n),
            restakeEarnings: true,
            delegationTarget: {
                delegateType: DelegationTargetType.PassiveDelegation,
            },
        });

        test('creates configure delegation transaction', () => {
            expect(tx.payload.type).toBe(26);
        });

        test('calculates fixed energy cost', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(473n);
        });
    });

    describe('configureValidator', () => {
        const tx = Transaction.configureValidator({
            stake: CcdAmount.fromMicroCcd(10000000000n),
            restakeEarnings: false,
            openForDelegation: OpenStatus.ClosedForAll,
            keys: {
                aggregationVerifyKey:
                    'ad8e519b6a7f869780a547b6aade0aeb112a7364160b391fc179d68792388cd99d3b60c2037964abbadaf22bfded67b913eed9ac246f2fc39c3eff7c7060838e320fea1419c9282159e56ae5aef1291d31ba34ad389c9571e4d83cf65509bb57',
                electionVerifyKey: 'adbf30d103c08cd4960b6e559ef9bd97427f5160d611eeba4507a116e0aa8cb3',
                proofAggregation:
                    'c9c98d80869b56e51c57ea668aec00a62280268b595f113f801bcf205d996d22056b2779ce547874829f41dd81c267979ee5576aa8e5c0d090b3ad68752fb74b',
                proofElection:
                    'd9102e9eb0e6d527df37a576fd09e218d3f2c5ff28a656f49fd02d81bec58a0dcfbb79be0ef9bad74cbc73522e769e912cc8541e058be0d8b654e1e7bed9780e',
                proofSig:
                    'e033f3293c388b7388bcb7db01d6052c8ba869d6c8aa6ddba0d3b6dca288f30748ce47e87e368cd323e787fc5e2f48f34311d80bb39a9915551c09c81d97e80d',
                signatureVerifyKey: 'e278cf4ae4f354833732c27aa2649559c450da1c73b2a29d50d258d9c3459727',
            },
            metadataUrl: 'https://validator.example.com',
            transactionFeeCommission: 10,
            bakingRewardCommission: 5,
            finalizationRewardCommission: 5,
        });

        test('creates configure validator transaction', () => {
            expect(tx.payload.type).toBe(25);
        });

        test('calculates fixed energy cost with keys', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(4618n);
        });

        test('calculates fixed energy cost without keys', () => {
            const tx = Transaction.configureValidator({
                stake: CcdAmount.fromMicroCcd(10000000000n),
                restakeEarnings: false,
                openForDelegation: OpenStatus.ClosedForAll,
                metadataUrl: 'https://validator.example.com',
                transactionFeeCommission: 10,
                bakingRewardCommission: 5,
                finalizationRewardCommission: 5,
            });
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(516n);
        });
    });

    describe('tokenUpdate', () => {
        const tx = Transaction.tokenUpdate({
            tokenId: TokenId.fromString('TEST'),
            operations: Cbor.encode([{ pause: {} }]),
        });

        test('creates token update transaction', () => {
            expect(tx.payload.type).toBe(27);
        });

        test('calculates fixed energy cost', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(529n);
        });
    });

    describe('updateCredentials', () => {
        const cdi = {
            credentialPublicKeys: {
                keys: {
                    '0': {
                        schemeId: 'Ed25519',
                        verifyKey: 'd684ac5fd786d33c82701ce9f05017bb6f3114bec77c0e836e7d5c211de9acc6',
                    },
                },
                threshold: 1,
            },
            credId: 'a5727a5f217a0abaa6bba7f6037478051a49d5011e045eb0d86fce393e0c7b4a96382c60e09a489ebb6d800dc0d88d05',
            commitments: {
                cmmPrf: 'abcdef',
                cmmCredCounter: '2',
                cmmIdCredSecSharingCoeff: ['1', '2', '3'],
                cmmAttributes: {},
                cmmMaxAccounts: '3',
            },
            ipIdentity: 0,
            revocationThreshold: 2,
            arData: {
                '1': {
                    encIdCredPubShare:
                        'a458d29cdf02ae34d2ae9b11da12a20df1cb2f0051f50547ca975c1916334443f8654198ffd55763274d7663b3f71def89950e178445b2c080de77cbe66bf16716808124af92b99f4d042568a8ac178a51050b04c073e5400a8e89dce61290fd',
                },
            },
            policy: {
                validTo: '202205',
                createdAt: '202005',
                revealedAttributes: {},
            },
            proofs: 'abc123',
        };

        const tx = Transaction.updateCredentials({
            newCredentials: [{ index: 1, cdi }],
            removeCredentialIds: [],
            threshold: 1,            
        }
        ,1n);

        test('creates update credentials transaction', () => {
            expect(tx.payload.type).toBe(20);
        });

        test('calculates fixed energy cost (single credential)', () => {
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(55471n);
        });

        test('calculates fixed energy cost (multiple credentials)', () => {
            const tx = Transaction.updateCredentials({
                newCredentials: [
                    { index: 1, cdi },
                    { index: 2, cdi },
                ],
                removeCredentialIds: [],
                threshold: 1,                
            }, 
            1n);
            const energy = Transaction.getEnergyCost(tx);
            expect(energy.value).toBe(109778n);
        });
    });

    describe('getEnergyCost', () => {
        test('energy cost increases with multiple signatures', () => {
            const tx1 = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            });

            const tx2 = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            }).addMultiSig(3);

            const energy1 = Transaction.getEnergyCost(tx1);
            expect(energy1.value).toBe(501n);

            const energy2 = Transaction.getEnergyCost(tx2);
            expect(energy2.value).toBe(701n);
        });
    });

    describe('toJSON/fromJSON', () => {
        test('roundtrip completes successfully', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            }).addMetadata(metadata);

            const json = Transaction.toJSONString(tx);
            const deserialized = Transaction.fromJSONString(json);

            expect(AccountAddress.equals(deserialized.header.sender!, tx.header.sender)).toBe(true);
            expect(deserialized.header.nonce!.value).toBe(tx.header.nonce.value);
            expect(deserialized.payload).toEqual(tx.payload);
        });

        test('header JSON values are correct types', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3);

            const json = Transaction.toJSON(tx);
            const expectedHeader = {
                sender: '3VwCfvVskERFAJ3GeJy2mNFrzfChqUymSJJCvoLAP9rtAwMGYt',
                nonce: 1n,
                expiry: 1700000000,
                executionEnergyAmount: 300n,
                numSignatures: 3,
            };
            expect(json.header).toEqual(expectedHeader);
        });
    });

    describe('addSignature', () => {
        test('fails when signature count exceeds numSignatures in header', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2);

            const signature = {
                0: {
                    0: 'signature1',
                    1: 'signature2',
                    2: 'signature3',
                },
            };

            expect(() => Transaction.addSignature(tx, signature)).toThrow(
                'Too many signatures added to the transaction. Counted 3, but transaction specifies 2 allowed number of signatures.'
            );
        });

        test('succeeds when signature count equals numSignatures', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2);

            const signature = {
                0: {
                    0: 'signature1',
                    1: 'signature2',
                },
            };

            const signed = Transaction.addSignature(tx, signature);
            expect(signed.signature).toEqual(signature);
        });

        test('succeeds when signature count is less than numSignatures', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(3);

            const signature = {
                0: {
                    0: 'signature1',
                },
            };

            const signed = Transaction.addSignature(tx, signature);
            expect(signed.signature).toEqual(signature);
        });

        test('defaults numSignatures to 1 when not specified', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            }).addMetadata(metadata);

            const signature = {
                0: {
                    0: 'signature1',
                },
            };

            const signed = Transaction.addSignature(tx, signature);
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
                .addMultiSig(3);

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

            const signed1 = Transaction.addSignature(tx, sig1);
            const signed2 = Transaction.addSignature(tx, sig2);

            const merged = Transaction.mergeSignatures(signed1, signed2);

            expect(merged.signature).toEqual({
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
                .addMultiSig(3);

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

            const signed1 = Transaction.addSignature(tx, sig1);
            const signed2 = Transaction.addSignature(tx, sig2);

            const merged = Transaction.mergeSignatures(signed1, signed2);

            expect(merged.signature).toEqual({
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
                .addMultiSig(2);

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

            const signed1 = Transaction.addSignature(tx, sig1);
            const signed2 = Transaction.addSignature(tx, sig2);

            expect(() => Transaction.mergeSignatures(signed1, signed2)).toThrow(
                'Duplicate signature found for credential index 0 at key index 0'
            );
        });

        test('preserves all properties from first transaction', () => {
            const tx = Transaction.transfer({
                amount: CcdAmount.fromMicroCcd(1000000n),
                toAddress: recipientAddress,
            })
                .addMetadata(metadata)
                .addMultiSig(2);

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

            const signed1 = Transaction.addSignature(tx, sig1);
            const signed2 = Transaction.addSignature(tx, sig2);

            const merged = Transaction.mergeSignatures(signed1, signed2);

            expect(merged.header).toEqual(signed1.header);
            expect(merged.payload).toEqual(signed1.payload);
        });
    });
});
