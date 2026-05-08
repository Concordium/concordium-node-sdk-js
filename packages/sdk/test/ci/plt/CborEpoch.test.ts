import { decode } from 'cbor2/decoder';
import { encode } from 'cbor2/encoder';

import { Cbor, CborEpoch } from '../../../src/pub/plt.ts';
import { TransactionExpiry } from '../../../src/pub/types.ts';

describe('PLT CborEpoch', () => {
    const expiry = TransactionExpiry.fromEpochSeconds(10n);
    const epoch = CborEpoch.fromTransactionExpiry(expiry);

    it('encodes CBOR epoch time as tag 1', () => {
        expect(Buffer.from(CborEpoch.toCBOR(epoch)).toString('hex')).toBe('c10a');
    });

    it('decodes CBOR epoch-time bytes as CBOR epoch time', () => {
        expect(CborEpoch.fromCBOR(Buffer.from('c10a', 'hex'))).toEqual(epoch);
    });

    it('unwraps CBOR epoch time as transaction expiry', () => {
        expect(CborEpoch.toTransactionExpiry(epoch)).toEqual(expiry);
    });

    it('registers a CBOR encoder for CborEpoch', () => {
        CborEpoch.registerCBOREncoder();
        expect(Buffer.from(encode(epoch)).toString('hex')).toBe('c10a');
    });

    it('registers a CBOR decoder for epoch-time tag 1', () => {
        const cleanup = CborEpoch.registerCBORDecoder();
        try {
            expect(decode(Buffer.from('c10a', 'hex'))).toEqual(epoch);
        } finally {
            cleanup();
        }
    });

    it('is included in scoped Cbor.decode decoder registration', () => {
        expect(Cbor.decode(Cbor.fromHexString('c10a'))).toEqual(epoch);
    });
});
