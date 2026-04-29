import { Buffer } from 'buffer/index.js';

import { LockId } from '../../../src/pub/plt.ts';

describe('PLT LockId', () => {
    it('encodes using the protocol tag and raw tuple', () => {
        expect(Buffer.from(LockId.toCBOR(LockId.create(1n, 2n, 3n))).toString('hex')).toBe('d99fd883010203');
    });

    it('roundtrips CBOR encoding', () => {
        const lockId = LockId.create(10001n, 5n, 0n);
        expect(LockId.fromCBOR(LockId.toCBOR(lockId))).toEqual(lockId);
    });
});
