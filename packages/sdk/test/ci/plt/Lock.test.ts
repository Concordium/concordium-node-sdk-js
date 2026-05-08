import {
    Cbor,
    CborAccountAddress,
    CborEpoch,
    Lock,
    LockController,
    LockId,
    LockInfo,
    TokenAmount,
    TokenId,
    createMetaUpdatePayload,
} from '../../../src/pub/plt.js';
import { AccountAddress, SequenceNumber } from '../../../src/pub/types.js';
import { Payload, Transaction } from '../../../src/transactions/index.js';

const ACCOUNT_1 = AccountAddress.fromBase58('4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd');
const ACCOUNT_2 = AccountAddress.fromBase58('3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB');
const LOCK_ID = LockId.create(1n, 2n, 0n);
const TOKEN_ID = TokenId.fromString('TEST');

function mockGrpc(overrides: Partial<Lock.Type['grpc']> = {}) {
    return overrides as Lock.Type['grpc'];
}

function createSenderAccountInfo(token: TokenId.Type, balance: TokenAmount.Type, available?: TokenAmount.Type) {
    return {
        accountAddress: ACCOUNT_1,
        accountTokens: [
            {
                id: token,
                state: {
                    balance,
                    moduleState: available === undefined ? undefined : Cbor.encode({ available }),
                },
            },
        ],
    };
}

function futureEpoch(): CborEpoch.Type {
    return CborEpoch.fromEpochSeconds(BigInt(Math.ceil(Date.now() / 1000) + 60));
}

function pastEpoch(): CborEpoch.Type {
    return CborEpoch.fromEpochSeconds(BigInt(Math.floor(Date.now() / 1000) - 60));
}

function createLockInfo(
    roles: LockController.SimpleV0Capability[],
    expiry: CborEpoch.Type = futureEpoch(),
    account: AccountAddress.Type = ACCOUNT_1
): LockInfo {
    return {
        lock: LOCK_ID,
        recipients: [CborAccountAddress.fromAccountAddress(ACCOUNT_2)],
        expiry,
        controller: LockController.simpleV0(
            [
                {
                    account: CborAccountAddress.fromAccountAddress(account),
                    roles,
                },
            ],
            [TOKEN_ID]
        ),
        funds: [
            {
                account: CborAccountAddress.fromAccountAddress(ACCOUNT_1),
                amounts: [{ token: TOKEN_ID, amount: TokenAmount.create(100n, 0) }],
            },
        ],
    };
}

describe('PLT Lock.composeCreateOperations', () => {
    it('composes lockCreate with subsequent lock operations by injecting the predicted lock id', async () => {
        const grpc = {
            getAccountInfo: jest.fn().mockResolvedValue({
                accountIndex: 9n,
                accountNonce: { value: 12n },
            }),
        };
        const info = createLockInfo([LockController.SimpleV0Capability.Fund]);
        const composed = await Lock.composeCreateOperations(
            grpc as never,
            ACCOUNT_1,
            {
                recipients: info.recipients,
                expiry: info.expiry,
                controller: info.controller,
            },
            [
                {
                    lockFund: {
                        token: TOKEN_ID,
                        amount: TokenAmount.create(10n, 0),
                    },
                },
                {
                    lockReturn: {
                        token: TOKEN_ID,
                        source: CborAccountAddress.fromAccountAddress(ACCOUNT_1),
                        amount: TokenAmount.create(5n, 0),
                    },
                },
            ]
        );

        expect(composed).toEqual([
            {
                lockCreate: {
                    recipients: info.recipients,
                    expiry: info.expiry,
                    controller: info.controller,
                },
            },
            {
                lockFund: {
                    token: TOKEN_ID,
                    lock: LockId.create(9n, 12n, 0n),
                    amount: TokenAmount.create(10n, 0),
                },
            },
            {
                lockReturn: {
                    token: TOKEN_ID,
                    lock: LockId.create(9n, 12n, 0n),
                    source: CborAccountAddress.fromAccountAddress(ACCOUNT_1),
                    amount: TokenAmount.create(5n, 0),
                },
            },
        ]);
    });
});

describe('PLT Lock.create', () => {
    it('submits a single meta update transaction with lockCreate followed by lock-bound operations', async () => {
        const addMetadata = jest.fn().mockReturnValue({ build: jest.fn().mockReturnValue('built-transaction') });
        const metaUpdate = jest.spyOn(Transaction, 'metaUpdate').mockReturnValue({ addMetadata } as never);
        const signAndFinalize = jest.spyOn(Transaction, 'signAndFinalize').mockResolvedValue('signed' as never);
        const grpc = {
            getAccountInfo: jest.fn().mockResolvedValue({
                accountIndex: 9n,
                accountNonce: SequenceNumber.create(12),
            }),
            getNextAccountNonce: jest.fn().mockResolvedValue({ nonce: SequenceNumber.create(12) }),
            sendTransaction: jest.fn().mockResolvedValue('tx-hash'),
        };
        const info = createLockInfo([LockController.SimpleV0Capability.Fund]);

        const transaction = await Lock.create(grpc as never, ACCOUNT_1, {
            recipients: info.recipients,
            expiry: info.expiry,
            controller: info.controller,
        })
            .fund({ token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
            .submit({} as never);

        expect(transaction.transactionHash).toBe('tx-hash');

        const [payload] = metaUpdate.mock.calls[0];
        const expected = Payload.metaUpdate(
            createMetaUpdatePayload([
                {
                    lockCreate: {
                        recipients: info.recipients,
                        expiry: info.expiry,
                        controller: info.controller,
                    },
                },
                {
                    lockFund: {
                        token: TOKEN_ID,
                        lock: LockId.create(9n, 12n, 0n),
                        amount: TokenAmount.create(10n, 0),
                    },
                },
            ])
        );
        expect(payload).toEqual(expected);

        metaUpdate.mockRestore();
        signAndFinalize.mockRestore();
    });
});

describe('PLT Lock validation', () => {
    it('validates lock operations when the sender has the required capability and the lock is not expired', async () => {
        expect(
            Lock.canCancel(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Cancel])),
                ACCOUNT_1
            )
        ).toBe(true);
        await expect(
            Lock.canFund(
                Lock.fromInfo(
                    mockGrpc({
                        getAccountInfo: jest
                            .fn()
                            .mockResolvedValue(
                                createSenderAccountInfo(
                                    TOKEN_ID,
                                    TokenAmount.create(100n, 0),
                                    TokenAmount.create(100n, 0)
                                )
                            ),
                    }),
                    createLockInfo([LockController.SimpleV0Capability.Fund])
                ),
                ACCOUNT_1,
                { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) }
            )
        ).resolves.toBe(true);
        expect(
            Lock.canSend(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Send])),
                ACCOUNT_1,
                {
                    token: TOKEN_ID,
                    source: ACCOUNT_1,
                    amount: TokenAmount.create(10n, 0),
                    recipient: ACCOUNT_2,
                }
            )
        ).toBe(true);
        expect(
            Lock.canReturn(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Return])),
                ACCOUNT_1,
                { token: TOKEN_ID, source: ACCOUNT_1, amount: TokenAmount.create(10n, 0) }
            )
        ).toBe(true);
    });

    it('throws MissingCapabilityError when the sender lacks the required capability', async () => {
        const lock = Lock.fromInfo(
            mockGrpc({
                getAccountInfo: jest
                    .fn()
                    .mockResolvedValue(
                        createSenderAccountInfo(TOKEN_ID, TokenAmount.create(100n, 0), TokenAmount.create(100n, 0))
                    ),
            }),
            createLockInfo([LockController.SimpleV0Capability.Cancel])
        );

        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.MissingCapabilityError);
        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toMatchObject({
            code: Lock.LockErrorCode.MISSING_CAPABILITY,
            sender: ACCOUNT_1,
            capability: LockController.SimpleV0Capability.Fund,
            lockId: LOCK_ID,
        });
    });

    it('throws LockExpiredError when the lock is expired', async () => {
        const lock = Lock.fromInfo(
            mockGrpc({
                getAccountInfo: jest
                    .fn()
                    .mockResolvedValue(
                        createSenderAccountInfo(TOKEN_ID, TokenAmount.create(100n, 0), TokenAmount.create(100n, 0))
                    ),
            }),
            createLockInfo([LockController.SimpleV0Capability.Fund], pastEpoch())
        );

        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.LockExpiredError);
        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toMatchObject({
            code: Lock.LockErrorCode.LOCK_EXPIRED,
            lockId: LOCK_ID,
        });
    });

    it('throws TokenNotAllowedError when the token is not configured on the lock for funding', async () => {
        const otherToken = TokenId.fromString('OTHER');
        const lock = Lock.fromInfo(
            mockGrpc({
                getAccountInfo: jest
                    .fn()
                    .mockResolvedValue(
                        createSenderAccountInfo(otherToken, TokenAmount.create(100n, 0), TokenAmount.create(100n, 0))
                    ),
            }),
            createLockInfo([LockController.SimpleV0Capability.Fund])
        );

        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: otherToken, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.TokenNotAllowedError);
        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: otherToken, amount: TokenAmount.create(10n, 0) })
        ).rejects.toMatchObject({
            code: Lock.LockErrorCode.TOKEN_NOT_ALLOWED,
            token: otherToken,
            lockId: LOCK_ID,
        });
    });

    it('throws InsufficientFundsError when the sender does not have enough available balance to fund the lock', async () => {
        const lock = Lock.fromInfo(
            mockGrpc({
                getAccountInfo: jest
                    .fn()
                    .mockResolvedValue(
                        createSenderAccountInfo(TOKEN_ID, TokenAmount.create(100n, 0), TokenAmount.create(5n, 0))
                    ),
            }),
            createLockInfo([LockController.SimpleV0Capability.Fund])
        );

        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.InsufficientFundsError);
        await expect(
            Lock.canFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toMatchObject({
            code: Lock.LockErrorCode.INSUFFICIENT_FUNDS,
            sender: ACCOUNT_1,
            token: TOKEN_ID,
            requiredAmount: TokenAmount.create(10n, 0),
        });
    });

    it('throws RecipientNotAllowedError when the recipient is not configured on the lock', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Send]));
        const recipient = ACCOUNT_1;

        expect(() =>
            Lock.canSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(10n, 0),
                recipient,
            })
        ).toThrow(Lock.RecipientNotAllowedError);
        try {
            Lock.canSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(10n, 0),
                recipient,
            });
            fail('Expected canSend to throw');
        } catch (error) {
            expect(error).toMatchObject({
                code: Lock.LockErrorCode.RECIPIENT_NOT_ALLOWED,
                recipient,
                lockId: LOCK_ID,
            });
        }
    });

    it('throws InsufficientFundsError when the source does not have enough locked funds to return', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Return]));

        expect(() =>
            Lock.canReturn(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
            })
        ).toThrow(Lock.InsufficientFundsError);
        try {
            Lock.canReturn(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
            });
            fail('Expected canReturn to throw');
        } catch (error) {
            expect(error).toMatchObject({
                code: Lock.LockErrorCode.INSUFFICIENT_FUNDS,
                sender: ACCOUNT_1,
                token: TOKEN_ID,
                requiredAmount: TokenAmount.create(101n, 0),
            });
        }
    });

    it('throws InsufficientFundsError when the source does not have enough locked funds to send', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Send]));

        expect(() =>
            Lock.canSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
                recipient: ACCOUNT_2,
            })
        ).toThrow(Lock.InsufficientFundsError);
        try {
            Lock.canSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
                recipient: ACCOUNT_2,
            });
            fail('Expected canSend to throw');
        } catch (error) {
            expect(error).toMatchObject({
                code: Lock.LockErrorCode.INSUFFICIENT_FUNDS,
                sender: ACCOUNT_1,
                token: TOKEN_ID,
                requiredAmount: TokenAmount.create(101n, 0),
            });
        }
    });
});

describe('PLT Lock.fromCbor', () => {
    it('decodes CBOR-encoded LockInfo', () => {
        const info = createLockInfo([LockController.SimpleV0Capability.Fund]);
        const lock = Lock.fromCbor(mockGrpc(), Cbor.encode(info));

        expect(lock.info.lock).toEqual(LOCK_ID);
        expect(lock.info.funds[0].account.address.address).toBe(ACCOUNT_1.address);
        expect(lock.info.funds[0].amounts[0].token).toEqual(TOKEN_ID);
        expect(lock.info.funds[0].amounts[0].amount).toEqual(TokenAmount.create(100n, 0));
        expect(lock.info.recipients[0].address.address).toBe(ACCOUNT_2.address);
        expect(lock.info.expiry.expiry.expiryEpochSeconds).toBe(info.expiry.expiry.expiryEpochSeconds);
        expect(lock.info.controller).toEqual(info.controller);
    });

    it('throws a decode error for malformed CBOR', () => {
        expect(() => Lock.fromCbor(mockGrpc(), Cbor.fromHexString('ff'))).toThrow();
    });
});
