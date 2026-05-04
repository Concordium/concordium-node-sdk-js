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
import { Transaction } from '../../../src/transactions/index.js';

const ACCOUNT_1 = AccountAddress.fromBase58('4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd');
const ACCOUNT_2 = AccountAddress.fromBase58('3ybJ66spZ2xdWF3avgxQb2meouYa7mpvMWNPmUnczU8FoF8cGB');
const LOCK_ID = LockId.create(1n, 2n, 0n);
const TOKEN_ID = TokenId.fromString('TEST');

function mockGrpc() {
    return {} as Lock.Type['grpc'];
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

describe('PLT Lock.createAndSendOperations', () => {
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

        await expect(
            Lock.createAndSendOperations(
                grpc as never,
                ACCOUNT_1,
                {
                    recipients: info.recipients,
                    expiry: info.expiry,
                    controller: info.controller,
                },
                {
                    lockFund: {
                        token: TOKEN_ID,
                        amount: TokenAmount.create(10n, 0),
                    },
                },
                {} as never
            )
        ).resolves.toBe('tx-hash');

        expect(metaUpdate).toHaveBeenCalledTimes(1);
        const [payload] = metaUpdate.mock.calls[0];
        expect(payload).toEqual(
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
        expect(addMetadata).toHaveBeenCalledTimes(1);
        expect(signAndFinalize).toHaveBeenCalledWith('built-transaction', {});
        expect(grpc.sendTransaction).toHaveBeenCalledWith('signed');

        metaUpdate.mockRestore();
        signAndFinalize.mockRestore();
    });
});

describe('PLT Lock validation', () => {
    it('validates lock operations when the sender has the required capability and the lock is not expired', async () => {
        await expect(
            Lock.canCancel(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Cancel])),
                ACCOUNT_1
            )
        ).resolves.toBe(true);
        await expect(
            Lock.canFund(Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Fund])), ACCOUNT_1)
        ).resolves.toBe(true);
        await expect(
            Lock.canSend(Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Send])), ACCOUNT_1)
        ).resolves.toBe(true);
        await expect(
            Lock.canReturn(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Return])),
                ACCOUNT_1
            )
        ).resolves.toBe(true);
    });

    it('throws MissingCapabilityError when the sender lacks the required capability', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Cancel]));

        await expect(Lock.canFund(lock, ACCOUNT_1)).rejects.toThrow(Lock.MissingCapabilityError);
        await expect(Lock.canFund(lock, ACCOUNT_1)).rejects.toMatchObject({
            code: Lock.LockErrorCode.MISSING_CAPABILITY,
            sender: ACCOUNT_1,
            capability: LockController.SimpleV0Capability.Fund,
            lockId: LOCK_ID,
        });
    });

    it('throws LockExpiredError when the lock is expired', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Fund], pastEpoch()));

        await expect(Lock.canFund(lock, ACCOUNT_1)).rejects.toThrow(Lock.LockExpiredError);
        await expect(Lock.canFund(lock, ACCOUNT_1)).rejects.toMatchObject({
            code: Lock.LockErrorCode.LOCK_EXPIRED,
            lockId: LOCK_ID,
        });
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
