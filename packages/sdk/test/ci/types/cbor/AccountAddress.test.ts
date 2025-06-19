import { Buffer } from 'buffer/index.js';
import { encode } from 'cbor2';

import { AccountAddress } from '../../../../src/pub/types.js';

describe('AccountAddress CBOR', () => {
    test('Account address cbor encoding/decoding', () => {
        const address = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
        const encoded = AccountAddress.toCBOR(address);
        const expected = `5820 1515151515151515151515151515151515151515151515151515151515151515`.replace(/\s/g, '');
        expect(Buffer.from(encoded).toString('hex')).toEqual(expected);

        const decoded = AccountAddress.fromCBOR(encoded);

        // Verify the decoded address matches the original
        expect(AccountAddress.equals(decoded, address)).toBeTruthy();
        expect(AccountAddress.toBuffer(decoded)).toEqual(AccountAddress.toBuffer(address));
    });

    test('CBOR encoding with cbor2 library registration', () => {
        // Register the AccountAddress encoder and decoder
        AccountAddress.registerCBOREncoder();

        // Encode directly with cbor2 library
        const originalAddress = AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15));
        const encoded = encode(originalAddress);

        // This hex string represents the expected CBOR encoding of an AccountAddress with:
        // 32-byte address filled with 0x15
        const expected = `5820 1515151515151515151515151515151515151515151515151515151515151515`.replace(/\s/g, '');
        expect(Buffer.from(encoded).toString('hex')).toEqual(expected);
    });
});
