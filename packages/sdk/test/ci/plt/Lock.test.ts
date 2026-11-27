import {
    Cbor,
    CborAccountAddress,
    CborEpoch,
    Lock,
    LockConfig,
    LockCreateConfig,
    LockId,
    LockInfo,
    TokenAmount,
    TokenId,
    createTokenUpdatePayload,
} from '../../../src/pub/plt.js';
import { Payload } from '../../../src/pub/transactions.js';
import { AccountAddress, SequenceNumber } from '../../../src/pub/types.js';

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
    roles: LockConfig.SimpleV0Capability[],
    expiry: CborEpoch.Type = futureEpoch(),
    account: AccountAddress.Type = ACCOUNT_1,
    recipients: LockConfig.Recipients = [CborAccountAddress.fromAccountAddress(ACCOUNT_2)]
): LockInfo & { config: LockConfig.V0 } {
    return {
        lock: LOCK_ID,
        config: {
            version: 0,
            variant: 'simpleV0',
            recipients,
            expiry,
            holders: [CborAccountAddress.fromAccountAddress(ACCOUNT_1)],
            roles: [{ account: CborAccountAddress.fromAccountAddress(account), roles }],
            tokens: [TOKEN_ID],
        },
        funds: [
            {
                account: CborAccountAddress.fromAccountAddress(ACCOUNT_1),
                amounts: [{ token: TOKEN_ID, amount: TokenAmount.create(100n, 0) }],
            },
        ],
    };
}

describe('PLT Lock.create', () => {
    it('submits a single unscoped token update transaction with lockCreate followed by lock-bound operations', async () => {
        const grpc = {
            getAccountInfo: jest.fn().mockResolvedValue({
                accountIndex: 9n,
                accountNonce: SequenceNumber.create(12),
            }),
            getNextAccountNonce: jest.fn().mockResolvedValue({ nonce: SequenceNumber.create(12) }),
            sendTransaction: jest.fn().mockResolvedValue('tx-hash'),
        };
        const config = LockCreateConfig.simpleV0(
            'any',
            [CborAccountAddress.fromAccountAddress(ACCOUNT_1)],
            futureEpoch(),
            [],
            [TOKEN_ID]
        );

        const payload = await Lock.create(grpc as never, ACCOUNT_1, config)
            .fund({ token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
            .payload();

        const expected = Payload.tokenUpdate(
            createTokenUpdatePayload({
                operations: [
                    { lockCreate: config },
                    {
                        lockFund: {
                            token: TOKEN_ID,
                            lock: LockId.create(9n, 12n, 0n),
                            amount: TokenAmount.create(10n, 0),
                        },
                    },
                ],
            })
        );
        expect(Payload.tokenUpdate(payload)).toEqual(expected);
    });
});

describe('PLT Lock validation', () => {
    afterEach(() => jest.restoreAllMocks());

    it('authorizes funding by effective roles, not holder membership', async () => {
        const info = createLockInfo([LockConfig.SimpleV0Capability.Fund], futureEpoch(), ACCOUNT_2);
        const getAccountInfo = jest.fn().mockImplementation(async (account: AccountAddress.Type) => ({
            ...createSenderAccountInfo(TOKEN_ID, TokenAmount.create(100n, 0)),
            accountAddress: account,
        }));
        const lock = Lock.fromInfo(mockGrpc({ getAccountInfo }), info);
        const details = { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) };

        await expect(Lock.validateFund(lock, ACCOUNT_2, details)).resolves.toBe(true);
        await expect(Lock.validateFund(lock, ACCOUNT_1, details)).rejects.toThrow(Lock.MissingCapabilityError);
    });

    it('rejects cancellation validation for an unknown version even with a past expiry in its data', () => {
        const info = createLockInfo([]);
        const config = { version: 7, expiry: pastEpoch() };
        const lock = Lock.fromInfo(mockGrpc(), { ...info, config });

        expect(() => Lock.validateCancel(lock, ACCOUNT_1)).toThrow(Lock.UnsupportedConfigurationError);
    });

    it.each(['variant', 'capability'])(
        'allows cancelling an expired v0 lock with an unfamiliar %s, but not at equality',
        (unfamiliar) => {
            const expiry = 1_800_000_000n;
            const now = jest.spyOn(Date, 'now').mockReturnValue(Number(expiry) * 1000 + 1);
            const info = createLockInfo([], CborEpoch.fromEpochSeconds(expiry));
            const config =
                unfamiliar === 'variant'
                    ? { ...info.config, variant: 'futureVariant' }
                    : {
                          ...info.config,
                          roles: [
                              {
                                  account: CborAccountAddress.fromAccountAddress(ACCOUNT_2),
                                  roles: ['futureCapability'],
                              },
                          ],
                      };
            const lock = Lock.fromInfo(mockGrpc(), { ...info, config });

            expect(Lock.validateCancel(lock, ACCOUNT_1)).toBe(true);
            now.mockReturnValue(Number(expiry) * 1000);
            expect(() => Lock.validateCancel(lock, ACCOUNT_1)).toThrow(Lock.UnsupportedConfigurationError);
        }
    );

    it('allows release at exact expiry but rejects it one millisecond later', () => {
        const expiry = 1_800_000_000n;
        const now = jest.spyOn(Date, 'now').mockReturnValue(Number(expiry) * 1000);
        const info = createLockInfo([LockConfig.SimpleV0Capability.Release], CborEpoch.fromEpochSeconds(expiry));
        const lock = Lock.fromInfo(mockGrpc(), info);
        const details = { token: TOKEN_ID, source: ACCOUNT_1, amount: TokenAmount.create(10n, 0) };

        expect(Lock.validateRelease(lock, ACCOUNT_1, details)).toBe(true);
        now.mockReturnValue(Number(expiry) * 1000 + 1);
        expect(() => Lock.validateRelease(lock, ACCOUNT_1, details)).toThrow(Lock.LockExpiredError);
    });

    it('validates lock operations when the sender has the required capability and the lock is not expired', async () => {
        expect(
            Lock.validateCancel(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockConfig.SimpleV0Capability.Cancel])),
                ACCOUNT_1
            )
        ).toBe(true);
        await expect(
            Lock.validateFund(
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
                    createLockInfo([LockConfig.SimpleV0Capability.Fund])
                ),
                ACCOUNT_1,
                { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) }
            )
        ).resolves.toBe(true);
        expect(
            Lock.validateSend(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockConfig.SimpleV0Capability.Send])),
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
            Lock.validateRelease(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockConfig.SimpleV0Capability.Release])),
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
            createLockInfo([LockConfig.SimpleV0Capability.Cancel])
        );

        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.MissingCapabilityError);
        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toMatchObject({
            code: Lock.LockErrorCode.MISSING_CAPABILITY,
            sender: ACCOUNT_1,
            capability: LockConfig.SimpleV0Capability.Fund,
            lockId: LOCK_ID,
        });
    });

    it('allows cancelling an expired lock without the cancel capability', () => {
        const lock = Lock.fromInfo(
            mockGrpc(),
            createLockInfo([LockConfig.SimpleV0Capability.Fund], pastEpoch(), ACCOUNT_1)
        );

        expect(Lock.validateCancel(lock, ACCOUNT_2)).toBe(true);
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
            createLockInfo([LockConfig.SimpleV0Capability.Fund], pastEpoch())
        );

        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.LockExpiredError);
        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
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
            createLockInfo([LockConfig.SimpleV0Capability.Fund])
        );

        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: otherToken, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.TokenNotAllowedError);
        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: otherToken, amount: TokenAmount.create(10n, 0) })
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
            createLockInfo([LockConfig.SimpleV0Capability.Fund])
        );

        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toThrow(Lock.InsufficientFundsError);
        await expect(
            Lock.validateFund(lock, ACCOUNT_1, { token: TOKEN_ID, amount: TokenAmount.create(10n, 0) })
        ).rejects.toMatchObject({
            code: Lock.LockErrorCode.INSUFFICIENT_FUNDS,
            sender: ACCOUNT_1,
            token: TOKEN_ID,
            requiredAmount: TokenAmount.create(10n, 0),
        });
    });

    it('allows sending to any recipient when the lock recipients is "any"', () => {
        const lock = Lock.fromInfo(
            mockGrpc(),
            createLockInfo([LockConfig.SimpleV0Capability.Send], futureEpoch(), ACCOUNT_1, 'any')
        );

        expect(
            Lock.validateSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(10n, 0),
                recipient: ACCOUNT_1,
            })
        ).toBe(true);
    });

    it('throws RecipientNotAllowedError when the recipient is not configured on the lock', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockConfig.SimpleV0Capability.Send]));
        const recipient = ACCOUNT_1;

        expect(() =>
            Lock.validateSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(10n, 0),
                recipient,
            })
        ).toThrow(Lock.RecipientNotAllowedError);
        try {
            Lock.validateSend(lock, ACCOUNT_1, {
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

    it('throws InsufficientFundsError when the source does not have enough locked funds to release', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockConfig.SimpleV0Capability.Release]));

        expect(() =>
            Lock.validateRelease(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
            })
        ).toThrow(Lock.InsufficientFundsError);
        try {
            Lock.validateRelease(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
            });
            fail('Expected canRelease to throw');
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
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockConfig.SimpleV0Capability.Send]));

        expect(() =>
            Lock.validateSend(lock, ACCOUNT_1, {
                token: TOKEN_ID,
                source: ACCOUNT_1,
                amount: TokenAmount.create(101n, 0),
                recipient: ACCOUNT_2,
            })
        ).toThrow(Lock.InsufficientFundsError);
        try {
            Lock.validateSend(lock, ACCOUNT_1, {
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
        const info = createLockInfo([LockConfig.SimpleV0Capability.Fund]);
        expect(Lock.fromCbor(mockGrpc(), Cbor.encode(info)).info).toMatchObject(info);
    });

    it('throws a decode error for malformed CBOR', () => {
        expect(() => Lock.fromCbor(mockGrpc(), Cbor.fromHexString('ff'))).toThrow();
    });
});
