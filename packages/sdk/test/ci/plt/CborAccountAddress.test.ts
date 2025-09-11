import { Buffer } from 'buffer/index.js';
import { decode, encode } from 'cbor2';

import { CborAccountAddress } from '../../../src/plt/index.ts';
import { AccountAddress } from '../../../src/types/index.ts';

describe('PLT CborAccountAddress', () => {
    test('Account address cbor encoding', () => {
        const address = CborAccountAddress.fromAccountAddress(AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15)));
        const encoded = CborAccountAddress.toCBOR(address);
        // This expected buffer represents the CBOR encoding of an TokenHolder with:
        // - Tag 40307 (0x9d73) for Address
        // - Two properties:
        //   - Key 01: Tagged CoinInfo (40305/0x9d71) with discriminant 919 (0x397) for Concordium
        //   - Key 03: 32-byte address filled with 0x15
        const expected = Buffer.from(
            `
            d99d73 a2
              01
                d99d71
                  a1
                    01 19 0397
              03 5820 1515151515151515151515151515151515151515151515151515151515151515
            `.replace(/\s/g, ''),
            'hex'
        );
        expect(Buffer.from(encoded).toString('hex')).toEqual(expected.toString('hex'));
    });

    test('Account address cbor decoding with tagged-coininfo', () => {
        // Create a test address with known bytes
        const originalAddress = CborAccountAddress.fromAccountAddress(
            AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15))
        );

        const encoded = CborAccountAddress.toCBOR(originalAddress);
        const decoded = CborAccountAddress.fromCBOR(encoded);

        // Verify the decoded address matches the original
        expect(decoded).toEqual(originalAddress);
    });

    test('Account address cbor decoding without tagged-coininfo', () => {
        // Create a test address with known bytes
        const originalAddress = CborAccountAddress.fromAccountAddressNoCoinInfo(
            AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15))
        );

        // Create CBOR bytes manually without the tagged-coininfo (only the address bytes)
        // This buffer represents the simplified CBOR encoding of an TokenHolder with:
        // - Tag 40307 (0x9d73) for Address
        // - One property:
        //   - Key 03: 32-byte address filled with 0x15
        const taggedAddressBytes = Buffer.from(
            `
            d99d73 a1
              03
                5820 1515151515151515151515151515151515151515151515151515151515151515
            `.replace(/\s/g, ''),
            'hex'
        );

        const decoded = CborAccountAddress.fromCBOR(taggedAddressBytes);

        // Verify the decoded address matches the original
        expect(decoded).toEqual(originalAddress);
    });

    test('CBOR encoding/decoding with cbor2 library registration', () => {
        // Register the TokenHolder encoder and decoder
        CborAccountAddress.registerCBOREncoder();
        const cleanup = CborAccountAddress.registerCBORDecoder();

        try {
            // Create a test address
            const originalAddress = CborAccountAddress.fromAccountAddress(
                AccountAddress.fromBuffer(new Uint8Array(32).fill(0x15))
            );

            // Encode directly with cbor2 library
            const encoded = encode(originalAddress);
            // This hex string represents the expected CBOR encoding of an TokenHolder with:
            // - Tag 40307 (0x9d73) for Address
            // - Two properties:
            //   - Key 01: Tagged CoinInfo (40305/0x9d71) with discriminant 919 (0x397) for Concordium
            //   - Key 03: 32-byte address filled with 0x15
            const taggedAddressHex = `
            d99d73 a2
              01
                d99d71
                  a1
                    01 19 0397
              03 5820 1515151515151515151515151515151515151515151515151515151515151515
            `.replace(/\s/g, '');

            // Check that the encoded value follows the expected structure
            // The address should be tagged with 40307 (0x9d73)
            expect(Buffer.from(encoded).toString('hex')).toEqual(taggedAddressHex);

            // Decode directly with cbor2 library (should use our registered decoder)
            const decoded: CborAccountAddress.Type = decode(encoded);

            // Verify it's an TokenHolder instance
            expect(CborAccountAddress.instanceOf(decoded)).toBeTruthy();

            // Verify the address matches the original
            expect(decoded).toEqual(originalAddress);

            // Test encode-decode roundtrip with cbor2
            const roundtrip: CborAccountAddress.Type = decode(encode(originalAddress));
            expect(roundtrip).toEqual(originalAddress);
        } finally {
            // Clean up the registered decoder
            cleanup();
        }
    });
});
