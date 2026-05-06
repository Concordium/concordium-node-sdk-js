import { Buffer } from 'buffer/index.js';

import { LockId } from '../../../src/pub/plt.ts';
import { AccountAddress, SequenceNumber } from '../../../src/pub/types.ts';

describe('PLT LockId', () => {
    it('formats as <accountIndex, sequenceNumber, creationOrder>', () => {
        expect(LockId.create(1n, 2n, 3n).toString()).toBe('<1, 2, 3>');
    });

    it('parses from <accountIndex, sequenceNumber, creationOrder>', () => {
        expect(LockId.fromString('<1,2,3>')).toEqual(LockId.create(1n, 2n, 3n));
        expect(LockId.fromString('<1, 2, 3>')).toEqual(LockId.create(1n, 2n, 3n));
    });

    it('encodes using the protocol tag and raw tuple', () => {
        expect(Buffer.from(LockId.toCBOR(LockId.create(1n, 2n, 3n))).toString('hex')).toBe('d99fd883010203');
    });

    it('roundtrips CBOR encoding', () => {
        const lockId = LockId.create(10001n, 5n, 0n);
        expect(LockId.fromCBOR(LockId.toCBOR(lockId))).toEqual(lockId);
    });

    it('derives the next lock id from account info looked up on chain', async () => {
        const account = AccountAddress.fromBase58('4UC8o4m8AgTxt5VBFMdLwMCwwJQVJwjesNzW7RPXkACynrULmd');
        const grpc = {
            getAccountInfo: jest.fn().mockResolvedValue({
                accountIndex: 42n,
                accountNonce: SequenceNumber.create(7),
            }),
        };

        await expect(LockId.fromAccount(grpc as never, account)).resolves.toEqual(LockId.create(42n, 7n, 0n));
        await expect(LockId.fromAccount(grpc as never, 42n, 3n)).resolves.toEqual(LockId.create(42n, 7n, 3n));
    });
});
