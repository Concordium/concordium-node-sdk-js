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
} from '../../../src/pub/plt.js';
import { AccountAddress } from '../../../src/pub/types.js';

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

describe('PLT Lock validation', () => {
    it('validates lock operations when the sender has the required capability and the lock is not expired', async () => {
        await expect(
            Lock.validateCancelable(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Cancel])),
                ACCOUNT_1
            )
        ).resolves.toBe(true);
        await expect(
            Lock.validateFund(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Fund])),
                ACCOUNT_1
            )
        ).resolves.toBe(true);
        await expect(
            Lock.validateSend(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Send])),
                ACCOUNT_1
            )
        ).resolves.toBe(true);
        await expect(
            Lock.validateReturn(
                Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Return])),
                ACCOUNT_1
            )
        ).resolves.toBe(true);
    });

    it('throws MissingCapabilityError when the sender lacks the required capability', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Cancel]));

        await expect(Lock.validateFund(lock, ACCOUNT_1)).rejects.toThrow(Lock.MissingCapabilityError);
        await expect(Lock.validateFund(lock, ACCOUNT_1)).rejects.toMatchObject({
            code: Lock.LockErrorCode.MISSING_CAPABILITY,
            sender: ACCOUNT_1,
            capability: LockController.SimpleV0Capability.Fund,
            lockId: LOCK_ID,
        });
    });

    it('throws LockExpiredError when the lock is expired', async () => {
        const lock = Lock.fromInfo(mockGrpc(), createLockInfo([LockController.SimpleV0Capability.Fund], pastEpoch()));

        await expect(Lock.validateFund(lock, ACCOUNT_1)).rejects.toThrow(Lock.LockExpiredError);
        await expect(Lock.validateFund(lock, ACCOUNT_1)).rejects.toMatchObject({
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
